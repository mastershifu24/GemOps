"use client";

import type { SlotState } from "@/types/database";

interface ProductBeadSlotProps {
  index: number;
  slot: SlotState;
  x: number;
  y: number;
  isActive: boolean;
  emptySize: string;
  filledSize: string;
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
  emptySize,
  filledSize,
  sequentialOnly = false,
  activeSlotIndex,
  onSlotTap,
}: ProductBeadSlotProps) {
  const filled = slot !== null;
  const tappable =
    onSlotTap &&
    (!sequentialOnly ||
      filled ||
      index === activeSlotIndex);

  return (
    <button
      type="button"
      disabled={!tappable}
      onClick={() => tappable && onSlotTap(index)}
      className={`absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-300 ${
        isActive && !filled
          ? "ring-2 ring-gem-gold ring-offset-2 ring-offset-gem-ink animate-pulse"
          : ""
      } ${
        filled
          ? `${filledSize} product-bead-3d`
          : `${emptySize} border border-dashed border-white/40 bg-gem-slate/50 shadow-inner`
      } ${tappable ? "cursor-pointer hover:scale-110 hover:border-white/60" : ""}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-label={
        filled
          ? `Slot ${index + 1}: ${slot.name}`
          : `Empty slot ${index + 1}`
      }
    >
      {filled ? (
        <span
          className={`bead-sphere block rounded-full ${filledSize}`}
          style={{ backgroundColor: slot.display_color }}
        />
      ) : (
        <span className="text-[9px] font-medium tabular-nums text-gem-mist/60">
          {index + 1}
        </span>
      )}
    </button>
  );
}
