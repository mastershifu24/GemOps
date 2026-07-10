"use client";

import { formatCurrency, PAYMENT_METHOD_LABELS } from "@/lib/pricing";
import { formatSizingSummary } from "@/lib/format-order";
import type { Order } from "@/types/database";

interface AssemblyScriptCardProps {
  order: Order;
  processing?: boolean;
  onMarkComplete?: () => void;
}

export function AssemblyScriptCard({
  order,
  processing = false,
  onMarkComplete,
}: AssemblyScriptCardProps) {
  const sizingLine = formatSizingSummary(order.sizing_metadata);

  return (
    <div className="rounded-xl border border-white/10 bg-gem-slate p-6 print:border-gray-300 print:bg-white print:text-black">
      <p className="font-display text-3xl text-gem-gold print:text-black">
        #{order.order_code}
      </p>
      <p className="mt-2 text-sm text-gem-mist/50 print:text-gray-600">
        {order.filled_slot_count} / {order.total_slot_count} slots ·{" "}
        {formatCurrency(order.total_cents ?? 0)}
        {order.payment_method && (
          <> · paid via {PAYMENT_METHOD_LABELS[order.payment_method]}</>
        )}
      </p>

      {sizingLine && (
        <p className="mt-3 rounded-lg border border-gem-gold/25 bg-gem-gold/5 px-3 py-2 text-sm text-gem-mist print:border-gray-300 print:bg-gray-50 print:text-gray-800">
          <span className="text-xs uppercase tracking-wider text-gem-gold print:text-gray-500">
            Size &amp; fit
          </span>
          <span className="mt-1 block">{sizingLine}</span>
        </p>
      )}

      <div
        id={`assembly-${order.id}`}
        className="mt-6 rounded-lg bg-gem-ink p-5 print:bg-white print:p-0"
      >
        <p className="font-mono text-lg leading-relaxed text-gem-mist sm:text-xl print:text-black">
          {order.assembly_script ?? "No assembly script generated"}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 rounded-xl border border-white/15 py-3 text-sm text-gem-mist transition hover:border-white/30"
        >
          Print recipe
        </button>
        {onMarkComplete && (
          <button
            type="button"
            disabled={processing}
            onClick={onMarkComplete}
            className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-medium text-gem-mist transition hover:border-white/30 disabled:opacity-50"
          >
            {processing ? "Marking complete…" : "Mark Assembly Complete"}
          </button>
        )}
      </div>
    </div>
  );
}
