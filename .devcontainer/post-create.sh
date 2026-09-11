#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

if [[ -n "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY is present — live API mode for the RAG app under test."
else
  echo "No OPENAI_API_KEY — fixture mode (canned model). Enough to complete the screen."
fi

# Start once so "Assessment environment ready" means the UI is actually up.
if ! (exec 3<>/dev/tcp/127.0.0.1/3000) 2>/dev/null; then
  npm run dev >/tmp/northline-dev.log 2>&1 &
fi

for attempt in $(seq 1 30); do
  if (exec 3<>/dev/tcp/127.0.0.1/3000) 2>/dev/null; then
    echo
    echo "Assessment environment ready."
    echo "Open the Northline ops assistant on port 3000 (Ports panel)."
    exit 0
  fi
  sleep 1
done

echo "The app did not become ready on port 3000. Last log:" >&2
tail -n 80 /tmp/northline-dev.log >&2 || true
exit 1
