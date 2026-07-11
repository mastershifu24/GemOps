import { NextResponse } from "next/server";
import { isDevMode, listDevOrders, updateDevOrderStatus } from "@/lib/dev-orders";
import { assertOrderTransition } from "@/lib/order-transitions";
import { requireStaffSession } from "@/lib/supabase/route-auth";
import { validatePatchOrderBody } from "@/lib/validate-order";
import type { OrderStatus } from "@/types/database";
import type { Database } from "@/types/supabase";

type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = validatePatchOrderBody(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { status: nextStatus, payment_method: paymentMethod } = parsed.data;

  if (isDevMode()) {
    const current = listDevOrders().find((o) => o.id === id);
    if (!current) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const result = updateDevOrderStatus(
      id,
      nextStatus,
      nextStatus === "in_studio" && paymentMethod
        ? {
            payment_method: paymentMethod,
            amount_paid_cents: current.total_cents,
          }
        : undefined
    );

    if (!result) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({
      ...result.order,
      persisted: false,
      idempotent: result.noop,
    });
  }

  const auth = await requireStaffSession();
  if ("response" in auth) {
    return auth.response;
  }

  const supabase = auth.db;
  const { data: existing, error: fetchError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const transition = assertOrderTransition(
    existing.status as OrderStatus,
    nextStatus
  );

  if (!transition.ok) {
    return NextResponse.json({ error: transition.error }, { status: 409 });
  }

  if (transition.noop) {
    return NextResponse.json({ ...existing, idempotent: true });
  }

  const updates: OrderUpdate = { status: nextStatus };

  if (nextStatus === "paid" || nextStatus === "in_studio") {
    updates.paid_at = new Date().toISOString();
    updates.payment_method = paymentMethod ?? null;
    updates.amount_paid_cents = existing.total_cents;
  }
  if (nextStatus === "completed") {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
