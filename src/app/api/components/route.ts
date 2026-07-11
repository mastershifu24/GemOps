import { NextResponse } from "next/server";
import {
  createDevComponent,
  listDevComponents,
} from "@/lib/dev-components";
import { isDevMode } from "@/lib/dev-orders";
import { requireStaffSession } from "@/lib/supabase/route-auth";
import type { ComponentType } from "@/types/database";
import type { Database, Json } from "@/types/supabase";

type ComponentInsert = Database["public"]["Tables"]["components"]["Insert"];

interface CreateComponentBody {
  name: string;
  component_type: ComponentType;
  sku?: string;
  display_color?: string;
  unit_cost_cents?: number;
}

export async function GET() {
  if (isDevMode()) {
    return NextResponse.json({
      components: listDevComponents(),
      persisted: false,
    });
  }

  const auth = await requireStaffSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { data, error } = await auth.db
    .from("components")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ components: data, persisted: true });
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateComponentBody;

  if (!body.name?.trim() || !body.component_type) {
    return NextResponse.json(
      { error: "name and component_type are required" },
      { status: 400 }
    );
  }

  if (isDevMode()) {
    const component = createDevComponent({
      name: body.name.trim(),
      component_type: body.component_type,
      sku: body.sku?.trim() || null,
      display_color: body.display_color ?? "#9ca3af",
      spline_asset_url: null,
      unit_cost_cents: body.unit_cost_cents ?? 0,
      configuration_rules: {},
    });
    return NextResponse.json({ ...component, persisted: false });
  }

  const auth = await requireStaffSession();
  if ("response" in auth) {
    return auth.response;
  }

  const payload: ComponentInsert = {
    name: body.name.trim(),
    component_type: body.component_type,
    sku: body.sku?.trim() || null,
    display_color: body.display_color ?? "#9ca3af",
    unit_cost_cents: body.unit_cost_cents ?? 0,
    configuration_rules: {} as Json,
    is_active: true,
  };

  const { data, error } = await auth.db
    .from("components")
    .insert(payload)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ...data, persisted: true });
}
