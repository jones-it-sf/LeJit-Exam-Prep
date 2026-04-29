#!/usr/bin/env tsx
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pdfParse from "pdf-parse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const pdfArg = process.argv[2];
const outArg = process.argv[3];

if (!pdfArg) {
  console.error("Usage: npm run import:cissp -- path/to/questions.pdf [output-json]");
  process.exit(1);
}

const pdfPath = path.isAbsolute(pdfArg) ? pdfArg : path.join(repoRoot, pdfArg);
const outfile = outArg ?? path.join(repoRoot, "public/content/exams/cissp/questions.json");

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
  console.log("Reading PDF...");
  const buf = readFileSync(pdfPath);
  const data = await pdfParse(buf);
  let text = data.text;

  console.log(`Extracted ${text.length} characters from ${data.numpages} pages`);

  // Remove watermarks, page markers, and JSON metadata
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
  
  console.log(`Found ${Math.floor(blocks.length / 2)} potential question blocks`);

  // blocks[0] is header, then alternating: qNum, content, qNum, content...
  for (let i = 1; i < blocks.length - 1; i += 2) {
    const qNum = blocks[i].trim();
    const content = blocks[i + 1];
    
    if (!content || content.length < 50) continue;

    // Find the answer line
    const answerMatch = content.match(/\nAnswer:\s*\n?\s*([A-D])\s*\n/i);
    if (!answerMatch) continue;

    const answerIdx = content.indexOf(answerMatch[0]);
    const questionPart = content.slice(0, answerIdx);
    const afterAnswer = content.slice(answerIdx + answerMatch[0].length);

    // Extract stem (before first choice)
    const firstChoiceIdx = questionPart.search(/\n[A-D][\.\)]\s/);
    if (firstChoiceIdx === -1) continue;

    const stem = questionPart.slice(0, firstChoiceIdx).trim().replace(/\s+/g, " ");
    if (stem.length < 10) continue;

    // Extract choices - improved regex to handle multiline choices
    const choicesText = questionPart.slice(firstChoiceIdx);
    const choices: string[] = [];
    
    // Split by choice markers
    const choiceParts = choicesText.split(/\n([A-D])[\.\)]\s+/);
    // choiceParts: ['', 'A', 'choice A text...', 'B', 'choice B text...', ...]
    
    for (let j = 1; j < choiceParts.length; j += 2) {
      const choiceText = choiceParts[j + 1];
      if (choiceText) {
        const cleaned = choiceText
          .split(/\n[A-D][\.\)]/)[0] // Stop at next choice marker
          .trim()
          .replace(/\s+/g, " ");
        if (cleaned) choices.push(cleaned);
      }
    }

    if (choices.length < 2) continue;

    // Correct answer
    const correctLetter = answerMatch[1].toUpperCase();
    let correctIndex = correctLetter.charCodeAt(0) - 65;
    if (correctIndex < 0 || correctIndex >= choices.length) correctIndex = 0;

    // Explanation - get everything after "Explanation:" until next question
    let explanation = "";
    const expMatch = afterAnswer.match(/Explanation:\s*\n?([\s\S]*?)$/i);
    if (expMatch) {
      explanation = expMatch[1]
        .replace(/\n{2,}/g, " ")
        .replace(/References:[\s\S]*$/, "") // Remove references section
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 1000); // Keep more explanation text
    }

    questions.push({
      id: `cissp-${qNum}`,
      domain: "CISSP",
      stem,
      choices,
      correctIndex,
      explanation,
    });
  }

  // Sort by number
  questions.sort((a, b) => {
    const numA = parseInt(a.id.replace("cissp-", ""), 10);
    const numB = parseInt(b.id.replace("cissp-", ""), 10);
    return numA - numB;
  });

  console.log(`Successfully parsed ${questions.length} questions`);

  // Show sample
  if (questions.length > 0) {
    console.log("\nSample question:");
    console.log(`  Q: ${questions[0].stem.slice(0, 80)}...`);
    console.log(`  Choices: ${questions[0].choices.length}`);
    console.log(`  Answer: ${String.fromCharCode(65 + questions[0].correctIndex)}`);
  }

  const pack = {
    $schema: "./question-pack-schema.json",
    examSlug: "cissp",
    questions,
  };

  writeFileSync(outfile, JSON.stringify(pack, null, 2), "utf8");
  console.log(`\nWrote: ${outfile}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
