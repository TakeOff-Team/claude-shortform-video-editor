import { createContext, useContext, useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import type { Style } from "./types";

export const W = 1080;
export const H = 1920;
export const FPS = 30;

/** Instagram / TikTok / Shorts cover the edges with buttons and text. Keep everything important inside this box. */
export const SAFE = { left: 80, right: 1000, top: 210, bottom: 1480 };

// A neutral starting point. Onboarding replaces almost all of it with the creator's own look.
export const DEFAULT_STYLE: Style = {
  name: "default",
  colors: {
    background: "#F4F2EE",
    background2: "#E7E3DC",
    surface: "#FFFFFF",
    ink: "#141414",
    muted: "#6E6A64",
    accent: "#FF5B2E",
    accent2: "#2F6BFF",
    captionText: "#FFFFFF",
    captionBg: "rgba(0,0,0,0.55)",
  },
  fonts: { heading: "Inter", body: "Inter", caption: "Inter", headingWeight: 800, bodyWeight: 500, captionWeight: 800 },
  background: "dots",
  captions: { style: "pill", uppercase: false, size: 64, maxWords: 3, maxChars: 18 },
  cards: { radius: 28, shadow: "soft", border: false },
  motion: { energy: "normal", drift: true },
  marks: { style: "hand", color: "" },
  split: 0.5,
  punchIn: 1.12,
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

export const mergeStyle = (s?: DeepPartial<Style>): Style => {
  const d = DEFAULT_STYLE;
  const x = s ?? {};
  return {
    ...d,
    ...(x as object),
    colors: { ...d.colors, ...(x.colors ?? {}) },
    fonts: { ...d.fonts, ...(x.fonts ?? {}) },
    captions: { ...d.captions, ...(x.captions ?? {}) },
    cards: { ...d.cards, ...(x.cards ?? {}) },
    motion: { ...d.motion, ...(x.motion ?? {}) },
    marks: { ...d.marks, ...(x.marks ?? {}) },
  } as Style;
};

export const StyleContext = createContext<Style>(DEFAULT_STYLE);
export const useStyle = () => useContext(StyleContext);

export const markColor = (s: Style) => s.marks.color || s.colors.accent;

export const shadowOf = (s: Style) =>
  s.cards.shadow === "none" ? "none" : s.cards.shadow === "hard" ? `10px 12px 0 ${s.colors.ink}` : "0 18px 50px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.08)";

/** Spring settings per energy level. */
export const springFor = (s: Style) =>
  s.motion.energy === "calm"
    ? { damping: 26, stiffness: 160, mass: 0.8 }
    : s.motion.energy === "punchy"
      ? { damping: 16, stiffness: 420, mass: 0.5 }
      : { damping: 20, stiffness: 300, mass: 0.6 };

const SYSTEM = new Set(["system-ui", "-apple-system", "Helvetica", "Helvetica Neue", "Arial", "Georgia", "Times New Roman", "Menlo", "Courier New"]);

/** Load the style's Google Fonts before the first frame renders (falls back to system fonts if offline). */
export const useFonts = (s: Style) => {
  const families = [...new Set([s.fonts.heading, s.fonts.body, s.fonts.caption])].filter((f) => f && !SYSTEM.has(f));
  const key = families.join("|");
  const [handle] = useState(() => (families.length ? delayRender(`fonts: ${key}`, { timeoutInMilliseconds: 20000 }) : null));
  useEffect(() => {
    if (handle === null) return;
    const weights = [s.fonts.headingWeight, s.fonts.bodyWeight, s.fonts.captionWeight];
    const wait = loadFonts(families, weights).then(() => Promise.all(families.flatMap((f) => weights.map((w) => document.fonts.load(`${w} 40px "${f}"`)))));
    const timeout = new Promise((r) => setTimeout(r, 15000));
    Promise.race([wait, timeout])
      .catch(() => undefined)
      .finally(() => continueRender(handle));
  }, [handle, key]); // eslint-disable-line react-hooks/exhaustive-deps
};

// One Google Fonts stylesheet per family, loaded once per page. If a font doesn't come in the asked-for
// weights, retry with whatever it has; if it doesn't exist (or we're offline), the system font takes over.
let fontsReady: Promise<void> | null = null;
const css = (href: string) =>
  new Promise<boolean>((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve(true);
    link.onerror = () => {
      link.remove();
      resolve(false);
    };
    document.head.appendChild(link);
  });
const loadFonts = (families: string[], weights: number[]) =>
  (fontsReady ??= Promise.all(
    families.map(async (f) => {
      const fam = encodeURIComponent(f).replace(/%20/g, "+");
      const w = [...new Set([400, ...weights])].sort((a, b) => a - b).join(";");
      if (!(await css(`https://fonts.googleapis.com/css2?family=${fam}:wght@${w}&display=block`))) {
        await css(`https://fonts.googleapis.com/css2?family=${fam}&display=block`);
      }
    }),
  ).then(() => undefined));

export const fontStack = (f: string) => `"${f}", -apple-system, "Helvetica Neue", Arial, sans-serif`;
