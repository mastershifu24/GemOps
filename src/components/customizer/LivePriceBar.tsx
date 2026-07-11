"use client";

import { formatCurrency } from "@/lib/pricing";

interface LivePriceBarProps {
  totalCents: number;
  filledCount: number;
}

export function LivePriceBar({ totalCents, filledCount }: LivePriceBarProps) {
  if (filledCount === 0) {
    return (
      <div className="border-t border-white/10 bg-gem-slate/95 px-4 py-2.5 backdrop-blur-sm">
        <p className="text-center text-xs text-gem-mist/50">
          Tap stones below — price updates live
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-gem-gold/25 bg-gem-slate/95 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 text-left">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gem-mist/50">
            Your design
          </p>
          <p className="text-xs text-gem-mist/70">
            {filledCount} {filledCount === 1 ? "stone" : "stones"} placed
          </p>
        </div>
        <p className="shrink-0 font-display text-2xl tabular-nums text-gem-gold">
          {formatCurrency(totalCents)}
        </p>
      </div>
    </div>
  );
}
