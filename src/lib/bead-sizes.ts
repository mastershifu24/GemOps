import type { BeadShape, SlotAssignment } from "@/types/database";

export const BEAD_SIZE_OPTIONS_MM = [2, 3, 4, 6, 8] as const;
export type BeadSizeMm = (typeof BEAD_SIZE_OPTIONS_MM)[number];

export const BEAD_SHAPE_OPTIONS: { id: BeadShape; label: string }[] = [
  { id: "round", label: "Round" },
  { id: "faceted", label: "Faceted" },
  { id: "rondelle", label: "Rondelle" },
];

export function beadDimensionsPx(
  mm: number,
  componentType: string | undefined,
  compact: boolean
): { width: number; height: number } {
  if (componentType === "spacer") {
    const s = compact ? 12 : 14;
    return { width: s, height: s };
  }
  if (componentType === "clasp") {
    const s = compact ? 18 : 22;
    return { width: s, height: s };
  }

  const base = compact ? 22 : 28;
  const scale = mm / 8;
  const size = Math.max(10, Math.round(base * scale));
  return { width: size, height: size };
}

export function beadShapeClass(shape: BeadShape | undefined): string {
  switch (shape) {
    case "faceted":
      return "rounded-[4px] rotate-45";
    case "rondelle":
      return "rounded-full scale-x-125 scale-y-75";
    default:
      return "rounded-full";
  }
}

export function slotBeadSizeMm(slot: SlotAssignment): number {
  return slot.bead_size_mm ?? 8;
}
