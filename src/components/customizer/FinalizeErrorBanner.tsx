"use client";

interface FinalizeErrorBannerProps {
  orderCode: string;
  message: string;
  onRetry: () => void;
  retrying?: boolean;
}

export function FinalizeErrorBanner({
  orderCode,
  message,
  onRetry,
  retrying = false,
}: FinalizeErrorBannerProps) {
  return (
    <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-4 text-sm text-amber-100">
      <p className="font-medium text-amber-50">Finalize did not complete</p>
      <p className="mt-2 leading-relaxed text-amber-100/90">{message}</p>
      <p className="mt-3 rounded-lg bg-black/20 px-3 py-2 font-display text-2xl text-gem-gold">
        #{orderCode}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-amber-100/70">
        If the success screen never appeared, show this code to the cashier — your
        order may already be in the system. Tap retry only if they cannot find it.
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="mt-4 w-full rounded-xl border border-amber-400/40 py-2.5 text-sm font-medium text-amber-50 transition hover:bg-amber-500/15 disabled:opacity-50"
      >
        {retrying ? "Retrying…" : "Retry Finalize"}
      </button>
    </div>
  );
}
