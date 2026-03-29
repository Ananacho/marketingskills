import React from "react";
import { Composition } from "remotion";
import { MapJourney } from "./MapJourney";

export const RemotionRoot = () => {
  return (
    <Composition
      id="MapJourney"
      component={MapJourney}
      durationInFrames={600}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
