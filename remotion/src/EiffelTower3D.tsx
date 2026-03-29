import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  u: number;
  v: number;
  mapW: number;
  mapH: number;
  progress: number; // 0 → 1
}

// SVG-based pseudo-3D Eiffel Tower rendered with perspective depth layers
export const EiffelTower3D: React.FC<Props> = ({ u, v, mapW, mapH, progress }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const x = u * mapW;
  const y = v * mapH;

  // Scale up as it reveals
  const scale = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.9, stiffness: 160 },
  });

  // Gentle rotation for 3D feel
  const rotateY = interpolate(progress, [0, 1], [-15, 15]);
  const towerOpacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1]);

  // Build-up animation: tower grows from base upward
  const buildHeight = interpolate(progress, [0, 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <g transform={`translate(${x},${y})`} opacity={towerOpacity}>
      <g transform={`scale(${scale * 1.4})`}>
        <EiffelSVG buildHeight={buildHeight} rotateY={rotateY} progress={progress} frame={frame} />
      </g>
    </g>
  );
};

interface EiffelProps {
  buildHeight: number;
  rotateY: number;
  progress: number;
  frame: number;
}

const EiffelSVG: React.FC<EiffelProps> = ({ buildHeight, rotateY, progress, frame }) => {
  // The tower total SVG height is 200 units, placed above origin
  const totalH = 200;
  const clipH = totalH * buildHeight;

  // Gentle sway animation
  const sway = Math.sin(frame * 0.04) * 1.2 * Math.max(0, progress - 0.5);

  // Perspective skew for pseudo-3D (rotateY simulated by horizontal scale + shear)
  const skewX = rotateY * 0.15;
  const scaleX = 1 - Math.abs(rotateY) * 0.004;

  // Subtle spotlight
  const spotOpacity = interpolate(progress, [0.5, 1], [0, 0.7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <g transform={`translate(${sway}, 0)`}>
      {/* Glow on ground */}
      <ellipse cx={0} cy={0} rx={35} ry={8}
        fill="#f59e0b" opacity={0.18 * progress} />

      {/* Clip to build-up height */}
      <clipPath id="towerClip">
        <rect x={-60} y={-totalH - 10} width={120} height={clipH + 10} />
      </clipPath>

      {/* Spotlight beam */}
      <polygon
        points={`-2,-${totalH} 2,-${totalH} 30,30 -30,30`}
        fill="url(#spotGrad)"
        opacity={spotOpacity}
      />
      <defs>
        <radialGradient id="spotGrad" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#fef3c7" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="steelGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#8b7355" />
          <stop offset="40%"  stopColor="#c4a882" />
          <stop offset="60%"  stopColor="#d4b896" />
          <stop offset="100%" stopColor="#8b7355" />
        </linearGradient>
        <linearGradient id="shadowGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#3d2b1f" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#3d2b1f" stopOpacity={0}   />
        </linearGradient>
      </defs>

      <g clipPath="url(#towerClip)" transform={`scale(${scaleX}, 1) skewX(${skewX})`}>
        {/* ── Layer 1: Deep shadow (right face) ───────────────────── */}
        {/* Base legs */}
        <polygon points="-28,0 -18,-40 -10,-40 -18,0" fill="#2a1f14" />
        <polygon points=" 28,0  18,-40  10,-40  18,0" fill="#1a1209" />

        {/* ── Layer 2: Main structure ───────────────────────────────── */}
        {/* Left leg */}
        <polygon points="-28,0 -18,-40 -12,-40 -20,0" fill="url(#steelGrad)" />
        {/* Right leg */}
        <polygon points=" 28,0  18,-40  12,-40  20,0" fill="url(#steelGrad)" />
        {/* Center strut */}
        <polygon points="-6,0 6,0 4,-40 -4,-40" fill="#b8965e" />

        {/* Cross braces - base section */}
        {[-35, -28, -21, -14].map((y) => (
          <React.Fragment key={y}>
            <line x1={-22} y1={y}    x2={-10} y2={y - 7}   stroke="#7a6040" strokeWidth={1.5} />
            <line x1={-22} y1={y - 7} x2={-10} y2={y}      stroke="#7a6040" strokeWidth={1.5} />
            <line x1={22}  y1={y}    x2={10}  y2={y - 7}   stroke="#5a4530" strokeWidth={1.5} />
            <line x1={22}  y1={y - 7} x2={10}  y2={y}      stroke="#5a4530" strokeWidth={1.5} />
          </React.Fragment>
        ))}

        {/* First floor platform */}
        <rect x={-22} y={-40} width={44} height={6} rx={1} fill="#c4a882" />
        <rect x={-22} y={-40} width={44} height={2} rx={1} fill="#e0c9a0" />
        <rect x={-22} y={-44} width={44} height={4} rx={1} fill="#b8965e" />

        {/* Middle section */}
        <polygon points="-18,-44 18,-44 14,-82 -14,-82" fill="url(#steelGrad)" />
        {/* Shadow side */}
        <polygon points="18,-44 14,-82 16,-82 20,-44" fill="#2a1f14" />

        {/* Cross braces middle */}
        {[-50, -60, -70].map((y) => (
          <React.Fragment key={y}>
            <line x1={-16} y1={y}    x2={-6} y2={y - 10} stroke="#7a6040" strokeWidth={1.2} />
            <line x1={-16} y1={y - 10} x2={-6} y2={y}   stroke="#7a6040" strokeWidth={1.2} />
            <line x1={16}  y1={y}    x2={6}  y2={y - 10} stroke="#5a4530" strokeWidth={1.2} />
            <line x1={16}  y1={y - 10} x2={6}  y2={y}   stroke="#5a4530" strokeWidth={1.2} />
          </React.Fragment>
        ))}

        {/* Second floor platform */}
        <rect x={-16} y={-82} width={32} height={5} rx={1} fill="#c4a882" />
        <rect x={-16} y={-82} width={32} height={2} rx={1} fill="#e0c9a0" />
        <rect x={-16} y={-87} width={32} height={4} rx={1} fill="#b8965e" />

        {/* Upper shaft */}
        <polygon points="-12,-87 12,-87 5,-140 -5,-140" fill="url(#steelGrad)" />
        <polygon points="12,-87 5,-140 6,-140 13,-87" fill="#2a1f14" />

        {/* Cross braces upper */}
        {[-95, -108, -120].map((y) => (
          <React.Fragment key={y}>
            <line x1={-10} y1={y}    x2={-3} y2={y - 13} stroke="#7a6040" strokeWidth={1} />
            <line x1={-10} y1={y - 13} x2={-3} y2={y}   stroke="#7a6040" strokeWidth={1} />
            <line x1={10}  y1={y}    x2={3}  y2={y - 13} stroke="#5a4530" strokeWidth={1} />
            <line x1={10}  y1={y - 13} x2={3}  y2={y}   stroke="#5a4530" strokeWidth={1} />
          </React.Fragment>
        ))}

        {/* Third platform */}
        <rect x={-8} y={-140} width={16} height={4} rx={1} fill="#c4a882" />
        <rect x={-8} y={-143} width={16} height={3} rx={1} fill="#b8965e" />

        {/* Pinnacle */}
        <polygon points="-5,-143 5,-143 2,-190 -2,-190" fill="url(#steelGrad)" />
        <polygon points="5,-143 2,-190 3,-190 6,-143" fill="#2a1f14" />

        {/* Antenna */}
        <line x1={0} y1={-190} x2={0} y2={-200} stroke="#c4a882" strokeWidth={2} />
        <circle cx={0} cy={-201} r={2} fill="#f59e0b" opacity={0.9} />

        {/* Blinking light on antenna */}
        <circle
          cx={0} cy={-201} r={4}
          fill="#fef3c7"
          opacity={(Math.floor(frame / 10) % 2 === 0) ? 0.9 : 0.1}
        />

        {/* Arc lights */}
        {progress > 0.7 && (
          <>
            <circle cx={-18} cy={-40}  r={3} fill="#fef3c7" opacity={0.8} />
            <circle cx={18}  cy={-40}  r={3} fill="#fef3c7" opacity={0.8} />
            <circle cx={-12} cy={-82}  r={2.5} fill="#fef3c7" opacity={0.8} />
            <circle cx={12}  cy={-82}  r={2.5} fill="#fef3c7" opacity={0.8} />
            <circle cx={-6}  cy={-140} r={2} fill="#fef3c7" opacity={0.8} />
            <circle cx={6}   cy={-140} r={2} fill="#fef3c7" opacity={0.8} />
          </>
        )}
      </g>

      {/* Ambient shadow on map */}
      <ellipse cx={8} cy={2} rx={28} ry={5}
        fill="black" opacity={0.3 * buildHeight} />
    </g>
  );
};
