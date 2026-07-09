import type {
  BraceletLengthOption,
  DesignTemplate,
} from "@/types/database";

export type TemplateLayout = DesignTemplate["configuration_rules"]["layout"];

/** Standard wrist sizes → bead counts (~8 mm beads on elastic) */
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

export function getTemplateLayout(template: DesignTemplate): TemplateLayout {
  return template.configuration_rules?.layout ?? "linear";
}

export function isRadialTemplate(template: DesignTemplate): boolean {
  return getTemplateLayout(template) === "radial";
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
