import { NextResponse } from "next/server";
import { isDevMode, updateDevOrderStatus } from "@/lib/dev-orders";
import { createApiClient } from "@/lib/supabase/api";
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

  const payment =
    paymentMethod && amountPaidCents !== undefined
      ? { payment_method: paymentMethod, amount_paid_cents: amountPaidCents }
      : undefined;

  if (isDevMode()) {
    const updated = updateDevOrderStatus(id, status as OrderStatus, payment);
    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ ...updated, persisted: false });
  }

  const supabase = createApiClient();
  const updates: OrderUpdate = { status };

  if (status === "paid" || status === "in_studio") {
    updates.paid_at = new Date().toISOString();
  }
  if (status === "completed") {
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
