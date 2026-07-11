import { NextResponse } from "next/server";
import { buildAssemblyScript, generateOrderCode } from "@/lib/constants";
import {
  createDevOrder,
  isDevMode,
  listDevOrders,
} from "@/lib/dev-orders";
import { toCreateOrderResponse } from "@/lib/order-response";
import { calculateOrderTotalCents } from "@/lib/pricing";
import {
  requireServiceClient,
  requireStaffSession,
} from "@/lib/supabase/route-auth";
import type { Order, OrderSizingMetadata, OrderStatus, SlotAssignment } from "@/types/database";
import type { Database, Json } from "@/types/supabase";

type CreateOrderRow = Pick<
  Order,
  "id" | "order_code" | "status" | "assembly_script" | "total_cents"
>;

function asCreateOrderRow(row: {
  id: string;
  order_code: string;
  status: string;
  assembly_script: string | null;
  total_cents: number;
}): CreateOrderRow {
  return { ...row, status: row.status as OrderStatus };
}

type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];

interface CreateOrderBody {
  order_code?: string;
  design_template_id: string;
  slot_layout: SlotAssignment[];
  total_slot_count: number;
  filled_slot_count: number;
  assembly_script?: string;
  sizing_metadata?: OrderSizingMetadata | null;
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
    const { order, idempotent } = createDevOrder({
      order_code: orderCode,
      design_template_id: body.design_template_id,
      slot_layout: body.slot_layout,
      total_slot_count: body.total_slot_count,
      filled_slot_count: body.filled_slot_count,
      assembly_script: assemblyScript,
      total_cents: totalCents,
      sizing_metadata: body.sizing_metadata ?? null,
    });

    return NextResponse.json(
      toCreateOrderResponse(order, { persisted: false, idempotent })
    );
  }

  const serviceClient = requireServiceClient();
  if (serviceClient instanceof NextResponse) {
    return serviceClient;
  }

  try {
    const { data: existing } = await serviceClient
      .from("orders")
      .select("id, order_code, status, assembly_script, total_cents")
      .eq("order_code", orderCode)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        toCreateOrderResponse(asCreateOrderRow(existing), { idempotent: true })
      );
    }

    const payload: OrderInsert = {
      order_code: orderCode,
      design_template_id: body.design_template_id,
      slot_layout: body.slot_layout as unknown as Json,
      total_slot_count: body.total_slot_count,
      filled_slot_count: body.filled_slot_count,
      assembly_script: assemblyScript,
      status: "pending_payment",
      total_cents: totalCents,
      sizing_metadata: (body.sizing_metadata ?? null) as unknown as Json,
    };

    const { data, error } = await serviceClient
      .from("orders")
      .insert(payload)
      .select("id, order_code, status, assembly_script, total_cents")
      .single();

    if (error) {
      if (error.code === "23505") {
        const replay = await serviceClient
          .from("orders")
          .select("id, order_code, status, assembly_script, total_cents")
          .eq("order_code", orderCode)
          .single();

        if (replay.data) {
          return NextResponse.json(
            toCreateOrderResponse(asCreateOrderRow(replay.data), {
              idempotent: true,
            })
          );
        }
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toCreateOrderResponse(asCreateOrderRow(data)));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  if (isDevMode()) {
    return NextResponse.json({ orders: listDevOrders(), persisted: false });
  }

  const auth = await requireStaffSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { data, error } = await auth.db
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: data, persisted: true });
}
