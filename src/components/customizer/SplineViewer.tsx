"use client";

import { ProductModelViewer } from "@/components/customizer/ProductModelViewer";
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

/**
 * Live 3D product preview — always shows the chosen product shape.
 * Beads fill in real time as slot state changes; switching template swaps the model.
 */
export function SplineViewer({ className = "", strand }: SplineViewerProps) {
  const hasStrand = strand !== undefined;
  const layout = strand?.layout ?? "linear";
  const productType = strand?.productType ?? "strand";
  const previewKey = `${productType}-${layout}-${strand?.totalSlots ?? 0}-${strand?.slots.filter(Boolean).length ?? 0}`;

  return (
    <div
      className={`relative overflow-hidden bg-gem-ink ${className}`}
      style={{ minHeight: hasStrand ? "300px" : "220px" }}
    >
      {hasStrand && strand ? (
        <div className="absolute inset-0 flex items-center justify-center px-4 py-8">
          <ProductModelViewer
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

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gem-ink via-gem-ink/80 to-transparent" />
    </div>
  );
}
