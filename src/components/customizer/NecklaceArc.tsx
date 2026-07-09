"use client";

import type { SlotState } from "@/types/database";

interface NecklaceArcProps {
  slots: SlotState[];
  activeSlotIndex: number | null;
  centerLabel: string;
  onSlotTap?: (index: number) => void;
  sequentialOnly?: boolean;
  className?: string;
}

function beadSize(type: string | undefined, compact: boolean): string {
  if (type === "spacer") {
    return compact ? "h-3 w-3" : "h-3.5 w-3.5";
  }
  return compact ? "h-5 w-5" : "h-6 w-6";
}

/** Slots along a necklace arc (left → under → right) */
export function NecklaceArc({
  slots,
  activeSlotIndex,
  centerLabel,
  onSlotTap,
  sequentialOnly = false,
  className = "",
}: NecklaceArcProps) {
  const total = slots.length;
  const compact = total > 20;
  const emptySize = compact ? "h-5 w-5" : "h-6 w-6";
  const radiusPercent = 40;

  return (
    <div
      className={`relative mx-auto aspect-[5/4] w-full max-w-[300px] ${className}`}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-[58%] rounded-full border border-white/20"
        style={{
          width: `${radiusPercent * 2.2}%`,
          height: `${radiusPercent * 2.2}%`,
          transform: "translate(-50%, -50%)",
        }}
      />

      {slots.map((slot, index) => {
        const t = total <= 1 ? 0.5 : index / (total - 1);
        const angle = Math.PI - t * Math.PI;
        const x = 50 + radiusPercent * Math.cos(angle);
        const y = 58 - radiusPercent * Math.sin(angle);
        const isActive = index === activeSlotIndex;
        const filled = slot !== null;
        const size = filled ? beadSize(slot.component_type, compact) : emptySize;
        const tappable =
          onSlotTap &&
          !filled &&
          (!sequentialOnly || index === activeSlotIndex);

        return (
          <button
            key={index}
            type="button"
            disabled={!tappable}
            onClick={() => tappable && onSlotTap(index)}
            className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-200 ${
              isActive && !filled
                ? "ring-2 ring-gem-gold ring-offset-2 ring-offset-gem-ink animate-pulse"
                : ""
            } ${
              filled
                ? size
                : `${emptySize} border border-dashed border-white/30 bg-gem-slate/40`
            } ${tappable ? "cursor-pointer hover:border-white/50" : ""}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            aria-label={
              filled
                ? `Slot ${index + 1}: ${slot.name}`
                : `Empty slot ${index + 1}`
            }
          >
            {filled ? (
              <span
                className={`bead-sphere block rounded-full ${size}`}
                style={{ backgroundColor: slot.display_color }}
              />
            ) : (
              <span className="text-[8px] font-medium tabular-nums text-gem-mist/50">
                {index + 1}
              </span>
            )}
          </button>
        );
      })}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 text-center">
        <p className="text-[10px] uppercase tracking-[0.25em] text-gem-gold">
          {centerLabel}
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-gem-mist/60">
          {slots.filter(Boolean).length} / {total}
        </p>
      </div>
    </div>
  );
}
