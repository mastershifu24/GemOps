"use client";

import { BraceletLengthPicker } from "@/components/customizer/BraceletLengthPicker";
import { BeadSizePicker } from "@/components/customizer/BeadSizePicker";
import { StrandCountToggle } from "@/components/customizer/StrandCountToggle";
import { TemplateToggle } from "@/components/customizer/TemplateToggle";
import type { BeadShape, BraceletLengthOption, DesignTemplate, StrandCount } from "@/types/database";

interface DesignControlsProps {
  templates: DesignTemplate[];
  activeTemplate: DesignTemplate;
  onTemplateChange: (template: DesignTemplate) => void;
  lengthOptions: BraceletLengthOption[] | null;
  selectedLength: BraceletLengthOption | null;
  activeSlotCount: number;
  perRingSlotCount?: number;
  lengthLabel: string;
  onLengthChange: (option: BraceletLengthOption) => void;
  selectedBeadMm: number;
  selectedBeadShape: BeadShape;
  onBeadSizeChange: (mm: number) => void;
  onBeadShapeChange: (shape: BeadShape) => void;
  onClearAll: () => void;
  filledCount: number;
  onMeasureSize?: () => void;
  onTryAr?: () => void;
  cameraAvailable?: boolean;
  arPreviewUsed?: boolean;
  showStrandToggle?: boolean;
  strandCount?: StrandCount;
  onStrandCountChange?: (count: StrandCount) => void;
}

export function DesignControls({
  templates,
  activeTemplate,
  onTemplateChange,
  lengthOptions,
  selectedLength,
  activeSlotCount,
  perRingSlotCount,
  lengthLabel,
  onLengthChange,
  selectedBeadMm,
  selectedBeadShape,
  onBeadSizeChange,
  onBeadShapeChange,
  onClearAll,
  filledCount,
  onMeasureSize,
  onTryAr,
  cameraAvailable = false,
  arPreviewUsed = false,
  showStrandToggle = false,
  strandCount = 1,
  onStrandCountChange,
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
            selectedSlotCount={perRingSlotCount ?? activeSlotCount}
            onChange={onLengthChange}
            label={lengthLabel}
          />
        )}

        {showStrandToggle && onStrandCountChange && (
          <StrandCountToggle
            value={strandCount}
            onChange={onStrandCountChange}
          />
        )}

        <BeadSizePicker
          selectedMm={selectedBeadMm}
          selectedShape={selectedBeadShape}
          onSizeChange={onBeadSizeChange}
          onShapeChange={onBeadShapeChange}
        />

        {(onMeasureSize || onTryAr) && (
          <div>
            <p className="mb-2 text-xs text-gem-mist/50">Size confidence</p>
            <div className="flex gap-2">
              {onMeasureSize && (
                <button
                  type="button"
                  onClick={onMeasureSize}
                  className="flex-1 rounded-xl border border-gem-gold/40 py-2.5 text-sm text-gem-gold transition hover:bg-gem-gold/10"
                >
                  Measure fit
                </button>
              )}
              {onTryAr && (
                <button
                  type="button"
                  onClick={onTryAr}
                  disabled={!cameraAvailable}
                  className="flex-1 rounded-xl border border-white/15 py-2.5 text-sm text-gem-mist transition hover:border-gem-gold/40 hover:text-gem-gold disabled:opacity-40"
                >
                  {arPreviewUsed ? "Live try-on again" : "Live try-on"}
                </button>
              )}
            </div>
            {!cameraAvailable && onTryAr && (
              <p className="mt-1.5 text-[10px] text-gem-mist/40">
                Use a phone with camera access (Safari or Chrome).
              </p>
            )}
            {cameraAvailable && onTryAr && (
              <p className="mt-1.5 text-[10px] text-gem-mist/40">
                iPhone Safari — hold wrist to front camera; drag or pinch to adjust.
              </p>
            )}
          </div>
        )}

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
