import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  u: number;
  v: number;
  label: string;
  mapW: number;
  mapH: number;
  opacity: number;
  color?: string;
}

export const CityPin: React.FC<Props> = ({ u, v, label, mapW, mapH, opacity, color = "#60a5fa" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const x = u * mapW;
  const y = v * mapH;

  const scale = spring({ frame, fps, config: { damping: 14, mass: 0.7, stiffness: 180 } });

  return (
    <g transform={`translate(${x},${y})`} opacity={opacity}>
      {/* Pin stem */}
      <g transform={`scale(${scale})`}>
        <line x1={0} y1={-4} x2={0} y2={-28} stroke={color} strokeWidth={2} />
        {/* Pin head */}
        <circle cx={0} cy={-34} r={8} fill={color} opacity={0.9} />
        <circle cx={0} cy={-34} r={4} fill="white" opacity={0.9} />
        {/* Ripple rings */}
        <circle cx={0} cy={0} r={6}  fill="none" stroke={color} strokeWidth={1.5} opacity={0.6} />
        <circle cx={0} cy={0} r={12} fill="none" stroke={color} strokeWidth={1}   opacity={0.3} />
        {/* Label */}
        <text
          x={12}
          y={-28}
          fill="white"
          fontSize={14}
          fontFamily="sans-serif"
          fontWeight={600}
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
        >
          {label}
        </text>
      </g>
    </g>
  );
};
