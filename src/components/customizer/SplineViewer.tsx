"use client";

import { SPLINE_FALLBACK_EMBED_URL } from "@/lib/constants";

interface SplineViewerProps {
  className?: string;
}

/**
 * Uses Spline's my.spline.design embed — most reliable across devices.
 * react-spline/WebGL often fails silently on mobile and some browsers.
 */
export function SplineViewer({ className = "" }: SplineViewerProps) {
  return (
    <div
      className={`relative overflow-hidden bg-gem-slate ${className}`}
      style={{ minHeight: "220px" }}
    >
      <iframe
        src={SPLINE_FALLBACK_EMBED_URL}
        title="3D preview"
        className="absolute inset-0 h-full w-full border-0"
        loading="eager"
        allow="autoplay; fullscreen; xr-spatial-tracking"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gem-ink to-transparent" />
    </div>
  );
}
