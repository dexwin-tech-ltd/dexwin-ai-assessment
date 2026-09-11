#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if (exec 3<>/dev/tcp/127.0.0.1/3000) 2>/dev/null; then
  exit 0
fi

exec npm run dev
