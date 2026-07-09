import { NextResponse } from "next/server";
import { buildArSceneDescriptor } from "@/lib/ar/scene-descriptor";
import { isDevMode, listDevOrders } from "@/lib/dev-orders";
import { createApiClient } from "@/lib/supabase/api";
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

  const supabase = createApiClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "order_code, design_template_id, slot_layout, sizing_metadata, design_templates(*)"
    )
    .eq("order_code", orderCode)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const template = order.design_templates as unknown as DesignTemplate;
  const slots = order.slot_layout as unknown as SlotAssignment[];

  const scene = buildArSceneDescriptor({
    template,
    slots,
    sizing: (order.sizing_metadata as OrderSizingMetadata | null) ?? null,
    orderCode: order.order_code,
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
