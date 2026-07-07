import type { Component } from "@/types/database";
import { SEED_COMPONENTS } from "@/lib/constants";

const devComponents = new Map<string, Component>(
  SEED_COMPONENTS.map((c) => [c.id, { ...c }])
);

export function listDevComponents(): Component[] {
  return Array.from(devComponents.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export function createDevComponent(
  input: Omit<Component, "id" | "created_at" | "updated_at" | "is_active"> & {
    is_active?: boolean;
  }
): Component {
  const id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const component: Component = {
    id,
    is_active: input.is_active ?? true,
    created_at: now,
    updated_at: now,
    ...input,
  };
  devComponents.set(id, component);
  return component;
}

export function updateDevComponent(
  id: string,
  updates: Partial<Component>
): Component | null {
  const existing = devComponents.get(id);
  if (!existing) return null;

  const updated: Component = {
    ...existing,
    ...updates,
    id: existing.id,
    updated_at: new Date().toISOString(),
  };
  devComponents.set(id, updated);
  return updated;
}

export function deleteDevComponent(id: string): boolean {
  return devComponents.delete(id);
}
