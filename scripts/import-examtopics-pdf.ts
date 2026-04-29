#!/usr/bin/env tsx
/**
 * Importer for ExamTopics-style PDFs (e.g. CompTIA SY0-701).
 *
 * Format per question:
 *   Topic <N> Question #<M>
 *   <stem>
 *   A. ...
 *   B. ...
 *   C. ...
 *   D. ...
 *   Correct Answer:<letter(s)>
 *   Community vote distribution
 *   <letters with %>
 *   <explanation paragraph(s)>
 *   <user comments>
 *
 * Usage:
 *   npm run import:examtopics -- <pdf> <slug>
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pdfParse from "pdf-parse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const pdfArg = process.argv[2];
const slugArg = process.argv[3];

if (!pdfArg || !slugArg) {
  console.error(
    "Usage: npm run import:examtopics -- path/to/file.pdf <slug>",
  );
  process.exit(1);
}

const pdfPath = path.isAbsolute(pdfArg) ? pdfArg : path.join(repoRoot, pdfArg);
const slug = slugArg.toLowerCase().replace(/[^a-z0-9-]/g, "-");
const outfile = path.join(
  repoRoot,
  `public/content/exams/${slug}/questions.json`,
);

mkdirSync(path.dirname(outfile), { recursive: true });

interface Question {
  id: string;
  domain: string;
  stem: string;
  choices: string[];
  correctIndex: number;
  /** Set when more than one answer is correct (multi-select questions) */
  correctIndices?: number[];
  explanation: string;
}

interface ParsedVote {
  letter: string;
  percent: number;
}

function extractCommentBodies(text: string, max: number): string[] {
  const headerRe =
    /\n([A-Za-z0-9_][A-Za-z0-9_.\- ]{0,40})\s*\n(?:Highly Voted\s*\n|Most Recent\s*\n)?(\d+\s+(?:year|month|week|day)s?(?:,\s*\d+\s+(?:year|month|week|day)s?)?\s+ago)\s*\n/g;
  const positions: { start: number; bodyStart: number }[] = [];
  let m;
  while ((m = headerRe.exec(text)) !== null) {
    positions.push({
      start: m.index,
      bodyStart: m.index + m[0].length,
    });
    if (positions.length >= max + 1) break;
  }
  const bodies: string[] = [];
  for (let i = 0; i < positions.length && i < max; i++) {
    const bodyStart = positions[i].bodyStart;
    const bodyEnd =
      i + 1 < positions.length ? positions[i + 1].start : Math.min(bodyStart + 2000, text.length);
    bodies.push(text.slice(bodyStart, bodyEnd));
  }
  return bodies;
}

