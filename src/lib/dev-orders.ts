import { assertOrderTransition } from "@/lib/order-transitions";
import type { Order, OrderStatus, PaymentMethod } from "@/types/database";

interface DevOrderInput {
  order_code: string;
  design_template_id: string;
  slot_layout: Order["slot_layout"];
  total_slot_count: number;
  filled_slot_count: number;
  assembly_script: string;
  total_cents: number;
  sizing_metadata?: Order["sizing_metadata"];
}

const DEV_ORDERS_KEY = "__gemops_dev_orders__";

function devOrders(): Map<string, Order> {
  const globalStore = globalThis as typeof globalThis & {
    [DEV_ORDERS_KEY]?: Map<string, Order>;
  };
  if (!globalStore[DEV_ORDERS_KEY]) {
    globalStore[DEV_ORDERS_KEY] = new Map();
  }
  return globalStore[DEV_ORDERS_KEY];
}

export function isDevMode(): boolean {
  if (process.env.E2E_TEST_MODE === "1") return true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !url || !key || url.includes("your-project");
}

export function findDevOrderByCode(orderCode: string): Order | null {
  for (const order of devOrders().values()) {
    if (order.order_code === orderCode) return order;
  }
  return null;
}

export function createDevOrder(input: DevOrderInput): {
  order: Order;
  idempotent: boolean;
} {
  const existing = findDevOrderByCode(input.order_code);
  if (existing) {
    return { order: existing, idempotent: true };
  }

  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const order: Order = {
    id,
    order_code: input.order_code,
    design_template_id: input.design_template_id,
    slot_layout: input.slot_layout,
    status: "pending_payment",
    assembly_script: input.assembly_script,
    total_slot_count: input.total_slot_count,
    filled_slot_count: input.filled_slot_count,
    total_cents: input.total_cents,
    payment_method: null,
    amount_paid_cents: null,
    sizing_metadata: input.sizing_metadata ?? null,
    created_at: now,
    updated_at: now,
    paid_at: null,
    completed_at: null,
  };

  devOrders().set(id, order);
  return { order, idempotent: false };
}

export function listDevOrders(): Order[] {
  return Array.from(devOrders().values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function updateDevOrderStatus(
  id: string,
  status: OrderStatus,
  payment?: { payment_method: PaymentMethod; amount_paid_cents: number }
): { order: Order; noop: boolean } | { error: string } | null {
  const order = devOrders().get(id);
  if (!order) return null;

  const transition = assertOrderTransition(order.status, status);
  if (!transition.ok) {
    return { error: transition.error };
  }

  if (transition.noop) {
    return { order, noop: true };
  }

  const now = new Date().toISOString();
  const updated: Order = {
    ...order,
    status,
    updated_at: now,
    paid_at:
      status === "in_studio" || status === "paid" ? now : order.paid_at,
    completed_at: status === "completed" ? now : order.completed_at,
    payment_method: payment?.payment_method ?? order.payment_method,
    amount_paid_cents: payment?.amount_paid_cents ?? order.amount_paid_cents,
  };

  devOrders().set(id, updated);
  return { order: updated, noop: false };
}
