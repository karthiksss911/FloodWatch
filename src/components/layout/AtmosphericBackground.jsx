import { memo } from 'react';
import './AtmosphericBackground.css';

/**
 * AtmosphericBackground Component
 * Combines aesthetics from:
 * 1. Margins Studio: Analog film grain, editorial charcoal-navy palette, peripheral vignette.
 * 2. GoShuin: Cartographic dotted matrix, bathymetric contour lines, tactile stippling.
 * 3. Mapa do Astro: 3D spatial depth, ambient celestial/monsoon glow orbs, subtle atmospheric drift.
 * 
 * Hardware-accelerated, lightweight (zero external assets), strictly non-interactive,
 * fully responsive, and respects prefers-reduced-motion.
 */
function AtmosphericBackground() {
  return (
    <div className="fw-atmospheric-canvas" aria-hidden="true">
      {/* Base Layer: Deep Storm Ocean & Twilight Gradient Mesh */}
      <div className="fw-atmos-base-mesh" />

      {/* Atmospheric Low-Pressure Glow Orbs (Mapa do Astro inspired) */}
      <div className="fw-atmos-orbs">
        <div className="fw-orb fw-orb-monsoon-teal" />
        <div className="fw-orb fw-orb-storm-indigo" />
        <div className="fw-orb fw-orb-periyar-blue" />
        <div className="fw-orb fw-orb-coastal-glow" />
      </div>

      {/* Geospatial Topography & Radar Stippled Matrix (GoShuin inspired) */}
      <svg
        className="fw-atmos-topo-svg"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Cartographic dot pattern */}
          <pattern
            id="fw-carto-dots"
            x="0"
            y="0"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill="rgba(56, 189, 248, 0.22)" />
            <circle cx="18" cy="18" r="0.75" fill="rgba(6, 182, 212, 0.12)" />
          </pattern>

          {/* Topographic contour gradients */}
          <linearGradient id="fw-contour-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(6, 182, 212, 0.15)" />
            <stop offset="50%" stopColor="rgba(59, 130, 246, 0.08)" />
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0.03)" />
          </linearGradient>

          <linearGradient id="fw-contour-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(14, 165, 233, 0.12)" />
            <stop offset="70%" stopColor="rgba(99, 102, 241, 0.05)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Stippled coordinate dot grid */}
        <rect width="100%" height="100%" fill="url(#fw-carto-dots)" />

        {/* Orbital Radar & Telemetry Rings (Mapa do Astro inspired) */}
        <g className="fw-atmos-radar-rings">
          <circle cx="82%" cy="22%" r="220" fill="none" stroke="rgba(6, 182, 212, 0.12)" strokeDasharray="4 8" />
          <circle cx="82%" cy="22%" r="400" fill="none" stroke="rgba(6, 182, 212, 0.06)" strokeDasharray="3 9" />
          <circle cx="82%" cy="22%" r="600" fill="none" stroke="rgba(6, 182, 212, 0.03)" strokeDasharray="2 12" />
          <circle cx="15%" cy="82%" r="280" fill="none" stroke="rgba(99, 102, 241, 0.08)" strokeDasharray="4 10" />
        </g>

        {/* Atmospheric Isobaric & Bathymetric Contour Waves */}
        <g className="fw-atmos-contours">
          <path
            d="M-100,200 C300,120 700,320 1200,180 C1600,60 2000,240 2400,160"
            fill="none"
            stroke="url(#fw-contour-grad-1)"
            strokeWidth="1.5"
            strokeDasharray="4 8"
          />
          <path
            d="M-100,340 C350,260 750,420 1250,290 C1650,180 2050,360 2450,280"
            fill="none"
            stroke="url(#fw-contour-grad-1)"
            strokeWidth="1"
            opacity="0.8"
          />
          <path
            d="M-100,520 C280,440 680,600 1180,460 C1580,340 1980,520 2380,440"
            fill="none"
            stroke="url(#fw-contour-grad-2)"
            strokeWidth="1.2"
            strokeDasharray="6 12"
          />
          <path
            d="M-100,700 C400,600 850,780 1350,620 C1750,480 2150,660 2550,560"
            fill="none"
            stroke="url(#fw-contour-grad-2)"
            strokeWidth="1"
            opacity="0.6"
          />
        </g>

        {/* Cartographic Coordinate Stamp Marks (GoShuin & Margins Studio inspired) */}
        <g className="fw-atmos-stamps" opacity="0.32" fill="rgba(148, 163, 184, 0.7)" fontFamily="JetBrains Mono, monospace" fontSize="9.5" letterSpacing="0.14em">
          <text x="32" y="80">09°58′23″N · 76°17′34″E [KERALA BASIN SECTOR 07]</text>
          <text x="32" y="96">DATUM: WGS-84 / DOPPLER MONSOON INTELLIGENCE</text>
        </g>
      </svg>

      {/* Atmospheric Rain Streak & Moisture Shimmer (Subtle, non-distracting) */}
      <div className="fw-atmos-rain-streaks" />

      {/* Film Grain Texture & Noise Layer (Margins Studio inspired) */}
      <div className="fw-atmos-film-grain" />

      {/* Peripheral Vignette Layer (Focusing center viewport) */}
      <div className="fw-atmos-vignette" />
    </div>
  );
}

export default memo(AtmosphericBackground);
