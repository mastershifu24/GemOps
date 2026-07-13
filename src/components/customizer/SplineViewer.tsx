"use client";

import dynamic from "next/dynamic";
import type { TemplateLayout } from "@/lib/template-layout";
import type { ProductType, SlotState } from "@/types/database";

export interface StrandOverlayProps {
  slots: SlotState[];
  activeSlotIndex: number | null;
  filledCount: number;
  totalSlots: number;
  layout?: TemplateLayout;
  productType?: ProductType;
  previewLabel?: string;
  sequentialOnly?: boolean;
  strandCount?: 1 | 2;
  onSlotTap?: (index: number) => void;
}

interface SplineViewerProps {
  className?: string;
  strand?: StrandOverlayProps;
}

const GemstonePreview3D = dynamic(
  () =>
    import("@/components/customizer/GemstonePreview3D").then(
      (m) => m.GemstonePreview3D
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[240px] items-center justify-center">
        <p className="text-sm text-gem-mist/50">Loading 3D preview…</p>
      </div>
    ),
  }
);

/**
 * Live 3D gemstone preview — beads update as the customer designs.
 * (Name kept for compatibility; Spline scene optional later via model URLs.)
 */
export function SplineViewer({ className = "", strand }: SplineViewerProps) {
  const hasStrand = strand !== undefined;
  const layout = strand?.layout ?? "linear";
  const productType = strand?.productType ?? "strand";
  const previewKey = `${productType}-${layout}-${strand?.totalSlots ?? 0}-${strand?.strandCount ?? 1}`;

  return (
    <div
      className={`relative overflow-hidden bg-gem-ink ${className}`}
      style={{ minHeight: hasStrand ? "300px" : "220px" }}
    >
      {hasStrand && strand ? (
        <div className="absolute inset-0 flex items-center justify-center px-2 py-4">
          <GemstonePreview3D
            key={previewKey}
            slots={strand.slots}
            activeSlotIndex={strand.activeSlotIndex}
            layout={layout}
            productType={productType}
            centerLabel={strand.previewLabel ?? "Your Design"}
            sequentialOnly={strand.sequentialOnly}
            strandCount={strand.strandCount ?? 1}
            onSlotTap={strand.onSlotTap}
            className="max-h-full w-full"
          />
        </div>
      ) : (
        <div className="flex h-full min-h-[220px] items-center justify-center">
          <p className="text-sm text-gem-mist/40">Select a product to preview</p>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-gem-ink via-gem-ink/70 to-transparent" />
    </div>
  );
}
