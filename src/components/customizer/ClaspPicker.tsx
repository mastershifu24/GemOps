"use client";

import type { Component } from "@/types/database";

interface ClaspPickerProps {
  clasps: Component[];
  selectedId: string | null;
  onSelect: (component: Component) => void;
}

export function ClaspPicker({
  clasps,
  selectedId,
  onSelect,
}: ClaspPickerProps) {
  if (clasps.length === 0) return null;

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-gem-gold">
        Clasp
      </p>
      <p className="mt-1 text-xs text-gem-mist/50">
        Tap a clasp — it places at the start of your design.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {clasps.map((clasp) => {
          const isSelected = selectedId === clasp.id;
          return (
            <button
              key={clasp.id}
              type="button"
              onClick={() => onSelect(clasp)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
                isSelected
                  ? "border-gem-gold bg-gem-gold/10"
                  : "border-white/10 bg-gem-slate hover:border-white/25"
              }`}
            >
              <span
                className="bead-sphere h-8 w-8 rounded-md"
                style={{ backgroundColor: clasp.display_color }}
              />
              <span className="text-sm text-gem-mist/80">{clasp.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
