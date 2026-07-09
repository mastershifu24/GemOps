"use client";

import type { BraceletLengthOption } from "@/types/database";
import { formatLengthLabel } from "@/lib/template-layout";

interface BraceletLengthPickerProps {
  options: BraceletLengthOption[];
  selectedSlotCount: number;
  onChange: (option: BraceletLengthOption) => void;
  label?: string;
  disabled?: boolean;
}

function optionKey(option: BraceletLengthOption): string {
  return `${option.label}-${option.slot_count}`;
}

function ChevronDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BraceletLengthPicker({
  options,
  selectedSlotCount,
  onChange,
  label = "Size",
  disabled = false,
}: BraceletLengthPickerProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-gem-gold">
        {label}
      </p>
      <p className="mt-1 text-xs text-gem-mist/50">
        Pick the size that fits — the ring adjusts to match.
      </p>

      <div className="relative mt-2">
        <select
          value={selectedSlotCount}
          disabled={disabled}
          onChange={(e) => {
            const count = Number(e.target.value);
            const option = options.find((o) => o.slot_count === count);
            if (option) onChange(option);
          }}
          className="w-full appearance-none rounded-xl border border-white/10 bg-gem-slate py-3 pl-4 pr-11 text-sm text-gem-mist transition hover:border-white/20 focus:border-gem-gold focus:outline-none focus:ring-1 focus:ring-gem-gold disabled:opacity-40"
          aria-label="Wrist length"
        >
          {options.map((option) => (
            <option
              key={optionKey(option)}
              value={option.slot_count}
              className="bg-gem-slate text-gem-mist"
            >
              {formatLengthLabel(option)}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gem-mist/50">
          <ChevronDownIcon />
        </span>
      </div>
    </div>
  );
}
