import { readdirSync, readFileSync } from "node:fs";
import { join, extname } from "node:path";

/**
 * INTENTIONALLY NAIVE
 * Fixed-width slices with no overlap and no source metadata.
 * Headings and answers often land in different windows.
 */
const WINDOW = 80;

export function loadDocs(docsDir) {
  return readdirSync(docsDir)
    .filter((name) => extname(name) === ".md")
    .sort()
    .map((name) => ({
      name,
      text: readFileSync(join(docsDir, name), "utf8"),
    }));
}

export function chunkDocs(docs) {
  const chunks = [];
  for (const doc of docs) {
    const raw = doc.text.replace(/\s+/g, " ").trim();
    for (let i = 0; i < raw.length; i += WINDOW) {
      const text = raw.slice(i, i + WINDOW).trim();
      if (text) chunks.push({ text });
    }
  }
  return chunks;
}
