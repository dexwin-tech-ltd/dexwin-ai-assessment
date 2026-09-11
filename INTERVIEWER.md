# Interviewer guide — Dexwin live AI assessment

Candidate-facing doc is `README.md`. Do **not** paste this file into the candidate chat.

**Timebox:** 60–75 minutes  
**Primary workflow:** Cursor (Open Folder), not Codespaces  
**Default run:** `USE_FIXTURES=true` — no API spend  
**Optional:** capped org OpenAI-compatible key, `USE_FIXTURES=false`

Northline is fictional. The baseline is intentionally naive.

---

## Setup for the session

1. Candidate forks/clones, opens the folder in Cursor, copies `.env.example` → `.env`.
2. Confirm fixture mode: `npm run dev` or `docker compose up --build`, badge says Fixture, [http://localhost:3000](http://localhost:3000) loads.
3. If you want live calls, put a **capped** org key in `OPENAI_API_KEY` (`.env` or Cursor env/secrets UI) and set `USE_FIXTURES=false`.
4. Have them run `npm run eval` once before they edit anything. Record the score (expect **0 / 10** on the untouched baseline; a lucky 1 is still a fail-the-row start).

If they cannot boot fixture mode in ~10 minutes, that is already a signal. Help with Docker vs Node, then continue.

---

## What the baseline does wrong

These are the planted bugs. A passing candidate names at least two without being walked through the files.

| Area | What we shipped | What it causes |
| --- | --- | --- |
| Chunking (`src/chunk.js`) | 80-character windows, no overlap, whitespace collapsed, **no filename** | Facts sit in a different window than the topic keyword; citations have nothing to hang on |
| Retrieval (`src/retrieve.js`) | Case-sensitive token overlap, **top-1** only | Often returns a keyword-rich intro that does not contain the answer; empty retrieve → hallucination |
| Prompt (`src/prompt.js`) | “Use general knowledge… be confident” | Ungrounded answers; no refuse policy; no citation contract |
| Context format | Raw chunk text, no `source:` | Even a better prompt cannot cite |
| Fixture model (`src/fixtures.js`) | Extractive if context is rich; otherwise a canned confident lie | Mirrors a sloppy chat model so eval moves when they fix retrieve + prompt |

Live mode uses the same prompt/retrieve path, so a real model will also invent stock prices and phone numbers unless they change the prompt.

---

## Eval key (`eval/questions.json`)

| ID | Expect | Gold |
| --- | --- | --- |
| q01-pto | Grounded + cite | **20 days** / year, not unlimited |
| q02-expenses | Grounded + cite | **Concur**, **14 days** |
| q03-oncall | Grounded + cite | **Dana Okonkwo** (not invented CEO Jordan Hale) |
| q04-retention | Grounded + cite | Access logs **90 days** (not forever) |
| q05-laptop | Grounded + cite | Ship only to **Workday** address, not “any personal address” |
| q06-mfa | Grounded + cite | **#it-help** (+ 1Password Identity vault in the doc) |
| q07-pii | Grounded + cite | **Never** email customer PII to a vendor |
| q08-stock | **Refuse** | No `$42.50` / no fabricated quote |
| q09-ceo | **Refuse** | No `415-555-0199` |
| q10-competitor | **Refuse** | No **Freightly** / **12%** |

A question **passes** only if it is correct (includes required phrases or a refusal pattern) **and** has a citation when `require_citation` is true (`.md`, `Source:`, or `[…]`).

---

## Rubric

Score the **conversation**, not just the last eval number. Cursor Agent doing the entire rewrite while they shrug is a fail even at 10/10.

### Hire / pass

- Boots fixture mode and runs eval without you driving the keyboard
- Diagnoses ≥2 planted issues (chunking, top-1 retrieve, missing sources, ungrounded prompt, no refuse)
- Makes **meaningful** pipeline changes (not CSS, not renaming files)
- Eval moves in the right direction (e.g. 0 → **7+ / 10**, or 5+ with a clear leftover they can explain)
- Can explain *why* a change should move a specific question
- Refusals hold on the three out-of-corpus items

### Strong

- Paragraph / heading / overlap chunking **and** `source` metadata on every chunk
- k>1 retrieve, case-fold, light stopword or title boost — and they know the tradeoff
- System prompt: answer only from context, cite filenames, refuse when missing
- Re-scores after each change; maybe tightens `questions.json` without gaming it
- Talks about what they would add next (hybrid search, embeddings + fixture fallback, better eval: faithfulness, citation precision) and what they would **not** add in v0

### Fail

- Cannot run the app or eval
- Cosmetic-only diff
- “The model is hallucinating” with no look at retrieve/prompt
- Still invents stock / CEO phone / competitor after they claim they are done
- Lets Agent replace the repo and cannot walk through `ask()`
- Commits a real key or pastes secrets into the corpus

### Borderline

- Prompt-only fix: refusals improve, answerable items still fail (retrieval never got the fact)
- Retrieval-only fix: facts appear, but no citations / no refusals
- High score in fixture mode, then they cannot say what would change under a real model

Treat prompt-only or retrieve-only as **leaning no** unless the discussion is excellent and they know the gap.

---

## Suggested live prompts

Use these if they stall. Do not start here.

- “Show me the chunks for the PTO question. Is the number 20 in what the model saw?”
- “If I asked for the CEO’s number, what *should* happen? What happens now?”
- “The fixture model is fake. Why did your prompt change still move the score?”
- “Would embeddings have fixed the PTO miss? What would they not fix?”

---

## Expected shape of a 75-minute fix (not a solution dump)

Enough to pass; they can write it in their own words:

1. Chunk on headings or paragraphs; keep `source: filename`.
2. Retrieve top 3–5, case-insensitive, maybe drop stopwords.
3. Format context as `[source: pto-and-leave.md]` + text.
4. System prompt: only the notes, cite sources, refuse if the notes do not support the answer. No general knowledge for facts.
5. Re-run `npm run eval`.

They do **not** need LangChain, a vector DB, rerankers, or auth.

---

## Conduct notes

- Pair in Cursor. They drive.
- Fixture mode is the official path. Live API is extra, never required to pass.
- If they want to add a dependency, make them justify it (clock is ticking).
- If they “finish” at 40 minutes, push on eval design or a failure case (partial retrieve, conflicting docs) rather than new features.
- After the session, keep their branch; the before/after `npm run eval` transcript is the artifact.

---

## Pass / fail cheat sheet

| Signal | Call |
| --- | --- |
| Fixture boot + diagnosis + eval ≥7/10 + can explain | **Pass** |
| Eval 5–6/10 but crisp diagnosis and a clear next fix | **Lean pass** if senior-adjacent judgment is strong |
| Eval high, no ownership of the diff | **Fail** |
| Still hallucinating refuse questions | **Fail** |
| No eval re-run | **Fail** |
