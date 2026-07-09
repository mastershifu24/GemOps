"use client";

export type StrandCount = 1 | 2;

interface StrandCountToggleProps {
  value: StrandCount;
  onChange: (count: StrandCount) => void;
}

export function StrandCountToggle({ value, onChange }: StrandCountToggleProps) {
  return (
    <div>
      <p className="mb-2 text-xs text-gem-mist/50">Strands</p>
      <p className="mb-2 text-[10px] text-gem-mist/40">
        Toggle single or double — build on the cord line under the ring, or tap the ring directly.
      </p>
      <div className="flex gap-1 rounded-xl border border-white/10 bg-gem-slate p-1">
        {([1, 2] as const).map((count) => {
          const isActive = value === count;
          return (
            <button
              key={count}
              type="button"
              onClick={() => onChange(count)}
              className={`flex-1 rounded-lg px-3 py-2.5 text-center text-sm transition ${
                isActive
                  ? "bg-gem-gold text-gem-ink"
                  : "text-gem-mist/70 hover:text-gem-mist"
              }`}
            >
              <span className="block font-medium">
                {count === 1 ? "Single" : "Double"}
              </span>
              <span
                className={`mt-0.5 block text-[10px] ${
                  isActive ? "text-gem-ink/70" : "text-gem-mist/40"
                }`}
              >
                {count === 1 ? "1 loop" : "2 loops"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
