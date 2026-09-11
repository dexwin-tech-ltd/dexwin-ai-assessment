/**
 * INTENTIONALLY NAIVE
 * Encourages general knowledge, no citations, no refusal policy.
 */
export const SYSTEM_PROMPT = [
  "You are a helpful company assistant for employees.",
  "Answer the question as best you can.",
  "You may use your general knowledge if the notes are thin.",
  "Be concise and confident.",
].join(" ");

export function buildUserMessage(context, question) {
  const ctx = context?.trim()
    ? `Notes:\n${context}\n\n`
    : "Notes: (none retrieved)\n\n";
  return `${ctx}Question: ${question}`;
}
