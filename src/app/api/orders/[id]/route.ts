import { NextResponse } from "next/server";
import { isDevMode, updateDevOrderStatus } from "@/lib/dev-orders";
import { createApiClient } from "@/lib/supabase/api";
import type { OrderStatus } from "@/types/database";
import type { Database } from "@/types/supabase";

type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const status = body.status as string | undefined;

  if (!status) {
    return NextResponse.json({ error: "status required" }, { status: 400 });
  }

  if (isDevMode()) {
    const updated = updateDevOrderStatus(id, status as OrderStatus);
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
