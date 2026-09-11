import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chunkDocs, loadDocs } from "./chunk.js";
import { complete } from "./llm.js";
import { SYSTEM_PROMPT, buildUserMessage } from "./prompt.js";
import { formatContext, retrieve } from "./retrieve.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

let cache;

export function corpusDir() {
  return resolve(ROOT, "docs");
}

export function getIndex() {
  if (!cache) {
    const docs = loadDocs(corpusDir());
    cache = { docs, chunks: chunkDocs(docs) };
  }
  return cache;
}

export function resetIndex() {
  cache = undefined;
}

export async function ask(question, cfg) {
  const q = String(question || "").trim();
  if (!q) throw new Error("Question is required.");

  const { docs, chunks } = getIndex();
  const retrieved = retrieve(q, chunks);
  const context = formatContext(retrieved);
  const user = buildUserMessage(context, q);
  const started = Date.now();
  const llm = await complete({
    system: SYSTEM_PROMPT,
    user,
    question: q,
    context,
    cfg,
  });

  return {
    question: q,
    answer: llm.text,
    retrieved,
    context,
    fixture: llm.fixture,
    model: llm.model,
    ms: Date.now() - started,
    stats: { docs: docs.length, chunks: chunks.length },
  };
}
