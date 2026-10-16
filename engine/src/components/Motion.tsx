import React, { useLayoutEffect, useRef, useState } from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { springFor, useStyle } from "../style";
import type { Enter } from "../types";

/** Every graphic arrives (short spring from a direction) and then keeps drifting in slightly for the
 * whole beat, so no frame ever sits dead still. */
export const Arrive: React.FC<{ enter: Enter; dur: number; children: React.ReactNode }> = ({ enter, dur, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const style = useStyle();
  if (enter === "none") return <>{children}</>;
  const s = spring({ frame, fps, config: springFor(style) });
  const dist = style.motion.energy === "calm" ? 60 : style.motion.energy === "punchy" ? 200 : 130;
  const [dx, dy] =
    enter === "left" ? [-dist, 0] : enter === "right" ? [dist, 0] : enter === "up" ? [0, dist] : enter === "down" ? [0, -dist] : [0, 0];
  const pop = enter === "pop" ? interpolate(s, [0, 1], [0.72, 1]) : 1;
  const opacity = enter === "fade" ? interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" }) : Math.min(1, s * 2.5);
  const drift = style.motion.drift
    ? interpolate(frame, [0, Math.max(1, dur)], [1, 1.035], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) })
    : 1;
  return (
    <div style={{ transform: `translate(${dx * (1 - s)}px, ${dy * (1 - s)}px) scale(${pop * drift})`, opacity, willChange: "transform" }}>
      {children}
    </div>
  );
};

/** Lays its content out at `width` and shrinks it (never grows it) until it also fits `height`.
 * Measured in a layout effect, so the scaled version is what gets captured. */
export const FitBox: React.FC<{ width: number; height: number; children: React.ReactNode }> = ({ width, height, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const k = Math.min(1, height / Math.max(1, el.offsetHeight), width / Math.max(1, el.scrollWidth));
    if (Math.abs(k - scale) > 0.005) setScale(k);
  });
  return (
    <div style={{ width, height, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div ref={ref} style={{ width, flexShrink: 0, transform: `scale(${scale})`, transformOrigin: "center" }}>
        {children}
      </div>
    </div>
  );
};

/** 0 -> 1 over `frames` starting at frame `at` (relative to the current sequence). */
export const useAppear = (at: number, frames = 8) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const style = useStyle();
  return spring({ frame: frame - at, fps, config: springFor(style), durationInFrames: frames * 2 });
};
