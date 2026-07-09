import type {
  BeadShape,
  OrderSizingMetadata,
  ProductType,
  TemplateConfigurationRules,
} from "@/types/database";

export interface ArSceneSlot {
  index: number;
  component_id: string;
  name: string;
  type: string;
  color: string;
  bead_size_mm: number;
  bead_shape: BeadShape;
}

export interface ArPlacementHint {
  anchor: "wrist" | "neck" | "ankle";
  overlay_y_percent: number;
  overlay_scale: number;
  camera_facing: "user" | "environment";
}

export interface ArSceneDescriptor {
  version: 1;
  order_code: string | null;
  product_type: ProductType;
  layout: TemplateConfigurationRules["layout"];
  template_slug: string;
  template_name: string;
  slot_count: number;
  filled_count: number;
  slots: ArSceneSlot[];
  sizing: OrderSizingMetadata | null;
  placement: ArPlacementHint;
  generated_at: string;
}
