"""Shared helpers for the editing tools."""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30


def project(slug: str) -> Path:
    p = ROOT / "projects" / slug
    if not p.exists():
        sys.exit(f"no project called '{slug}' (looked in {p}). Start one with: ./edit new {slug} <video>")
    return p


def read_json(path: Path, default=None):
    try:
        return json.loads(Path(path).read_text())
    except FileNotFoundError:
        if default is not None:
            return default
        raise


def write_json(path: Path, data) -> None:
    Path(path).write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def duration(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def silences(path: Path, db: float = -36, min_len: float = 0.16, start: float = 0.0, end: float | None = None):
    """[(silence_start, silence_end)] in source seconds."""
    cmd = ["ffmpeg", "-nostdin", "-hide_banner", "-ss", str(start)]
    if end is not None:
        cmd += ["-t", str(end - start)]
    cmd += ["-i", str(path), "-af", f"silencedetect=n={db}dB:d={min_len}", "-f", "null", "-"]
    err = subprocess.run(cmd, capture_output=True, text=True).stderr
    s = [float(x) + start for x in re.findall(r"silence_start: (-?[\d.]+)", err)]
    e = [float(x) + start for x in re.findall(r"silence_end: ([\d.]+)", err)]
    stop = end if end is not None else duration(path)
    e += [stop] * (len(s) - len(e))
    return list(zip(s, e))


def speech_spans(path: Path, db: float = -36, gap: float = 0.16, start: float = 0.0, end: float | None = None, min_len: float = 0.15):
    """The pieces of speech between real pauses. Their edges are clean cut points."""
    stop = end if end is not None else duration(path)
    spans, cur = [], start
    for s, e in silences(path, db, gap, start, stop):
        if s - cur > min_len:
            spans.append((round(cur, 2), round(s, 2)))
        cur = e
    if stop - cur > min_len:
        spans.append((round(cur, 2), round(stop, 2)))
    return spans


def norm(word: str) -> str:
    return re.sub(r"[^a-z0-9']", "", word.lower())
