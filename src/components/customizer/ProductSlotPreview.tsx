"use client";

import { BraceletSlotStrip } from "@/components/customizer/BraceletSlotStrip";
import { NecklaceArc } from "@/components/customizer/NecklaceArc";
import { RadialSlotRing } from "@/components/customizer/RadialSlotRing";
import type { TemplateLayout } from "@/lib/template-layout";
import type { SlotState } from "@/types/database";

interface ProductSlotPreviewProps {
  slots: SlotState[];
  activeSlotIndex: number | null;
  layout: TemplateLayout;
  centerLabel: string;
  sequentialOnly?: boolean;
  onSlotTap?: (index: number) => void;
  className?: string;
}

export function ProductSlotPreview({
  slots,
  activeSlotIndex,
  layout,
  centerLabel,
  sequentialOnly = false,
  onSlotTap,
  className = "",
}: ProductSlotPreviewProps) {
  if (layout === "arc") {
    return (
      <NecklaceArc
        slots={slots}
        activeSlotIndex={activeSlotIndex}
        centerLabel={centerLabel}
        onSlotTap={onSlotTap}
        sequentialOnly={sequentialOnly}
        className={className}
      />
    );
  }

  if (layout === "radial") {
    return (
      <RadialSlotRing
        slots={slots}
        activeSlotIndex={activeSlotIndex}
        centerLabel={centerLabel}
        onSlotTap={onSlotTap}
        sequentialOnly={sequentialOnly}
        spin
        className={className}
      />
    );
  }

  return (
    <div className={`w-full px-2 ${className}`}>
      <div className="mb-2 text-center">
        <p className="text-[10px] uppercase tracking-[0.25em] text-gem-gold">
          {centerLabel}
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-gem-mist/60">
          {slots.filter(Boolean).length} / {slots.length}
        </p>
      </div>
      <BraceletSlotStrip
        slots={slots}
        activeSlotIndex={activeSlotIndex}
        onSlotTap={onSlotTap}
        variant="overlay"
      />
    </div>
  );
}
