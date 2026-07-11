"use client";

import {
  beadDimensionsPx,
  beadShapeClass,
  slotBeadSizeMm,
} from "@/lib/bead-sizes";
import {
  layoutUsesArc,
  layoutUsesLayered,
  layoutUsesRing,
  layeredSlotPosition,
  necklaceSlotPosition,
  ringSlotPosition,
} from "@/lib/slot-layout-math";
import type { TemplateLayout } from "@/lib/template-layout";
import type { ProductType, SlotState } from "@/types/database";

interface ArTryOnOverlayProps {
  slots: SlotState[];
  layout: TemplateLayout;
  productType: ProductType;
  strandCount?: 1 | 2;
}

/**
 * High-contrast ring for live camera — not the customizer UI.
 * Customizer uses subtle borders + active-slot pulse that vanish on video.
 */
export function ArTryOnOverlay({
  slots,
  layout,
  productType,
}: ArTryOnOverlayProps) {
  const total = slots.length;
  const filledCount = slots.filter(Boolean).length;
  const radiusPercent = total > 20 ? 38 : 42;
  const isRing = layoutUsesRing(layout);
  const isLayered = layoutUsesLayered(layout);
  const isArc = layoutUsesArc(layout);
  const showStrandThreads =
    productType === "bracelet" && (isRing || isLayered);

  const getPosition = (index: number) => {
    if (isLayered) {
      return layeredSlotPosition(
        index,
        total,
        radiusPercent - 6,
        radiusPercent
      );
    }
    if (isRing) return ringSlotPosition(index, total, radiusPercent);
    if (isArc) return necklaceSlotPosition(index, total, radiusPercent);
    return ringSlotPosition(index, total, radiusPercent);
  };

  const arBeadScale = 1.65;

  return (
    <div className="relative h-full w-full">
      {isRing && !showStrandThreads && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border-[3px] border-gem-gold/90 shadow-[0_0_24px_rgba(201,169,98,0.55),inset_0_0_12px_rgba(201,169,98,0.15)]"
          style={{
            width: `${radiusPercent * 2}%`,
            height: `${radiusPercent * 2}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}

      {isArc && (
        <div
          className="pointer-events-none absolute left-1/2 top-[58%] rounded-full border-[3px] border-gem-gold/85 shadow-[0_0_20px_rgba(201,169,98,0.45)]"
          style={{
            width: `${radiusPercent * 2.2}%`,
            height: `${radiusPercent * 2.2}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}

      {showStrandThreads && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border-[3px] border-gem-gold/80 shadow-[0_0_20px_rgba(201,169,98,0.4)]"
          style={{
            width: `${radiusPercent * 2}%`,
            height: `${radiusPercent * 2}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}

      {slots.map((slot, index) => {
        if (!slot) return null;
        const { x, y } = getPosition(index);
        const dims = beadDimensionsPx(
          slotBeadSizeMm(slot),
          slot.component_type,
          total > 20
        );
        const w = Math.round(dims.width * arBeadScale);
        const h = Math.round(dims.height * arBeadScale);

        return (
          <div
            key={index}
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span
              className={`bead-sphere block product-bead-3d ring-2 ring-white/30 ${beadShapeClass(slot.bead_shape)}`}
              style={{
                backgroundColor: slot.display_color,
                width: w,
                height: h,
                boxShadow:
                  "0 0 10px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.35)",
              }}
            />
          </div>
        );
      })}

      {filledCount === 0 && (
        <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-xs font-medium text-white/80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          Add stones in the customizer to preview them here
        </p>
      )}
    </div>
  );
}
