"use client";

import { QRCodeSVG } from "qrcode.react";
import { getCustomizeUrl, STORE_NAME, STORE_TAGLINE } from "@/lib/branding";

export function CounterQrDisplay() {
  const customizeUrl = getCustomizeUrl();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gem-ink px-6 py-10 print:bg-white print:px-4">
      <div className="w-full max-w-md text-center print:max-w-none">
        <p className="text-xs uppercase tracking-[0.35em] text-gem-gold print:text-black">
          {STORE_NAME}
        </p>
        <h1 className="mt-3 font-display text-3xl text-gem-mist print:text-black sm:text-4xl">
          Scan to design
        </h1>
        <p className="mt-2 text-sm text-gem-mist/60 print:text-gray-600">
          {STORE_TAGLINE}
        </p>

        <div className="mx-auto mt-10 inline-block rounded-2xl border border-white/10 bg-white p-6 print:border-gray-200 print:shadow-none">
          <QRCodeSVG
            value={customizeUrl}
            size={280}
            level="M"
            includeMargin
            className="h-auto w-full max-w-[280px]"
          />
        </div>

        <p className="mt-6 break-all font-mono text-sm text-gem-mist/50 print:text-gray-500">
          {customizeUrl}
        </p>

        <p className="mt-8 text-xs text-gem-mist/40 print:text-gray-400">
          Point your phone camera here · no app download needed
        </p>

        <button
          type="button"
          onClick={() => window.print()}
          className="mt-8 rounded-xl border border-white/15 px-6 py-3 text-sm text-gem-mist transition hover:border-white/30 print:hidden"
        >
          Print for counter
        </button>
      </div>
    </main>
  );
}
