import React, { useMemo } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fontStack, useStyle } from "../style";
import type { Style, Word } from "../types";

type Chunk = { words: Word[]; s: number; e: number };

// Never end a caption on a word that leans into the next one ("the", "to", "your"...).
const WEAK = new Set(["the", "to", "a", "an", "and", "of", "in", "on", "for", "with", "your", "my", "is", "it's", "i", "i'm", "you", "at", "this", "that", "but", "or", "so", "if"]);
const bare = (t: string) => t.toLowerCase().replace(/[^a-z']/g, "");

/** Words -> short caption chunks. Phrasing rules adapted from Jake Schincariol's master-skills (MIT):
 * break after . ! ?, after a comma once there are 2 words, on pauses of 0.3s+, at the word/character limit;
 * never end on a weak word. Each chunk stays up until the next one starts (no flicker in between). */
export const chunkWords = (words: Word[], s: Style): Chunk[] => {
  const { maxWords, maxChars } = s.captions;
  const out: Chunk[] = [];
  let cur: Word[] = [];
  const len = (ws: Word[]) => ws.map((w) => w.text).join(" ").length;
  const flush = () => {
    if (cur.length) out.push({ words: cur, s: cur[0].s, e: cur[cur.length - 1].e });
    cur = [];
  };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const pause = prev && w.s - prev.e >= 0.3;
    const full = cur.length >= maxWords || len([...cur, w]) > maxChars;
    const lastWeak = cur.length > 0 && WEAK.has(bare(cur[cur.length - 1].text));
    if (cur.length && (pause || len([...cur, w]) > maxChars + 6 || (full && !lastWeak))) flush();
    cur.push(w);
    if (/[.!?]$/.test(w.text) || (/[,;:]$/.test(w.text) && cur.length >= 2)) flush();
  });
  flush();
  return out.map((c, i) => ({ ...c, e: out[i + 1] && out[i + 1].s - c.e < 0.6 ? out[i + 1].s : c.e + 0.25 }));
};

const clean = (t: string) => t.replace(/[.,!?;:"“”]+$/g, "").replace(/^["“”]+/, "");

export const Captions: React.FC<{ words: Word[]; y: number }> = ({ words, y }) => {
  const s = useStyle();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const chunks = useMemo(() => chunkWords(words, s), [words, s]);
  const c = chunks.find((x) => t >= x.s && t < x.e);
  if (!c || s.captions.style === "none") return null;

  const local = frame - Math.round(c.s * fps);
  const k = s.motion.energy === "calm" ? 1 : interpolate(local, [0, 4], [0.86, 1], { extrapolateRight: "clamp" });
  const size = s.captions.size;
  const st = s.captions.style;
  const base: React.CSSProperties = {
    fontFamily: fontStack(s.fonts.caption), fontWeight: s.fonts.captionWeight, fontSize: size, lineHeight: 1.15,
    textTransform: s.captions.uppercase ? "uppercase" : "none", color: s.colors.captionText, textAlign: "center",
    letterSpacing: s.captions.uppercase ? "0.01em" : "-0.01em",
  };
  const look: React.CSSProperties =
    st === "pill" ? { background: s.colors.captionBg, padding: "12px 30px 16px", borderRadius: 24 }
      : st === "box" ? { background: s.colors.accent, padding: "10px 26px 14px", borderRadius: 10 }
        : st === "outline" ? { WebkitTextStroke: `${Math.round(size / 7)}px #000`, paintOrder: "stroke fill", textShadow: "0 6px 18px rgba(0,0,0,0.35)" }
          : { textShadow: "0 3px 14px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.6)" }; // plain + highlight

  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: y, display: "flex", justifyContent: "center", transform: `translateY(-50%) scale(${k})` }}>
      <div style={{ ...base, ...look, maxWidth: 900 }}>
        {c.words.map((w, i) => {
          const active = (st === "highlight" || st === "outline") && t >= w.s && (i === c.words.length - 1 || t < c.words[i + 1].s);
          return (
            <span key={i} style={{ color: active ? s.colors.accent : undefined }}>
              {clean(w.text)}
              {i < c.words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
};
