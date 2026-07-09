"use client";

import { BraceletSlotStrip } from "@/components/customizer/BraceletSlotStrip";
import type { SlotState, StrandCount } from "@/types/database";

interface StrandStripBuilderProps {
  slots: SlotState[];
  perRingSlotCount: number;
  strandCount: StrandCount;
  activeSlotIndex: number | null;
  onSlotTap: (globalIndex: number) => void;
  /** Sits under 3D ring — compact chrome, prominent cord line */
  placement?: "hero" | "panel";
}

/**
 * Linear strand strip(s) — separate from the 3D ring hero.
 * Filling a slot here updates the same state that drives the ring preview.
 */
export function StrandStripBuilder({
  slots,
  perRingSlotCount,
  strandCount,
  activeSlotIndex,
  onSlotTap,
  placement = "panel",
}: StrandStripBuilderProps) {
  const innerSlots = slots.slice(0, perRingSlotCount);
  const isHero = placement === "hero";

  const strip = (
    label: string,
    stripSlots: SlotState[],
    indexOffset: number,
    activeLocal: number | null
  ) => (
    <div>
      <p
        className={`mb-2 uppercase tracking-wider text-gem-mist/50 ${
          isHero ? "text-[10px]" : "text-[10px]"
        }`}
      >
        {label}
      </p>
      <BraceletSlotStrip
        slots={stripSlots}
        activeSlotIndex={activeLocal}
        onSlotTap={(localIndex) => onSlotTap(indexOffset + localIndex)}
        variant="strand"
      />
    </div>
  );

  return (
    <section
      className={
        isHero
          ? "w-full"
          : "rounded-xl border border-white/10 bg-gem-slate/40 p-4"
      }
    >
      {!isHero && (
        <>
          <p className="text-xs uppercase tracking-[0.25em] text-gem-gold">
            Strand builder
          </p>
          <p className="mt-1 text-xs text-gem-mist/50">
            Build on the cord strip — the 3D ring above fills in as you go.
          </p>
        </>
      )}

      <div className={isHero ? "space-y-3" : "mt-4 space-y-4"}>
        {strandCount === 1
          ? strip(
              "Single strand",
              innerSlots,
              0,
              activeSlotIndex !== null && activeSlotIndex < perRingSlotCount
                ? activeSlotIndex
                : null
            )
          : (
            <>
              {strip(
                "Inner strand",
                innerSlots,
                0,
                activeSlotIndex !== null &&
                  activeSlotIndex < perRingSlotCount
                  ? activeSlotIndex
                  : null
              )}
              {strip(
                "Outer strand",
                slots.slice(perRingSlotCount, perRingSlotCount * 2),
                perRingSlotCount,
                activeSlotIndex !== null &&
                  activeSlotIndex >= perRingSlotCount
                  ? activeSlotIndex - perRingSlotCount
                  : null
              )}
            </>
          )}
      </div>
    </section>
  );
}
