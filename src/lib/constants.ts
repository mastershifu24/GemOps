import type { Component, DesignTemplate, SlotAssignment } from "@/types/database";
import {
  DOG_COLLAR_LENGTH_OPTIONS,
  NECKLACE_LENGTH_OPTIONS,
  WRIST_LENGTH_OPTIONS,
} from "@/lib/template-layout";

/** MVP seed data — used when Supabase is not configured yet */
export const SEED_COMPONENTS: Component[] = [
  {
    id: "seed-onyx",
    name: "Onyx",
    component_type: "bead",
    sku: "BD-ONYX",
    display_color: "#1a1a1a",
    spline_asset_url: null,
    unit_cost_cents: 800,
    configuration_rules: { finish: "matte", diameter_mm: 8 },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "seed-moon",
    name: "Moonstone",
    component_type: "bead",
    sku: "BD-MOON",
    display_color: "#e8e4f0",
    spline_asset_url: null,
    unit_cost_cents: 1200,
    configuration_rules: { finish: "glow", diameter_mm: 8 },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "seed-rose",
    name: "Rose Quartz",
    component_type: "bead",
    sku: "BD-ROSE",
    display_color: "#f4c2c2",
    spline_asset_url: null,
    unit_cost_cents: 900,
    configuration_rules: { finish: "polish", diameter_mm: 8 },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "seed-lapis",
    name: "Lapis",
    component_type: "bead",
    sku: "BD-LAPIS",
    display_color: "#1e3a5f",
    spline_asset_url: null,
    unit_cost_cents: 1100,
    configuration_rules: { finish: "polish", diameter_mm: 8 },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "seed-citrine",
    name: "Citrine",
    component_type: "bead",
    sku: "BD-CITR",
    display_color: "#e4a82a",
    spline_asset_url: null,
    unit_cost_cents: 1000,
    configuration_rules: { finish: "faceted", diameter_mm: 8 },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "seed-spacer",
    name: "Spacer",
    component_type: "spacer",
    sku: "SP-GLD",
    display_color: "#c9a962",
    spline_asset_url: null,
    unit_cost_cents: 300,
    configuration_rules: { finish: "metal", diameter_mm: 4 },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const SEED_TEMPLATES: DesignTemplate[] = [
  {
    id: "seed-bracelet-16",
    name: "Bracelet",
    slug: "bracelet-16",
    description: "Circular wrist bracelet",
    slot_count: 16,
    configuration_rules: {
      layout: "radial",
      product_type: "bracelet",
      fill_mode: "sequential",
      assembly_direction: "left_to_right",
      length_options: WRIST_LENGTH_OPTIONS,
      slots: [],
    },
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "seed-necklace-18",
    name: "Necklace",
    slug: "necklace-18",
    description: "Beaded necklace on an arc",
    slot_count: 18,
    configuration_rules: {
      layout: "arc",
      product_type: "necklace",
      fill_mode: "sequential",
      assembly_direction: "left_to_right",
      length_options: NECKLACE_LENGTH_OPTIONS,
      slots: [],
    },
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "seed-dog-collar-16",
    name: "Dog Collar",
    slug: "dog-collar-16",
    description: "Beaded dog collar band",
    slot_count: 16,
    configuration_rules: {
      layout: "radial",
      product_type: "dog_collar",
      fill_mode: "sequential",
      assembly_direction: "left_to_right",
      length_options: DOG_COLLAR_LENGTH_OPTIONS,
      slots: [],
    },
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "seed-classic-24",
    name: "Classic Strand",
    slug: "classic-24",
    description: "Single-strand bracelet, 24 bead slots",
    slot_count: 24,
    configuration_rules: {
      layout: "linear",
      product_type: "strand",
      assembly_direction: "left_to_right",
      slots: [],
    },
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "seed-double-48",
    name: "Double Strand",
    slug: "double-48",
    description: "Double-strand bracelet, 48 bead slots",
    slot_count: 48,
    configuration_rules: {
      layout: "linear",
      product_type: "strand",
      assembly_direction: "left_to_right",
      slots: [],
    },
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const ORDER_PREFIXES = ["LUNA", "ONYX", "JADE", "RUBY", "OPAL", "PEARL"] as const;

export function generateOrderCode(): string {
  const prefix =
    ORDER_PREFIXES[Math.floor(Math.random() * ORDER_PREFIXES.length)];
  const suffix = 100 + Math.floor(Math.random() * 900);
  return `${prefix}-${suffix}`;
}

/** Bench stringer recipe: START -> 5x Onyx -> 1x Spacer -> END */
export function buildAssemblyScript(layout: SlotAssignment[]): string {
  const filled = [...layout].sort((a, b) => a.slot_index - b.slot_index);
  if (filled.length === 0) return "START -> (empty) -> END";

  const segments: string[] = [];
  let currentName = filled[0].name;
  let count = 1;

  for (let i = 1; i < filled.length; i++) {
    if (filled[i].name === currentName) {
      count++;
    } else {
      segments.push(`${count}x ${currentName}`);
      currentName = filled[i].name;
      count = 1;
    }
  }
  segments.push(`${count}x ${currentName}`);

  return `START -> ${segments.join(" -> ")} -> END`;
}

export function createEmptySlots(count: number): (SlotAssignment | null)[] {
  return Array.from({ length: count }, () => null);
}

export function findNextEmptySlotIndex(
  slots: (SlotAssignment | null)[]
): number | null {
  const index = slots.findIndex((s) => s === null);
  return index === -1 ? null : index;
}

export function countFilledSlots(slots: (SlotAssignment | null)[]): number {
  return slots.filter(Boolean).length;
}

export function toSlotAssignment(
  component: Component,
  slotIndex: number
): SlotAssignment {
  return {
    slot_index: slotIndex,
    component_id: component.id,
    name: component.name,
    component_type: component.component_type,
    display_color: component.display_color,
    unit_cost_cents: component.unit_cost_cents,
  };
}

/** Alternating A/B pattern for solo demo */
export function buildSampleLayout(
  components: Component[] = SEED_COMPONENTS,
  slotCount = 24
): SlotAssignment[] {
  const onyx = components.find((c) => c.name === "Onyx") ?? components[0];
  const moon = components.find((c) => c.name === "Moonstone") ?? components[1];

  return Array.from({ length: slotCount }, (_, i) =>
    toSlotAssignment(i % 2 === 0 ? onyx : moon, i)
  );
}

export const SPLINE_SCENE_URL =
  process.env.NEXT_PUBLIC_SPLINE_SCENE_URL ??
  "https://prod.spline.design/vCEn64MbFJ38qnjV/scene.splinecode";

/** Phase 2: scene with bead_00…bead_47 named spheres + thread (scene.splinecode export) */
export function getSplineStrandSceneUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SPLINE_STRAND_SCENE_URL?.trim();
  if (url && url.includes("scene.splinecode")) return url;
  return null;
}

/** iframe fallback if react-spline fails to load (WebGL, network, etc.) */
export const SPLINE_FALLBACK_EMBED_URL =
  process.env.NEXT_PUBLIC_SPLINE_FALLBACK_EMBED_URL ??
  "https://my.spline.design/floatingbasketball-2e7G7zCpIzx26IAKccqGzzwC/";
