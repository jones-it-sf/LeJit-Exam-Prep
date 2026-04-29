#!/usr/bin/env tsx
import { createHash } from "node:crypto";

const passphrase = process.argv[2]?.trim();
if (!passphrase) {
  console.error(
    "Usage: npm run gen-auth-hash -- '<team passphrase>'\n" +
      "Example: npm run gen-auth-hash -- \"hunter2\"",
  );
  process.exit(1);
}

const hex = createHash("sha256").update(passphrase, "utf8").digest("hex");

console.log("SHA-256 (hex):\n\n" + hex);
console.log(
  "\nSet this in `.env.local` (local) or Actions secret `EXAM_AUTH_HASH_HEX` mapped to env `VITE_AUTH_HASH_HEX`:",
);
console.log(`\n  VITE_AUTH_HASH_HEX=${hex}\n`);
