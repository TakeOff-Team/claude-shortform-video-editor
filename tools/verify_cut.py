#!/usr/bin/env python3
"""Check the cut before anyone watches it:  ./edit verify <slug>

1. Dead space: any pause longer than the limit (default 0.12s) anywhere in cut.mp4.
2. Read-through: every take transcribed again ON THE CUT, so you can read the video top to bottom and
   catch a line in the wrong order, a word that lost its ending, or a take that starts mid-word.
3. Said twice: any 5-word run that appears twice in the whole cut (two takes of the same line both made it in).

Tune: my-style/style.json -> "clip": {"max_pause": 0.12}
"""
import sys
from pathlib import Path

from asr import clip, load_audio, transcribe
from common import ROOT, norm, read_json, silences

job = Path(sys.argv[1])
cut = job / "cut.mp4"
max_pause = float(read_json(ROOT / "my-style" / "style.json", {}).get("clip", {}).get("max_pause", 0.12))
problems = 0

gaps = [(s, e) for s, e in silences(cut, -36, max_pause)]
print(f"1. Dead space (pauses over {max_pause}s): " + ("none" if not gaps else ""))
for s, e in gaps:
    print(f"   {s:6.2f}s - {e:6.2f}s  ({e - s:.2f}s)")
problems += len(gaps)

cmap = read_json(job / "cut_map.json", {"segments": []})["segments"]
audio = load_audio(cut)
if not cmap:  # pre-cut video: read it in ~6s pieces
    from common import duration
    d = duration(cut)
    cmap = [{"cut_s": round(i, 2), "cut_e": round(min(d, i + 6), 2), "note": ""} for i in [x * 6.0 for x in range(int(d // 6) + 1)] if i < d]
print("\n2. Read-through (each take transcribed on the cut):")
all_words = []
for k, sg in enumerate(cmap):
    text = transcribe(clip(audio, sg["cut_s"], sg["cut_e"]))["text"].strip()
    all_words += [w for w in (norm(x) for x in text.split()) if w]
    print(f"   #{k + 1:<2} {sg['cut_s']:6.2f}s  {text}" + (f"   [{sg['note']}]" if sg.get("note") else ""))

print("\n3. Said twice: ", end="")
seen, dupes = {}, set()
N = 5  # a duplicated take repeats a long run; short phrases ("the last 30 days") legitimately come back
for i in range(len(all_words) - N + 1):
    tri = " ".join(all_words[i:i + N])
    if tri in seen and i - seen[tri] >= N:
        dupes.add(tri)
    seen.setdefault(tri, i)
print("nothing" if not dupes else "")
for d in sorted(dupes):
    print(f"   '{d}' appears more than once (fine if you meant it, a duplicate take if not)")
problems += len(dupes)

print(f"\n{'Looks clean.' if not problems else f'{problems} thing(s) to look at.'} Also listen for clipped word endings in the read-through above.")
