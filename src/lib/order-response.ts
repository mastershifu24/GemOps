import type { Order } from "@/types/database";

/** Shape returned by POST /api/orders (create + idempotent replay). */
export function toCreateOrderResponse(
  order: Pick<
    Order,
    "id" | "order_code" | "status" | "assembly_script" | "total_cents"
  >,
  options?: { persisted?: boolean; idempotent?: boolean }
) {
  return {
    id: order.id,
    order_code: order.order_code,
    status: order.status,
    assembly_script: order.assembly_script,
    total_cents: order.total_cents,
    persisted: options?.persisted ?? true,
    idempotent: options?.idempotent ?? false,
  };
}
