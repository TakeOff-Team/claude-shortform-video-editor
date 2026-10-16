#!/usr/bin/env python3
"""Break down a reference video so Claude can learn the style from it:
    ./edit study <url or video file> [name]

Writes my-style/references/<name>/:
  video.mp4       the video (downloaded with yt-dlp, or copied)
  hook.jpg        the first 3 seconds at 4 frames per second (how the video opens)
  sheet-N.jpg     the whole video at 1 frame per second, 20 frames per sheet, timestamped
  breakdown.json  length, number of cuts, average shot length, cuts per second, speaking pace,
                  when each cut happens, and the transcript with timings
  transcript.txt  what's said

Instagram and TikTok sometimes block downloads. If a link fails, save the video (or screen record it)
and pass the file instead.
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

from asr import load_audio, transcribe, word_list
from common import ROOT, duration, write_json

src = sys.argv[1] if len(sys.argv) > 1 else sys.exit("usage: ./edit study <url or file> [name]")
name = sys.argv[2] if len(sys.argv) > 2 else None
refs = ROOT / "my-style" / "references"

if re.match(r"https?://", src):
    name = name or re.sub(r"[^a-z0-9]+", "-", src.lower().split("?")[0].rstrip("/").split("/")[-1])[:40] or "reference"
    out = refs / name
    out.mkdir(parents=True, exist_ok=True)
    venv_dl = ROOT / ".venv" / "bin" / "yt-dlp"  # setup keeps this one current; an old yt-dlp can't open Instagram
    dl = [str(venv_dl) if venv_dl.exists() else "yt-dlp", "-q", "--no-warnings", "-f", "mp4/bestvideo*+bestaudio/best",
          "--merge-output-format", "mp4", "-o", str(out / "video.%(ext)s"), src]
    r = subprocess.run(dl, capture_output=True, text=True)
    if (r.returncode != 0 or not (out / "video.mp4").exists()) and venv_dl.exists():
        print("download failed, updating yt-dlp and trying again...")
        subprocess.run([str(ROOT / ".venv" / "bin" / "pip"), "install", "-q", "--upgrade", "yt-dlp"], capture_output=True)
        r = subprocess.run(dl, capture_output=True, text=True)
    if r.returncode != 0 or not (out / "video.mp4").exists():
        sys.exit("Couldn't download that link (Instagram/TikTok often need a login).\n"
                 "Save the video to your computer or screen record it, then run: ./edit study <file> " + name +
                 f"\n\n{r.stderr.strip()[-400:]}")
else:
    p = Path(src).expanduser()
    if not p.exists():
        sys.exit(f"can't find {src}")
    name = name or re.sub(r"[^a-z0-9]+", "-", p.stem.lower()).strip("-") or "reference"
    out = refs / name
    out.mkdir(parents=True, exist_ok=True)
    shutil.copy(p, out / "video.mp4")

video = out / "video.mp4"
dur = duration(video)


def ff(*args):
    return subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y", *args], capture_output=True, text=True)


# contact sheets (timestamped when this ffmpeg has drawtext)
stamp = "drawtext=text='%{pts\\:hms}':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=4"
for f in out.glob("sheet-*.jpg"):
    f.unlink()
for label, vf, path in [
    ("hook", "trim=0:3,fps=4,scale=216:-2,{s}tile=6x2:padding=4:color=white", out / "hook.jpg"),
    ("sheet", "fps=1,scale=216:-2,{s}tile=5x4:padding=4:color=white", out / "sheet-%d.jpg"),
]:
    r = ff("-i", str(video), "-vf", vf.format(s=stamp + ","), *(["-frames:v", "1"] if label == "hook" else []), str(path))
    if r.returncode != 0:  # no drawtext: same sheet without timestamps
        ff("-i", str(video), "-vf", vf.format(s=""), *(["-frames:v", "1"] if label == "hook" else []), str(path))

# cuts = changes between frames. A low threshold catches graphic swaps on a plain background too
# (a full camera cut scores ~0.4+, a new card on a white canvas only ~0.1); hits closer than 0.3s merge.
err = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", str(video), "-vf", "select='gt(scene,0.1)',showinfo", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
cuts = []
for t in (round(float(x), 2) for x in re.findall(r"pts_time:([\d.]+)", err)):
    if not cuts or t - cuts[-1] >= 0.3:
        cuts.append(t)
shots = [b - a for a, b in zip([0.0] + cuts, cuts + [dur]) if b - a > 0.05]

words = word_list(transcribe(load_audio(video), words=True)) if dur < 600 else []
speech = (words[-1]["e"] - words[0]["s"]) if words else 0
text = " ".join(w["text"] for w in words)
(out / "transcript.txt").write_text(text + "\n")

stats = {
    "source": src,
    "length_s": round(dur, 1),
    "cuts": len(cuts),
    "average_shot_s": round(sum(shots) / len(shots), 2) if shots else round(dur, 1),
    "median_shot_s": round(sorted(shots)[len(shots) // 2], 2) if shots else round(dur, 1),
    "cuts_per_second": round(len(cuts) / dur, 2) if dur else 0,
    "words_per_second": round(len(words) / speech, 2) if speech else 0,
    "first_3s_said": " ".join(w["text"] for w in words if w["s"] < 3),
    "cut_times": cuts,
    "words": words,
}
write_json(out / "breakdown.json", stats)
sheets = sorted(out.glob("sheet-*.jpg"))
print(f"{name}: {dur:.1f}s, {len(cuts)} cuts (a new shot every {stats['average_shot_s']}s on average), "
      f"{stats['words_per_second']} words/s")
print(f"hook: \"{stats['first_3s_said']}\"")
print(f"look at: {out / 'hook.jpg'} + {len(sheets)} sheet(s): " + ", ".join(str(s) for s in sheets))
