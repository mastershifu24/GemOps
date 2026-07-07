"use client";

import type { SlotState } from "@/types/database";

interface BraceletSlotStripProps {
  slots: SlotState[];
  activeSlotIndex: number | null;
  onSlotTap?: (index: number) => void;
}

export function BraceletSlotStrip({
  slots,
  activeSlotIndex,
  onSlotTap,
}: BraceletSlotStripProps) {
  return (
    <div className="relative w-full overflow-x-auto px-2 pb-2">
      <div className="mx-auto flex min-w-max items-center gap-1 py-3">
        {/* Linear thread line */}
        <div className="pointer-events-none absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-gem-gold/25" />

        {slots.map((slot, index) => {
          const isActive = index === activeSlotIndex;
          const filled = slot !== null;
          const size = slot?.component_type === "spacer" ? "h-5 w-5" : "h-7 w-7";

          return (
            <button
              key={index}
              type="button"
              onClick={() => onSlotTap?.(index)}
              className={`relative z-10 flex shrink-0 items-center justify-center rounded-full transition-all ${
                isActive
                  ? "ring-2 ring-gem-gold ring-offset-2 ring-offset-gem-ink"
                  : ""
              } ${filled ? size : "h-7 w-7 border border-dashed border-white/20 bg-gem-slate/50"}`}
              aria-label={
                filled
                  ? `Slot ${index + 1}: ${slot.name}`
                  : `Empty slot ${index + 1}`
              }
            >
              {filled && (
                <span
                  className={`bead-sphere block rounded-full ${size}`}
                  style={{ backgroundColor: slot.display_color }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
