import { NextResponse } from "next/server";
import { buildAssemblyScript, generateOrderCode } from "@/lib/constants";
import {
  createDevOrder,
  isDevMode,
  listDevOrders,
} from "@/lib/dev-orders";
import { calculateOrderTotalCents } from "@/lib/pricing";
import { createApiClient } from "@/lib/supabase/api";
import type { SlotAssignment } from "@/types/database";
import type { Database, Json } from "@/types/supabase";

type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];

interface CreateOrderBody {
  order_code?: string;
  design_template_id: string;
  slot_layout: SlotAssignment[];
  total_slot_count: number;
  filled_slot_count: number;
  assembly_script?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateOrderBody;

  if (!body.design_template_id || !Array.isArray(body.slot_layout)) {
    return NextResponse.json(
      { error: "Invalid order payload" },
      { status: 400 }
    );
  }

  const orderCode = body.order_code ?? generateOrderCode();
  const assemblyScript =
    body.assembly_script ?? buildAssemblyScript(body.slot_layout);
  const totalCents = calculateOrderTotalCents(body.slot_layout);

  if (isDevMode()) {
    const order = createDevOrder({
      order_code: orderCode,
      design_template_id: body.design_template_id,
      slot_layout: body.slot_layout,
      total_slot_count: body.total_slot_count,
      filled_slot_count: body.filled_slot_count,
      assembly_script: assemblyScript,
      total_cents: totalCents,
    });

    return NextResponse.json({
      id: order.id,
      order_code: order.order_code,
      status: order.status,
      assembly_script: order.assembly_script,
      total_cents: order.total_cents,
      persisted: false,
    });
  }

  try {
    const supabase = createApiClient();
    const payload: OrderInsert = {
      order_code: orderCode,
      design_template_id: body.design_template_id,
      slot_layout: body.slot_layout as unknown as Json,
      total_slot_count: body.total_slot_count,
      filled_slot_count: body.filled_slot_count,
      assembly_script: assemblyScript,
      status: "pending_payment",
      total_cents: totalCents,
    };

    const { data, error } = await supabase
      .from("orders")
      .insert(payload)
      .select("id, order_code, status, assembly_script, total_cents")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ...data, persisted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  if (isDevMode()) {
    return NextResponse.json({ orders: listDevOrders(), persisted: false });
  }

  const supabase = createApiClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: data, persisted: true });
}
