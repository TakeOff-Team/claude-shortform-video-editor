import React from "react";
import { Easing, Img, interpolate, OffthreadVideo, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fontStack, markColor, shadowOf, springFor, useStyle } from "../style";
import type { Panel, Style } from "../types";
import { Ink } from "./Ink";
import { plain, RichText, SurfaceContext, useAsset } from "./RichText";

/** Everything a panel needs to know about the beat it lives in. */
export type PanelCtx = { t0: number; dur: number; width: number; full: boolean; overlay?: boolean };

const isVideo = (src: string) => /\.(mp4|mov|webm|m4v)$/i.test(src);
const onBg = (s: Style) => (s.background === "blur" ? "#FFFFFF" : s.colors.ink);
const mutedOnBg = (s: Style) => (s.background === "blur" ? "rgba(255,255,255,0.78)" : s.colors.muted);

/** Frame (inside the beat) when a cue at `at` seconds lands; spreads un-timed items across the first 70%. */
const cueFrames = (n: number, at: (number | undefined)[], ctx: PanelCtx, fps: number) =>
  Array.from({ length: n }, (_, i) =>
    at[i] !== undefined ? Math.round((at[i]! - ctx.t0) * fps) : Math.round(((i * 0.7) / Math.max(1, n)) * ctx.dur * fps),
  );

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; pad?: number }> = ({ children, style, pad = 44 }) => {
  const s = useStyle();
  return (
    <div
      style={{
        background: s.colors.surface, borderRadius: s.cards.radius, boxShadow: shadowOf(s),
        border: s.cards.border ? `3px solid ${s.colors.ink}` : "none", padding: pad, color: s.colors.ink,
        fontFamily: fontStack(s.fonts.body), fontWeight: s.fonts.bodyWeight, ...style,
      }}
    >
      <SurfaceContext.Provider value={s.colors.surface}>{children}</SurfaceContext.Provider>
    </div>
  );
};

const usePop = (at: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useStyle();
  return spring({ frame: frame - at, fps, config: springFor(s) });
};

// ---------------------------------------------------------------------------------------------

