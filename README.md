# Dexwin live AI/LLM assessment

Cursor-first screen. Timebox **60–75 minutes**. You will run a tiny, intentionally naive RAG app over a fake company FAQ corpus, then improve retrieval, prompts, and guardrails against a fixed eval set.

This is **not** a GitHub Codespaces exercise. Work in [Cursor](https://cursor.com).

The company in the corpus (**Northline**) is fictional. Nothing here is a real policy or a real secret.

---

## What you are building on

A small Node.js (no npm dependencies) internal-ops assistant:

- `docs/` — 12 short markdown FAQs
- `src/` — naive chunk → retrieve → prompt → model pipeline
- `eval/questions.json` — 10 questions (some answerable, some should be refused)
- Fixture mode so you can work **without** a vendor API key

The baseline is supposed to look a bit dumb. Your job is to make it trustworthy enough that an interviewer would ship a v0.

---

## Setup (Cursor)

1. Fork or clone this repo.
2. Open the folder in Cursor: **File → Open Folder**.
3. Copy the env file:

   ```bash
   cp .env.example .env
   ```

4. Leave `USE_FIXTURES=true` unless you were given a **capped org** OpenAI-compatible key.

   If you have a key, put it in `OPENAI_API_KEY` in `.env`, or set the same variable in Cursor’s environment / secrets UI if your session uses that. Then set `USE_FIXTURES=false`.

   Do not commit `.env`. Do not use a personal unlimited key.

5. Run one of:

   ```bash
   docker compose up --build
   ```

   or, with Node 18+:

   ```bash
   npm install
   npm run dev
   ```

   (`npm install` is a no-op for runtime deps; the app uses Node builtins + `fetch`.)

6. Open [http://localhost:3000](http://localhost:3000). You should see a **Fixture mode** badge when no live key is in use.

---

## Fixture vs live API

| Mode | When | What happens |
| --- | --- | --- |
| **Fixture** (`USE_FIXTURES=true`, or unset and no key) | Default. Use this unless asked otherwise. | No network. A deterministic stand-in model. It will hallucinate unless retrieved context + the system prompt give it something better. |
| **Live** (`USE_FIXTURES=false` + `OPENAI_API_KEY`) | Optional, if a capped org key is provided. | `POST {OPENAI_BASE_URL}/chat/completions` (OpenAI-compatible). `OPENAI_BASE_URL` and `OPENAI_MODEL` are overridable. |

Fixture scoring **does** move when you change chunking, retrieval, and the system prompt. The mock model is shallowly instruction-following (grounding / refuse / cite). That is on purpose: you can iterate offline.

---

## Suggested stages

| Window | Do this |
| --- | --- |
| 0–10 min | Boot fixture mode. Click the sample questions. Run **Run eval set** or `npm run eval`. A low score is expected. |
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
- Do you use Cursor as an accelerator and still own the design?

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
