"use client";

import { BraceletSlotStrip } from "@/components/customizer/BraceletSlotStrip";
import type { SlotState, StrandCount } from "@/types/database";

interface StrandStripBuilderProps {
  slots: SlotState[];
  perRingSlotCount: number;
  strandCount: StrandCount;
  activeSlotIndex: number | null;
  onSlotTap: (globalIndex: number) => void;
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
}: StrandStripBuilderProps) {
  const innerSlots = slots.slice(0, perRingSlotCount);

  return (
    <section className="rounded-xl border border-white/10 bg-gem-slate/40 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-gem-gold">
        Strand builder
      </p>
      <p className="mt-1 text-xs text-gem-mist/50">
        Build on the cord strip — the 3D ring above fills in as you go.
      </p>

      <div className="mt-4 space-y-4">
        {strandCount === 1 ? (
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-wider text-gem-mist/40">
              Single strand
            </p>
            <BraceletSlotStrip
              slots={innerSlots}
              activeSlotIndex={
                activeSlotIndex !== null && activeSlotIndex < perRingSlotCount
                  ? activeSlotIndex
                  : null
              }
              onSlotTap={(localIndex) => onSlotTap(localIndex)}
            />
          </div>
        ) : (
          <>
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-wider text-gem-mist/40">
                Inner strand
              </p>
              <BraceletSlotStrip
                slots={innerSlots}
                activeSlotIndex={
                  activeSlotIndex !== null &&
                  activeSlotIndex < perRingSlotCount
                    ? activeSlotIndex
                    : null
                }
                onSlotTap={(localIndex) => onSlotTap(localIndex)}
              />
            </div>
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-wider text-gem-mist/40">
                Outer strand
              </p>
              <BraceletSlotStrip
                slots={slots.slice(perRingSlotCount, perRingSlotCount * 2)}
                activeSlotIndex={
                  activeSlotIndex !== null &&
                  activeSlotIndex >= perRingSlotCount
                    ? activeSlotIndex - perRingSlotCount
                    : null
                }
                onSlotTap={(localIndex) =>
                  onSlotTap(perRingSlotCount + localIndex)
                }
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
