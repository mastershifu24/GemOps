"use client";

import { BraceletSlotStrip } from "@/components/customizer/BraceletSlotStrip";
import { SPLINE_FALLBACK_EMBED_URL } from "@/lib/constants";
import type { SlotState } from "@/types/database";

export interface StrandOverlayProps {
  slots: SlotState[];
  activeSlotIndex: number | null;
  filledCount: number;
  totalSlots: number;
  onSlotTap?: (index: number) => void;
}

interface SplineViewerProps {
  className?: string;
  /** Live strand overlay — fills as customer taps stones */
  strand?: StrandOverlayProps;
}

/**
 * Spline iframe embed + optional live bead strip overlaid at the bottom.
 * iframe: reliable 3D on mobile. Strand state always driven from React.
 */
export function SplineViewer({ className = "", strand }: SplineViewerProps) {
  const hasStrand = strand !== undefined;

  return (
    <div
      className={`relative overflow-hidden bg-gem-ink ${className}`}
      style={{ minHeight: hasStrand ? "280px" : "220px" }}
    >
      <iframe
        src={SPLINE_FALLBACK_EMBED_URL}
        title="3D preview"
        className="absolute inset-0 h-full w-full border-0"
        loading="eager"
        allow="autoplay; fullscreen; xr-spatial-tracking"
      />

      {/* Fade 3D into strand / page */}
      <div
        className={`pointer-events-none absolute inset-x-0 bg-gradient-to-t from-gem-ink via-gem-ink/80 to-transparent ${
          hasStrand ? "bottom-0 h-32" : "bottom-0 h-16"
        }`}
      />

      {hasStrand && (
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
      )}
    </div>
  );
}
