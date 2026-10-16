#!/bin/bash
# ./edit new <slug> <video> [script.txt]
# Makes projects/<slug>/ with:
#   source.mp4  the video as a clean vertical 1080x1920, 30fps, SDR H.264 (iPhone HDR gets tone-mapped,
#               landscape footage gets centre-cropped to 9:16)
#   audio.wav   16 kHz mono, for transcription
#   script.txt  the script, if you have one (optional)
#   assets/     screenshots, logos and B-roll for this video
#   out/        storyboard + renders
set -e
cd "$(dirname "$0")/.."
SLUG=${1:?usage: ./edit new <slug> <video> [script.txt]}
SRC=${2:?usage: ./edit new <slug> <video> [script.txt]}
SCRIPT=${3:-}
[ -f "$SRC" ] || { echo "can't find the video: $SRC"; exit 2; }
case "$SLUG" in *[!a-z0-9-]*) echo "use a slug with only lowercase letters, numbers and dashes (e.g. my-first-video)"; exit 2 ;; esac

P=projects/$SLUG
mkdir -p "$P/assets" "$P/out"
[ -n "$SCRIPT" ] && cp "$SCRIPT" "$P/script.txt"

# Fit to 1080x1920 (cover + centre crop), constant 30fps.
FIT="scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1"
HDR=$(ffprobe -v error -select_streams v:0 -show_entries stream=color_transfer,color_primaries -of csv=p=0 "$SRC")
VF="$FIT,format=yuv420p"
if echo "$HDR" | grep -qE "arib-std-b67|smpte2084|bt2020"; then
  echo "HDR video (iPhone?) -> tone-mapping to normal colours"
  VF="zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,$FIT,format=yuv420p"
fi
encode() {
  # the Mac's hardware encoder is several times faster; fall back to x264 if it's unavailable
  for V in "-c:v h264_videotoolbox -b:v 16M -maxrate 24M -bufsize 32M" "-c:v libx264 -preset veryfast -crf 17"; do
    # shellcheck disable=SC2086
    ffmpeg -nostdin -hide_banner -loglevel error -y -i "$SRC" -map 0:v:0 -map 0:a:0 -vf "$1" -r 30 \
      $V -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$P/source.mp4" && return 0
  done
  return 1
}
if ! encode "$VF"; then
  echo "(tone-mapping not available in this ffmpeg, converting without it)"
  encode "$FIT,format=yuv420p"
fi
ffmpeg -nostdin -hide_banner -loglevel error -y -i "$P/source.mp4" -ac 1 -ar 16000 "$P/audio.wav"

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$P/source.mp4")
printf "ready: %s (%.1fs)\n" "$P" "$DUR"
echo "raw footage with retakes -> ./edit chunks $SLUG     already edited -> ./edit precut $SLUG"
