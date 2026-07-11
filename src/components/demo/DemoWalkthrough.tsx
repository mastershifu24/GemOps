"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SplineViewer } from "@/components/customizer/SplineViewer";
import { AssemblyScriptCard } from "@/components/studio/AssemblyScriptCard";
import {
  buildAssemblyScript,
  buildSampleLayout,
  generateOrderCode,
  SEED_TEMPLATES,
} from "@/lib/constants";
import { STORE_NAME, STORE_TAGLINE } from "@/lib/branding";
import { formatCurrency } from "@/lib/pricing";
import {
  getDefaultCustomizerTemplate,
  getPreviewCenterLabel,
  getProductType,
  getTemplateLayout,
} from "@/lib/template-layout";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { DesignTemplate, Order, SlotState } from "@/types/database";

type DemoPhase = "idle" | "ordered" | "paid" | "done";

const PHASES = [
  { id: "idle" as const, label: "Design", step: 1 },
  { id: "ordered" as const, label: "Cashier", step: 2 },
  { id: "paid" as const, label: "Studio", step: 3 },
];

function phaseIndex(phase: DemoPhase): number {
  if (phase === "idle") return 0;
  if (phase === "ordered") return 1;
  if (phase === "paid" || phase === "done") return 2;
  return 0;
}

const DEMO_TEMPLATE =
  SEED_TEMPLATES.find((t) => t.slug === "bracelet-16") ??
  getDefaultCustomizerTemplate(SEED_TEMPLATES);

