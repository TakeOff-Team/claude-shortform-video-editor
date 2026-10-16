#!/usr/bin/env python3
"""Exact word timings for one stretch of the raw:  ./edit words <slug> START END

Use it to find the cut point inside a chunk (a false start, a hesitation, the last clean repeat).
Also prints the short pauses in that stretch, which are the cleanest places to cut.
"""
import sys

from asr import clip, load_audio, transcribe, word_list
from common import silences

job, a, b = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
audio = load_audio(f"{job}/audio.wav")
words = word_list(transcribe(clip(audio, a, b), words=True), offset=a)
print(" ".join(f"{w['text']}@{w['s']:.2f}" for w in words) + (f"  [ends {words[-1]['e']:.2f}]" if words else "  (no speech)"))
gaps = silences(f"{job}/audio.wav", -40, 0.06, a, b)
if gaps:
    print("pauses: " + ", ".join(f"{s:.2f}-{e:.2f}" for s, e in gaps))
