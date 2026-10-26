#!/bin/bash
# ./edit phone [N] [--any]      pull the newest N camera videos off a plugged-in iPhone into inbox/
# ./edit phone list [N]         just list the newest N videos on the phone (nothing is downloaded)
#
# Uses Apple's ImageCaptureCore (the same engine as the Image Capture app), so there is nothing to install.
# The puller compiles itself the first time (needs Xcode Command Line Tools, which Homebrew already installed).
# Prints one JSON line per video: {name, created, duration, mb, path}
# Exit codes: 2 = no iPhone found, 3 = phone locked / not trusted, 4 = download failed.
set -e
cd "$(dirname "$0")/.."
BIN=tools/.bin/iphone_pull
if [ ! -x "$BIN" ] || [ tools/iphone_pull.swift -nt "$BIN" ]; then
  mkdir -p tools/.bin
  command -v swiftc >/dev/null 2>&1 || { echo "swiftc is missing. Run: xcode-select --install" >&2; exit 1; }
  echo "building the iPhone puller (one time only)..." >&2
  swiftc -O tools/iphone_pull.swift -o "$BIN" 2>/dev/null
fi

if [ "${1:-}" = "list" ]; then
  exec "$BIN" list --n "${2:-10}"
fi

N=${1:-1}; shift 2>/dev/null || true
mkdir -p inbox
exec "$BIN" pull --n "$N" --out inbox "$@"