const Title: React.FC<{ p: Extract<Panel, { type: "title" }>; ctx: PanelCtx }> = ({ p, ctx }) => {
  const s = useStyle();
  const n = plain(p.text).length;
  const auto = n <= 10 ? 160 : n <= 20 ? 132 : n <= 36 ? 112 : n <= 60 ? 92 : 74;
  const size = (p.size ?? auto) * (ctx.full ? 1 : 0.92);
  const shadow = ctx.overlay ? "0 4px 24px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.5)" : undefined;
  return (
    <div style={{ textAlign: p.align ?? "center", width: ctx.width }}>
      <div
        style={{
          fontFamily: fontStack(s.fonts.heading), fontWeight: s.fonts.headingWeight, fontSize: size, lineHeight: 1.08,
          letterSpacing: "-0.02em", color: ctx.overlay ? "#FFFFFF" : onBg(s), textWrap: "balance", textShadow: shadow,
        }}
      >
        <RichText text={p.text} />
      </div>
      {p.sub && (
        <div style={{ marginTop: size * 0.32, fontFamily: fontStack(s.fonts.body), fontWeight: s.fonts.bodyWeight, fontSize: Math.max(36, size * 0.38), color: mutedOnBg(s), lineHeight: 1.25, textWrap: "balance" }}>
          <RichText text={p.sub} />
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ p: Extract<Panel, { type: "stat" }>; ctx: PanelCtx }> = ({ p, ctx }) => {
  const s = useStyle();
  const frame = useCurrentFrame();
  const m = p.value.match(/^(.*?)([\d][\d,]*\.?\d*)(.*)$/);
  let shown = p.value;
  if (m && p.countUp !== false) {
    const target = parseFloat(m[2].replace(/,/g, ""));
    const decimals = (m[2].split(".")[1] ?? "").length;
    const k = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    const v = target * k;
    shown = m[1] + v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + m[3];
  }
  const size = (p.value.length <= 4 ? 300 : p.value.length <= 8 ? 230 : 170) * (ctx.full ? 1 : 0.8);
  return (
    <div style={{ textAlign: "center", width: ctx.width }}>
      <div style={{ fontFamily: fontStack(s.fonts.heading), fontWeight: 900, fontSize: size, lineHeight: 1, color: s.colors.accent, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
        {shown}
      </div>
      {p.label && (
        <div style={{ marginTop: 28, fontFamily: fontStack(s.fonts.heading), fontWeight: s.fonts.headingWeight, fontSize: size * 0.27, color: onBg(s), lineHeight: 1.15, textWrap: "balance" }}>
          <RichText text={p.label} />
        </div>
      )}
    </div>
  );
};

const Marker: React.FC<{ kind: string; i: number; k: number }> = ({ kind, i, k }) => {
  const s = useStyle();
  const size = 64;
  if (kind === "bullet") return <div style={{ width: 20, height: 20, borderRadius: 10, background: s.colors.accent, margin: "0 22px", transform: `scale(${k})` }} />;
  const bg = kind === "x" ? "#E5484D" : s.colors.accent;
  return (
    <div style={{ width: size, height: size, borderRadius: size, background: bg, color: "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${k})`, fontFamily: fontStack(s.fonts.heading), fontWeight: 800, fontSize: 34 }}>
      {kind === "number" ? i + 1 : (
        <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
          <path d={kind === "x" ? "M6 6 L18 18 M18 6 L6 18" : "M4 12.5 L9.5 18 L20 6.5"} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
        </svg>
      )}
    </div>
  );
};

const ListRow: React.FC<{ text: string; at: number; i: number; marker: string }> = ({ text, at, i, marker }) => {
  const k = usePop(at);
  const s = useStyle();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28, opacity: Math.min(1, k * 2), transform: `translateX(${(1 - k) * 60}px)` }}>
      <Marker kind={marker} i={i} k={k} />
      <div style={{ fontSize: 60, lineHeight: 1.18, fontWeight: 650, fontFamily: fontStack(s.fonts.body) }}>
        <RichText text={text} />
      </div>
    </div>
  );
};

const List: React.FC<{ p: Extract<Panel, { type: "list" }>; ctx: PanelCtx }> = ({ p, ctx }) => {
  const s = useStyle();
  const { fps } = useVideoConfig();
  const items = p.items.map((it) => (typeof it === "string" ? { text: it, at: undefined } : it));
  const at = cueFrames(items.length, items.map((it, i) => it.at ?? p.at?.[i]), ctx, fps);
  return (
    <Card style={{ width: ctx.width }} pad={52}>
      {p.title && (
        <div style={{ fontFamily: fontStack(s.fonts.heading), fontWeight: s.fonts.headingWeight, fontSize: 68, marginBottom: 36, lineHeight: 1.1 }}>
          <RichText text={p.title} />
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        {items.map((it, i) => <ListRow key={i} text={it.text} at={at[i]} i={i} marker={p.marker ?? "check"} />)}
      </div>
    </Card>
  );
};

const BrowserBar: React.FC<{ url?: string }> = ({ url }) => {
  const s = useStyle();
  return (
    <div style={{ height: 64, background: "#EDEBE8", display: "flex", alignItems: "center", gap: 12, padding: "0 22px", flexShrink: 0 }}>
      {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <div key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c }} />)}
      {url && (
        <div style={{ marginLeft: 16, flex: 1, height: 38, borderRadius: 19, background: "#fff", display: "flex", alignItems: "center", padding: "0 20px", fontSize: 24, color: "#555", fontFamily: fontStack(s.fonts.body), overflow: "hidden", whiteSpace: "nowrap" }}>
          {url.replace(/^https?:\/\//, "")}
        </div>
      )}
    </div>
  );
};

const Media: React.FC<{ p: Extract<Panel, { type: "media" }>; ctx: PanelCtx; areaH: number }> = ({ p, ctx, areaH }) => {
  const s = useStyle();
  const asset = useAsset();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const src = asset(p.src);
  const fill = !!p.fill;
  const push = interpolate(frame, [0, ctx.dur * fps], [1.0, 1.08], { extrapolateRight: "clamp" });
  const f = p.focus;
  const focusAt = f ? Math.round(((f.at ?? ctx.t0 + 0.4) - ctx.t0) * fps) : 0;
  const z = f && p.zoom ? interpolate(frame - focusAt, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }) : 0;
  const zs = f ? 1 + z * (Math.min(1 / f.w, 1 / f.h) * 0.8 - 1) : 1;
  const fx = f ? f.x + f.w / 2 : 0.5;
  const fy = f ? f.y + f.h / 2 : 0.5;

  const mediaStyle: React.CSSProperties = fill
    ? { width: "100%", height: "100%", objectFit: "cover", transform: `scale(${push})` }
    : { width: "100%", display: "block" };
  const el = isVideo(p.src) ? <OffthreadVideo src={src} muted style={mediaStyle} /> : <Img src={src} style={mediaStyle} />;
  const inner = (
    <div style={{ position: "relative", overflow: "hidden", width: "100%", height: fill ? "100%" : undefined }}>
      <div style={{ transform: `translate(${(0.5 - fx) * z * 100}%, ${(0.5 - fy) * z * 100}%) scale(${zs})`, transformOrigin: `${fx * 100}% ${fy * 100}%`, height: fill ? "100%" : undefined }}>
        {el}
      </div>
      {f && !p.zoom && <FocusRing f={f} at={focusAt} color={markColor(s)} hand={s.marks.style === "hand"} />}
    </div>
  );

  if (fill) return <div style={{ width: "100%", height: areaH, overflow: "hidden", borderRadius: p.frame === "none" ? 0 : s.cards.radius }}>{inner}</div>;
  const frameKind = p.frame ?? "card";
  const body =
    frameKind === "none" ? inner
      : frameKind === "phone" ? (
          <div style={{ width: ctx.width * 0.56, margin: "0 auto", borderRadius: 64, padding: 16, background: "#111", boxShadow: shadowOf(s) }}>
            <div style={{ borderRadius: 50, overflow: "hidden" }}>{inner}</div>
          </div>
        )
        : (
          <div style={{ borderRadius: s.cards.radius, overflow: "hidden", boxShadow: shadowOf(s), border: s.cards.border ? `3px solid ${s.colors.ink}` : "none", background: s.colors.surface }}>
            {frameKind === "browser" && <BrowserBar url={p.url} />}
            {inner}
          </div>
        );
  return (
    <div style={{ width: ctx.width }}>
      {body}
      {p.caption && (
        <div style={{ marginTop: 26, textAlign: "center", fontFamily: fontStack(s.fonts.heading), fontWeight: s.fonts.headingWeight, fontSize: 52, color: onBg(s), textWrap: "balance" }}>
          <RichText text={p.caption} />
        </div>
      )}
    </div>
  );
};

const FocusRing: React.FC<{ f: { x: number; y: number; w: number; h: number }; at: number; color: string; hand: boolean }> = ({ f, at, color, hand }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - at, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const padX = f.w * 0.08;
  const padY = f.h * 0.18;
  return (
    <Ink kind={hand ? "circle" : "box"} progress={p} color={color} hand={hand} width={7}
      style={{ left: `${(f.x - padX) * 100}%`, top: `${(f.y - padY) * 100}%`, width: `${(f.w + 2 * padX) * 100}%`, height: `${(f.h + 2 * padY) * 100}%` }} />
  );
};

const LogoTile: React.FC<{ src: string; label?: string; at: number; size: number }> = ({ src, label, at, size }) => {
  const s = useStyle();
  const asset = useAsset();
  const k = usePop(at);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: Math.min(1, k * 2), transform: `scale(${interpolate(k, [0, 1], [0.6, 1])})` }}>
      <div style={{ width: size, height: size, borderRadius: s.cards.radius, background: s.colors.surface, boxShadow: shadowOf(s), border: s.cards.border ? `3px solid ${s.colors.ink}` : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Img src={asset(src)} style={{ width: size * 0.62, height: size * 0.62, objectFit: "contain" }} />
      </div>
      {label && <div style={{ fontFamily: fontStack(s.fonts.heading), fontWeight: s.fonts.headingWeight, fontSize: 40, color: onBg(s), textAlign: "center", maxWidth: size + 40 }}>{label}</div>}
    </div>
  );
};

const Logos: React.FC<{ p: Extract<Panel, { type: "logos" }>; ctx: PanelCtx }> = ({ p, ctx }) => {
  const s = useStyle();
  const { fps } = useVideoConfig();
  const n = p.items.length;
  const perRow = n <= 3 ? n : n === 4 ? 2 : 3;
  const size = Math.min(300, (ctx.width - (perRow - 1) * 44) / perRow);
  const at = cueFrames(n, p.items.map((it) => it.at), ctx, fps);
  return (
    <div style={{ width: ctx.width, textAlign: "center" }}>
      {p.title && <div style={{ fontFamily: fontStack(s.fonts.heading), fontWeight: s.fonts.headingWeight, fontSize: 72, color: onBg(s), marginBottom: 48, lineHeight: 1.1 }}><RichText text={p.title} /></div>}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 44 }}>
        {p.items.map((it, i) => <LogoTile key={i} src={it.src} label={it.label} at={at[i]} size={size} />)}
      </div>
    </div>
  );
};

const Compare: React.FC<{ p: Extract<Panel, { type: "compare" }>; ctx: PanelCtx }> = ({ p, ctx }) => {
  const s = useStyle();
  const { fps } = useVideoConfig();
  const rightAt = Math.round(((p.at ?? ctx.t0 + ctx.dur * 0.45) - ctx.t0) * fps);
  const k = usePop(rightAt);
  const col = (side: { title: string; items?: string[] }, good: boolean) => (
    <Card style={{ flex: 1, opacity: good ? Math.min(1, k * 2) : 1, transform: good ? `translateY(${(1 - k) * 50}px)` : undefined, border: good ? `4px solid ${s.colors.accent}` : s.cards.border ? `3px solid ${s.colors.ink}` : "none" }} pad={36}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
        <Marker kind={good ? "check" : "x"} i={0} k={1} />
        <div style={{ fontFamily: fontStack(s.fonts.heading), fontWeight: s.fonts.headingWeight, fontSize: 54, lineHeight: 1.05 }}><RichText text={side.title} /></div>
      </div>
      {(side.items ?? []).map((t, i) => (
        <div key={i} style={{ fontSize: 44, lineHeight: 1.3, color: good ? s.colors.ink : s.colors.muted, marginTop: 10 }}><RichText text={t} /></div>
      ))}
    </Card>
  );
  return <div style={{ width: ctx.width, display: "flex", gap: 26, alignItems: "stretch" }}>{col(p.left, false)}{col(p.right, true)}</div>;
};

const Bubble: React.FC<{ m: { from: "me" | "them"; text: string; name?: string }; at: number }> = ({ m, at }) => {
  const s = useStyle();
  const k = usePop(at);
  const me = m.from === "me";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: me ? "flex-end" : "flex-start", opacity: Math.min(1, k * 2), transform: `scale(${interpolate(k, [0, 1], [0.85, 1])})`, transformOrigin: me ? "right bottom" : "left bottom" }}>
      {m.name && <div style={{ fontSize: 26, color: s.colors.muted, margin: "0 18px 6px" }}>{m.name}</div>}
      <div style={{ maxWidth: "82%", padding: "24px 32px", borderRadius: 40, fontSize: 50, lineHeight: 1.26, overflowWrap: "anywhere", background: me ? s.colors.accent : "#E9E9EB", color: me ? "#fff" : "#111", borderBottomRightRadius: me ? 10 : 38, borderBottomLeftRadius: me ? 38 : 10 }}>
        <RichText text={m.text} />
      </div>
    </div>
  );
};

