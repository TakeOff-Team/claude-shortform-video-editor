#!/bin/bash
# Music bed under the voice:  tools/add_music.sh in.mp4 song.mp3 out.mp4 [bed LUFS, default -30] [song start s, default 0]
# Trims the song to the video, fades it in (0.3s) and out (1.2s), levels it flat so a song that builds
# doesn't get louder, ducks it ~3 dB while you talk, mixes, then re-masters the whole thing to -14 LUFS.
# Louder bed: -27. Quieter: -33.
set -e
IN=$1; SONG=$2; OUT=$3; BED=${4:--30}; START=${5:-0}
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
FO=$(awk -v d="$D" 'BEGIN{x=d-1.2; if(x<0)x=0; printf "%.3f", x}')
TMP=$(mktemp -d)
ffmpeg -nostdin -hide_banner -loglevel error -y -i "$IN" -ss "$START" -i "$SONG" -filter_complex \
  "[1:a]atrim=0:$D,asetpts=PTS-STARTPTS,aresample=48000,loudnorm=I=$BED:LRA=2:TP=-12,afade=t=in:d=0.3,afade=t=out:st=$FO:d=1.2[m];\
   [0:a]asplit=2[v][sc];[m][sc]sidechaincompress=threshold=0.05:ratio=2:attack=20:release=300[duck];\
   [v][duck]amix=inputs=2:duration=first:normalize=0[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k "$TMP/mix.mp4"
"$(dirname "$0")/master_audio.sh" "$TMP/mix.mp4" "$OUT"
rm -rf "$TMP"
