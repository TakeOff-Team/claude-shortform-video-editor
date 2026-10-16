#!/bin/bash
# ./edit render <slug> [version]
# Renders the edit, masters the audio to -14 LUFS, and lays your music bed under it if my-style/style.json
# has one ("music": {"file": "my-style/music/song.mp3", "level": -30}).
# Every render gets a new version number (v1, v2...) so apps that cache by filename never show an old cut.
set -e
cd "$(dirname "$0")/.."
SLUG=$1
P=projects/$SLUG
OUT=$P/out
mkdir -p "$OUT"
V=${2:-}
if [ -z "$V" ]; then V=1; while [ -e "$OUT/$SLUG-v$V.mp4" ]; do V=$((V+1)); done; fi
FINAL="$OUT/$SLUG-v$V.mp4"

node tools/build_props.mjs "$SLUG"
echo "rendering v$V (about 1-3 minutes per minute of video)..."
(cd engine && npx --no-install remotion render src/index.ts Main "../$OUT/.render.mp4" --props="../$P/.props.json" --log=error)

MUSIC=$(node -e "try{const s=require('./my-style/style.json');if(s.music&&s.music.file)console.log(s.music.file+'|'+(s.music.level??-30)+'|'+(s.music.start??0))}catch(e){}")
if [ -n "$MUSIC" ]; then
  IFS='|' read -r SONG LEVEL START <<< "$MUSIC"
  if [ -f "$SONG" ]; then
    echo "adding music: $SONG"
    tools/add_music.sh "$OUT/.render.mp4" "$SONG" "$FINAL" "$LEVEL" "$START"
  else
    echo "(music file $SONG not found, skipping music)"
    tools/master_audio.sh "$OUT/.render.mp4" "$FINAL"
  fi
else
  tools/master_audio.sh "$OUT/.render.mp4" "$FINAL"
fi
rm -f "$OUT/.render.mp4"
echo "done: $FINAL"
echo "next: ./edit qa $SLUG $V"
