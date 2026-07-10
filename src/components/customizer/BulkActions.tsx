"use client";

interface BulkActionsProps {
  patternMode: boolean;
  onPatternAlternator: () => void;
  onFillRemaining: () => void;
  disabled?: boolean;
  hasSelection: boolean;
  remainingCount: number;
  showPatternAlternator?: boolean;
}

export function BulkActions({
  patternMode,
  onPatternAlternator,
  onFillRemaining,
  disabled = false,
  hasSelection,
  remainingCount,
  showPatternAlternator = true,
}: BulkActionsProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {showPatternAlternator && (
        <button
          type="button"
          disabled={disabled || remainingCount === 0}
          onClick={onPatternAlternator}
          className={`flex-1 rounded-xl border px-4 py-3 text-sm transition ${
            patternMode
              ? "border-gem-gold bg-gem-gold/15 text-gem-gold"
              : "border-white/15 bg-gem-slate text-gem-mist hover:border-white/30"
          } disabled:opacity-40`}
        >
          {patternMode
            ? "Tap 2nd stone for A/B pattern"
            : "Pattern Alternator"}
        </button>
      )}
      <button
        type="button"
        disabled={disabled || !hasSelection || remainingCount === 0}
        onClick={onFillRemaining}
        className="flex-1 rounded-xl border border-white/15 bg-gem-slate px-4 py-3 text-sm text-gem-mist transition hover:border-white/30 disabled:opacity-40"
      >
        Fill all beads ({remainingCount})
      </button>
    </div>
  );
}
