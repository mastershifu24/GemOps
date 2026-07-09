"use client";

import { useCallback, useEffect, useState } from "react";
import { StaffSignOutButton } from "@/components/auth/StaffSignOutButton";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Component, ComponentType, Order } from "@/types/database";

const COMPONENT_TYPES: ComponentType[] = [
  "bead",
  "spacer",
  "clasp",
  "charm",
  "watch_case",
  "watch_dial",
  "watch_strap",
  "watch_movement",
];

type AdminTab = "studio" | "components";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("studio");
  const [orders, setOrders] = useState<Order[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [persisted, setPersisted] = useState(true);

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<ComponentType>("bead");
  const [newColor, setNewColor] = useState("#9ca3af");
  const [newSku, setNewSku] = useState("");

  const studioOrders = orders.filter((o) => o.status === "in_studio");
  const selectedOrder =
    studioOrders.find((o) => o.id === selectedOrderId) ?? studioOrders[0] ?? null;

  const fetchOrders = useCallback(async () => {
    const res = await fetch("/api/orders");
    if (!res.ok) throw new Error("Failed to load orders");
    const data = await res.json();
    setOrders(data.orders ?? []);
    setPersisted(data.persisted !== false);
  }, []);

  const fetchComponents = useCallback(async () => {
    const res = await fetch("/api/components");
    if (!res.ok) throw new Error("Failed to load components");
    const data = await res.json();
    setComponents(data.components ?? []);
    setPersisted(data.persisted !== false);
  }, []);

  const refresh = useCallback(async () => {
    try {
      await Promise.all([fetchOrders(), fetchComponents()]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load data");
    } finally {
      setLoading(false);
    }
  }, [fetchOrders, fetchComponents]);

  useEffect(() => {
    refresh();

    if (!isSupabaseConfigured()) {
      const interval = setInterval(refresh, 3000);
      return () => clearInterval(interval);
    }

    const supabase = createClient();
    if (!supabase) {
      const interval = setInterval(refresh, 3000);
      return () => clearInterval(interval);
    }

    const channel = supabase
      .channel("admin-order-queue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "components" },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  useEffect(() => {
    if (studioOrders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(studioOrders[0].id);
    }
  }, [studioOrders, selectedOrderId]);

  const handleMarkCompleted = async (order: Order) => {
    setProcessingId(order.id);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to complete order");
      }

      await refresh();
      setSelectedOrderId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete order");
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setError(null);
    try {
      const res = await fetch("/api/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          component_type: newType,
          display_color: newColor,
          sku: newSku.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to add component");
      }

      setNewName("");
      setNewSku("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add component");
    }
  };

  const handleToggleActive = async (component: Component) => {
    setError(null);
    try {
      const res = await fetch(`/api/components/${component.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !component.is_active }),
      });

      if (!res.ok) throw new Error("Failed to update component");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update component");
    }
  };

  const handleDeleteComponent = async (component: Component) => {
    if (!confirm(`Delete ${component.name}?`)) return;

    setError(null);
    try {
      const res = await fetch(`/api/components/${component.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete component");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete component");
    }
  };

  return (
    <div className="min-h-screen bg-gem-ink">
      <header className="border-b border-white/10 bg-gem-slate px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gem-gold">
              GemOps Admin
            </p>
            <h1 className="mt-1 font-display text-2xl text-gem-mist">
              Logistics Command Center
            </h1>
          </div>

          <div className="flex rounded-xl border border-white/10 p-1">
            <button
              type="button"
              onClick={() => setTab("studio")}
              className={`rounded-lg px-4 py-2 text-sm transition ${
                tab === "studio"
                  ? "bg-gem-gold text-gem-ink"
                  : "text-gem-mist/70 hover:text-gem-mist"
              }`}
            >
              Studio Queue ({studioOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("components")}
              className={`rounded-lg px-4 py-2 text-sm transition ${
                tab === "components"
                  ? "bg-gem-gold text-gem-ink"
                  : "text-gem-mist/70 hover:text-gem-mist"
              }`}
            >
              Components ({components.length})
            </button>
          </div>
          <StaffSignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {!persisted && (
          <p className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Dev mode — data stored in memory until Supabase is connected.
          </p>
        )}

        {error && (
          <p className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-gem-mist/50">Loading…</p>
        ) : tab === "studio" ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <h2 className="mb-4 text-xs uppercase tracking-[0.25em] text-gem-gold">
                Incoming Orders
              </h2>

              {studioOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 py-12 text-center">
                  <p className="text-gem-mist/60">No orders in studio yet</p>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gem-mist/40">
                    After the cashier marks an order paid on{" "}
                    <a href="/pos" className="text-gem-gold underline">
                      /pos
                    </a>
                    , it shows up here with the bench recipe.
                  </p>
                  <p className="mt-4 text-xs text-gem-mist/30">
                    Demo order: customize → pos → admin
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {studioOrders.map((order) => (
                    <li key={order.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(order.id)}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                          selectedOrder?.id === order.id
                            ? "border-gem-gold bg-gem-gold/10"
                            : "border-white/10 bg-gem-slate hover:border-white/25"
                        }`}
                      >
                        <span className="font-display text-xl text-gem-gold">
                          #{order.order_code}
                        </span>
                        <span className="mt-1 block text-sm text-gem-mist/50">
                          {order.filled_slot_count} beads · {formatTime(order.created_at)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-xs uppercase tracking-[0.25em] text-gem-gold">
                60-Second Assembly Script
              </h2>

              {selectedOrder ? (
                <div className="rounded-xl border border-white/10 bg-gem-slate p-6">
                  <p className="font-display text-3xl text-gem-gold">
                    #{selectedOrder.order_code}
                  </p>
                  <p className="mt-2 text-sm text-gem-mist/50">
                    {selectedOrder.filled_slot_count} /{" "}
                    {selectedOrder.total_slot_count} slots filled
                  </p>

                  <div className="mt-6 rounded-lg bg-gem-ink p-5">
                    <p className="font-mono text-lg leading-relaxed text-gem-mist sm:text-xl">
                      {selectedOrder.assembly_script ??
                        "No assembly script generated"}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={processingId === selectedOrder.id}
                    onClick={() => handleMarkCompleted(selectedOrder)}
                    className="mt-6 w-full rounded-xl border border-white/15 py-3 text-sm font-medium text-gem-mist transition hover:border-white/30 disabled:opacity-50"
                  >
                    {processingId === selectedOrder.id
                      ? "Marking complete…"
                      : "Mark Assembly Complete"}
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/15 py-12 text-center text-gem-mist/40">
                  Select an order to view its bench recipe
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <h2 className="mb-4 text-xs uppercase tracking-[0.25em] text-gem-gold">
                Add Component
              </h2>

              <form
                onSubmit={handleAddComponent}
                className="space-y-4 rounded-xl border border-white/10 bg-gem-slate p-5"
              >
                <div>
                  <label className="text-xs text-gem-mist/50">Name</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-gem-ink px-3 py-2 text-gem-mist"
                    placeholder="e.g. Turquoise"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-gem-mist/50">Type</label>
                  <select
                    value={newType}
                    onChange={(e) =>
                      setNewType(e.target.value as ComponentType)
                    }
                    className="mt-1 w-full rounded-lg border border-white/10 bg-gem-ink px-3 py-2 text-gem-mist"
                  >
                    {COMPONENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-gem-mist/50">Color</label>
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-white/10 bg-gem-ink"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gem-mist/50">SKU</label>
                    <input
                      value={newSku}
                      onChange={(e) => setNewSku(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-gem-ink px-3 py-2 text-gem-mist"
                      placeholder="BD-TURQ"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-gem-gold py-3 text-sm font-semibold text-gem-ink"
                >
                  Add Component
                </button>
              </form>
            </section>

            <section>
              <h2 className="mb-4 text-xs uppercase tracking-[0.25em] text-gem-gold">
                Component Catalog
              </h2>

              <ul className="space-y-2">
                {components.map((component) => (
                  <li
                    key={component.id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-gem-slate p-3"
                  >
                    <span
                      className="bead-sphere h-8 w-8 shrink-0 rounded-full"
                      style={{ backgroundColor: component.display_color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-gem-mist">{component.name}</p>
                      <p className="text-xs text-gem-mist/40">
                        {component.component_type}
                        {component.sku ? ` · ${component.sku}` : ""}
                        {!component.is_active ? " · inactive" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(component)}
                      className="shrink-0 text-xs text-gem-mist/60 hover:text-gem-mist"
                    >
                      {component.is_active ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteComponent(component)}
                      className="shrink-0 text-xs text-red-400/70 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
