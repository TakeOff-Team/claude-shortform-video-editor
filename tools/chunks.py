#!/usr/bin/env python3
"""The editor's view of raw footage:  ./edit chunks <slug> [--from S] [--to E] [--db -36] [--gap 0.16]

Splits the raw audio at every real pause and transcribes each piece of speech ON ITS OWN.
Prints one line per chunk:  [start - end]  text

Why not transcribe the whole file? Whisper on a long file skips restarts and quietly merges repeated
takes into one clean line, which hides exactly the takes you need to choose between. Chunk edges sit
in silence, so they are clean cut points: copy the times straight into picks.json.
"""
import argparse
import sys

from asr import clip, load_audio, transcribe
from common import duration, speech_spans

ap = argparse.ArgumentParser()
ap.add_argument("job")
ap.add_argument("--from", dest="start", type=float, default=0.0)
ap.add_argument("--to", dest="end", type=float, default=None)
ap.add_argument("--db", type=float, default=-36, help="what counts as silence (dB)")
ap.add_argument("--gap", type=float, default=0.16, help="shortest pause that splits two chunks (s)")
a = ap.parse_args()

wav = f"{a.job}/audio.wav"
end = a.end if a.end is not None else duration(wav)
audio = load_audio(wav)
spans = speech_spans(wav, a.db, a.gap, a.start, end)
print(f"# {len(spans)} chunks, {a.start:.1f}s to {end:.1f}s (pause = {a.gap}s under {a.db:g} dB)", file=sys.stderr)
for s, e in spans:
    text = transcribe(clip(audio, s - 0.05, e + 0.05))["text"].strip()
    print(f"[{s:7.2f} - {e:7.2f}]  {text}", flush=True)
