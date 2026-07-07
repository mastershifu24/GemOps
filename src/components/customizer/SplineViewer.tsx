"use client";

import dynamic from "next/dynamic";
import { SPLINE_SCENE_URL } from "@/lib/constants";

const Spline = dynamic(
  () => import("@splinetool/react-spline").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-gem-slate">
        <div className="h-10 w-10 animate-pulse rounded-full bg-gem-gold/30" />
      </div>
    ),
  }
);

interface SplineViewerProps {
  className?: string;
}

export function SplineViewer({ className = "" }: SplineViewerProps) {
  return (
    <div className={`relative overflow-hidden bg-gem-slate ${className}`}>
      <Spline scene={SPLINE_SCENE_URL} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gem-ink to-transparent" />
    </div>
  );
}
