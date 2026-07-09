import type {
  BraceletLengthOption,
  OrderSizingMetadata,
  ProductType,
  StrandCount,
} from "@/types/database";

/** Parse leading inches from labels like 7" or 7.5" */
export function parseInchesFromLabel(label: string): number | null {
  const match = label.match(/^([\d.]+)"/);
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  return Number.isFinite(value) ? value : null;
}

/** Recommend closest length preset from a measured circumference (inches). */
export function recommendLengthOption(
  options: BraceletLengthOption[],
  measuredInches: number
): BraceletLengthOption {
  let best = options[0];
  let bestDelta = Infinity;

  for (const option of options) {
    const inches = parseInchesFromLabel(option.label);
    if (inches === null) continue;
    const delta = Math.abs(inches - measuredInches);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = option;
    }
  }

  return best;
}

export function buildOrderSizingMetadata(input: {
  productType: ProductType;
  templateName: string;
  templateSlug: string;
  lengthLabel: string | null;
  slotCount: number;
  strandCount?: StrandCount;
  measuredCircumferenceIn?: number | null;
  arPreviewUsed?: boolean;
}): OrderSizingMetadata {
  const lengthIn = input.lengthLabel
    ? parseInchesFromLabel(input.lengthLabel)
    : null;

  return {
    product_type: input.productType,
    template_name: input.templateName,
    template_slug: input.templateSlug,
    length_label: input.lengthLabel,
    length_inches: lengthIn,
    slot_count: input.slotCount,
    strand_count: input.strandCount ?? 1,
    measured_circumference_in: input.measuredCircumferenceIn ?? null,
    ar_preview_used: input.arPreviewUsed ?? false,
    captured_at: new Date().toISOString(),
  };
}

export const MEASURE_GUIDE: Record<
  ProductType,
  { title: string; steps: string[]; hint: string }
> = {
  bracelet: {
    title: "Measure your wrist",
    steps: [
      "Wrap a soft tape or string snugly around your wrist bone.",
      "Mark where it meets, then measure the length in inches.",
      "Add 0.5\" for a comfortable beaded bracelet fit.",
    ],
    hint: "Most adults are 6\"–7.5\" wrist (before comfort add-on).",
  },
  anklet: {
    title: "Measure your ankle",
    steps: [
      "Wrap tape around the narrowest part above the ankle bone.",
      "Measure in inches and add 0.25\"–0.5\" for drape.",
    ],
    hint: "Typical anklet lengths are 8\"–10\".",
  },
  dog_collar: {
    title: "Measure your dog's neck",
    steps: [
      "Wrap a tape snugly where the collar sits (two fingers should fit).",
      "Record the inches — pick the closest collar size below.",
    ],
    hint: "Measure at the base of the neck, not over fur bulk.",
  },
  necklace: {
    title: "Choose necklace length",
    steps: [
      "Choker: 14\" · sits at throat",
      "Princess: 18\" · at collarbone",
      "Matinee: 20\" · above bust",
      "Opera: 22\"+ · lower chest",
    ],
    hint: "Use a string at home to see where each length falls.",
  },
  strand: {
    title: "Strand length",
    steps: [
      "Classic strand uses fixed slot count for this template.",
      "Hold a string to your wrist to compare drape before finalizing.",
    ],
    hint: "Double strand templates need more wrist circumference room.",
  },
};

export function supportsCamera(): boolean {
  return (
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}