function cleanText(s: string): string {
  return s
    .replace(/Selected Answer:\s*[A-F]+/gi, "")
    .replace(/upvoted\s+\d+\s+times?/gi, "")
    .replace(/[\u4e00-\u9fff]/g, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseVoteDistribution(line: string): ParsedVote[] {
  // e.g. "C (69%)A (31%)" or "B (39%)A (37%)D (16%)8%"
  const matches = [...line.matchAll(/([A-F]+)\s*\((\d+)%\)/g)];
  return matches.map((m) => ({
    letter: m[1],
    percent: parseInt(m[2], 10),
  }));
}

async function main() {
  console.log(`Reading PDF: ${pdfPath}`);
  const buf = readFileSync(pdfPath);
  const data = await pdfParse(buf);
  const text = data.text;

  console.log(`Extracted ${text.length} characters from ${data.numpages} pages`);

  // Strip site noise + private-use Unicode glyphs from the PDF icon font that
  // otherwise break our line-anchored regexes.
  const cleaned = text
    .replace(/-Expert Verified, Online, Free\./g, "")
    .replace(
      /CertificationTest\.net - Cheap & Quality Resources With Best Support/g,
      "",
    )
    .replace(/[\uE000-\uF8FF]/g, "")
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "");

  const questions: Question[] = [];
  // Split by "Topic <N>Question #<M>"
  const headerRe = /Topic\s+(\d+)\s*Question\s*#(\d+)/g;
  const matches = [...cleaned.matchAll(headerRe)];

  console.log(`Found ${matches.length} question markers`);

  let conflicts = 0;
  let multiAnswer = 0;

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const topic = m[1];
    const qNum = m[2];
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index ?? cleaned.length : cleaned.length;
    const block = cleaned.slice(start, end);

    // The PDF places this question's "Highly Voted" / "Most Recent" comments
    // immediately BEFORE its header (in the previous question's block).
    // We harvest those as bonus explanation candidates.
    const prevHeaderEnd =
      i > 0 ? (matches[i - 1].index ?? 0) + matches[i - 1][0].length : 0;
    const beforeHeader = cleaned.slice(prevHeaderEnd, m.index);
    const highlyVotedRe =
      /\n([A-Za-z0-9_][A-Za-z0-9_.\- ]{0,40})\s*\n(?:Highly Voted|Most Recent)\s*\n(\d+\s+(?:year|month|week|day)s?(?:,\s*\d+\s+(?:year|month|week|day)s?)?\s+ago)\s*\n/g;
    const beforeHighlyVoted: string[] = [];
    let hvm;
    while ((hvm = highlyVotedRe.exec(beforeHeader)) !== null) {
      const bodyStart = hvm.index + hvm[0].length;
      // Stop at next username header or "upvoted N times" + double newline
      const after = beforeHeader.slice(bodyStart);
      const stop = after.search(
        /(?:\nupvoted\s+\d+\s+times?\s*\n)|(?:\n[A-Za-z0-9_][A-Za-z0-9_.\- ]{0,40}\s*\n(?:Highly Voted|Most Recent|\d+\s+(?:year|month|week|day)))/,
      );
      const body = stop > 0 ? after.slice(0, stop) : after.slice(0, 1500);
      beforeHighlyVoted.push(body);
    }

    // Find "Correct Answer:" position
    const ansMatch = block.match(/\nCorrect\s*Answer:\s*([A-F]+)\s*/);
    if (!ansMatch) continue;

    const ansIdx = block.indexOf(ansMatch[0]);
    const beforeAnswer = block.slice(0, ansIdx);
    const afterAnswer = block.slice(ansIdx + ansMatch[0].length);

    // Stem = first lines before the first choice marker
    const firstChoice = beforeAnswer.search(/\n[A-F][\.\)]\s/);
    if (firstChoice === -1) continue;
    const stem = beforeAnswer.slice(0, firstChoice).trim().replace(/\s+/g, " ");
    if (stem.length < 10) continue;

    // Choices
    const choicesText = beforeAnswer.slice(firstChoice);
    const choiceParts = choicesText.split(/\n([A-F])[\.\)]\s+/);
    const choices: string[] = [];
    const choiceLetters: string[] = [];
    for (let j = 1; j < choiceParts.length; j += 2) {
      const letter = choiceParts[j];
      const choiceText = choiceParts[j + 1];
      if (!choiceText) continue;
      const cleanedChoice = choiceText
        .split(/\n[A-F][\.\)]/)[0]
        .trim()
        .replace(/\s+/g, " ");
      if (cleanedChoice) {
        choices.push(cleanedChoice);
        choiceLetters.push(letter);
      }
    }
    if (choices.length < 2) continue;

    // Official correct answer (may be multi-letter like "BC", "CE")
    const correctLetters = ansMatch[1].toUpperCase().split("");
    const correctIndices = correctLetters
      .map((l) => choiceLetters.indexOf(l))
      .filter((i) => i >= 0);
    if (correctIndices.length === 0) continue;
    const isMulti = correctIndices.length > 1;
    if (isMulti) multiAnswer++;

    // Community vote distribution (line right after "Community vote distribution")
    let communityNote = "";
    const voteMatch = afterAnswer.match(
      /Community vote distribution\s*\n([^\n]+)/,
    );
    let topVoteLetter: string | null = null;
    if (voteMatch) {
      const votes = parseVoteDistribution(voteMatch[1]);
      if (votes.length > 0) {
        const top = votes[0];
        topVoteLetter = top.letter;
        const officialLetters = correctLetters.join("");
        const distStr = votes
          .map((v) => `${v.letter} (${v.percent}%)`)
          .join(", ");
        // Strong disagreement: community top vote differs from official AND >= 50%
        if (top.letter !== officialLetters && top.percent >= 50) {
          conflicts++;
          communityNote = `Disputed answer — community vote: ${distStr}. Most users picked ${top.letter} instead of the listed answer ${officialLetters}. Verify against your study material.`;
        } else if (top.letter !== officialLetters && top.percent >= 35) {
          // Significant minority disagrees
          communityNote = `Note — community is divided: ${distStr}. Listed answer is ${officialLetters}.`;
        }
      }
    }

    // Sources for explanation, in priority order:
    //   (1) standalone paragraph between vote distribution and first older comment
    //   (2) any "Highly Voted" / "Most Recent" comments captured BEFORE this header
    //   (3) text body of the first older comment after this header
    let explanation = "";
    const afterVote = voteMatch
      ? afterAnswer.slice((voteMatch.index ?? 0) + voteMatch[0].length)
      : afterAnswer;

    // After-the-header content belongs to *this* question only until the first
    // "Highly Voted"/"Most Recent" marker, which signals the next question's
    // pinned-comment block.
    const nextQuestionMarker = afterVote.search(
      /\n[A-Za-z0-9_][A-Za-z0-9_.\- ]{0,40}\s*\n(?:Highly Voted|Most Recent)\s*\n/,
    );
    const ourSlice =
      nextQuestionMarker > 0 ? afterVote.slice(0, nextQuestionMarker) : afterVote;

    // First older-comment header pattern (no Highly Voted/Most Recent marker)
    const olderCommentRe =
      /\n([A-Za-z0-9_][A-Za-z0-9_.\- ]{0,40})\s*\n(\d+\s+(?:year|month|week|day)s?(?:,\s*\d+\s+(?:year|month|week|day)s?)?\s+ago)/;
    const firstOlder = ourSlice.match(olderCommentRe);

    let standalone = firstOlder && firstOlder.index !== undefined
      ? ourSlice.slice(0, firstOlder.index)
      : ourSlice.slice(0, 800);
    standalone = cleanText(standalone);

    const candidates: string[] = [];
    if (standalone.length >= 60) candidates.push(standalone);
    for (const body of beforeHighlyVoted) {
      const t = cleanText(body);
      if (t.length >= 40) candidates.push(t);
    }
    if (candidates.length === 0) {
      const olderBodies = extractCommentBodies(ourSlice, 4);
      for (const body of olderBodies) {
        const t = cleanText(body);
        if (t.length >= 40) candidates.push(t);
      }
    }
    // Fallback: when this question's afterVote section is mostly the next
    // question's pinned comments, the *only* remaining content for THIS
    // question is in the slice before the header (older chronological comments
    // bleed into the previous question's block). Harvest those too.
    if (candidates.length === 0) {
      const beforeBodies = extractCommentBodies(beforeHeader, 6);
      // Collect substantive ones, prefer those that look like answer
      // commentary by including "Selected Answer" tokens in the raw text.
      const scored = beforeBodies
        .map((b) => ({ raw: b, clean: cleanText(b) }))
        .filter((x) => x.clean.length >= 40);
      // Prefer the longest comment - tends to be the most substantive one.
      scored.sort((a, b) => b.clean.length - a.clean.length);
      if (scored[0]) candidates.push(scored[0].clean);
    }

    // Prefer Highly Voted comments (which we deliberately put after standalone),
    // but fall back to the longest substantive candidate.
    if (candidates.length > 0) {
      // pick the longest candidate
      candidates.sort((a, b) => b.length - a.length);
      explanation = candidates[0];
    } else if (standalone) {
      explanation = standalone;
    }

    if (explanation.length > 1200) explanation = explanation.slice(0, 1200) + "…";

    if (communityNote) {
      explanation = explanation
        ? `${explanation}\n\n${communityNote}`
        : communityNote;
    }
    void topVoteLetter;

    questions.push({
      id: `${slug}-${qNum}`,
      domain: `${slug.toUpperCase().replace(/-/g, " ")} (Topic ${topic})`,
      stem,
      choices,
      correctIndex: correctIndices[0],
      ...(isMulti ? { correctIndices } : {}),
      explanation,
    });
  }

  questions.sort((a, b) => {
    const numA = parseInt(a.id.split("-").pop() ?? "0", 10);
    const numB = parseInt(b.id.split("-").pop() ?? "0", 10);
    return numA - numB;
  });

  console.log(`Successfully parsed ${questions.length} questions`);
  console.log(
    `  ${multiAnswer} multi-answer questions, ${conflicts} where community disagreed with official answer`,
  );

  if (questions.length > 0) {
    console.log("\nSample question:");
    console.log(`  Q: ${questions[0].stem.slice(0, 90)}…`);
    console.log(`  Choices: ${questions[0].choices.length}`);
    console.log(
      `  Answer: ${String.fromCharCode(65 + questions[0].correctIndex)}`,
    );
  }

  const pack = {
    $schema: "../../question-pack-schema.json",
    examSlug: slug,
    questions,
  };

  writeFileSync(outfile, JSON.stringify(pack, null, 2), "utf8");
  console.log(`\nWrote: ${outfile}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
