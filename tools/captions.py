#!/usr/bin/env python3
"""Word-level captions for the finished cut:  ./edit captions <slug>   ->  words.json

Transcribes cut.mp4 in short pieces (one per take when there's a cut_map, otherwise split at pauses),
because long clips make Whisper drop sentences. A coverage check re-splits any piece that came back
with too few words. Names from script.txt and my-style vocabulary get their exact spelling back.

Fix a mishearing:  projects/<slug>/caption_fixes.json  {"cloud code": "Claude Code"}  then run it again.
"""
import re
import sys
from difflib import SequenceMatcher
from pathlib import Path

from asr import VOCAB, clip, load_audio, transcribe, word_list
from common import duration, norm, read_json, speech_spans, write_json

job = Path(sys.argv[1])
cut = job / "cut.mp4"
dur = duration(cut)
audio = load_audio(cut)
script = (job / "script.txt").read_text() if (job / "script.txt").exists() else ""

# pieces: the takes (cut_map), else speech spans merged into pieces of <= ~12s
cmap = read_json(job / "cut_map.json", {"segments": []})["segments"]
if cmap:
    pieces = [(sg["cut_s"], sg["cut_e"]) for sg in cmap]
else:
    pieces = []
    for s, e in speech_spans(cut, -38, 0.25):
        if pieces and e - pieces[-1][0] <= 12:
            pieces[-1] = (pieces[-1][0], e)
        else:
            pieces.append((s, e))
    pieces = [(max(0, s - 0.05), min(dur, e + 0.05)) for s, e in pieces] or [(0, dur)]

names = set(VOCAB) | {re.sub(r"[^A-Za-z0-9.]", "", t) for t in script.split() if t[:1].isupper() and len(t) > 3}
prompt = ", ".join(sorted(names))[:400] + "." if names else None


def spell(text: str) -> str:
    core = re.sub(r"[^A-Za-z0-9]", "", text)
    if len(core) <= 3:
        return text
    for nm in names:
        if core.lower() != nm.lower() and SequenceMatcher(None, core.lower(), nm.lower()).ratio() >= 0.8:
            return text.replace(core, nm)
    return text


def words_in(a: float, b: float, depth: int = 0) -> list[dict]:
    got = word_list(transcribe(clip(audio, a, b), words=True, prompt=prompt), offset=a)
    # people talk ~2.5-4.5 words/s. Under ~1.6 words/s means Whisper dropped a sentence: split + retry
    if depth < 2 and b - a > 1.5 and len(got) / (b - a) < 1.6:
        mid = (a + b) / 2
        return words_in(a, mid, depth + 1) + words_in(mid, b, depth + 1)
    return got


def mid_sentence(text: str) -> str:
    """Whisper capitalises the first word of every piece; mid-sentence it shouldn't be ("answers, You need")."""
    core = re.sub(r"[^A-Za-z']", "", text)
    if core in names or core in ("I", "I'm", "I'll", "I've", "I'd") or not core[:1].isupper() or core.isupper():
        return text
    return text.replace(core[0], core[0].lower(), 1)


words = []
for a, b in pieces:
    if b - a < 0.3:
        continue
    for k, w in enumerate(words_in(a, b)):
        if k == 0 and words and not re.search(r"[.!?]$", words[-1]["text"]):
            w["text"] = mid_sentence(w["text"])
        if words and (w["text"].startswith("-") or (w["text"].startswith(".") and len(w["text"]) <= 4)):
            words[-1]["text"] += w["text"]
            words[-1]["e"] = w["e"]
            continue
        words.append({"text": spell(w["text"]), "s": w["s"], "e": min(w["e"], b)})

# per-project phrase fixes: {"cloud code": "Claude Code", "chat gpt": "ChatGPT"}
fixes = read_json(job / "caption_fixes.json", {})
for wrong, right in fixes.items():
    bad, good = [norm(x) for x in wrong.split()], right.split()
    i = 0
    while i <= len(words) - len(bad):
        if bad and [norm(w["text"]) for w in words[i:i + len(bad)]] == bad:
            old = words[i:i + len(bad)]
            tail = re.sub(r"^.*?([.,!?]*)$", r"\1", old[-1]["text"])
            if len(good) == len(bad):  # same word count: keep each word's own timing
                new = [dict(w, text=g) for w, g in zip(old, good)]
            else:  # different count: share the phrase's time evenly
                s0, e0 = old[0]["s"], old[-1]["e"]
                step = (e0 - s0) / len(good)
                new = [{"text": g, "s": round(s0 + k * step, 3), "e": round(s0 + (k + 1) * step, 3)} for k, g in enumerate(good)]
            if tail and not new[-1]["text"].endswith(tail):
                new[-1]["text"] += tail
            words[i:i + len(bad)] = new
            i += len(new)
        else:
            i += 1

# keep timings sane: no overlaps, no zero-length words
for i, w in enumerate(words):
    if i and w["s"] < words[i - 1]["e"]:
        words[i - 1]["e"] = w["s"]
    w["e"] = max(w["e"], w["s"] + 0.05)

write_json(job / "words.json", {"duration": round(dur, 3), "words": words})
line = " ".join(w["text"] for w in words)
print(line)
print(f"\n{len(words)} words over {dur:.1f}s -> words.json. Read it against the script; fix mishearings in caption_fixes.json.")
