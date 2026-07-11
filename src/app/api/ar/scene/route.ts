import { NextResponse } from "next/server";
import { buildArSceneDescriptor } from "@/lib/ar/scene-descriptor";
import { isDevMode, listDevOrders } from "@/lib/dev-orders";
import { requireStaffSession } from "@/lib/supabase/route-auth";
import type {
  DesignTemplate,
  OrderSizingMetadata,
  SlotAssignment,
} from "@/types/database";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderCode = searchParams.get("order_code");

  if (!orderCode) {
    return NextResponse.json(
      { error: "order_code query parameter required" },
      { status: 400 }
    );
  }

  if (isDevMode()) {
    const order = listDevOrders().find((o) => o.order_code === orderCode);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const scene = buildArSceneDescriptor({
      template: stubTemplateFromOrder(order.design_template_id),
      slots: order.slot_layout,
      sizing: order.sizing_metadata,
      orderCode: order.order_code,
    });

    return NextResponse.json(scene);
  }

  const auth = await requireStaffSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { data: order, error } = await auth.db
    .from("orders")
    .select(
      "order_code, design_template_id, slot_layout, sizing_metadata, design_templates(*)"
    )
    .eq("order_code", orderCode)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const row = order as {
    order_code: string;
    slot_layout: unknown;
    sizing_metadata: unknown;
    design_templates: unknown;
  };

  const template = row.design_templates as DesignTemplate;
  const slots = row.slot_layout as SlotAssignment[];

  const scene = buildArSceneDescriptor({
    template,
    slots,
    sizing: (row.sizing_metadata as OrderSizingMetadata | null) ?? null,
    orderCode: row.order_code,
  });

  return NextResponse.json(scene);
}

/** Dev mode has no template join — minimal stub for placement/layout */
function stubTemplateFromOrder(templateId: string): DesignTemplate {
  return {
    id: templateId,
    name: "Design",
    slug: "design",
    slot_count: 24,
    configuration_rules: {
      product_type: "bracelet",
      layout: "radial",
      length_options: [],
      fill_mode: "sequential",
    },
    is_active: true,
    created_at: new Date().toISOString(),
    description: null,
  };
}
