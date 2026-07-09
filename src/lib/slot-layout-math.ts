import type { TemplateLayout } from "@/lib/template-layout";

/** Shared bead positions for bracelet (full ring) */
export function ringSlotPosition(
  index: number,
  total: number,
  radiusPercent: number
): { x: number; y: number } {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return {
    x: 50 + radiusPercent * Math.cos(angle),
    y: 50 + radiusPercent * Math.sin(angle),
  };
}

/** Necklace arc: left → bottom → right */
export function necklaceSlotPosition(
  index: number,
  total: number,
  radiusPercent: number,
  centerY = 58
): { x: number; y: number } {
  const t = total <= 1 ? 0.5 : index / (total - 1);
  const angle = Math.PI - t * Math.PI;
  return {
    x: 50 + radiusPercent * Math.cos(angle),
    y: centerY - radiusPercent * Math.sin(angle),
  };
}

/** Linear strand: left-to-right in a row */
export function linearSlotPosition(
  index: number,
  total: number
): { x: number; y: number } {
  const padding = 8;
  const span = 100 - padding * 2;
  const x = padding + (index / Math.max(total - 1, 1)) * span;
  return { x, y: 50 };
}

export function layoutUsesRing(layout: TemplateLayout): boolean {
  return layout === "radial" || layout === "layered";
}

export function layoutUsesLayered(layout: TemplateLayout): boolean {
  return layout === "layered";
}

/** Double strand: inner ring then outer ring */
export function layeredSlotPosition(
  index: number,
  total: number,
  innerRadius: number,
  outerRadius: number
): { x: number; y: number } {
  const perRing = total / 2;
  if (index < perRing) {
    return ringSlotPosition(index, perRing, innerRadius);
  }
  return ringSlotPosition(index - perRing, perRing, outerRadius);
}

export function layoutUsesArc(layout: TemplateLayout): boolean {
  return layout === "arc";
}