const Chat: React.FC<{ p: Extract<Panel, { type: "chat" }>; ctx: PanelCtx }> = ({ p, ctx }) => {
  const s = useStyle();
  const { fps } = useVideoConfig();
  const at = cueFrames(p.messages.length, p.messages.map((m) => m.at), ctx, fps);
  return (
    <Card style={{ width: ctx.width }} pad={36}>
      {p.app && <div style={{ textAlign: "center", fontWeight: 700, fontSize: 32, color: s.colors.muted, marginBottom: 24 }}>{p.app}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>{p.messages.map((m, i) => <Bubble key={i} m={m} at={at[i]} />)}</div>
    </Card>
  );
};

const Typing: React.FC<{ p: Extract<Panel, { type: "typing" }>; ctx: PanelCtx }> = ({ p, ctx }) => {
  const s = useStyle();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const typeFrames = Math.max(10, Math.min(p.text.length * 1.4, ctx.dur * fps * 0.6));
  const n = Math.round(interpolate(frame, [4, 4 + typeFrames], [0, p.text.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const caret = Math.floor(frame / 8) % 2 === 0 ? 1 : 0;
  const resultAt = p.resultAt !== undefined ? Math.round((p.resultAt - ctx.t0) * fps) : Math.round(4 + typeFrames + 8);
  const r = usePop(resultAt);
  const variant = p.variant ?? "prompt";
  const term = variant === "terminal";
  const box: React.CSSProperties = term
    ? { background: "#15161A", color: "#E8E8E8", fontFamily: '"SF Mono", Menlo, monospace', borderRadius: s.cards.radius * 0.6 }
    : { background: s.colors.surface, color: s.colors.ink, fontFamily: fontStack(s.fonts.body), borderRadius: variant === "search" ? 999 : s.cards.radius };
  return (
    <div style={{ width: ctx.width }}>
      {p.label && <div style={{ fontFamily: fontStack(s.fonts.heading), fontWeight: s.fonts.headingWeight, fontSize: 54, color: onBg(s), marginBottom: 22, marginLeft: 8 }}>{p.label}</div>}
      <div style={{ ...box, boxShadow: shadowOf(s), padding: term ? "0 0 40px" : variant === "search" ? "30px 44px" : 44, fontSize: term ? 46 : 56, lineHeight: 1.32, minHeight: variant === "search" ? 0 : 220, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {term && <div style={{ height: 54, background: "#24262C", display: "flex", alignItems: "center", gap: 10, padding: "0 20px", marginBottom: 28 }}>{["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />)}</div>}
        <div style={{ padding: term ? "0 36px" : 0, display: "flex", gap: 18, alignItems: "flex-start" }}>
          {term && <span style={{ color: "#5AD07A" }}>$</span>}
          {variant === "search" && (
            <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke={s.colors.muted} strokeWidth={2.4} style={{ marginTop: 8, flexShrink: 0 }}><circle cx={11} cy={11} r={7} /><path d="M20 20 L16 16" /></svg>
          )}
          <span style={{ whiteSpace: "pre-wrap" }}>
            {p.text.slice(0, n)}
            <span style={{ opacity: caret, color: term ? "#E8E8E8" : s.colors.accent }}>▍</span>
          </span>
        </div>
      </div>
      {p.result && (
        <Card style={{ marginTop: 26, opacity: Math.min(1, r * 2), transform: `translateY(${(1 - r) * 40}px)`, fontSize: 42, lineHeight: 1.35 }} pad={38}>
          <RichText text={p.result} />
        </Card>
      )}
    </div>
  );
};

const Icon: React.FC<{ p: Extract<Panel, { type: "icon" }>; ctx: PanelCtx }> = ({ p, ctx }) => {
  const s = useStyle();
  const asset = useAsset();
  const k = usePop(0);
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 9) * 6;
  const size = ctx.full ? 300 : 240;
  return (
    <div style={{ textAlign: "center", width: ctx.width }}>
      <div style={{ transform: `translateY(${bob}px) scale(${interpolate(k, [0, 1], [0.4, 1])})`, display: "inline-block" }}>
        {p.src ? <Img src={asset(p.src)} style={{ width: size, height: size, objectFit: "contain" }} /> : <div style={{ fontSize: size, lineHeight: 1 }}>{p.emoji}</div>}
      </div>
      {p.label && <div style={{ marginTop: 36, fontFamily: fontStack(s.fonts.heading), fontWeight: s.fonts.headingWeight, fontSize: 84, color: onBg(s), lineHeight: 1.1, textWrap: "balance" }}><RichText text={p.label} /></div>}
    </div>
  );
};

const Quote: React.FC<{ p: Extract<Panel, { type: "quote" }>; ctx: PanelCtx }> = ({ p, ctx }) => {
  const s = useStyle();
  return (
    <Card style={{ width: ctx.width, position: "relative" }} pad={60}>
      <div style={{ fontFamily: fontStack(s.fonts.heading), fontSize: 180, lineHeight: 0.6, color: s.colors.accent, height: 70 }}>“</div>
      <div style={{ fontFamily: fontStack(s.fonts.heading), fontWeight: s.fonts.headingWeight, fontSize: 58, lineHeight: 1.22, textWrap: "balance" }}><RichText text={p.text} /></div>
      {p.author && <div style={{ marginTop: 30, fontSize: 36, color: s.colors.muted }}>{p.author}</div>}
    </Card>
  );
};

export const PanelView: React.FC<{ panel: Panel; ctx: PanelCtx; areaH: number }> = ({ panel, ctx, areaH }) => {
  switch (panel.type) {
    case "title": return <Title p={panel} ctx={ctx} />;
    case "stat": return <Stat p={panel} ctx={ctx} />;
    case "list": return <List p={panel} ctx={ctx} />;
    case "media": return <Media p={panel} ctx={ctx} areaH={areaH} />;
    case "logos": return <Logos p={panel} ctx={ctx} />;
    case "compare": return <Compare p={panel} ctx={ctx} />;
    case "chat": return <Chat p={panel} ctx={ctx} />;
    case "typing": return <Typing p={panel} ctx={ctx} />;
    case "icon": return <Icon p={panel} ctx={ctx} />;
    case "quote": return <Quote p={panel} ctx={ctx} />;
    default: return null;
  }
};
