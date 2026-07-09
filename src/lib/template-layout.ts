import type { DesignTemplate, ProductType } from "@/types/database";
import type { BraceletLengthOption } from "@/types/database";

export type TemplateLayout = DesignTemplate["configuration_rules"]["layout"];

export const PRODUCT_LABELS: Record<ProductType, string> = {
  bracelet: "Bracelet",
  necklace: "Necklace",
  dog_collar: "Dog Collar",
  anklet: "Anklet",
  strand: "Strand",
};

export const SIZE_PICKER_LABELS: Record<ProductType, string> = {
  bracelet: "Wrist Length",
  necklace: "Necklace Length",
  dog_collar: "Collar Size",
  anklet: "Anklet Length",
  strand: "Strand Length",
};

/** Wrist circumference → bead count (~8 mm beads) */
export const WRIST_LENGTH_OPTIONS: BraceletLengthOption[] = [
  { label: '5.5"', slot_count: 10, description: "Petite" },
  { label: '6"', slot_count: 12, description: "XS" },
  { label: '6.5"', slot_count: 14, description: "Small" },
  { label: '7"', slot_count: 16, description: "Medium", default: true },
  { label: '7.5"', slot_count: 18, description: "Large" },
  { label: '8"', slot_count: 20, description: "XL" },
  { label: '8.5"', slot_count: 22, description: "XXL" },
  { label: '9"', slot_count: 24, description: "Wide" },
];

/** Necklace chain length → bead count */
export const NECKLACE_LENGTH_OPTIONS: BraceletLengthOption[] = [
  { label: '14"', slot_count: 14, description: "Choker" },
  { label: '16"', slot_count: 16, description: "Short" },
  { label: '18"', slot_count: 18, description: "Princess", default: true },
  { label: '20"', slot_count: 20, description: "Matinee" },
  { label: '22"', slot_count: 22, description: "Opera" },
  { label: '24"', slot_count: 24, description: "Rope" },
];

/** Dog neck circumference → bead count */
export const DOG_COLLAR_LENGTH_OPTIONS: BraceletLengthOption[] = [
  { label: '10"', slot_count: 12, description: "XS" },
  { label: '12"', slot_count: 14, description: "Small" },
  { label: '14"', slot_count: 16, description: "Medium", default: true },
  { label: '16"', slot_count: 18, description: "Large" },
  { label: '18"', slot_count: 20, description: "XL" },
  { label: '20"', slot_count: 22, description: "XXL" },
];

/** Anklet circumference → bead count */
export const ANKLET_LENGTH_OPTIONS: BraceletLengthOption[] = [
  { label: '8"', slot_count: 10, description: "Petite" },
  { label: '8.5"', slot_count: 12, description: "Small" },
  { label: '9"', slot_count: 14, description: "Medium", default: true },
  { label: '9.5"', slot_count: 16, description: "Large" },
  { label: '10"', slot_count: 18, description: "XL" },
];

export function getProductType(template: DesignTemplate): ProductType {
  return template.configuration_rules?.product_type ?? "strand";
}

export function getTemplateLayout(template: DesignTemplate): TemplateLayout {
  return template.configuration_rules?.layout ?? "linear";
}

export function isRadialTemplate(template: DesignTemplate): boolean {
  return getTemplateLayout(template) === "radial";
}

export function isArcTemplate(template: DesignTemplate): boolean {
  return getTemplateLayout(template) === "arc";
}

export function usesProductPreview(template: DesignTemplate): boolean {
  const layout = getTemplateLayout(template);
  return layout === "radial" || layout === "arc" || layout === "linear";
}

export function isSequentialFill(template: DesignTemplate): boolean {
  return template.configuration_rules?.fill_mode === "sequential";
}

export function getLengthOptions(
  template: DesignTemplate
): BraceletLengthOption[] | null {
  const options = template.configuration_rules?.length_options;
  return options?.length ? options : null;
}

export function getDefaultLengthOption(
  template: DesignTemplate
): BraceletLengthOption | null {
  const options = getLengthOptions(template);
  if (!options) return null;
  return options.find((o) => o.default) ?? options[Math.floor(options.length / 2)];
}

export function resolveSlotCount(
  template: DesignTemplate,
  selectedLength?: BraceletLengthOption | null
): number {
  if (selectedLength) return selectedLength.slot_count;
  const fallback = getDefaultLengthOption(template);
  if (fallback) return fallback.slot_count;
  return template.slot_count;
}

export function formatLengthLabel(option: BraceletLengthOption): string {
  const detail = option.description ? ` · ${option.description}` : "";
  return `${option.label}${detail} (${option.slot_count} beads)`;
}

export function getSizePickerLabel(template: DesignTemplate): string {
  return SIZE_PICKER_LABELS[getProductType(template)];
}

export function getPreviewCenterLabel(template: DesignTemplate): string {
  const product = PRODUCT_LABELS[getProductType(template)];
  return `Your ${product}`;
}
