#!/usr/bin/env python3
"""Check the finished video before anyone sees it:  ./edit qa <slug> [version]

Writes projects/<slug>/out/qa-vN.jpg: one still per beat (70% into it), numbered, with the platform safe
zone drawn on (anything outside the dashed box can get covered by the app's buttons and caption).
Also re-measures loudness and looks for frozen or black stretches.
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from common import read_json

job = Path(sys.argv[1])
slug = job.name
out = job / "out"
v = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else None
if v is None:
    vs = sorted(int(m.group(1)) for f in out.glob(f"{slug}-v*.mp4") if (m := re.search(r"-v(\d+)\.mp4$", f.name)))
    if not vs:
        sys.exit(f"no renders in {out} yet. Run ./edit render {slug}")
    v = str(vs[-1])
video = out / f"{slug}-v{v}.mp4"
beats = read_json(job / "edit.json")["beats"] or [{"s": 0, "e": 1}]


def ff(*a):
    return subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", *a], capture_output=True, text=True)


safe = ("drawbox=x=80*iw/1080:y=210*ih/1920:w=920*iw/1080:h=1270*ih/1920:color=0x00C8FF@0.9:t=3,"
        "drawtext=text='{n}':x=12:y=10:fontsize=34:fontcolor=white:box=1:boxcolor=black@0.7:boxborderw=6")
with tempfile.TemporaryDirectory() as tmp:
    for i, b in enumerate(beats):
        t = b["s"] + (b["e"] - b["s"]) * 0.7
        f = f"{tmp}/{i:03d}.png"
        r = ff("-loglevel", "error", "-y", "-ss", f"{t:.3f}", "-i", str(video), "-frames:v", "1", "-vf", "scale=270:480," + safe.format(n=i + 1), f)
        if r.returncode != 0:  # ffmpeg without drawtext
            ff("-loglevel", "error", "-y", "-ss", f"{t:.3f}", "-i", str(video), "-frames:v", "1", "-vf", "scale=270:480," + safe.split(",drawtext")[0], f)
    cols = 6
    sheet = out / f"qa-v{v}.jpg"
    ff("-loglevel", "error", "-y", "-framerate", "1", "-i", f"{tmp}/%03d.png", "-vf", f"tile={cols}x{-(-len(beats) // cols)}:padding=6:color=white", "-frames:v", "1", str(sheet))

loud = ff("-nostats", "-i", str(video), "-af", "ebur128=peak=true", "-f", "null", "-").stderr
I = re.findall(r"I:\s+(-?[\d.]+) LUFS", loud)
peak = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", loud)
black = re.findall(r"black_start:([\d.]+)", ff("-i", str(video), "-vf", "blackdetect=d=0.3:pix_th=0.05", "-an", "-f", "null", "-").stderr)
frozen = re.findall(r"freeze_start: ([\d.]+)", ff("-i", str(video), "-vf", "freezedetect=n=0.003:d=2.5", "-an", "-f", "null", "-").stderr)

print(f"contact sheet: {sheet}  (dashed box = safe zone, numbers = beats)")
print(f"loudness: {I[-1] if I else '?'} LUFS (target -14), true peak {peak[-1] if peak else '?'} dBFS (keep under -1)")
print("black frames: " + (", ".join(f"{x}s" for x in black) if black else "none"))
print("frozen picture (2.5s+ with nothing moving): " + (", ".join(f"{x}s" for x in frozen) if frozen else "none"))
