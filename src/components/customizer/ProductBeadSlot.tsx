"use client";

import {
  beadDimensionsPx,
  beadShapeClass,
  slotBeadSizeMm,
} from "@/lib/bead-sizes";
import type { SlotState } from "@/types/database";

interface ProductBeadSlotProps {
  index: number;
  slot: SlotState;
  x: number;
  y: number;
  isActive: boolean;
  compact?: boolean;
  sequentialOnly?: boolean;
  activeSlotIndex: number | null;
  onSlotTap?: (index: number) => void;
}

export function ProductBeadSlot({
  index,
  slot,
  x,
  y,
  isActive,
  compact = false,
  sequentialOnly = false,
  activeSlotIndex,
  onSlotTap,
}: ProductBeadSlotProps) {
  const filled = slot !== null;
  const tappable =
    onSlotTap &&
    (!sequentialOnly || filled || index === activeSlotIndex);

  const dims = filled
    ? beadDimensionsPx(
        slotBeadSizeMm(slot),
        slot.component_type,
        compact
      )
    : beadDimensionsPx(8, "bead", compact);

  return (
    <button
      type="button"
      disabled={!tappable}
      onClick={() => tappable && onSlotTap(index)}
      className={`absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-all duration-300 ${
        isActive && !filled
          ? "rounded-full ring-2 ring-gem-gold ring-offset-2 ring-offset-gem-ink animate-pulse"
          : ""
      } ${tappable ? "cursor-pointer hover:scale-110" : ""}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-label={
        filled
          ? `Slot ${index + 1}: ${slot.name}`
          : `Empty slot ${index + 1}`
      }
    >
      {filled ? (
        <span
          className={`bead-sphere block product-bead-3d ${beadShapeClass(slot.bead_shape)}`}
          style={{
            backgroundColor: slot.display_color,
            width: dims.width,
            height: dims.height,
          }}
        />
      ) : (
        <span
          className="flex items-center justify-center rounded-full border border-dashed border-white/40 bg-gem-slate/50 text-[9px] font-medium tabular-nums text-gem-mist/60 shadow-inner"
          style={{ width: dims.width, height: dims.height }}
        >
          {index + 1}
        </span>
      )}
    </button>
  );
}
