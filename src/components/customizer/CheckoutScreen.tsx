"use client";

import { QRCodeSVG } from "qrcode.react";
import {
  getOrderProofCode,
  getPickupEstimateLabel,
  STORE_NAME,
} from "@/lib/branding";
import { formatCurrency } from "@/lib/pricing";

interface CheckoutScreenProps {
  orderCode: string;
  filledCount: number;
  totalSlots: number;
  templateName: string;
  wristLengthLabel?: string | null;
  totalCents: number;
  arFitConfirmed?: boolean;
  onStartOver: () => void;
}

export function CheckoutScreen({
  orderCode,
  filledCount,
  totalSlots,
  templateName,
  wristLengthLabel,
  totalCents,
  arFitConfirmed = false,
  onStartOver,
}: CheckoutScreenProps) {
  const displayCode = orderCode.startsWith("#") ? orderCode : `#${orderCode}`;
  const pickupLabel = getPickupEstimateLabel();
  const qrValue = getOrderProofCode(orderCode);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gem-ink px-6 py-10 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-gem-gold">
        {STORE_NAME}
      </p>
      <p className="mt-4 text-xs uppercase tracking-[0.35em] text-gem-mist/50">
        Order locked
      </p>
      <h1 className="mt-4 font-display text-5xl text-gem-mist">{displayCode}</h1>
      <p className="mt-4 max-w-xs text-base leading-relaxed text-gem-mist/70">
        Show this screen to your cashier to pay. Screenshot it — this is your
        receipt.
      </p>

      <div className="mt-8 inline-block rounded-2xl border border-white/10 bg-white p-4">
        <QRCodeSVG value={qrValue} size={160} level="M" includeMargin />
      </div>
      <p className="mt-2 font-mono text-xs text-gem-mist/45">{qrValue}</p>

      <div className="mt-8 w-full max-w-xs rounded-xl border border-white/10 bg-gem-slate p-4 text-left text-sm">
        <p className="text-gem-mist/50">Template</p>
        <p className="text-gem-mist">{templateName}</p>
        {wristLengthLabel && (
          <>
            <p className="mt-3 text-gem-mist/50">Size</p>
            <p className="text-gem-mist">{wristLengthLabel}</p>
          </>
        )}
        {arFitConfirmed && (
          <>
            <p className="mt-3 text-gem-mist/50">Try-on</p>
            <p className="text-gem-gold">Fit confirmed in store ✓</p>
          </>
        )}
        <p className="mt-3 text-gem-mist/50">Stones</p>
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
          Pickup
        </p>
        <p className="mt-1 font-medium text-gem-mist">{pickupLabel}</p>
        <p className="mt-2 text-xs leading-relaxed text-gem-mist/60">
          We&apos;ll start building once payment is complete at the counter.
        </p>
      </div>

      <div className="mt-6 w-full max-w-xs rounded-xl border border-white/10 bg-gem-slate/60 p-4 text-left text-sm">
        <p className="text-xs uppercase tracking-wider text-gem-mist/50">
          Next step
        </p>
        <p className="mt-1 text-gem-mist/80">
          Take this phone to the cashier. They&apos;ll find your order on the
          POS screen and mark it paid.
        </p>
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
