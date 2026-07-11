import type {
  OrderSizingMetadata,
  OrderStatus,
  SlotAssignment,
} from "@/types/database";
import type { PaymentMethod } from "@/lib/pricing";

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "pending_payment",
  "paid",
  "in_studio",
  "completed",
  "cancelled",
] as const;

const ORDER_STATUS_SET = new Set<string>(ORDER_STATUSES);

const PAYMENT_METHODS = new Set<string>(["cash", "card", "other"]);

export function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUS_SET.has(value);
}

export function isPaymentMethod(value: string): value is PaymentMethod {
  return PAYMENT_METHODS.has(value);
}

export interface ValidatedCreateOrderBody {
  order_code?: string;
  design_template_id: string;
  slot_layout: SlotAssignment[];
  total_slot_count: number;
  filled_slot_count: number;
  assembly_script?: string;
  sizing_metadata?: OrderSizingMetadata | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidSlotAssignment(value: unknown): value is SlotAssignment {
  if (!isRecord(value)) return false;
  return (
    typeof value.slot_index === "number" &&
    Number.isInteger(value.slot_index) &&
    value.slot_index >= 0 &&
    typeof value.component_id === "string" &&
    value.component_id.length > 0 &&
    typeof value.name === "string" &&
    value.name.length > 0 &&
    typeof value.component_type === "string" &&
    typeof value.display_color === "string"
  );
}

export function validateCreateOrderBody(
  body: unknown
): { ok: true; data: ValidatedCreateOrderBody } | { ok: false; error: string } {
  if (!isRecord(body)) {
    return { ok: false, error: "Invalid order payload" };
  }

  if (
    typeof body.design_template_id !== "string" ||
    !body.design_template_id.trim()
  ) {
    return { ok: false, error: "design_template_id is required" };
  }

  if (!Array.isArray(body.slot_layout)) {
    return { ok: false, error: "slot_layout must be an array" };
  }

  if (body.slot_layout.length === 0) {
    return { ok: false, error: "At least one bead or component is required" };
  }

  if (!body.slot_layout.every(isValidSlotAssignment)) {
    return { ok: false, error: "slot_layout contains invalid slot entries" };
  }

  if (
    typeof body.total_slot_count !== "number" ||
    !Number.isInteger(body.total_slot_count) ||
    body.total_slot_count < 1
  ) {
    return { ok: false, error: "total_slot_count must be a positive integer" };
  }

  if (
    typeof body.filled_slot_count !== "number" ||
    !Number.isInteger(body.filled_slot_count) ||
    body.filled_slot_count < 1 ||
    body.filled_slot_count > body.total_slot_count
  ) {
    return {
      ok: false,
      error: "filled_slot_count must be between 1 and total_slot_count",
    };
  }

  if (body.slot_layout.length > body.total_slot_count) {
    return {
      ok: false,
      error: "slot_layout exceeds total_slot_count",
    };
  }

  if (
    body.order_code !== undefined &&
    (typeof body.order_code !== "string" || !body.order_code.trim())
  ) {
    return { ok: false, error: "order_code must be a non-empty string" };
  }

  return {
    ok: true,
    data: {
      order_code:
        typeof body.order_code === "string" ? body.order_code.trim() : undefined,
      design_template_id: body.design_template_id.trim(),
      slot_layout: body.slot_layout,
      total_slot_count: body.total_slot_count,
      filled_slot_count: body.filled_slot_count,
      assembly_script:
        typeof body.assembly_script === "string"
          ? body.assembly_script
          : undefined,
      sizing_metadata:
        body.sizing_metadata === null || isRecord(body.sizing_metadata)
          ? (body.sizing_metadata as OrderSizingMetadata | null)
          : null,
    },
  };
}

export interface ValidatedPatchOrderBody {
  status: OrderStatus;
  payment_method?: PaymentMethod;
  amount_paid_cents?: number;
}

export function validatePatchOrderBody(
  body: unknown
): { ok: true; data: ValidatedPatchOrderBody } | { ok: false; error: string } {
  if (!isRecord(body)) {
    return { ok: false, error: "Invalid request body" };
  }

  if (typeof body.status !== "string" || !isOrderStatus(body.status)) {
    return { ok: false, error: "Invalid or missing status" };
  }

  const data: ValidatedPatchOrderBody = { status: body.status };

  if (body.payment_method !== undefined) {
    if (
      typeof body.payment_method !== "string" ||
      !isPaymentMethod(body.payment_method)
    ) {
      return { ok: false, error: "Invalid payment_method" };
    }
    data.payment_method = body.payment_method;
  }

  if (body.amount_paid_cents !== undefined) {
    if (
      typeof body.amount_paid_cents !== "number" ||
      !Number.isInteger(body.amount_paid_cents) ||
      body.amount_paid_cents < 0
    ) {
      return { ok: false, error: "amount_paid_cents must be a non-negative integer" };
    }
    data.amount_paid_cents = body.amount_paid_cents;
  }

  if (body.status === "in_studio" && !data.payment_method) {
    return {
      ok: false,
      error: "payment_method is required when marking an order paid",
    };
  }

  return { ok: true, data };
}
