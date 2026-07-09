"use client";

import { useId } from "react";

interface StrandRingThreadProps {
  /** Center-to-bead radius as % of container (matches slot layout) */
  radiusPercent: number;
  /** inner | outer for double-strand layering */
  variant?: "single" | "inner" | "outer";
  className?: string;
}

/**
 * Visible cord/thread loop — the gold elastic line beads sit on.
 * Matches the linear strand strip thread, curved into a wrist ring.
 */
export function StrandRingThread({
  radiusPercent,
  variant = "single",
  className = "",
}: StrandRingThreadProps) {
  const uid = useId().replace(/:/g, "");
  const size = radiusPercent * 2;
  const isInner = variant === "inner";
  const isOuter = variant === "outer";

  const strokeWidth = isInner ? 2.5 : isOuter ? 3 : 3.5;
  const strokeOpacity = isInner ? 0.55 : isOuter ? 0.85 : 0.9;
  const glowOpacity = isInner ? 0.06 : isOuter ? 0.14 : 0.12;

  return (
    <div
      className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 product-strand-cord ${className}`}
      style={{ width: `${size}%`, height: `${size}%` }}
      aria-hidden
    >
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient
            id={`strand-thread-${uid}-${variant}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#e8dcc8" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#c9a962" stopOpacity="1" />
            <stop offset="65%" stopColor="#a8884a" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#e8dcc8" stopOpacity="0.85" />
          </linearGradient>
          <filter
            id={`strand-glow-${uid}-${variant}`}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Soft glow under cord */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke={`rgba(201, 169, 98, ${glowOpacity})`}
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
        />

        {/* Main elastic cord */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke={`url(#strand-thread-${uid}-${variant})`}
          strokeWidth={strokeWidth}
          strokeOpacity={strokeOpacity}
          strokeLinecap="round"
          strokeDasharray={isInner ? "2 3" : undefined}
          filter={`url(#strand-glow-${uid}-${variant})`}
        />

        {/* Highlight sheen */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth={0.6}
          strokeDasharray="8 42"
          transform="rotate(-30 50 50)"
        />
      </svg>
    </div>
  );
}

interface DoubleStrandTwistProps {
  innerRadiusPercent: number;
  outerRadiusPercent: number;
}

/** Subtle twist marks where inner and outer loops cross — intertwined look */
export function DoubleStrandTwist({
  innerRadiusPercent,
  outerRadiusPercent,
}: DoubleStrandTwistProps) {
  const pairs = [
    { angle: -Math.PI / 2 },
    { angle: Math.PI / 6 },
    { angle: (5 * Math.PI) / 6 },
  ];

  return (
    <>
      {pairs.map(({ angle }, i) => {
        const midR = (innerRadiusPercent + outerRadiusPercent) / 2;
        const x = 50 + midR * Math.cos(angle);
        const y = 50 + midR * Math.sin(angle);
        return (
          <div
            key={i}
            className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gem-gold/25 blur-[1px]"
            style={{ left: `${x}%`, top: `${y}%` }}
            aria-hidden
          />
        );
      })}
    </>
  );
}
