#!/bin/bash
# ./edit face <slug>  ->  projects/<slug>/out/face.jpg
# Three frames from the cut side by side with guide lines at 25 / 50 / 75% height, so Claude can read
# where your face sits (faceCenter in edit.json, 0 = top of frame, 1 = bottom). Split-screen layouts
# use it to keep your face framed high instead of cut off.
set -e
P=$1
V="$P/cut.mp4"; [ -f "$V" ] || V="$P/source.mp4"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
TMP=$(mktemp -d)
i=0
for f in 0.2 0.5 0.8; do
  T=$(awk -v d="$D" -v f="$f" 'BEGIN{printf "%.2f", d*f}')
  ffmpeg -nostdin -hide_banner -loglevel error -y -ss "$T" -i "$V" -frames:v 1 \
    -vf "scale=540:960,drawbox=y=ih*0.25:w=iw:h=3:color=red@0.9:t=fill,drawbox=y=ih*0.5:w=iw:h=3:color=red@0.9:t=fill,drawbox=y=ih*0.75:w=iw:h=3:color=red@0.9:t=fill" \
    "$TMP/$i.png"
  i=$((i+1))
done
mkdir -p "$P/out"
ffmpeg -nostdin -hide_banner -loglevel error -y -i "$TMP/0.png" -i "$TMP/1.png" -i "$TMP/2.png" -filter_complex hstack=inputs=3 "$P/out/face.jpg"
rm -rf "$TMP"
echo "$P/out/face.jpg (red lines = 25%, 50%, 75% down the frame)"
