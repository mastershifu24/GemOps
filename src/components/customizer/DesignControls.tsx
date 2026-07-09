"use client";

import { BraceletLengthPicker } from "@/components/customizer/BraceletLengthPicker";
import { BeadSizePicker } from "@/components/customizer/BeadSizePicker";
import { TemplateToggle } from "@/components/customizer/TemplateToggle";
import type { BeadShape, BraceletLengthOption, DesignTemplate } from "@/types/database";

interface DesignControlsProps {
  templates: DesignTemplate[];
  activeTemplate: DesignTemplate;
  onTemplateChange: (template: DesignTemplate) => void;
  lengthOptions: BraceletLengthOption[] | null;
  selectedLength: BraceletLengthOption | null;
  activeSlotCount: number;
  lengthLabel: string;
  onLengthChange: (option: BraceletLengthOption) => void;
  selectedBeadMm: number;
  selectedBeadShape: BeadShape;
  onBeadSizeChange: (mm: number) => void;
  onBeadShapeChange: (shape: BeadShape) => void;
  onClearAll: () => void;
  filledCount: number;
}

export function DesignControls({
  templates,
  activeTemplate,
  onTemplateChange,
  lengthOptions,
  selectedLength,
  activeSlotCount,
  lengthLabel,
  onLengthChange,
  selectedBeadMm,
  selectedBeadShape,
  onBeadSizeChange,
  onBeadShapeChange,
  onClearAll,
  filledCount,
}: DesignControlsProps) {
  return (
    <section className="rounded-xl border border-white/10 bg-gem-slate/60 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-gem-gold">
        Build Your Piece
      </p>
      <p className="mt-1 text-xs text-gem-mist/50">
        Type · length · bead size — all on one screen.
      </p>

      <div className="mt-4 space-y-5">
        <div>
          <p className="mb-2 text-xs text-gem-mist/50">Jewelry type</p>
          <TemplateToggle
            templates={templates}
            activeTemplateId={activeTemplate.id}
            onChange={onTemplateChange}
          />
        </div>

        {lengthOptions && selectedLength && (
          <BraceletLengthPicker
            options={lengthOptions}
            selectedSlotCount={activeSlotCount}
            onChange={onLengthChange}
            label={lengthLabel}
          />
        )}

        <BeadSizePicker
          selectedMm={selectedBeadMm}
          selectedShape={selectedBeadShape}
          onSizeChange={onBeadSizeChange}
          onShapeChange={onBeadShapeChange}
        />

        <button
          type="button"
          onClick={onClearAll}
          disabled={filledCount === 0}
          className="w-full rounded-xl border border-white/15 py-2.5 text-sm text-gem-mist/80 transition hover:border-red-400/40 hover:text-red-300 disabled:opacity-40"
        >
          Clear all beads
        </button>
      </div>
    </section>
  );
}
