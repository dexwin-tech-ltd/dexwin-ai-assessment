/**
 * Deterministic stand-in for a chat model.
 *
 * It is shallowly instruction-following so prompt + retrieval changes
 * move the eval score without calling a vendor:
 *   - If retrieved context has an extractable answer, use it.
 *   - If the system prompt asks to stay grounded / refuse, honor that
 *     when nothing extractable is present.
 *   - Otherwise emit a confident hallucination (the naive baseline).
 */

const STOP = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "do",
  "does",
  "we",
  "i",
  "how",
  "what",
  "when",
  "where",
  "who",
  "which",
  "should",
  "can",
  "could",
  "of",
  "for",
  "to",
  "and",
  "or",
  "in",
  "on",
  "at",
  "our",
  "you",
  "your",
  "if",
  "my",
  "me",
  "with",
  "from",
  "this",
  "that",
  "current",
]);

const HALLUCINATIONS = [
  {
    match: /pto|time[- ]off|vacation|leave|accrue/i,
    answer:
      "Northline offers unlimited PTO. Put the dates on the shared calendar and go.",
  },
  {
    match: /expense|concur|receipt/i,
    answer:
      "Email receipts to finance@northline.com whenever you remember. There is no deadline.",
  },
  {
    match: /on-call|on call|pager|escalat/i,
    answer:
      "Page whoever is in #general. After-hours escalation is the CEO, Jordan Hale.",
  },
  {
    match: /access logs|retain|retention/i,
    answer: "We keep production access logs forever for compliance.",
  },
  {
    match: /laptop|ship|macbook|device/i,
    answer:
      "IT will ship a laptop to any personal address. Just Slack your home details.",
  },
  {
    match: /mfa|phone|yubi|1password|okta/i,
    answer:
      "Disable MFA from the Okta self-service page if you lose your phone. SMS is preferred.",
  },
  {
    match: /stock|share price|ticker/i,
    answer: "Northline last traded at $42.50.",
  },
  {
    match: /ceo|cell number|personal (cell|phone)/i,
    answer: "You can reach the CEO at +1-415-555-0199.",
  },
  {
    match: /competitor|undercut|pricing this quarter/i,
    answer: "Undercut Freightly by 12% this quarter — Sales already agreed.",
  },
  {
    match: /pii|vendor|spreadsheet/i,
    answer:
      "Yes — email the customer spreadsheet to the vendor if it unblocks onboarding.",
  },
];

export function fixtureComplete({ system, context, question }) {
  const grounded = /only use|only from|provided|context|documents|notes|ground|do not use general|don't use general|must not invent|no general knowledge/i.test(
    system,
  );
  const wantsCite = /cite|citation|source|filename/i.test(system);
  const refuseIfMissing =
    /refuse|don't know|do not know|not in|insufficient|cannot answer|say you (do not|don't) have/i.test(
      system,
    );

  const extracted = extractiveAnswer(context, question);
  if (extracted) {
    let text = extracted;
    if (wantsCite) {
      const sources = extractSources(context);
      if (sources.length) text += `\n\nSources: ${sources.join(", ")}`;
    }
    return text;
  }

  if (grounded && refuseIfMissing) {
    return "I don't have that information in the provided documents.";
  }

  return hallucinate(question);
}

export function extractiveAnswer(context, question) {
  if (!context || !context.trim()) return null;
  const qWords = tokenize(question);
  if (!qWords.length) return null;

  const units = context
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const scored = units
    .map((s) => {
      const hits = qWords.filter((w) => s.toLowerCase().includes(w)).length;
      return { s, hits };
    })
    .filter((x) => x.hits >= 2)
    .sort((a, b) => b.hits - a.hits);

  if (!scored.length) return null;
  return scored
    .slice(0, 2)
    .map((x) => x.s)
    .join(" ");
}

function extractSources(context) {
  const fromTag = [...context.matchAll(/source:\s*([^\s\]]+\.md)/gi)].map(
    (m) => m[1],
  );
  const fromName = [...context.matchAll(/\b([\w-]+\.md)\b/g)].map((m) => m[1]);
  return [...new Set([...fromTag, ...fromName])];
}

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

function hallucinate(question) {
  for (const row of HALLUCINATIONS) {
    if (row.match.test(question)) return row.answer;
  }
  return "Based on common practice, ask your manager and proceed. This is standard at most companies.";
}
