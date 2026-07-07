"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  SPLINE_FALLBACK_EMBED_URL,
  SPLINE_SCENE_URL,
} from "@/lib/constants";

const Spline = dynamic(
  () => import("@splinetool/react-spline").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <SplinePlaceholder label="Loading 3D…" />,
  }
);

function SplinePlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-3 bg-gem-slate">
      <div className="h-10 w-10 animate-pulse rounded-full bg-gem-gold/30" />
      <p className="text-xs uppercase tracking-wider text-gem-mist/40">{label}</p>
    </div>
  );
}

function SplineIframeFallback() {
  return (
    <iframe
      src={SPLINE_FALLBACK_EMBED_URL}
      title="3D preview"
      className="h-full min-h-[200px] w-full border-0"
      loading="lazy"
      allow="autoplay; fullscreen; xr-spatial-tracking"
    />
  );
}

interface SplineViewerProps {
  className?: string;
}

export function SplineViewer({ className = "" }: SplineViewerProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!loaded) setFailed(true);
    }, 12000);
    return () => clearTimeout(timeout);
  }, [loaded]);

  return (
    <div
      className={`relative overflow-hidden bg-gem-slate ${className}`}
      style={{ minHeight: "200px" }}
    >
      {failed ? (
        <SplineIframeFallback />
      ) : (
        <>
          {!loaded && <SplinePlaceholder label="Loading 3D scene…" />}
          <Spline
            scene={SPLINE_SCENE_URL}
            className={`h-full w-full min-h-[200px] ${loaded ? "opacity-100" : "absolute inset-0 opacity-0"}`}
            onLoad={() => setLoaded(true)}
          />
        </>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gem-ink to-transparent" />
    </div>
  );
}
