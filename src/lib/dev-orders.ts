import type { Order, SlotAssignment } from "@/types/database";

interface DevOrderInput {
  order_code: string;
  design_template_id: string;
  slot_layout: SlotAssignment[];
  total_slot_count: number;
  filled_slot_count: number;
  assembly_script: string;
}

const devOrders = new Map<string, Order>();

export function isDevMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !url || !key || url.includes("your-project");
}

export function createDevOrder(input: DevOrderInput): Order {
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
    created_at: now,
    updated_at: now,
    paid_at: null,
    completed_at: null,
  };

  devOrders.set(id, order);
  return order;
}

export function listDevOrders(): Order[] {
  return Array.from(devOrders.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function updateDevOrderStatus(
  id: string,
  status: Order["status"]
): Order | null {
  const order = devOrders.get(id);
  if (!order) return null;

  const now = new Date().toISOString();
  const updated: Order = {
    ...order,
    status,
    updated_at: now,
    paid_at:
      status === "in_studio" || status === "paid" ? now : order.paid_at,
    completed_at: status === "completed" ? now : order.completed_at,
  };

  devOrders.set(id, updated);
  return updated;
}
