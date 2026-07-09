"use client";

import type { SlotState } from "@/types/database";

interface BraceletSlotStripProps {
  slots: SlotState[];
  activeSlotIndex: number | null;
  onSlotTap?: (index: number) => void;
  /** Overlay on 3D hero — tighter beads, higher contrast thread */
  variant?: "default" | "overlay";
}

export function BraceletSlotStrip({
  slots,
  activeSlotIndex,
  onSlotTap,
  variant = "default",
}: BraceletSlotStripProps) {
  const isOverlay = variant === "overlay";
  const compact = slots.length > 30;

  const emptySize = compact
    ? isOverlay
      ? "h-5 w-5"
      : "h-6 w-6"
    : isOverlay
      ? "h-6 w-6"
      : "h-7 w-7";

  const beadSize = (type: string | undefined) => {
    if (type === "spacer") {
      return compact ? "h-3.5 w-3.5" : isOverlay ? "h-4 w-4" : "h-5 w-5";
    }
    return compact
      ? isOverlay
        ? "h-5 w-5"
        : "h-6 w-6"
      : isOverlay
        ? "h-6 w-6"
        : "h-7 w-7";
  };

  return (
    <div
      className={`relative w-full overflow-x-auto ${
        isOverlay ? "px-1 pb-0" : "px-2 pb-2"
      }`}
    >
      <div
        className={`mx-auto flex min-w-max items-center ${
          compact ? "gap-0.5" : "gap-1"
        } ${isOverlay ? "py-2" : "py-3"}`}
      >
        <div
          className={`pointer-events-none absolute left-2 right-2 top-1/2 h-px -translate-y-1/2 ${
            isOverlay ? "bg-white/35" : "bg-gem-gold/25"
          }`}
        />

        {slots.map((slot, index) => {
          const isActive = index === activeSlotIndex;
          const filled = slot !== null;
          const size = filled ? beadSize(slot.component_type) : emptySize;

          return (
            <button
              key={index}
              type="button"
              onClick={() => onSlotTap?.(index)}
              className={`relative z-10 flex shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                isActive
                  ? `ring-2 ring-gem-gold ring-offset-2 ${
                      isOverlay ? "ring-offset-transparent" : "ring-offset-gem-ink"
                    }`
                  : ""
              } ${
                filled
                  ? size
                  : `${emptySize} border border-dashed ${
                      isOverlay
                        ? "border-white/30 bg-black/20"
                        : "border-white/20 bg-gem-slate/50"
                    }`
              }`}
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
