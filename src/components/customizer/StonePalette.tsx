"use client";

import type { Component } from "@/types/database";

interface StonePaletteProps {
  components: Component[];
  selectedId: string | null;
  onSelect: (component: Component) => void;
  disabled?: boolean;
}

export function StonePalette({
  components,
  selectedId,
  onSelect,
  disabled = false,
}: StonePaletteProps) {
  const paletteItems = components.filter(
    (c) => c.component_type === "bead" || c.component_type === "spacer"
  );

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {paletteItems.map((component) => {
        const isSelected = selectedId === component.id;

        return (
          <button
            key={component.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(component)}
            className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition ${
              isSelected
                ? "border-gem-gold bg-gem-gold/10"
                : "border-white/10 bg-gem-slate hover:border-white/25"
            } ${disabled ? "opacity-40" : ""}`}
          >
            <span
              className="bead-sphere h-10 w-10 rounded-full"
              style={{ backgroundColor: component.display_color }}
            />
            <span className="text-xs text-gem-mist/80">{component.name}</span>
          </button>
        );
      })}
    </div>
  );
}
