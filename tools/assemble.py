#!/usr/bin/env python3
"""Assemble the cut from the picked takes:  ./edit cut <slug>

picks.json: {"picks": [[start, end, "what's said"], ...]} in source seconds, in the order they play.
Each take gets a tiny lead-in so the first consonant isn't clipped and ends a couple of frames early
(tight cuts keep the pace up), except the very last take, which keeps its full tail. Takes butt together
with no air between them, with 8 ms audio fades at every joint so there are no clicks.
Writes cut.mp4 + cut_map.json (where each take sits on the cut timeline).

Tune the feel in my-style/style.json -> "clip": {"lead_in": 0.03, "end_early": 0.08}
"""
import subprocess
import sys
from pathlib import Path

from common import ROOT, read_json, write_json

job = Path(sys.argv[1])
picks = read_json(job / "picks.json")["picks"]
feel = read_json(ROOT / "my-style" / "style.json", {}).get("clip", {})
LEAD_IN = float(feel.get("lead_in", 0.03))
END_EARLY = float(feel.get("end_early", 0.08))

segs, t = [], 0.0
for k, (s, e, *note) in enumerate(picks):
    last = k == len(picks) - 1
    a = round(max(0.0, s - LEAD_IN), 3)
    b = round(e + 0.08 if last else max(s + 0.2, e - END_EARLY), 3)
    segs.append({"s": a, "e": b, "cut_s": round(t, 3), "cut_e": round(t + b - a, 3), "note": note[0] if note else ""})
    t += b - a

parts, ins = [], []
for k, sg in enumerate(segs):
    d = sg["e"] - sg["s"]
    parts.append(f"[0:v]trim={sg['s']}:{sg['e']},setpts=PTS-STARTPTS[v{k}];"
                 f"[0:a]atrim={sg['s']}:{sg['e']},asetpts=PTS-STARTPTS,"
                 f"afade=t=in:d=0.008,afade=t=out:st={max(0, d - 0.008):.3f}:d=0.008[a{k}];")
    ins.append(f"[v{k}][a{k}]")
graph = job / ".cut_filter.txt"
graph.write_text("".join(parts) + "".join(ins) + f"concat=n={len(segs)}:v=1:a=1[v][a]")
tmp = job / "cut.tmp.mp4"
# the Mac's hardware encoder first (fast), x264 if it isn't available
for enc in (["-c:v", "h264_videotoolbox", "-b:v", "16M", "-maxrate", "24M", "-bufsize", "32M"], ["-c:v", "libx264", "-preset", "veryfast", "-crf", "17"]):
    r = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-i", str(job / "source.mp4"),
                        "-filter_complex_script", str(graph), "-map", "[v]", "-map", "[a]", "-r", "30", *enc, "-pix_fmt", "yuv420p",
                        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", str(tmp)])
    if r.returncode == 0:
        break
else:
    sys.exit("ffmpeg couldn't assemble the cut (see the error above)")
tmp.replace(job / "cut.mp4")
graph.unlink()
write_json(job / "cut_map.json", {"duration": round(t, 3), "segments": segs})
src = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(job / "source.mp4")],
                     capture_output=True, text=True).stdout.strip()
print(f"{len(segs)} takes -> cut.mp4 ({float(src):.1f}s raw -> {t:.1f}s). Next: ./edit verify {job.name}")
