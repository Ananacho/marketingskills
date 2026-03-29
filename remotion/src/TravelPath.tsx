import React from "react";
import { useCurrentFrame } from "remotion";

interface UV { u: number; v: number }

interface Props {
  from: UV;
  to: UV;
  mapW: number;
  mapH: number;
  progress: number;   // 0 → 1
  color?: string;
}

// Build a great-circle-like arc using intermediate Mercator points
function buildArcPoints(from: UV, to: UV, segments = 60): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Slight arc upward (great-circle approximation via quadratic bezier in UV)
    const midU = (from.u + to.u) / 2;
    const midV = Math.min(from.v, to.v) - Math.abs(to.u - from.u) * 0.12;
    // Quadratic bezier
    const u = (1 - t) * (1 - t) * from.u + 2 * (1 - t) * t * midU + t * t * to.u;
    const v = (1 - t) * (1 - t) * from.v + 2 * (1 - t) * t * midV + t * t * to.v;
    pts.push([u, v]);
  }
  return pts;
}

function pointsToPath(pts: Array<[number, number]>, w: number, h: number, progress: number): string {
  const count = Math.max(2, Math.floor(pts.length * progress));
  return pts
    .slice(0, count)
    .map(([u, v], i) => `${i === 0 ? "M" : "L"}${(u * w).toFixed(1)},${(v * h).toFixed(1)}`)
    .join(" ");
}

// Animated dashes plane icon position
function getHeadPosition(pts: Array<[number, number]>, progress: number, w: number, h: number) {
  const idx = Math.min(pts.length - 1, Math.floor(pts.length * progress));
  const [u, v] = pts[Math.max(0, idx)];
  return { x: u * w, y: v * h };
}

export const TravelPath: React.FC<Props> = ({
  from, to, mapW, mapH, progress, color = "#60a5fa",
}) => {
  const frame = useCurrentFrame();
  if (progress <= 0) return null;

  const pts = buildArcPoints(from, to);
  const d = pointsToPath(pts, mapW, mapH, progress);
  const head = getHeadPosition(pts, Math.min(progress, 0.999), mapW, mapH);

  // Trailing glow path
  const trailStart = Math.max(0, progress - 0.15);
  const trailPts = pts.slice(
    Math.floor(pts.length * trailStart),
    Math.floor(pts.length * progress) + 1,
  );
  const trailD = trailPts
    .map(([u, v], i) => `${i === 0 ? "M" : "L"}${(u * mapW).toFixed(1)},${(v * mapH).toFixed(1)}`)
    .join(" ");

  // Animated pulse ring
  const pulse = (frame % 20) / 20;

  return (
    <g>
      {/* Full path (dim) */}
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeOpacity={0.25} strokeLinecap="round" />

      {/* Bright trailing segment */}
      <path d={trailD} fill="none" stroke={color} strokeWidth={3} strokeOpacity={0.9} strokeLinecap="round" />

      {/* Glow */}
      <path d={trailD} fill="none" stroke={color} strokeWidth={8} strokeOpacity={0.15} strokeLinecap="round" />

      {/* Head dot */}
      <circle cx={head.x} cy={head.y} r={5} fill={color} />
      <circle cx={head.x} cy={head.y} r={5 + pulse * 12} fill="none" stroke={color} strokeWidth={1.5} opacity={1 - pulse} />

      {/* Plane icon (triangle pointing in direction of travel) */}
      {progress > 0.02 && progress < 0.99 && (
        <PlaneIcon pts={pts} progress={progress} mapW={mapW} mapH={mapH} color={color} />
      )}
    </g>
  );
};

const PlaneIcon: React.FC<{
  pts: Array<[number, number]>;
  progress: number;
  mapW: number;
  mapH: number;
  color: string;
}> = ({ pts, progress, mapW, mapH, color }) => {
  const idx = Math.min(pts.length - 2, Math.floor(pts.length * progress));
  const [u0, v0] = pts[Math.max(0, idx - 1)];
  const [u1, v1] = pts[idx];
  const dx = u1 * mapW - u0 * mapW;
  const dy = v1 * mapH - v0 * mapH;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const cx = u1 * mapW;
  const cy = v1 * mapH;

  return (
    <g transform={`translate(${cx},${cy}) rotate(${angle})`}>
      {/* Simple plane silhouette */}
      <polygon
        points="-10,4 14,0 -10,-4"
        fill={color}
        opacity={0.95}
      />
      <polygon
        points="-10,-1 -2,-8 2,-6 -4,-1"
        fill={color}
        opacity={0.8}
      />
      <polygon
        points="-10,1 -2,8 2,6 -4,1"
        fill={color}
        opacity={0.8}
      />
    </g>
  );
};
