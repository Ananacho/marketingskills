import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { TravelPath } from "./TravelPath";
import { EiffelTower3D } from "./EiffelTower3D";
import { MapBackground } from "./MapBackground";
import { CityPin } from "./CityPin";

// ─── Timeline (frames @ 30fps) ────────────────────────────────────────────────
// 0-60    : Zoom in tight on LA  (establishing shot)
// 60-120  : Hold on LA           (zoom out to see continent)
// 120-300 : Animate line LA→NY   (camera follows midpoint)
// 300-360 : Hold on NY
// 360-540 : Animate line NY→Paris (camera follows midpoint, zooms out to globe)
// 540-600 : Zoom in on Paris + Eiffel Tower reveal

const CITIES = {
  la:     { lat: 34.0522,  lng: -118.2437, label: "Los Angeles" },
  ny:     { lat: 40.7128,  lng: -74.006,   label: "New York"    },
  paris:  { lat: 48.8566,  lng:  2.3522,   label: "Paris"       },
};

// Mercator projection helpers
function mercatorY(lat: number): number {
  const rad = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

function lngToX(lng: number): number {
  return (lng + 180) / 360;
}

// normalised [0,1] mercator coords
function cityUV(lat: number, lng: number) {
  const maxLat = 85.0511;
  const yMax = mercatorY(maxLat);
  return {
    u: lngToX(lng),
    v: 0.5 - mercatorY(lat) / (2 * yMax),
  };
}

const LA    = cityUV(CITIES.la.lat,    CITIES.la.lng);
const NY    = cityUV(CITIES.ny.lat,    CITIES.ny.lng);
const PARIS = cityUV(CITIES.paris.lat, CITIES.paris.lng);

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

interface Viewport {
  centerU: number;
  centerV: number;
  zoom: number; // map-widths visible (lower = more zoomed in)
}

function viewportToCSS(vp: Viewport, width: number, height: number) {
  // Map is rendered at 3x screen size; we translate + scale to frame the viewport
  const mapW = width * 3;
  const mapH = height * 3;

  const scale = 1 / vp.zoom;
  const tx = width  / 2 - vp.centerU * mapW * scale;
  const ty = height / 2 - vp.centerV * mapH * scale;

  return { transform: `translate(${tx}px, ${ty}px) scale(${scale})`, mapW, mapH };
}

// ─── Main composition ─────────────────────────────────────────────────────────
export const MapJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // ── Segment progress ──────────────────────────────────────────────────────
  const laHoldEnd    = 60;
  const laZoomOutEnd = 120;
  const lanyEnd      = 300;
  const nyHoldEnd    = 360;
  const nyParisEnd   = 540;
  const parisEnd     = 600;

  // LA→NY path progress (0→1)
  const lanyT = interpolate(frame, [laZoomOutEnd, lanyEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });

  // NY→Paris path progress
  const nyParisT = interpolate(frame, [nyHoldEnd, nyParisEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });

  // ── Viewport camera ───────────────────────────────────────────────────────
  let vp: Viewport;

  if (frame < laHoldEnd) {
    // Tight zoom onto LA
    const t = spring({ frame, fps, config: { damping: 18, mass: 0.8 } });
    vp = {
      centerU: LA.u,
      centerV: LA.v,
      zoom: interpolate(t, [0, 1], [0.04, 0.08]),
    };
  } else if (frame < laZoomOutEnd) {
    // Zoom out to see the continent
    const t = interpolate(frame, [laHoldEnd, laZoomOutEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) });
    vp = {
      centerU: LA.u,
      centerV: LA.v,
      zoom: interpolate(t, [0, 1], [0.08, 0.22]),
    };
  } else if (frame < lanyEnd) {
    // Follow midpoint between start and current position on LA→NY arc
    const midU = lerp(LA.u, NY.u, lanyT * 0.5);
    const midV = lerp(LA.v, NY.v, lanyT * 0.5);
    vp = {
      centerU: lerp(LA.u, midU, Math.min(lanyT * 2, 1)),
      centerV: lerp(LA.v, midV, Math.min(lanyT * 2, 1)),
      zoom: interpolate(lanyT, [0, 0.5, 1], [0.22, 0.28, 0.22]),
    };
  } else if (frame < nyHoldEnd) {
    const t = interpolate(frame, [lanyEnd, nyHoldEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    vp = {
      centerU: lerp(lerp(LA.u, NY.u, 0.5), NY.u, t),
      centerV: lerp(lerp(LA.v, NY.v, 0.5), NY.v, t),
      zoom: interpolate(t, [0, 1], [0.22, 0.12]),
    };
  } else if (frame < nyParisEnd) {
    // Pan + zoom out to cross Atlantic
    const midU = lerp(NY.u, PARIS.u, nyParisT * 0.5);
    const midV = lerp(NY.v, PARIS.v, nyParisT * 0.5);
    vp = {
      centerU: lerp(NY.u, midU, Math.min(nyParisT * 2, 1)),
      centerV: lerp(NY.v, midV, Math.min(nyParisT * 2, 1)),
      zoom: interpolate(nyParisT, [0, 0.4, 0.7, 1], [0.12, 0.38, 0.38, 0.22]),
    };
  } else {
    // Zoom into Paris
    const t = interpolate(frame, [nyParisEnd, parisEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) });
    vp = {
      centerU: lerp(lerp(NY.u, PARIS.u, 0.5), PARIS.u, t),
      centerV: lerp(lerp(NY.v, PARIS.v, 0.5), PARIS.v, t),
      zoom: interpolate(t, [0, 1], [0.22, 0.06]),
    };
  }

  const { transform, mapW, mapH } = viewportToCSS(vp, width, height);

  // Eiffel reveal progress
  const eiffelT = interpolate(frame, [nyParisEnd + 20, parisEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const showEiffel = frame >= nyParisEnd + 10;

  // City pin visibility
  const laOpacity  = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const nyOpacity  = interpolate(frame, [lanyEnd - 10, lanyEnd + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const parOpacity = interpolate(frame, [nyParisEnd - 10, nyParisEnd + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ width, height, overflow: "hidden", background: "#0a0e1a", position: "relative" }}>
      {/* Map layer */}
      <div style={{ position: "absolute", top: 0, left: 0, width, height, overflow: "hidden" }}>
        <div style={{ position: "absolute", transformOrigin: "0 0", ...{ transform }, width: mapW, height: mapH }}>
          <MapBackground width={mapW} height={mapH} />

          {/* Travel paths */}
          <TravelPath
            from={LA} to={NY}
            mapW={mapW} mapH={mapH}
            progress={lanyT}
          />
          <TravelPath
            from={NY} to={PARIS}
            mapW={mapW} mapH={mapH}
            progress={nyParisT}
            color="#f59e0b"
          />

          {/* City pins */}
          <CityPin u={LA.u}    v={LA.v}    label="Los Angeles" mapW={mapW} mapH={mapH} opacity={laOpacity}  />
          <CityPin u={NY.u}    v={NY.v}    label="New York"    mapW={mapW} mapH={mapH} opacity={nyOpacity}  />
          <CityPin u={PARIS.u} v={PARIS.v} label="Paris"       mapW={mapW} mapH={mapH} opacity={parOpacity} color="#f59e0b" />

          {/* 3D Eiffel Tower */}
          {showEiffel && (
            <EiffelTower3D
              u={PARIS.u}
              v={PARIS.v}
              mapW={mapW}
              mapH={mapH}
              progress={eiffelT}
            />
          )}
        </div>
      </div>

      {/* Vignette overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%)",
      }} />

      {/* HUD label */}
      <div style={{
        position: "absolute", bottom: 40, left: 60,
        color: "rgba(255,255,255,0.85)", fontFamily: "sans-serif",
        fontSize: 28, fontWeight: 300, letterSpacing: 4, textTransform: "uppercase",
      }}>
        {frame < lanyEnd ? "Los Angeles" : frame < nyHoldEnd ? "New York" : frame < nyParisEnd ? "Crossing the Atlantic" : "Paris"}
      </div>
    </div>
  );
};
