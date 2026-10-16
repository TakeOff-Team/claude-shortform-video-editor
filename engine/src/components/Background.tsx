import React from "react";
import { AbsoluteFill, OffthreadVideo, useCurrentFrame } from "remotion";
import { H, useStyle, W } from "../style";

/** The canvas behind graphics. "blur" uses a dark, blurred copy of your own video. */
export const Background: React.FC<{ video: string }> = ({ video }) => {
  const s = useStyle();
  const frame = useCurrentFrame();
  const { background: bg, background2: bg2 } = s.colors;
  if (s.background === "blur") {
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <OffthreadVideo src={video} muted style={{ width: W, height: H, filter: "blur(38px) brightness(0.42) saturate(1.2)", transform: "scale(1.15)" }} />
      </AbsoluteFill>
    );
  }
  if (s.background === "gradient") {
    return <AbsoluteFill style={{ background: `linear-gradient(165deg, ${bg} 0%, ${bg2} 100%)` }} />;
  }
  if (s.background === "dots" || s.background === "grid") {
    const step = s.background === "dots" ? 44 : 72;
    const drift = (frame * 0.4) % step; // a slow drift so the background is never frozen
    const pattern =
      s.background === "dots"
        ? `radial-gradient(${bg2} 2.6px, transparent 2.8px)`
        : `linear-gradient(${bg2} 2px, transparent 2px), linear-gradient(90deg, ${bg2} 2px, transparent 2px)`;
    return (
      <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: -step, backgroundImage: pattern, backgroundSize: `${step}px ${step}px`, transform: `translate(${drift}px, ${drift}px)` }} />
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{ background: bg }} />;
};
