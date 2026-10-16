import React, { createContext, useContext } from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { markColor, useStyle } from "../style";
import { Ink } from "./Ink";

/** The colour text currently sits on (canvas or card), so accent words stay readable on both. */
export const SurfaceContext = createContext<string>("#FFFFFF");

const lum = (hex: string) => {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) return 0.5;
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

/** Where this project's files live in public/ (set once per render). */
export const AssetsContext = createContext<string>("");
export const useAsset = () => {
  const base = useContext(AssetsContext);
  return (src: string) => (/^(https?:|data:)/.test(src) ? src : staticFile(base + src.replace(/^assets\//, "")));
};

type MarkKind = "circle" | "underline" | "strike" | "highlight";

/** A word (or phrase) with a mark drawing itself onto it, `delay` frames into the beat. */
const Mark: React.FC<{ kind: MarkKind; delay: number; children: React.ReactNode }> = ({ kind, delay, children }) => {
  const frame = useCurrentFrame();
  const style = useStyle();
  const color = markColor(style);
  const p = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (kind === "highlight") {
    return (
      <span style={{ position: "relative", whiteSpace: "nowrap" }}>
        <span
          style={{
            position: "absolute", left: "-0.08em", right: "-0.08em", top: "18%", bottom: "8%",
            background: color, opacity: 0.32, borderRadius: style.marks.style === "hand" ? "0.2em 0.35em 0.25em 0.3em" : 6,
            transform: `scaleX(${p})`, transformOrigin: "left center",
          }}
        />
        <span style={{ position: "relative" }}>{children}</span>
      </span>
    );
  }
  // the box the stroke lives in, around the word (em-based, so it scales with the text)
  const box: React.CSSProperties =
    kind === "circle" ? { left: "-0.3em", right: "-0.3em", top: "-0.2em", bottom: "-0.12em" }
      : kind === "underline" ? { left: "-0.04em", right: "-0.04em", top: "0.96em", height: "0.26em" }
        : { left: "-0.06em", right: "-0.06em", top: "0.42em", height: "0.22em" };
  return (
    <span style={{ position: "relative", whiteSpace: "nowrap", display: "inline-block" }}>
      {children}
      <Ink kind={kind} progress={p} color={color} hand={style.marks.style === "hand"} width={kind === "strike" ? 9 : 7} style={box} />
    </span>
  );
};

const TOKEN = /\[\[(circle|underline|strike|highlight)(?:@(\d+))?:([^\]]+)\]\]|\*([^*]+)\*|\{\{img:([^}]+)\}\}|\n/g;

/**
 * Text with light markup:
 *   *word*                     accent colour
 *   [[circle:word]]            hand-drawn circle (also underline / strike / highlight)
 *   [[circle@12:word]]         ...drawn 12 frames into the beat (default 6)
 *   {{img:logo.png}}           an image inline, one line tall
 *   a real line break          new line
 */
export const RichText: React.FC<{ text: string; color?: string }> = ({ text, color }) => {
  const style = useStyle();
  const asset = useAsset();
  const surface = useContext(SurfaceContext);
  // a light accent (yellow) on a white card is unreadable as text: show it as a highlighter stripe instead
  const accentReads = contrast(style.colors.accent, surface) >= 2.6;
  const out: React.ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      out.push(<Mark key={k++} kind={m[1] as MarkKind} delay={m[2] ? Number(m[2]) : 6}>{m[3]}</Mark>);
    } else if (m[4]) {
      out.push(
        accentReads ? <span key={k++} style={{ color: style.colors.accent }}>{m[4]}</span>
          : <span key={k++} style={{ background: style.colors.accent, color: style.colors.ink, padding: "0 0.14em", borderRadius: "0.12em", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>{m[4]}</span>,
      );
    } else if (m[5]) {
      out.push(<Img key={k++} src={asset(m[5])} style={{ height: "0.9em", verticalAlign: "-0.1em", margin: "0 0.08em" }} />);
    } else {
      out.push(<br key={k++} />);
    }
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <span style={{ color }}>{out}</span>;
};

/** Plain text of a marked-up string (for sizing and the storyboard). */
export const plain = (text: string) =>
  text.replace(/\[\[[a-z]+(?:@\d+)?:([^\]]+)\]\]/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/\{\{img:[^}]+\}\}/g, "▢");
