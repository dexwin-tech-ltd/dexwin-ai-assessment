# Dexwin live AI/LLM assessment

Timebox **60–75 minutes**. You will run a tiny, intentionally naive RAG app over a fake company FAQ corpus, then improve retrieval, prompts, and guardrails against a fixed eval set.

**Preferred environment:** GitHub Codespaces (same idea as the TaskFlow fullstack assessment). Local Docker is the backup. You are **not** expected to use a coding AI assistant. The only model in the loop is the Northline ops app under test.

The company in the corpus (**Northline**) is fictional. Nothing here is a real policy or a real secret.

---

## What you are building on

A small Node.js (no npm dependencies) internal-ops assistant:

- `docs/` — 12 short markdown FAQs
- `src/` — naive chunk → retrieve → prompt → model pipeline
- `eval/questions.json` — 10 questions (some answerable, some should be refused)
- Fixture mode so the session can run **without** a live vendor key

The baseline is supposed to look a bit dumb. Your job is to make it trustworthy enough that an interviewer would ship a v0.

---

## Two different “keys” (do not mix them up)

| | What | Who sets it |
| --- | --- | --- |
| **App under test** | `OPENAI_API_KEY` (optional `OPENAI_BASE_URL`, `OPENAI_MODEL`) | Interviewer: Codespaces secret or `.env`. Capped **org** OpenAI-compatible key. |
| **Fixture fallback** | `USE_FIXTURES=true` | Default when no key is present. Canned model responses so you can still work on retrieval, eval, and guardrails. |

There is no coding-assistant setup for this screen.

---

## Setup — GitHub Codespaces (preferred)

Use this when the interviewer has asked you to work from GitHub:

1. Fork this repository **or** open the repo they added you to as a collaborator (follow the interviewer’s instruction).
2. Select **Code** → **Codespaces** → **Create codespace on main**.
3. Wait until the terminal shows **Assessment environment ready**. The Codespace copies `.env` if needed and starts the app.
4. Open port **3000** from the **Ports** panel if the browser preview does not appear. You should see a **Fixture mode** or **Live API** badge.
5. Keep forwarded ports private.

The first Codespace create may take a few minutes. The assessment clock should start only after **Assessment environment ready**.

**Live vs fixture in Codespaces**

- If the interviewer set a Codespaces secret named `OPENAI_API_KEY` on this repo (and you are working **on that repo**, not a fork), the app uses the live OpenAI-compatible API.
- If there is no key (typical on a **fork** — upstream secrets do not copy), the app runs in **fixture mode**. That is enough to complete the screen.
- To force canned responses even when a key exists: set `USE_FIXTURES=true` in `.env`.

Do not commit `.env`. Do not paste a personal unlimited key.

---

## Setup — local Docker (backup)

If Codespaces is unavailable:

```bash
cp .env.example .env
docker compose up --build
```

Then open [http://localhost:3000](http://localhost:3000).

Leave `OPENAI_API_KEY` empty for fixture mode. If the interviewer gives you a capped org key, put it in `.env` (or export it) and do **not** set `USE_FIXTURES=true`.

---

## Fixture vs live API (the RAG app)

| Mode | When | What happens |
| --- | --- | --- |
| **Fixture** | `USE_FIXTURES=true`, **or** no `OPENAI_API_KEY` | No vendor call. A deterministic stand-in model. It will hallucinate unless retrieved context + the system prompt give it something better. |
| **Live** | `OPENAI_API_KEY` set and `USE_FIXTURES` is not `true` | `POST {OPENAI_BASE_URL}/chat/completions` (OpenAI-compatible). |

Fixture scoring **does** move when you change chunking, retrieval, and the system prompt. The mock model is shallowly instruction-following (grounding / refuse / cite).

---

## Suggested stages

| Window | Do this |
| --- | --- |
| 0–10 min | Confirm the app is up. Click the sample questions. Run **Run eval set** or `npm run eval`. A low score is expected. |
| 10–25 min | Read `src/chunk.js`, `src/retrieve.js`, `src/prompt.js`, `src/pipeline.js`, and two or three files in `docs/`. Form a diagnosis. Talk out loud. |
| 25–55 min | Improve the pipeline. Re-run eval often. Aim to ground answers, cite sources, and refuse questions the corpus cannot support. |
| last 10–15 min | Freeze. Walk through before/after scores and one tradeoff you would not do in 75 minutes. |

You do not need embeddings, a vector database, or a rewrite of the app. Small, explained changes beat a silent “production RAG” dump.

---

## Commands

```bash
npm run dev          # http://localhost:3000
npm run eval         # scores eval/questions.json against the current pipeline
```

Eval exit code is `1` until every question passes — that is normal on the baseline.

---

## What we look at

- Can you run the app and the eval without ceremony?
- Do you find the actual failure modes (not just “the model is dumb”)?
- Do answers stay inside the corpus, with citations, and refuse cleanly when they should?
- Can you explain the diff you made?

`INTERVIEWER.md` is for the interviewer. Ignore it unless they share a prompt from it.

---

## Repo map

```
docs/                 Northline ops FAQs (the only allowed knowledge)
eval/questions.json   Fixed question set
eval/score.js         Scorer (also used by the UI)
src/chunk.js          How docs become chunks
src/retrieve.js       How chunks are picked
src/prompt.js         System / user prompt
src/fixtures.js       Offline model
src/llm.js            Fixture + live client
src/pipeline.js       ask()
src/server.js         Tiny HTTP UI
```
