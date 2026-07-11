"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StaffSignOutButton } from "@/components/auth/StaffSignOutButton";
import { STORE_NAME } from "@/lib/branding";
import { formatSizingSummary, orderMatchesSearch } from "@/lib/format-order";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { formatCurrency, type PaymentMethod } from "@/lib/pricing";
import type { Order } from "@/types/database";

const PAYMENT_OPTIONS: PaymentMethod[] = ["cash", "card", "other"];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PosDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [persisted, setPersisted] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<
    Record<string, PaymentMethod>
  >({});
  const [searchQuery, setSearchQuery] = useState("");

  const pendingOrders = orders.filter((o) => o.status === "pending_payment");
  const visibleOrders = pendingOrders.filter((o) =>
    orderMatchesSearch(o, searchQuery)
  );

  const getPaymentMethod = (orderId: string): PaymentMethod =>
    paymentMethods[orderId] ?? "card";

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setOrders(data.orders ?? []);
      setPersisted(data.persisted !== false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    if (!isSupabaseConfigured()) {
      const interval = setInterval(fetchOrders, 3000);
      return () => clearInterval(interval);
    }

    const supabase = createClient();
    if (!supabase) {
      const interval = setInterval(fetchOrders, 3000);
      return () => clearInterval(interval);
    }

    const channel = supabase
      .channel("pos-order-queue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const handleMarkPaid = async (order: Order) => {
    setProcessingId(order.id);
    setError(null);

    const method = getPaymentMethod(order.id);
    const amount = order.total_cents ?? 0;

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "in_studio",
          payment_method: method,
          amount_paid_cents: amount,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to update order");
      }

      const updated = await res.json();
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, ...updated } : o))
      );
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update order");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelOrder = async (order: Order) => {
    if (
      !window.confirm(
        `Cancel order #${order.order_code}? This cannot be undone.`
      )
    ) {
      return;
    }

    setProcessingId(order.id);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to cancel order");
      }

      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel order");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gem-ink">
      <header className="border-b border-white/10 bg-gem-slate px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gem-gold">
              {STORE_NAME} POS
            </p>
            <h1 className="mt-1 font-display text-2xl text-gem-mist">
              Order Queue
            </h1>
            <Link
              href="/qr"
              className="mt-2 inline-block text-xs text-gem-gold underline underline-offset-4"
            >
              Open customer QR →
            </Link>
          </div>
          <div className="text-right text-sm">
            <p className="text-gem-mist/50">Pending</p>
            <p className="text-2xl font-semibold text-gem-mist">
              {pendingOrders.length}
            </p>
            <div className="mt-2">
              <StaffSignOutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {!persisted && (
          <p className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Dev mode — orders stored in memory. Add Supabase env vars for
            production persistence.
          </p>
        )}

        {error && (
          <p className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-gem-mist/50">Loading queue…</p>
        ) : pendingOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 py-16 text-center">
            <p className="font-display text-xl text-gem-mist/60">
              Waiting for orders
            </p>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gem-mist/40">
              Leave this tab open. When a customer finalizes on{" "}
              <a href="/customize" className="text-gem-gold underline">
                /customize
              </a>
              , their order appears here automatically.
            </p>
            <p className="mt-4 text-xs text-gem-mist/30">
              Demo tip: open this page before finalizing on the phone
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order code…"
                className="w-full rounded-xl border border-white/10 bg-gem-slate px-4 py-3 text-sm text-gem-mist placeholder:text-gem-mist/40"
              />
            </div>

            {visibleOrders.length === 0 ? (
              <p className="text-center text-sm text-gem-mist/50">
                No orders match &ldquo;{searchQuery}&rdquo;
              </p>
            ) : (
          <ul className="space-y-4">
            {visibleOrders.map((order) => {
              const sizingLine = formatSizingSummary(order.sizing_metadata);
              return (
              <li
                key={order.id}
                className="flex flex-col gap-4 rounded-xl border border-white/10 bg-gem-slate p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-display text-3xl text-gem-gold">
                    #{order.order_code}
                  </p>
                  <p className="mt-1 font-display text-xl text-gem-mist">
                    {formatCurrency(order.total_cents ?? 0)}
                  </p>
                  <p className="mt-1 text-sm text-gem-mist/60">
                    {order.filled_slot_count} / {order.total_slot_count} beads ·{" "}
                    {formatTime(order.created_at)}
                  </p>
                  {sizingLine && (
                    <p className="mt-1 text-sm text-gem-gold/80">{sizingLine}</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
                  <div className="flex gap-1">
                    {PAYMENT_OPTIONS.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() =>
                          setPaymentMethods((prev) => ({
                            ...prev,
                            [order.id]: method,
                          }))
                        }
                        className={`rounded-lg px-3 py-1.5 text-xs capitalize transition ${
                          getPaymentMethod(order.id) === method
                            ? "bg-gem-gold text-gem-ink"
                            : "border border-white/15 text-gem-mist/70 hover:border-white/30"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={processingId === order.id}
                    onClick={() => handleMarkPaid(order)}
                    className="rounded-xl bg-gem-gold px-6 py-3 text-sm font-semibold uppercase tracking-wider text-gem-ink transition hover:bg-gem-gold/90 disabled:opacity-50"
                  >
                    {processingId === order.id
                      ? "Processing…"
                      : "Mark Paid & Send to Studio"}
                  </button>
                  <button
                    type="button"
                    disabled={processingId === order.id}
                    onClick={() => handleCancelOrder(order)}
                    className="text-center text-xs text-gem-mist/40 underline underline-offset-4 transition hover:text-red-300/80"
                  >
                    Cancel order
                  </button>
                  <p className="text-center text-xs text-gem-mist/30 sm:text-right">
                    Then check{" "}
                    <a href="/admin" className="text-gem-gold underline">
                      /admin
                    </a>
                  </p>
                </div>
              </li>
            );
            })}
          </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}
