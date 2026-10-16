#!/bin/bash
# Loudness master for Reels / TikTok / Shorts:  tools/master_audio.sh in.mp4 out.mp4
# One fixed gain to -14 LUFS (where the apps normalize to), then a true-peak limiter so nothing clips.
# No compressor, gate or one-pass loudnorm on the voice: they pump room echo and chop word endings.
# Method adapted from Jake Schincariol's master-skills (MIT).
set -e
IN=$1; OUT=$2
I=$(ffmpeg -nostdin -hide_banner -nostats -i "$IN" -map 0:a:0 -af "highpass=f=75,ebur128=peak=true" -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
G=$(awk -v i="$I" 'BEGIN{printf "%.2f", -14 - i}')
echo "voice measured $I LUFS -> gain $G dB"
ffmpeg -nostdin -hide_banner -loglevel error -y -i "$IN" -map 0:v -map 0:a -c:v copy \
  -af "highpass=f=75,volume=${G}dB,aresample=192000,alimiter=limit=0.794:attack=1:release=50:level=false:latency=true,aresample=48000" \
  -c:a aac -b:a 256k -movflags +faststart "$OUT"
