#!/usr/bin/env python3
"""Stutter / restart / filler scan of the picked takes:  ./edit check <slug>

Reads projects/<slug>/picks.json and transcribes EVERY take on its own (short clips, so Whisper can't
smooth over a repeat). Flags:
  - a word or 2-3 word phrase said twice in a row ("which a lot of which a lot of")
  - a restart hidden across a breath (Whisper often merges those into one clean line)
  - cut-off fragments and filler (uh, um)
  - non-speech sounds at the edges or between words (a laugh, breath, click or lip smack)
Fix every FLAG by moving the pick (start at the LAST clean repeat), then run it again until it says clean.
"""
import sys

import numpy as np

from asr import SR, clip, load_audio, transcribe, word_list
from common import norm, read_json

job = sys.argv[1]
picks = read_json(f"{job}/picks.json")["picks"]
audio = load_audio(f"{job}/audio.wav")
NONSPEECH = {"", "ha", "hah", "haha", "heh", "hehe", "hm", "hmm", "mm", "mhm", "huh", "ah", "oh", "uh", "um",
             "pff", "tsk", "you", "laughs", "laughing", "sigh", "music", "applause"}
FILLER = {"uh", "um", "uhm", "erm", "er"}
FRAME = 320  # 20 ms at 16 kHz


def text_of(a: np.ndarray) -> list[str]:
    return [w for w in (norm(x) for x in transcribe(a)["text"].split()) if w]


def levels(seg: np.ndarray) -> list[float]:
    return [20 * np.log10(np.sqrt((seg[i:i + FRAME] ** 2).mean()) + 1e-9) for i in range(0, len(seg) - FRAME, FRAME)]


flagged = 0
for k, (s, e, *note) in enumerate(picks):
    ws = word_list(transcribe(clip(audio, s - 0.05, e + 0.05), words=True), offset=s - 0.05)
    toks = [norm(w["text"]) for w in ws]
    flags = []

    # 1. repeated word / phrase, back to back
    for n in (1, 2, 3):
        for i in range(len(toks) - 2 * n + 1):
            if all(toks[i:i + n]) and toks[i:i + n] == toks[i + n:i + 2 * n]:
                flags.append(f"repeat '{' '.join(toks[i:i + n])}' at {ws[i + n]['s']:.2f}s")
    # 2. fragments + filler
    for i, w in enumerate(ws):
        t = norm(w["text"])
        if w["text"].endswith("-") or (len(t) == 1 and t not in ("a", "i") and not t.isdigit() and not w["text"].strip(".,!?").isupper()):  # "X" the app is a word
            flags.append(f"fragment '{w['text']}' at {w['s']:.2f}s")
        if t in FILLER:
            flags.append(f"filler '{w['text']}' at {w['s']:.2f}s")

    seg = clip(audio, s, e)
    db = levels(seg)
    # 3. restart across a breath: split at every dip (>= 60 ms quiet) and compare both sides on their own
    run = 0
    for i, d in enumerate(db):
        run = run + 1 if d <= -36 else 0
        t = i * 0.02
        if run == 3 and 0.3 < t < (e - s) - 0.3:
            L, R = text_of(seg[:int(t * SR)]), text_of(seg[int(t * SR):])
            if L and R and (R[0] == L[-1] or (len(R) > 1 and any(L[j:j + 2] == R[:2] for j in range(len(L) - 1)))):
                flags.append(f"restart across a pause at {s + t:.2f}s: '...{' '.join(L[-4:])}' | '{' '.join(R[:4])}...' (start after the pause)")
    # 4. non-speech sounds: transcribe every short voiced island alone, padded with silence
    islands, start, quiet = [], None, 0
    for i, d in enumerate(db + [-99] * 6):
        if d > -36:
            start, quiet = (i if start is None else start), 0
        elif start is not None:
            quiet += 1
            if quiet >= 3:
                islands.append((start, i - quiet + 1))
                start, quiet = None, 0
    pad = np.zeros(SR // 2, np.float32)
    for a, b in islands:
        length = (b - a) * 0.02
        if length > 0.4 or length > 0.8 * (e - s):  # real words, or a one-word pick
            continue
        if any(w["s"] < s + a * 0.02 < w["e"] for w in ws):  # the soft tail of a word ("plat-FORM"), not a stray sound
            continue
        txt = transcribe(np.concatenate([pad, seg[a * FRAME:b * FRAME], pad]))["text"]
        if all(norm(w) in NONSPEECH for w in txt.split()) or not any(c.isalpha() for c in txt):
            flags.append(f"non-speech sound at {s + a * 0.02:.2f}-{s + b * 0.02:.2f}s (laugh/breath/click? move the edge past it)")

    flagged += bool(flags)
    line = " ".join(w["text"] for w in ws)
    print(("FLAG " if flags else "ok   ") + f"#{k + 1} [{s:.2f}-{e:.2f}] {line}" + (f"\n       <- " + "\n       <- ".join(flags) if flags else ""), flush=True)

print(f"\n{flagged} take(s) flagged. Fix them in picks.json and run ./edit check again." if flagged
      else "\nclean: no stutters, repeats, filler or stray sounds")
sys.exit(1 if flagged else 0)
