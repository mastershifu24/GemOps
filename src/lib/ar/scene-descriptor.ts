import type { ArPlacementHint, ArSceneDescriptor } from "@/types/ar";
import type {
  DesignTemplate,
  OrderSizingMetadata,
  ProductType,
  SlotAssignment,
} from "@/types/database";
import { getProductType, getTemplateLayout } from "@/lib/template-layout";

/**
 * Portable JSON for future WebAR SDKs (8th Wall, model-viewer, native apps).
 * Same data can drive camera overlay today and hand-tracking tomorrow.
 */
export function buildArSceneDescriptor(input: {
  template: DesignTemplate;
  slots: SlotAssignment[];
  sizing: OrderSizingMetadata | null;
  orderCode?: string;
}): ArSceneDescriptor {
  const layout = getTemplateLayout(input.template);
  const productType = getProductType(input.template);

  return {
    version: 1,
    order_code: input.orderCode ?? null,
    product_type: productType,
    layout,
    template_slug: input.template.slug,
    template_name: input.template.name,
    slot_count: input.slots.length,
    filled_count: input.slots.filter(Boolean).length,
    slots: input.slots.map((slot) => ({
      index: slot.slot_index,
      component_id: slot.component_id,
      name: slot.name,
      type: slot.component_type,
      color: slot.display_color,
      bead_size_mm: slot.bead_size_mm ?? 8,
      bead_shape: slot.bead_shape ?? "round",
    })),
    sizing: input.sizing,
    placement: arPlacementForProduct(productType),
    generated_at: new Date().toISOString(),
  };
}

function arPlacementForProduct(productType: ProductType): ArPlacementHint {
  switch (productType) {
    case "necklace":
      return {
        anchor: "neck",
        overlay_y_percent: 32,
        overlay_scale: 0.85,
        camera_facing: "user",
      };
    case "dog_collar":
      return {
        anchor: "neck",
        overlay_y_percent: 55,
        overlay_scale: 0.9,
        camera_facing: "environment",
      };
    case "anklet":
      return {
        anchor: "ankle",
        overlay_y_percent: 72,
        overlay_scale: 0.75,
        camera_facing: "environment",
      };
    case "strand":
      return {
        anchor: "wrist",
        overlay_y_percent: 58,
        overlay_scale: 1,
        camera_facing: "environment",
      };
    default:
      return {
        anchor: "wrist",
        overlay_y_percent: 62,
        overlay_scale: 0.8,
        camera_facing: "environment",
      };
  }
}

export function getArPlacement(productType: ProductType): ArPlacementHint {
  return arPlacementForProduct(productType);
}
