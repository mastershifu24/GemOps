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
}

function beadSize(type: string | undefined, compact: boolean): string {
  if (type === "spacer") {
    return compact ? "h-3 w-3" : "h-3.5 w-3.5";
  }
  return compact ? "h-6 w-6" : "h-7 w-7";
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
}: ProductModelViewerProps) {
  const total = slots.length;
  const compact = total > 20;
  const emptySize = compact ? "h-6 w-6" : "h-7 w-7";
  const radiusPercent = compact ? 38 : 42;
  const isRing = layoutUsesRing(layout);
  const isArc = layoutUsesArc(layout);
  const isLinear = layout === "linear";

  if (isLinear) {
    return (
      <div className={`product-preview-stage w-full ${className}`}>
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
      className={`product-preview-stage relative mx-auto w-full ${className}`}
    >
      <div
        className={`product-preview-tilt relative ${
          isLinear ? "min-h-[100px] w-full max-w-full px-1" : "aspect-square max-w-[300px]"
        }`}
      >
        {/* Product thread / band — always visible */}
        {isRing && (
          <div
            className={`pointer-events-none absolute left-1/2 top-1/2 rounded-full border-2 border-white/25 shadow-[0_0_30px_rgba(201,169,98,0.12)] ${
              productType === "dog_collar" ? "product-collar-band" : "product-bracelet-band"
            } ${productType === "bracelet" || productType === "dog_collar" ? "bracelet-ring-spin" : ""}`}
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
          const filled = slot !== null;
          const size = filled ? beadSize(slot.component_type, compact) : emptySize;

          return (
            <ProductBeadSlot
              key={index}
              index={index}
              slot={slot}
              x={x}
              y={y}
              isActive={index === activeSlotIndex}
              emptySize={emptySize}
              filledSize={size}
              sequentialOnly={sequentialOnly}
              activeSlotIndex={activeSlotIndex}
              onSlotTap={onSlotTap}
            />
          );
        })}

        {/* Center / footer label */}
        <div
          className={`pointer-events-none absolute text-center ${
            isRing ? "inset-0 flex items-center justify-center" : "inset-x-0 bottom-0"
          }`}
        >
          <div className={isRing ? "bracelet-ring-counter" : ""}>
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
