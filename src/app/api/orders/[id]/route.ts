import { NextResponse } from "next/server";
import { isDevMode, updateDevOrderStatus } from "@/lib/dev-orders";
import { assertOrderTransition } from "@/lib/order-transitions";
import { requireStaffSession } from "@/lib/supabase/route-auth";
import type { OrderStatus, PaymentMethod } from "@/types/database";
import type { Database } from "@/types/supabase";

type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const status = body.status as string | undefined;
  const paymentMethod = body.payment_method as PaymentMethod | undefined;
  const amountPaidCents = body.amount_paid_cents as number | undefined;

  if (!status) {
    return NextResponse.json({ error: "status required" }, { status: 400 });
  }

  const nextStatus = status as OrderStatus;
  const payment =
    paymentMethod && amountPaidCents !== undefined
      ? { payment_method: paymentMethod, amount_paid_cents: amountPaidCents }
      : undefined;

  if (isDevMode()) {
    const result = updateDevOrderStatus(id, nextStatus, payment);
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
  }
  if (nextStatus === "completed") {
    updates.completed_at = new Date().toISOString();
  }
  if (paymentMethod) {
    updates.payment_method = paymentMethod;
  }
  if (amountPaidCents !== undefined) {
    updates.amount_paid_cents = amountPaidCents;
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
