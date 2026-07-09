"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Application } from "@splinetool/runtime";
import { BraceletRing } from "@/components/customizer/BraceletRing";
import { BraceletSlotStrip } from "@/components/customizer/BraceletSlotStrip";
import {
  getSplineStrandSceneUrl,
  SPLINE_FALLBACK_EMBED_URL,
} from "@/lib/constants";
import type { TemplateLayout } from "@/lib/template-layout";
import {
  sceneHasStrandBeads,
  syncSlotsToSpline,
} from "@/lib/spline-strand";
import type { SlotState } from "@/types/database";

const Spline = dynamic(
  () => import("@splinetool/react-spline").then((mod) => mod.default),
  { ssr: false }
);

export interface StrandOverlayProps {
  slots: SlotState[];
  activeSlotIndex: number | null;
  filledCount: number;
  totalSlots: number;
  layout?: TemplateLayout;
  sequentialOnly?: boolean;
  onSlotTap?: (index: number) => void;
}

interface SplineViewerProps {
  className?: string;
  strand?: StrandOverlayProps;
}

type ViewerMode = "loading-runtime" | "runtime-3d" | "iframe";

function IframeLayer() {
  return (
    <iframe
      src={SPLINE_FALLBACK_EMBED_URL}
      title="3D preview"
      className="absolute inset-0 h-full w-full border-0"
      loading="eager"
      allow="autoplay; fullscreen; xr-spatial-tracking"
    />
  );
}

function StrandOverlayPanel({
  strand,
  compact = false,
}: {
  strand: StrandOverlayProps;
  compact?: boolean;
}) {
  const isRadial = strand.layout === "radial";

  if (isRadial) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
        <BraceletRing
          slots={strand.slots}
          activeSlotIndex={strand.activeSlotIndex}
          onSlotTap={strand.onSlotTap}
          sequentialOnly={strand.sequentialOnly}
          className="max-h-[min(72vw,320px)]"
        />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center">
        <p className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] tabular-nums text-gem-mist/80 backdrop-blur-md">
          {strand.filledCount} / {strand.totalSlots} beads · 3D strand
        </p>
      </div>
    );
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 px-3 pb-3 pt-8">
      <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-md">
        <div className="mb-1 flex items-baseline justify-between">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gem-gold">
            Your Strand
          </p>
          <p className="text-[10px] tabular-nums text-gem-mist/70">
            {strand.filledCount} / {strand.totalSlots}
          </p>
        </div>
        <BraceletSlotStrip
          slots={strand.slots}
          activeSlotIndex={strand.activeSlotIndex}
          onSlotTap={strand.onSlotTap}
          variant="overlay"
        />
      </div>
    </div>
  );
}

/**
 * Phase 1: iframe hero + 2D strand overlay (always works).
 * Phase 2: if NEXT_PUBLIC_SPLINE_STRAND_SCENE_URL is set and scene has bead_00…,
 *           react-spline drives 3D bead colors; overlay becomes a small badge.
 */
export function SplineViewer({ className = "", strand }: SplineViewerProps) {
  const strandSceneUrl = getSplineStrandSceneUrl();
  const useRuntime = Boolean(
    strand && strandSceneUrl && strand.layout !== "radial"
  );

  const [mode, setMode] = useState<ViewerMode>(
    useRuntime ? "loading-runtime" : "iframe"
  );
  const appRef = useRef<Application | null>(null);

  const fallbackToIframe = useCallback(() => {
    setMode("iframe");
    appRef.current = null;
  }, []);

  const handleSplineLoad = useCallback(
    (app: Application) => {
      appRef.current = app;

      if (!strand || !sceneHasStrandBeads(app)) {
        fallbackToIframe();
        return;
      }

      syncSlotsToSpline(app, strand.slots, strand.totalSlots);
      setMode("runtime-3d");
    },
    [strand, fallbackToIframe]
  );

  useEffect(() => {
    if (!useRuntime) return;

    const timeout = setTimeout(() => {
      if (mode === "loading-runtime") fallbackToIframe();
    }, 12000);

    return () => clearTimeout(timeout);
  }, [useRuntime, mode, fallbackToIframe]);

  useEffect(() => {
    if (mode !== "runtime-3d" || !appRef.current || !strand) return;
    syncSlotsToSpline(appRef.current, strand.slots, strand.totalSlots);
  }, [mode, strand?.slots, strand?.totalSlots, strand]);

  const hasStrand = strand !== undefined;
  const isRadial = strand?.layout === "radial";
  const show3DStrand = mode === "runtime-3d" && !isRadial;
  const showIframe =
    (mode === "iframe" || mode === "loading-runtime") && !isRadial;

  return (
    <div
      className={`relative overflow-hidden bg-gem-ink ${className}`}
      style={{ minHeight: hasStrand ? "280px" : "220px" }}
    >
      {useRuntime && mode !== "iframe" && strandSceneUrl && (
        <div
          className={`absolute inset-0 ${showIframe ? "opacity-0" : "opacity-100"}`}
        >
          <Spline
            scene={strandSceneUrl}
            className="h-full w-full"
            onLoad={handleSplineLoad}
          />
        </div>
      )}

      {showIframe && <IframeLayer />}

      {mode === "loading-runtime" && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center bg-gem-ink/60">
          <div className="h-10 w-10 animate-pulse rounded-full bg-gem-gold/30" />
        </div>
      )}

      <div
        className={`pointer-events-none absolute inset-x-0 bg-gradient-to-t from-gem-ink via-gem-ink/80 to-transparent ${
          isRadial ? "bottom-0 h-16" : hasStrand ? "bottom-0 h-32" : "bottom-0 h-16"
        }`}
      />

      {hasStrand && isRadial && (
        <StrandOverlayPanel strand={strand} />
      )}

      {hasStrand && !isRadial && (
        <StrandOverlayPanel strand={strand} compact={show3DStrand} />
      )}
    </div>
  );
}