export function DemoWalkthrough() {
  const [templateId, setTemplateId] = useState(DEMO_TEMPLATE.id);
  const [slotCount, setSlotCount] = useState(DEMO_TEMPLATE.slot_count);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleLayout = buildSampleLayout(undefined, slotCount);
  const demoTemplate = DEMO_TEMPLATE;
  const previewSlots: SlotState[] =
    phase === "idle" ? sampleLayout : (activeOrder?.slot_layout ?? sampleLayout);
  const currentStep = phaseIndex(phase);

  const loadTemplate = useCallback(async () => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    if (!supabase) return;

    const { data } = await supabase
      .from("design_templates")
      .select("id, name, slot_count")
      .eq("slug", "bracelet-16")
      .single();

    if (data) {
      const template = data as DesignTemplate;
      setTemplateId(template.id);
      setSlotCount(template.slot_count);
    }
  }, []);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const refreshOrder = useCallback(async (orderId: string) => {
    const res = await fetch("/api/orders");
    if (res.status === 401) {
      setError(
        "Staff login required for cashier and studio steps. Open /login first, then return here."
      );
      return;
    }
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
        total_cents: created.total_cents ?? 0,
        payment_method: null,
        amount_paid_cents: null,
        sizing_metadata: null,
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
        body: JSON.stringify({
          status: "in_studio",
          payment_method: "card",
          amount_paid_cents: activeOrder.total_cents ?? 0,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) {
          throw new Error(
            "Staff login required. Open /login, then run the demo again for cashier and studio steps."
          );
        }
        throw new Error(body.error ?? "Could not mark paid");
      }
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

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) {
          throw new Error(
            "Staff login required. Open /login, then run the demo again for studio steps."
          );
        }
        throw new Error(body.error ?? "Could not complete order");
      }
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
    <div className="flex min-h-screen flex-col bg-gem-ink">
      <header className="sticky top-0 z-20">
        <SplineViewer
          className="h-[44vh] min-h-[280px] w-full sm:h-[38vh]"
          strand={{
            slots: previewSlots,
            activeSlotIndex: null,
            filledCount:
              phase === "idle"
                ? slotCount
                : activeOrder?.filled_slot_count ?? slotCount,
            totalSlots: slotCount,
            layout: getTemplateLayout(demoTemplate),
            productType: getProductType(demoTemplate),
            previewLabel: getPreviewCenterLabel(demoTemplate),
          }}
        />
      </header>

      <main className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-5">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-gem-gold">
            {STORE_NAME}
          </p>
          <h1 className="mt-2 font-display text-3xl text-gem-mist sm:text-4xl">
            {STORE_TAGLINE}
          </h1>
          <p className="mt-2 text-sm text-gem-mist/50">
            Full store flow · one screen · no second device
          </p>
        </div>

        {/* Progress rail */}
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-2">
          {PHASES.map((p, i) => {
            const done = currentStep > i || phase === "done";
            const active = currentStep === i && phase !== "done";
            return (
              <div key={p.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                      done
                        ? "bg-gem-gold text-gem-ink"
                        : active
                          ? "bg-gem-gold/20 text-gem-gold ring-2 ring-gem-gold"
                          : "bg-gem-slate text-gem-mist/30"
                    }`}
                  >
                    {done && phase !== "idle" && i < currentStep ? "✓" : p.step}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-wider ${
                      active || done ? "text-gem-gold" : "text-gem-mist/30"
                    }`}
                  >
                    {p.label}
                  </span>
                </div>
                {i < PHASES.length - 1 && (
                  <div
                    className={`mx-2 mb-5 h-px flex-1 transition-colors ${
                      currentStep > i ? "bg-gem-gold/60" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {/* Phase content */}
        {phase === "idle" && (
          <section className="flex flex-1 flex-col gap-4">
            <div className="rounded-xl border border-gem-gold/30 bg-gem-gold/5 p-6 text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-gem-gold">
                Step 1
              </p>
              <p className="mt-3 font-display text-xl text-gem-mist">
                Customer finalizes their design
              </p>
              <p className="mt-2 text-sm text-gem-mist/50">
                Tap below to simulate a completed bracelet order
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleCreateSample}
              className="w-full rounded-xl bg-gem-gold py-4 text-sm font-semibold uppercase tracking-wider text-gem-ink transition hover:bg-gem-gold/90 disabled:opacity-50"
            >
              {loading ? "Finalizing…" : "Finalize Sample Layout"}
            </button>

            <Link
              href="/customize"
              className="block text-center text-sm text-gem-mist/50 underline underline-offset-4 hover:text-gem-mist"
            >
              Or open the full customizer →
            </Link>
          </section>
        )}

        {phase === "ordered" && activeOrder && (
          <section className="flex flex-1 flex-col gap-4">
            <div className="rounded-xl border border-white/10 bg-gem-slate p-6 text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-gem-gold">
                Order Locked
              </p>
              <p className="mt-3 font-display text-5xl text-gem-mist">
                #{activeOrder.order_code}
              </p>
              <p className="mt-2 font-display text-2xl text-gem-gold">
                {formatCurrency(activeOrder.total_cents ?? 0)}
              </p>
              <p className="mt-4 text-sm text-gem-mist/50">
                Customer shows this to the cashier
              </p>
            </div>

            <div className="rounded-xl border border-gem-gold/30 bg-gem-gold/5 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-gem-gold">
                Step 2 · Cashier
              </p>
              <p className="mt-2 text-sm text-gem-mist/60">
                Order received — ready for payment
              </p>
              <button
                type="button"
                disabled={loading}
                onClick={handleMarkPaid}
                className="mt-4 w-full rounded-xl bg-gem-gold py-4 text-sm font-semibold uppercase tracking-wider text-gem-ink disabled:opacity-50"
              >
                {loading ? "Processing…" : "Mark Paid & Send to Studio"}
              </button>
            </div>
          </section>
        )}

        {(phase === "paid" || phase === "done") && activeOrder && (
          <section className="flex flex-1 flex-col gap-4">
            <div className="rounded-xl border border-gem-gold/30 bg-gem-gold/5 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-gem-gold">
                Step 3 · Studio
              </p>
              <p className="mt-2 text-sm text-gem-mist/60">
                Assembly recipe for the bench
              </p>
            </div>

            <AssemblyScriptCard
              order={activeOrder}
              processing={loading}
              onMarkComplete={phase === "paid" ? handleComplete : undefined}
            />

            {phase === "done" && (
              <div className="text-center">
                <p className="font-display text-lg text-gem-gold">
                  Strand complete ✦
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-4 text-sm text-gem-mist/50 underline underline-offset-4 hover:text-gem-mist"
                >
                  Run demo again
                </button>
              </div>
            )}
          </section>
        )}

        <p className="mt-auto text-center text-[11px] text-gem-mist/30">
          Production: customers → /customize · staff → /login then /pos & /admin
        </p>
      </main>
    </div>
  );
}
