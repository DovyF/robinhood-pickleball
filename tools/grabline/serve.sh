#!/usr/bin/env bash
# Run the Grabline server on your own machine.
#   ./serve.sh            -> http://127.0.0.1:7860
#   PORT=9000 ./serve.sh
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "warning: ffmpeg not found — quality will be capped and audio conversion will fail." >&2
  echo "  macOS: brew install ffmpeg   Debian/Ubuntu: sudo apt install ffmpeg" >&2
fi

if [ ! -d .venv ]; then
  echo "Creating virtualenv…"
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

export PORT="${PORT:-7860}"
echo
echo "Grabline server on http://127.0.0.1:${PORT}"
echo "Paste that into the front end under Server."
echo
exec uvicorn app:app --host 0.0.0.0 --port "${PORT}"
