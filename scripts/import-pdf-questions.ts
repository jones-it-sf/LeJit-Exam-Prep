#!/usr/bin/env tsx
/**
 * Generic exam-prep PDF importer.
 *
 * Handles PDFs with the layout used by your CertEmpire-style materials:
 *   Question: 1
 *   <stem>
 *   A. <choice>
 *   B. <choice>
 *   C. <choice>
 *   D. <choice>
 *   Answer:
 *   <Letter>
 *   Explanation:
 *   <text>
 *   References: ...
 *
 * Usage:
 *   npm run import:pdf -- path/to/file.pdf <slug>
 *     - Slug becomes the folder name and id prefix (e.g. cissp, sec-plus).
 *
 * Output: public/content/exams/<slug>/questions.json
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
    "Usage: npm run import:pdf -- path/to/file.pdf <slug>\n" +
      "Example: npm run import:pdf -- 'Exam Material/SY0-701_Answers.pdf' sec-plus",
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
  explanation: string;
}

async function main() {
  console.log(`Reading PDF: ${pdfPath}`);
  const buf = readFileSync(pdfPath);
  const data = await pdfParse(buf);
  let text = data.text;

  console.log(`Extracted ${text.length} characters from ${data.numpages} pages`);

  // Strip watermark / metadata noise
  text = text
    .replace(/\{"userId":[^\}]+\}/g, "")
    .replace(/Get Simulator Access at[^\n]+/g, "")
    .replace(/CertEmpire\.com/gi, "")
    .replace(/Cert\s*Empire/gi, "")
    .replace(/C\s*E\s*R\s*T\s*E\s*M\s*P\s*I\s*R\s*E/gi, "")
    .replace(/C\.E\.R\.T\.E\.M\.P\.I\.R\.E/gi, "")
    .replace(/C•E•R•T•E•M•P•I•R•E/gi, "")
    .replace(/Cert-Empire/gi, "");

  const questions: Question[] = [];
  // Split by "Question: N" pattern
  const blocks = text.split(/Question:\s*(\d+)\s*\n/);
  console.log(
    `Found ${Math.floor(blocks.length / 2)} potential question blocks`,
  );

  for (let i = 1; i < blocks.length - 1; i += 2) {
    const qNum = blocks[i].trim();
    const content = blocks[i + 1];

    if (!content || content.length < 50) continue;

    const answerMatch = content.match(/\nAnswer:\s*\n?\s*([A-D])\s*\n/i);
    if (!answerMatch) continue;

    const answerIdx = content.indexOf(answerMatch[0]);
    const questionPart = content.slice(0, answerIdx);
    const afterAnswer = content.slice(answerIdx + answerMatch[0].length);

    const firstChoiceIdx = questionPart.search(/\n[A-D][\.\)]\s/);
    if (firstChoiceIdx === -1) continue;

    const stem = questionPart
      .slice(0, firstChoiceIdx)
      .trim()
      .replace(/\s+/g, " ");
    if (stem.length < 10) continue;

    const choicesText = questionPart.slice(firstChoiceIdx);
    const choices: string[] = [];
    const choiceParts = choicesText.split(/\n([A-D])[\.\)]\s+/);

    for (let j = 1; j < choiceParts.length; j += 2) {
      const choiceText = choiceParts[j + 1];
      if (choiceText) {
        const cleaned = choiceText
          .split(/\n[A-D][\.\)]/)[0]
          .trim()
          .replace(/\s+/g, " ");
        if (cleaned) choices.push(cleaned);
      }
    }
    if (choices.length < 2) continue;

    const correctLetter = answerMatch[1].toUpperCase();
    let correctIndex = correctLetter.charCodeAt(0) - 65;
    if (correctIndex < 0 || correctIndex >= choices.length) correctIndex = 0;

    let explanation = "";
    const expMatch = afterAnswer.match(/Explanation:\s*\n?([\s\S]*?)$/i);
    if (expMatch) {
      explanation = expMatch[1]
        .replace(/\n{2,}/g, " ")
        .replace(/References:[\s\S]*$/, "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 1000);
    }

    questions.push({
      id: `${slug}-${qNum}`,
      domain: slug.toUpperCase().replace(/-/g, " "),
      stem,
      choices,
      correctIndex,
      explanation,
    });
  }

  questions.sort((a, b) => {
    const numA = parseInt(a.id.split("-").pop() ?? "0", 10);
    const numB = parseInt(b.id.split("-").pop() ?? "0", 10);
    return numA - numB;
  });

  console.log(`Successfully parsed ${questions.length} questions`);

  if (questions.length > 0) {
    console.log("\nSample question:");
    console.log(`  Q: ${questions[0].stem.slice(0, 80)}…`);
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
