import React, { useMemo } from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "./components/Background";
import { Captions } from "./components/Captions";
import { Arrive, FitBox } from "./components/Motion";
import { PanelView } from "./components/panels";
import { AssetsContext, SurfaceContext } from "./components/RichText";
import { H, mergeStyle, SAFE, StyleContext, useFonts, W } from "./style";
import type { Beat, Enter, Layout, Props } from "./types";

const ENTERS: Enter[] = ["up", "left", "pop", "right", "down"];

/** Where the graphic goes for each layout (x is always the safe column). */
const areaFor = (layout: Layout, splitY: number, fill: boolean) => {
  if (fill) return layout === "split" ? { top: 0, height: splitY, width: W, left: 0 } : { top: 0, height: H, width: W, left: 0 };
  const left = SAFE.left;
  const width = SAFE.right - SAFE.left;
  if (layout === "split") return { top: SAFE.top, height: splitY - SAFE.top - 70, width, left };
  if (layout === "overlay") return { top: SAFE.top, height: 680, width: width - 40, left: left + 20 };
  return { top: SAFE.top, height: 1170, width, left }; // full
};

const captionY = (layout: Layout, splitY: number) => (layout === "split" ? splitY : layout === "full" ? 1440 : 1250);

export const Main: React.FC<Props & { assets: string }> = (props) => {
  const style = useMemo(() => mergeStyle(props.style), [props.style]);
  useFonts(style);
  return (
    <StyleContext.Provider value={style}>
      <AssetsContext.Provider value={props.assets}>
        <SurfaceContext.Provider value={style.background === "blur" ? "#202020" : style.colors.background}>
          <Edit {...props} style={style} />
        </SurfaceContext.Provider>
      </AssetsContext.Provider>
    </StyleContext.Provider>
  );
};

const Edit: React.FC<Props & { assets: string }> = ({ video, words, beats, style, faceCenter = 0.42 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const src = /^https?:/.test(video) ? video : staticFile(video);
  const splitY = Math.round(H * Math.min(0.62, Math.max(0.38, style.split)));

  const idx = beats.findIndex((b) => t >= b.s && t < b.e);
  const beat: Beat | undefined = beats[idx];
  const layout: Layout = beat?.layout ?? "face";

  // automatic reframing: face/split beats alternate wide and punched-in, so your face "cuts" too
  const zoom = beat?.zoom ?? ((layout === "face" || layout === "split") && idx % 2 === 1 ? style.punchIn : 1);
  const faceY = faceCenter * H;
  const videoBox: React.CSSProperties =
    layout === "split" ? { top: splitY, height: H - splitY } : layout === "full" ? { top: 0, height: H, opacity: 0 } : { top: 0, height: H };
  // in split, slide the frame up so your face sits ~40% down the bottom box
  const offset = layout === "split" ? Math.min(0, Math.round(0.4 * (H - splitY) - faceY)) : 0;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {(layout === "split" || layout === "full") && <Background video={src} />}

      {/* one video element for the whole edit, so the audio never stops; layouts only move it */}
      <div style={{ position: "absolute", left: 0, width: W, overflow: "hidden", ...videoBox }}>
        <div style={{ position: "absolute", left: 0, top: offset, width: W, height: H, transform: `scale(${zoom})`, transformOrigin: `50% ${faceCenter * 100}%` }}>
          <OffthreadVideo src={src} style={{ width: W, height: H }} />
        </div>
      </div>

      {beats.map((b, i) => {
        if (!b.panel) return null;
        const from = Math.round(b.s * fps);
        const dur = Math.max(1, Math.round(b.e * fps) - from);
        const fill = b.panel.type === "media" && !!b.panel.fill;
        const area = areaFor(b.layout, splitY, fill);
        const enter: Enter = fill ? "fade" : b.enter ?? (style.motion.energy === "calm" ? "fade" : ENTERS[i % ENTERS.length]);
        // panels lay out a little narrower than the area: the entrance pop + slow push-in grow them ~4%
        const inner = fill ? area.width : Math.round(area.width * 0.94);
        const ctx = { t0: b.s, dur: b.e - b.s, width: inner, full: b.layout === "full", overlay: b.layout === "overlay" };
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none" name={`beat ${i + 1}: ${b.panel.type}`}>
            <div style={{ position: "absolute", ...area, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Arrive enter={enter} dur={dur}>
                {fill ? (
                  <div style={{ width: area.width, height: area.height }}>
                    <PanelView panel={b.panel} ctx={ctx} areaH={area.height} />
                  </div>
                ) : (
                  <FitBox width={inner} height={Math.round(area.height * 0.96)}>
                    <PanelView panel={b.panel} ctx={ctx} areaH={area.height} />
                  </FitBox>
                )}
              </Arrive>
            </div>
          </Sequence>
        );
      })}

      {beat?.captions !== false && <Captions words={words} y={captionY(layout, splitY)} />}
    </AbsoluteFill>
  );
};
