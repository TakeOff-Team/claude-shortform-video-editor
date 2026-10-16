import React, { useLayoutEffect, useRef, useState } from "react";

export type InkKind = "circle" | "underline" | "strike" | "box";

/** Stroke paths in real pixels (w x h), so the line keeps an even width and draws on smoothly. */
const pathFor = (kind: InkKind, w: number, h: number, hand: boolean) => {
  const X = (f: number) => (f * w).toFixed(1);
  const Y = (f: number) => (f * h).toFixed(1);
  if (kind === "circle" || kind === "box") {
    if (kind === "box" && !hand) return `M 0 0 H ${w} V ${h} H 0 Z`;
    if (!hand) return `M 0 ${Y(0.5)} A ${X(0.5)} ${Y(0.5)} 0 1 1 ${w} ${Y(0.5)} A ${X(0.5)} ${Y(0.5)} 0 1 1 0 ${Y(0.5)}`;
    // a loose loop that overshoots where it started, like a quick pen circle
    return `M ${X(0.1)} ${Y(0.58)} C ${X(0.04)} ${Y(0.2)}, ${X(0.92)} ${Y(0.04)}, ${X(0.98)} ${Y(0.46)} C ${X(1.02)} ${Y(0.86)}, ${X(0.2)} ${Y(1.0)}, ${X(0.05)} ${Y(0.62)} C ${X(0.01)} ${Y(0.44)}, ${X(0.24)} ${Y(0.18)}, ${X(0.62)} ${Y(0.14)}`;
  }
  if (!hand) return `M 0 ${Y(0.5)} L ${w} ${Y(0.5)}`;
  return kind === "underline"
    ? `M 0 ${Y(0.55)} C ${X(0.3)} ${Y(0.15)}, ${X(0.68)} ${Y(0.95)}, ${w} ${Y(0.3)}`
    : `M 0 ${Y(0.62)} C ${X(0.35)} ${Y(0.38)}, ${X(0.65)} ${Y(0.7)}, ${w} ${Y(0.4)}`;
};

/** A stroke that fills its absolutely positioned box and draws itself on as `progress` goes 0 -> 1. */
export const Ink: React.FC<{ kind: InkKind; progress: number; color: string; hand: boolean; width: number; style: React.CSSProperties }> = ({
  kind, progress, color, hand, width, style,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<[number, number]>([0, 0]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && (el.offsetWidth !== size[0] || el.offsetHeight !== size[1])) setSize([el.offsetWidth, el.offsetHeight]);
  });
  const [w, h] = size;
  return (
    <div ref={ref} style={{ position: "absolute", pointerEvents: "none", ...style }}>
      {w > 0 && h > 0 && progress > 0 && (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <path d={pathFor(kind, w, h, hand)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"
            pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - progress} />
        </svg>
      )}
    </div>
  );
};
