/**
 * INTENTIONALLY NAIVE
 * Case-sensitive token overlap, keep a single chunk, no title/boost.
 */
export function retrieve(query, chunks, k = 1) {
  const tokens = query.split(/\s+/).filter((w) => w.length > 2);
  const ranked = chunks
    .map((chunk) => {
      let score = 0;
      for (const token of tokens) {
        if (chunk.text.includes(token)) score += 1;
      }
      return { ...chunk, score };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked.slice(0, k);
}

export function formatContext(chunks) {
  // Baseline: dump raw text only — no filenames for citations to hook onto.
  return chunks.map((c) => c.text).join("\n---\n");
}
