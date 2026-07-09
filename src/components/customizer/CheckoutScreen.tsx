"use client";

import Link from "next/link";
import { STORE_NAME } from "@/lib/branding";
import { formatCurrency } from "@/lib/pricing";

interface CheckoutScreenProps {
  orderCode: string;
  filledCount: number;
  totalSlots: number;
  templateName: string;
  wristLengthLabel?: string | null;
  totalCents: number;
  onStartOver: () => void;
}

export function CheckoutScreen({
  orderCode,
  filledCount,
  totalSlots,
  templateName,
  wristLengthLabel,
  totalCents,
  onStartOver,
}: CheckoutScreenProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gem-ink px-6 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-gem-gold">
        {STORE_NAME}
      </p>
      <p className="mt-4 text-xs uppercase tracking-[0.35em] text-gem-mist/50">
        Order Locked
      </p>
      <h1 className="mt-4 font-display text-5xl text-gem-mist">#{orderCode}</h1>
      <p className="mt-6 max-w-xs text-base leading-relaxed text-gem-mist/70">
        Show this screen to your store cashier to complete payment and send your
        design to the studio.
      </p>

      <div className="mt-8 w-full max-w-xs rounded-xl border border-white/10 bg-gem-slate p-4 text-left text-sm">
        <p className="text-gem-mist/50">Template</p>
        <p className="text-gem-mist">{templateName}</p>
        {wristLengthLabel && (
          <>
            <p className="mt-3 text-gem-mist/50">Wrist length</p>
            <p className="text-gem-mist">{wristLengthLabel}</p>
          </>
        )}
        <p className="mt-3 text-gem-mist/50">Beads placed</p>
        <p className="text-gem-mist">
          {filledCount} / {totalSlots}
        </p>
        <p className="mt-3 text-gem-mist/50">Amount due</p>
        <p className="font-display text-2xl text-gem-gold">
          {formatCurrency(totalCents)}
        </p>
      </div>

      <div className="mt-6 w-full max-w-xs rounded-xl border border-gem-gold/30 bg-gem-gold/5 p-4 text-left text-sm">
        <p className="text-xs uppercase tracking-wider text-gem-gold">
          Next step
        </p>
        <p className="mt-1 text-gem-mist/80">
          Cashier marks this order paid on the POS screen.
        </p>
        <Link
          href="/pos"
          className="mt-3 inline-block text-sm font-medium text-gem-gold underline underline-offset-4"
        >
          Open POS →
        </Link>
      </div>

      <button
        type="button"
        onClick={onStartOver}
        className="mt-10 text-sm text-gem-mist/50 underline underline-offset-4 hover:text-gem-mist"
      >
        Start a new design
      </button>
    </main>
  );
}
