"use client";

interface ArFitConfirmedBannerProps {
  snapshotDataUrl: string | null;
  method: "manual" | "tracking";
  onDismiss: () => void;
  onTryAgain: () => void;
}

export function ArFitConfirmedBanner({
  snapshotDataUrl,
  method,
  onDismiss,
  onTryAgain,
}: ArFitConfirmedBannerProps) {
  return (
    <div className="rounded-xl border border-gem-gold/35 bg-gem-gold/10 p-4">
      <div className="flex gap-4">
        {snapshotDataUrl && (
          <img
            src={snapshotDataUrl}
            alt="Your try-on preview"
            className="h-20 w-20 shrink-0 rounded-lg border border-white/15 object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gem-gold">Fit confirmed</p>
          <p className="mt-1 text-xs leading-relaxed text-gem-mist/75">
            {method === "tracking"
              ? "Placement saved with body tracking. Staff will see this on your order."
              : "You placed the design on your wrist. Staff will see fit was checked in store."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg bg-gem-gold/20 px-3 py-1.5 text-xs text-gem-gold transition hover:bg-gem-gold/30"
            >
              Continue designing
            </button>
            <button
              type="button"
              onClick={onTryAgain}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-gem-mist/70 transition hover:border-gem-gold/30"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
