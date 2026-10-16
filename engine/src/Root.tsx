import React from "react";
import { Composition } from "remotion";
import { DEFAULT_STYLE, FPS, H, W } from "./style";
import type { Props } from "./types";
import { Main } from "./Video";

const empty: Props & { assets: string } = { video: "", duration: 5, words: [], beats: [], style: DEFAULT_STYLE, assets: "" };

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Main"
    component={Main}
    fps={FPS}
    width={W}
    height={H}
    durationInFrames={150}
    defaultProps={empty}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.ceil(props.duration * FPS)) })}
  />
);
