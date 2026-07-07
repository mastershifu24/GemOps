"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  buildAssemblyScript,
  buildSampleLayout,
  generateOrderCode,
  SEED_TEMPLATES,
} from "@/lib/constants";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { DesignTemplate, Order } from "@/types/database";

type DemoPhase = "idle" | "ordered" | "paid" | "done";

export function DemoWalkthrough() {
  const [templateId, setTemplateId] = useState(SEED_TEMPLATES[0].id);
  const [templateName, setTemplateName] = useState(SEED_TEMPLATES[0].name);
  const [slotCount, setSlotCount] = useState(24);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleLayout = buildSampleLayout(undefined, slotCount);

  const loadTemplate = useCallback(async () => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    if (!supabase) return;

    const { data } = await supabase
      .from("design_templates")
      .select("id, name, slot_count")
      .eq("slug", "classic-24")
      .single();

    if (data) {
      const template = data as DesignTemplate;
      setTemplateId(template.id);
      setTemplateName(template.name);
      setSlotCount(template.slot_count);
    }
  }, []);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const refreshOrder = useCallback(async (orderId: string) => {
    const res = await fetch("/api/orders");
    if (!res.ok) return;
    const data = await res.json();
    const found = (data.orders as Order[]).find((o) => o.id === orderId);
    if (found) {
      setActiveOrder(found);
      if (found.status === "pending_payment") setPhase("ordered");
      else if (found.status === "in_studio") setPhase("paid");
      else if (found.status === "completed") setPhase("done");
    }
  }, []);

  const handleCreateSample = async () => {
    setLoading(true);
    setError(null);

    const orderCode = generateOrderCode();
    const script = buildAssemblyScript(sampleLayout);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_code: orderCode,
          design_template_id: templateId,
          slot_layout: sampleLayout,
          total_slot_count: slotCount,
          filled_slot_count: slotCount,
          assembly_script: script,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not create sample order");
      }

      const created = await res.json();
      setActiveOrder({
        id: created.id,
        order_code: created.order_code,
        design_template_id: templateId,
        slot_layout: sampleLayout,
        status: "pending_payment",
        assembly_script: script,
        total_slot_count: slotCount,
        filled_slot_count: slotCount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        paid_at: null,
        completed_at: null,
      });
      setPhase("ordered");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!activeOrder) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${activeOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_studio" }),
      });

      if (!res.ok) throw new Error("Could not mark paid");
      await refreshOrder(activeOrder.id);
      setPhase("paid");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!activeOrder) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${activeOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      if (!res.ok) throw new Error("Could not complete order");
      await refreshOrder(activeOrder.id);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setActiveOrder(null);
    setPhase("idle");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gem-ink px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-gem-gold">
            GemOps Demo
          </p>
          <h1 className="mt-2 font-display text-3xl text-gem-mist">
            Full store flow, one screen
          </h1>
          <p className="mt-2 text-sm text-gem-mist/60">
            No second device needed. Click through customer → cashier → studio.
          </p>
        </div>

        {error && (
          <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <ol className="mt-8 space-y-4">
          {/* Step 1 */}
          <li
            className={`rounded-xl border p-5 ${
              phase === "idle"
                ? "border-gem-gold/50 bg-gem-gold/5"
                : "border-white/10 bg-gem-slate opacity-80"
            }`}
          >
            <p className="text-xs uppercase tracking-wider text-gem-gold">
              Step 1 · Customer
            </p>
            <p className="mt-2 text-gem-mist">
              A customer designs a 24-bead Onyx / Moonstone bracelet and
              finalizes.
            </p>

            {phase === "idle" ? (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCreateSample}
                  className="flex-1 rounded-xl bg-gem-gold py-3 text-sm font-semibold text-gem-ink disabled:opacity-50"
                >
                  {loading ? "Creating…" : "Create sample order"}
                </button>
                <Link
                  href="/customize"
                  className="flex-1 rounded-xl border border-white/15 py-3 text-center text-sm text-gem-mist hover:border-white/30"
                >
                  Or design your own →
                </Link>
              </div>
            ) : (
              <p className="mt-3 font-display text-2xl text-gem-gold">
                #{activeOrder?.order_code} · {templateName}
              </p>
            )}
          </li>

          {/* Step 2 */}
          <li
            className={`rounded-xl border p-5 ${
              phase === "ordered"
                ? "border-gem-gold/50 bg-gem-gold/5"
                : "border-white/10 bg-gem-slate"
            } ${phase === "idle" ? "opacity-40" : ""}`}
          >
            <p className="text-xs uppercase tracking-wider text-gem-gold">
              Step 2 · Cashier
            </p>
            <p className="mt-2 text-gem-mist">
              Cashier sees the order and marks it paid.
            </p>

            {phase === "ordered" && activeOrder && (
              <button
                type="button"
                disabled={loading}
                onClick={handleMarkPaid}
                className="mt-4 w-full rounded-xl bg-gem-gold py-3 text-sm font-semibold text-gem-ink disabled:opacity-50"
              >
                Mark Paid & Send to Studio
              </button>
            )}
            {(phase === "paid" || phase === "done") && (
              <p className="mt-3 text-sm text-gem-mist/50">✓ Sent to studio</p>
            )}
          </li>

          {/* Step 3 */}
          <li
            className={`rounded-xl border p-5 ${
              phase === "paid"
                ? "border-gem-gold/50 bg-gem-gold/5"
                : "border-white/10 bg-gem-slate"
            } ${phase === "idle" || phase === "ordered" ? "opacity-40" : ""}`}
          >
            <p className="text-xs uppercase tracking-wider text-gem-gold">
              Step 3 · Studio
            </p>
            <p className="mt-2 text-gem-mist">
              Bench stringer reads the recipe and builds it.
            </p>

            {(phase === "paid" || phase === "done") && activeOrder && (
              <>
                <div className="mt-4 rounded-lg bg-gem-ink p-4">
                  <p className="font-mono text-base leading-relaxed text-gem-mist sm:text-lg">
                    {activeOrder.assembly_script}
                  </p>
                </div>
                {phase === "paid" && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleComplete}
                    className="mt-4 w-full rounded-xl border border-white/15 py-3 text-sm text-gem-mist hover:border-white/30 disabled:opacity-50"
                  >
                    Mark Assembly Complete
                  </button>
                )}
                {phase === "done" && (
                  <p className="mt-3 text-sm text-gem-mist/50">✓ Order complete</p>
                )}
              </>
            )}
          </li>
        </ol>

        {phase === "done" && (
          <button
            type="button"
            onClick={handleReset}
            className="mt-6 w-full text-sm text-gem-mist/50 underline underline-offset-4"
          >
            Run demo again
          </button>
        )}

        <p className="mt-8 text-center text-xs text-gem-mist/40">
          In a real store, customers only see{" "}
          <Link href="/customize" className="text-gem-gold underline">
            /customize
          </Link>
          . Staff use separate POS and admin screens.
        </p>
      </div>
    </div>
  );
}
