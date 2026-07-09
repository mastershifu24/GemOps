export type ComponentType =
  | "bead"
  | "clasp"
  | "spacer"
  | "charm"
  | "watch_case"
  | "watch_dial"
  | "watch_strap"
  | "watch_movement";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "in_studio"
  | "completed"
  | "cancelled";

export interface SlotRule {
  index: number;
  role?: string;
  allowed_types?: ComponentType[];
  required?: boolean;
  fixed_component_id?: string | null;
}

/** Size preset → bead count */
export interface BraceletLengthOption {
  label: string;
  slot_count: number;
  description?: string;
  default?: boolean;
}

export type ProductType = "bracelet" | "necklace" | "dog_collar" | "anklet" | "strand";

export type BeadShape = "round" | "faceted" | "rondelle";

export type StrandCount = 1 | 2;

/** Stored with orders for size confidence + future AR replay */
export interface OrderSizingMetadata {
  product_type: ProductType;
  template_name: string;
  template_slug: string;
  length_label: string | null;
  length_inches: number | null;
  slot_count: number;
  strand_count?: StrandCount;
  measured_circumference_in: number | null;
  ar_preview_used: boolean;
  captured_at: string;
}

export interface TemplateConfigurationRules {
  layout: "linear" | "radial" | "arc" | "layered";
  product_type?: ProductType;
  assembly_direction?: "left_to_right" | "right_to_left" | "center_out";
  /** product templates: fill slots in order only */
  fill_mode?: "sequential" | "free";
  /** per-product size presets */
  length_options?: BraceletLengthOption[];
  slots?: SlotRule[];
}

export interface ComponentConfigurationRules {
  finish?: string;
  diameter_mm?: number;
  role?: string;
  [key: string]: unknown;
}

export interface Component {
  id: string;
  name: string;
  component_type: ComponentType;
  sku: string | null;
  display_color: string;
  spline_asset_url: string | null;
  unit_cost_cents: number;
  configuration_rules: ComponentConfigurationRules;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DesignTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  slot_count: number;
  configuration_rules: TemplateConfigurationRules;
  is_active: boolean;
  created_at: string;
}

export interface SlotAssignment {
  slot_index: number;
  component_id: string;
  name: string;
  component_type: ComponentType;
  display_color: string;
  unit_cost_cents?: number;
  bead_size_mm?: number;
  bead_shape?: BeadShape;
}

export type PaymentMethod = "cash" | "card" | "other";

export type SlotState = SlotAssignment | null;

export interface Order {
  id: string;
  order_code: string;
  design_template_id: string;
  slot_layout: SlotAssignment[];
  status: OrderStatus;
  assembly_script: string | null;
  total_slot_count: number;
  filled_slot_count: number;
  total_cents: number;
  payment_method: PaymentMethod | null;
  amount_paid_cents: number | null;
  sizing_metadata: OrderSizingMetadata | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  completed_at: string | null;
}

export interface CreateOrderPayload {
  design_template_id: string;
  slot_layout: SlotAssignment[];
  total_slot_count: number;
  filled_slot_count: number;
}
