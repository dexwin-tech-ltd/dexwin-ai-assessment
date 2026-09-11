# Interviewer guide — Dexwin live AI assessment

Candidate-facing doc is `README.md`. Do **not** paste this file into the candidate chat.

**Timebox:** 60–75 minutes  
**Primary environment:** GitHub Codespaces (TaskFlow-style). Local Docker is backup only.  
**App AI:** capped org OpenAI-compatible key via Codespaces secret `OPENAI_API_KEY`, or fixture mode  
**Coding assistants:** none. Do not recommend Copilot, Cursor, ChatGPT, or similar. This is not a “use AI to code” screen.

Northline is fictional. The baseline is intentionally naive.

---

## Org key for the app under test

The **only** model in the session is the Northline RAG pipeline. It reads:

- `OPENAI_API_KEY` (required for live calls)
- optional `OPENAI_BASE_URL` (default `https://api.openai.com/v1`)
- optional `OPENAI_MODEL` (default `gpt-4o-mini`)

That key is **not** a coding-assistant credential.

### Set a Codespaces secret (live mode)

On the **canonical** assessment repo (you need admin):

1. GitHub → **Settings** → **Secrets and variables** → **Codespaces**
2. **New repository secret**
   - Name: `OPENAI_API_KEY`
   - Value: the **capped org** OpenAI-compatible key
3. Optional secrets: `OPENAI_BASE_URL`, `OPENAI_MODEL` if you are not using default OpenAI.

Org-level Codespaces secrets work the same way if you scope them to this repository.

**Who should create the Codespace**

Repo/org Codespaces secrets are available to codespaces created **on that repository**. They do **not** copy to a candidate’s **fork**.

| Session shape | Live API | What to do |
| --- | --- | --- |
| Candidate is a **collaborator** and Codespaces **this** repo | Yes, if the secret is set | Preferred for live calls |
| Candidate **forks** then Codespaces the fork | Secret will be missing | Use **fixture mode**, or paste the capped key into `.env` in the session (do not commit it) |

If a key is present in the environment and `USE_FIXTURES` is not `true`, the app uses live Chat Completions. If the key is absent, it uses fixtures automatically.

### Force fixture mode

`.env` or environment: `USE_FIXTURES=true`  
Use this when the org key is unavailable, you want zero spend, or you want deterministic eval.

Fixture mode is enough to pass the screen (retrieval, prompts, guardrails, re-score). Live API is extra, never required.

---

## Setup for the session

1. Candidate opens **Codespaces** on the repo you specified (collaborator-on-canonical **or** their fork). Wait for **Assessment environment ready** and port **3000**.
2. Confirm the badge: **Fixture mode** vs **Live API**.
3. Have them run `npm run eval` (or **Run eval set** in the UI) before they edit anything. Record the score (expect **0 / 10** on the untouched baseline).

Backup if Codespaces fails: `cp .env.example .env` then `docker compose up --build`.

If they cannot boot fixture mode in ~10 minutes, that is already a signal. Help, then continue.

Do **not** tell them to install or open a coding assistant. If they use one unprompted, still grade **ownership of the diff** — a dump they cannot walk through is a fail.

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

Score the **conversation**, not just the last eval number. A 10/10 they cannot explain is a fail.

### Hire / pass

- Boots the app (Codespaces or Docker) and runs eval without you driving the keyboard
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
- Cannot walk through `ask()` / their own diff
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

- Pair in the Codespace (VS Code in the browser). They drive.
- Fixture mode is a full-credit path. Live API is extra.
- Do not steer them toward a coding assistant.
- If they want to add a dependency, make them justify it (clock is ticking).
- If they “finish” at 40 minutes, push on eval design or a failure case (partial retrieve, conflicting docs) rather than new features.
- After the session, keep their branch; the before/after `npm run eval` transcript is the artifact.

---

## Pass / fail cheat sheet

| Signal | Call |
| --- | --- |
| Boot + diagnosis + eval ≥7/10 + can explain | **Pass** |
| Eval 5–6/10 but crisp diagnosis and a clear next fix | **Lean pass** if senior-adjacent judgment is strong |
| Eval high, no ownership of the diff | **Fail** |
| Still hallucinating refuse questions | **Fail** |
| No eval re-run | **Fail** |
