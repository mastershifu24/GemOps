import type { BeadShape, SlotAssignment } from "@/types/database";
import { slotBeadSizeMm } from "@/lib/bead-sizes";

/** Reference diameter in mm — 3D unit scale 1.0 = this size */
export const REFERENCE_BEAD_MM = 8;

export interface GemMaterialProps {
  color: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  transmission: number;
  thickness: number;
  ior: number;
  emissive: string;
  emissiveIntensity: number;
  flatShading: boolean;
}

function parseHex(color: string): { r: number; g: number; b: number } {
  const hex = color.replace("#", "");
  if (hex.length !== 6) return { r: 0.5, g: 0.5, b: 0.5 };
  return {
    r: Number.parseInt(hex.slice(0, 2), 16) / 255,
    g: Number.parseInt(hex.slice(2, 4), 16) / 255,
    b: Number.parseInt(hex.slice(4, 6), 16) / 255,
  };
}

function luminance(color: string): number {
  const { r, g, b } = parseHex(color);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Infer gem look from catalog color + type + optional name hints */
export function gemMaterialForSlot(slot: SlotAssignment): GemMaterialProps {
  const color = slot.display_color || "#9ca3af";
  const name = slot.name.toLowerCase();
  const isMetal =
    slot.component_type === "spacer" ||
    slot.component_type === "clasp" ||
    name.includes("gold") ||
    name.includes("silver");

  if (isMetal) {
    return {
      color,
      roughness: 0.28,
      metalness: 0.92,
      clearcoat: 0.35,
      clearcoatRoughness: 0.2,
      transmission: 0,
      thickness: 0,
      ior: 1.5,
      emissive: "#000000",
      emissiveIntensity: 0,
      flatShading: false,
    };
  }

  const lum = luminance(color);
  const isDark = lum < 0.18;
  const isPale = lum > 0.72;
  const faceted =
    slot.bead_shape === "faceted" ||
    name.includes("faceted") ||
    name.includes("citrine");

  // Translucent stones (moonstone, rose quartz, jade-ish pastels)
  const translucent =
    name.includes("moon") ||
    name.includes("quartz") ||
    name.includes("jade") ||
    (isPale && !isDark);

  return {
    color,
    roughness: faceted ? 0.12 : translucent ? 0.22 : isDark ? 0.35 : 0.28,
    metalness: 0.05,
    clearcoat: faceted ? 1 : translucent ? 0.85 : 0.55,
    clearcoatRoughness: faceted ? 0.08 : 0.18,
    transmission: translucent ? 0.35 : 0,
    thickness: translucent ? 0.6 : 0,
    ior: 1.55,
    emissive: translucent ? color : "#000000",
    emissiveIntensity: translucent ? 0.04 : 0,
    flatShading: faceted,
  };
}

/** World-space bead radius from mm size (8mm → ~0.14) */
export function beadRadiusFromMm(mm: number): number {
  const base = 0.14;
  return base * (mm / REFERENCE_BEAD_MM);
}

export function beadScaleFromSlot(slot: SlotAssignment): {
  x: number;
  y: number;
  z: number;
} {
  const mm = slotBeadSizeMm(slot);
  const r = beadRadiusFromMm(mm);
  const shape: BeadShape = slot.bead_shape ?? "round";

  if (slot.component_type === "spacer") {
    return { x: r * 0.7, y: r * 0.7, z: r * 0.7 };
  }
  if (slot.component_type === "clasp") {
    return { x: r * 1.15, y: r * 0.7, z: r * 0.85 };
  }
  if (shape === "rondelle") {
    return { x: r * 1.15, y: r * 0.65, z: r * 1.15 };
  }
  return { x: r, y: r, z: r };
}
