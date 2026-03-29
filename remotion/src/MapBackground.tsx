import React from "react";

// SVG world map using simplified Mercator-projected land polygons rendered inline.
// We use an <image> tag pointing to the Natural Earth raster hosted on Wikimedia
// as a fallback; for offline/production use swap href for a bundled asset.

interface Props {
  width: number;
  height: number;
}

export const MapBackground: React.FC<Props> = ({ width, height }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block" }}
    >
      {/* Ocean */}
      <rect width={width} height={height} fill="#0d1b2e" />

      {/* Graticule grid lines */}
      {Array.from({ length: 37 }, (_, i) => {
        const lng = -180 + i * 10;
        const x = ((lng + 180) / 360) * width;
        return (
          <line
            key={`v${i}`}
            x1={x} y1={0} x2={x} y2={height}
            stroke="#1a2a3a" strokeWidth={0.5}
          />
        );
      })}
      {Array.from({ length: 19 }, (_, i) => {
        const lat = -90 + i * 10;
        // Mercator y
        const maxLat = 85.0511;
        const yMax = Math.log(Math.tan(Math.PI / 4 + (maxLat * Math.PI) / 180 / 2));
        const y = height * (0.5 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 180 / 2)) / (2 * yMax));
        return (
          <line
            key={`h${i}`}
            x1={0} y1={y} x2={width} y2={y}
            stroke="#1a2a3a" strokeWidth={0.5}
          />
        );
      })}

      {/* Land masses — simplified SVG paths in Mercator UV space */}
      <LandMasses width={width} height={height} />
    </svg>
  );
};

// Converts [lng, lat] → SVG pixel coords
function project(lng: number, lat: number, w: number, h: number): [number, number] {
  const maxLat = 85.0511;
  const yMax = Math.log(Math.tan(Math.PI / 4 + (maxLat * Math.PI) / 180 / 2));
  const x = ((lng + 180) / 360) * w;
  const y = h * (0.5 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 180 / 2)) / (2 * yMax));
  return [x, y];
}

function polyToPath(coords: [number, number][], w: number, h: number): string {
  return coords
    .map(([lng, lat], i) => {
      const [x, y] = project(lng, lat, w, h);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ") + " Z";
}

const LAND_FILL = "#1e3a2f";
const LAND_STROKE = "#2d5a42";

const LandMasses: React.FC<{ width: number; height: number }> = ({ width: w, height: h }) => {
  // Simplified land polygons (major continental outlines)
  const continents: Array<{ id: string; coords: [number, number][] }> = [
    // North America (simplified)
    {
      id: "na",
      coords: [
        [-168, 72], [-140, 72], [-115, 78], [-80, 82], [-65, 82], [-55, 75],
        [-60, 68], [-53, 58], [-56, 47], [-66, 44], [-70, 41], [-75, 35],
        [-80, 25], [-90, 20], [-105, 20], [-118, 22], [-120, 30], [-125, 38],
        [-124, 49], [-115, 55], [-100, 60], [-90, 65], [-80, 72], [-95, 78],
        [-120, 78], [-140, 78], [-168, 72],
      ],
    },
    // Greenland
    {
      id: "gl",
      coords: [
        [-44, 60], [-25, 60], [-18, 65], [-18, 77], [-25, 83], [-42, 83],
        [-52, 80], [-58, 76], [-58, 68], [-44, 60],
      ],
    },
    // South America
    {
      id: "sa",
      coords: [
        [-82, 12], [-75, 12], [-68, 12], [-60, 5], [-52, 5], [-45, -5],
        [-35, -10], [-35, -25], [-52, -35], [-58, -42], [-68, -55], [-75, -55],
        [-68, -45], [-65, -35], [-70, -20], [-78, -5], [-80, 5], [-82, 12],
      ],
    },
    // Europe (simplified)
    {
      id: "eu",
      coords: [
        [-10, 36], [5, 36], [15, 38], [28, 38], [35, 42], [35, 48],
        [28, 55], [20, 60], [15, 62], [5, 62], [-2, 58], [-5, 55],
        [-8, 48], [-2, 44], [-10, 42], [-10, 36],
      ],
    },
    // Scandinavia
    {
      id: "scan",
      coords: [
        [5, 58], [10, 58], [18, 60], [28, 62], [30, 70], [25, 72],
        [18, 70], [14, 65], [8, 62], [5, 60], [5, 58],
      ],
    },
    // Africa
    {
      id: "af",
      coords: [
        [-18, 16], [-8, 5], [5, 5], [18, 12], [42, 12], [52, 12],
        [52, 2], [42, -5], [40, -15], [36, -20], [32, -30], [28, -36],
        [18, -36], [12, -28], [10, -18], [2, -5], [-5, 5],
        [-12, 10], [-18, 16],
      ],
    },
    // Asia (very simplified)
    {
      id: "as",
      coords: [
        [35, 42], [45, 42], [60, 38], [70, 25], [78, 8], [80, 0],
        [100, 2], [110, 5], [122, 15], [130, 25], [130, 35], [140, 40],
        [142, 52], [135, 58], [118, 60], [100, 65], [80, 72], [60, 72],
        [40, 68], [35, 62], [35, 55], [28, 55], [35, 48], [35, 42],
      ],
    },
    // Australia
    {
      id: "au",
      coords: [
        [114, -22], [124, -18], [132, -12], [140, -18], [148, -22],
        [152, -28], [148, -38], [138, -38], [128, -34], [118, -28], [114, -22],
      ],
    },
    // British Isles
    {
      id: "uk",
      coords: [
        [-5, 50], [2, 52], [0, 58], [-5, 58], [-8, 55], [-5, 50],
      ],
    },
    // Japan
    {
      id: "jp",
      coords: [
        [130, 32], [135, 34], [140, 38], [142, 43], [140, 44],
        [136, 38], [131, 34], [130, 32],
      ],
    },
    // Indonesia (simplified)
    {
      id: "id",
      coords: [
        [96, 5], [106, -6], [115, -8], [125, -8], [135, -4],
        [132, 0], [120, 0], [110, 0], [100, 2], [96, 5],
      ],
    },
  ];

  return (
    <g>
      {continents.map(({ id, coords }) => (
        <path
          key={id}
          d={polyToPath(coords, w, h)}
          fill={LAND_FILL}
          stroke={LAND_STROKE}
          strokeWidth={1.5}
        />
      ))}
    </g>
  );
};
