#!/usr/bin/env python3
"""Speech to text for every tool in this repo.

Uses mlx-whisper on Apple Silicon (fast, runs on the Mac's GPU) and openai-whisper on Intel Macs.
Both return the same shape: {"text", "segments": [{"start", "end", "text", "words": [{"word", "start", "end"}]}]}.

Settings (optional):
  WHISPER_MODEL     tiny | base | small | medium (default) | large-v3 | large-v3-turbo
  my-style/style.json  "language": "en" (default) and "vocabulary": ["Claude", "Notion", ...]
                       (names and brands you say a lot, so Whisper spells them right)

  python tools/asr.py --warmup     download the model once
"""
import json
import os
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR = 16000


def _style():
    try:
        return json.loads((ROOT / "my-style" / "style.json").read_text())
    except Exception:
        return {}


LANGUAGE = os.environ.get("WHISPER_LANGUAGE") or _style().get("language") or "en"
MODEL = os.environ.get("WHISPER_MODEL", "medium")
VOCAB = _style().get("vocabulary") or []

# Once the model is downloaded, run fully offline (no Hugging Face pings, no warnings).
_cached = Path.home() / ".cache" / "huggingface" / "hub" / f"models--mlx-community--whisper-{MODEL}-mlx"
if _cached.exists():
    os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("HF_HUB_DISABLE_PROGRESS_BARS", "1")

try:
    import mlx_whisper  # Apple Silicon
    BACKEND = "mlx"
except ImportError:
    import whisper  # Intel
    BACKEND = "openai"

_model = None


def load_audio(path) -> np.ndarray:
    """Any audio/video file -> 16 kHz mono float32."""
    out = subprocess.run(
        ["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-i", str(path), "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(out, np.int16).astype(np.float32) / 32768.0


def clip(audio: np.ndarray, start: float, end: float) -> np.ndarray:
    return audio[int(max(0.0, start) * SR):int(max(0.0, end) * SR)]


def transcribe(audio: np.ndarray, words: bool = False, prompt: str | None = None) -> dict:
    """Transcribe a numpy clip. Short clips (a few seconds to ~30s) are far more reliable than whole files:
    Whisper skips restarts and merges repeated phrases on long audio."""
    if len(audio) < SR * 0.1:
        return {"text": "", "segments": []}
    kw = dict(language=LANGUAGE, word_timestamps=words, condition_on_previous_text=False)
    p = prompt if prompt is not None else (", ".join(VOCAB) + "." if VOCAB else None)
    if p:
        kw["initial_prompt"] = p
    if BACKEND == "mlx":
        repo = MODEL if "/" in MODEL else f"mlx-community/whisper-{MODEL}-mlx"
        return mlx_whisper.transcribe(audio, path_or_hf_repo=repo, verbose=None, **kw)
    global _model
    if _model is None:
        _model = whisper.load_model(MODEL)
    return _model.transcribe(audio, fp16=False, **kw)


def word_list(result: dict, offset: float = 0.0) -> list[dict]:
    """Flatten a transcription into [{"text", "s", "e"}] on the source timeline."""
    out = []
    for seg in result.get("segments", []):
        for w in seg.get("words", []):
            t = w["word"].strip()
            if t and out and t[0] in "%.,!?;:)]'’" and not w["word"].startswith(" "):
                out[-1]["text"] += t  # "1" + "%" -> "1%": one word, not a fragment
                out[-1]["e"] = round(offset + w["end"], 3)
            elif t:
                out.append({"text": t, "s": round(offset + w["start"], 3), "e": round(offset + w["end"], 3)})
    return out


if __name__ == "__main__" and "--warmup" in sys.argv:
    transcribe(np.zeros(SR, np.float32))
    print(f"{BACKEND} whisper-{MODEL} ready")
