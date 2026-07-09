"use client";

import { BEAD_SHAPE_OPTIONS, BEAD_SIZE_OPTIONS_MM } from "@/lib/bead-sizes";
import type { BeadShape } from "@/types/database";

interface BeadSizePickerProps {
  selectedMm: number;
  selectedShape: BeadShape;
  onSizeChange: (mm: number) => void;
  onShapeChange: (shape: BeadShape) => void;
}

export function BeadSizePicker({
  selectedMm,
  selectedShape,
  onSizeChange,
  onShapeChange,
}: BeadSizePickerProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-gem-gold">
          Bead Size
        </p>
        <p className="mt-1 text-xs text-gem-mist/50">
          Mix sizes on the same piece — pick size before each bead.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {BEAD_SIZE_OPTIONS_MM.map((mm) => (
            <button
              key={mm}
              type="button"
              onClick={() => onSizeChange(mm)}
              className={`rounded-lg border px-3 py-1.5 text-sm tabular-nums transition ${
                selectedMm === mm
                  ? "border-gem-gold bg-gem-gold/15 text-gem-gold"
                  : "border-white/10 bg-gem-slate text-gem-mist/70 hover:border-white/25"
              }`}
            >
              {mm}mm
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-gem-gold">
          Bead Shape
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {BEAD_SHAPE_OPTIONS.map((shape) => (
            <button
              key={shape.id}
              type="button"
              onClick={() => onShapeChange(shape.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                selectedShape === shape.id
                  ? "border-gem-gold bg-gem-gold/15 text-gem-gold"
                  : "border-white/10 bg-gem-slate text-gem-mist/70 hover:border-white/25"
              }`}
            >
              {shape.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
