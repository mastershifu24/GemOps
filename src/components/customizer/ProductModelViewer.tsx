"use client";

import { BraceletSlotStrip } from "@/components/customizer/BraceletSlotStrip";
import { ProductBeadSlot } from "@/components/customizer/ProductBeadSlot";
import {
  layoutUsesArc,
  layoutUsesRing,
  necklaceSlotPosition,
  ringSlotPosition,
} from "@/lib/slot-layout-math";
import type { TemplateLayout } from "@/lib/template-layout";
import type { ProductType, SlotState } from "@/types/database";

interface ProductModelViewerProps {
  slots: SlotState[];
  activeSlotIndex: number | null;
  layout: TemplateLayout;
  productType: ProductType;
  centerLabel: string;
  sequentialOnly?: boolean;
  onSlotTap?: (index: number) => void;
  className?: string;
  enableSpin?: boolean;
}

export function ProductModelViewer({
  slots,
  activeSlotIndex,
  layout,
  productType,
  centerLabel,
  sequentialOnly = false,
  onSlotTap,
  className = "",
  enableSpin = true,
}: ProductModelViewerProps) {
  const total = slots.length;
  const compact = total > 20;
  const radiusPercent = compact ? 38 : 42;
  const isRing = layoutUsesRing(layout);
  const isArc = layoutUsesArc(layout);
  const isLinear = layout === "linear";
  const spinsRing =
    enableSpin &&
    (productType === "bracelet" ||
      productType === "dog_collar" ||
      productType === "anklet");

  if (isLinear) {
    return (
      <div className={`product-preview-stage mx-auto w-full max-w-lg ${className}`}>
        <div className="product-preview-tilt w-full px-1">
          <p className="mb-2 text-center text-[10px] uppercase tracking-[0.25em] text-gem-gold">
            {centerLabel}
          </p>
          <BraceletSlotStrip
            slots={slots}
            activeSlotIndex={activeSlotIndex}
            onSlotTap={onSlotTap}
            variant="overlay"
          />
          <p className="mt-2 text-center text-xs tabular-nums text-gem-mist/60">
            {slots.filter(Boolean).length} / {total}
          </p>
        </div>
      </div>
    );
  }

  const getPosition = (index: number) => {
    if (isRing) return ringSlotPosition(index, total, radiusPercent);
    if (isArc) return necklaceSlotPosition(index, total, radiusPercent);
    return ringSlotPosition(index, total, radiusPercent);
  };

  return (
    <div
      className={`product-preview-stage mx-auto flex w-full justify-center ${className}`}
    >
      <div className="relative mx-auto aspect-square w-full max-w-[min(72vw,280px)]">
        <div
          className={`product-preview-tilt absolute inset-0 ${
            spinsRing ? "bracelet-ring-spin" : ""
          }`}
        >
          {isRing && (
            <div
              className={`pointer-events-none absolute left-1/2 top-1/2 rounded-full border-2 border-white/25 shadow-[0_0_30px_rgba(201,169,98,0.12)] ${
                productType === "dog_collar" ? "product-collar-band" : "product-bracelet-band"
              }`}
              style={{
                width: `${radiusPercent * 2}%`,
                height: `${radiusPercent * 2}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          )}

          {isArc && (
            <div
              className="pointer-events-none absolute left-1/2 top-[58%] rounded-full border-2 border-white/25 shadow-[0_0_24px_rgba(201,169,98,0.1)]"
              style={{
                width: `${radiusPercent * 2.2}%`,
                height: `${radiusPercent * 2.2}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          )}

          {slots.map((slot, index) => {
            const { x, y } = getPosition(index);
            return (
              <ProductBeadSlot
                key={index}
                index={index}
                slot={slot}
                x={x}
                y={y}
                isActive={index === activeSlotIndex}
                compact={compact}
                sequentialOnly={sequentialOnly}
                activeSlotIndex={activeSlotIndex}
                onSlotTap={onSlotTap}
              />
            );
          })}
        </div>

        <div
          className={`pointer-events-none absolute text-center ${
            isRing
              ? "inset-0 flex items-center justify-center"
              : "inset-x-0 bottom-0"
          }`}
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gem-gold">
              {centerLabel}
            </p>
            <p className="mt-0.5 text-xs tabular-nums text-gem-mist/60">
              {slots.filter(Boolean).length} / {total}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
