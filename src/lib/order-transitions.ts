import type { OrderStatus } from "@/types/database";

/** Valid forward transitions for the order pipeline. */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_payment: ["in_studio", "cancelled"],
  paid: ["in_studio", "completed"],
  in_studio: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export type OrderTransitionResult =
  | { ok: true; noop: boolean }
  | { ok: false; error: string };

export function assertOrderTransition(
  current: OrderStatus,
  next: OrderStatus
): OrderTransitionResult {
  if (current === next) {
    return { ok: true, noop: true };
  }

  if (!ORDER_TRANSITIONS[current]?.includes(next)) {
    return {
      ok: false,
      error: `Cannot move order from "${current}" to "${next}"`,
    };
  }

  return { ok: true, noop: false };
}
