import { NextResponse } from "next/server";
import { deleteDevComponent, updateDevComponent } from "@/lib/dev-components";
import { isDevMode } from "@/lib/dev-orders";
import { createApiClient } from "@/lib/supabase/api";
import type { ComponentType } from "@/types/database";
import type { Database } from "@/types/supabase";

type ComponentUpdate = Database["public"]["Tables"]["components"]["Update"];

interface UpdateComponentBody {
  name?: string;
  component_type?: ComponentType;
  sku?: string | null;
  display_color?: string;
  unit_cost_cents?: number;
  is_active?: boolean;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as UpdateComponentBody;

  if (isDevMode()) {
    const updated = updateDevComponent(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }
    return NextResponse.json({ ...updated, persisted: false });
  }

  const supabase = createApiClient();
  const updates: ComponentUpdate = {
    ...body,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("components")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (isDevMode()) {
    const deleted = deleteDevComponent(id);
    if (!deleted) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, persisted: false });
  }

  const supabase = createApiClient();
  const { error } = await supabase.from("components").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
