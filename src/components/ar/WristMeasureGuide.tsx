"use client";

import { useEffect, useState } from "react";
import {
  MEASURE_GUIDE,
  parseInchesFromLabel,
  recommendLengthOption,
} from "@/lib/ar/sizing";
import type { BraceletLengthOption, ProductType } from "@/types/database";

interface WristMeasureGuideProps {
  productType: ProductType;
  lengthOptions: BraceletLengthOption[] | null;
  currentLength: BraceletLengthOption | null;
  onApplyLength: (option: BraceletLengthOption, measuredInches?: number) => void;
  onClose: () => void;
}

export function WristMeasureGuide({
  productType,
  lengthOptions,
  currentLength,
  onApplyLength,
  onClose,
}: WristMeasureGuideProps) {
  const guide = MEASURE_GUIDE[productType];
  const [inches, setInches] = useState(
    currentLength ? (parseInchesFromLabel(currentLength.label) ?? "") : ""
  );
  const [recommended, setRecommended] = useState<BraceletLengthOption | null>(
    null
  );

  useEffect(() => {
    if (!lengthOptions || inches === "" || typeof inches !== "number") {
      setRecommended(null);
      return;
    }
    if (inches < 4 || inches > 30) {
      setRecommended(null);
      return;
    }
    setRecommended(recommendLengthOption(lengthOptions, inches));
  }, [inches, lengthOptions]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gem-slate p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-gem-gold">
          Size confidence
        </p>
        <h2 className="mt-1 font-display text-2xl text-gem-mist">{guide.title}</h2>
        <p className="mt-2 text-sm text-gem-mist/60">{guide.hint}</p>

        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-gem-mist/80">
          {guide.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        {lengthOptions && lengthOptions.length > 0 && (
          <div className="mt-5">
            <label
              htmlFor="measure-inches"
              className="text-xs text-gem-mist/50"
            >
              Your measurement (inches)
            </label>
            <input
              id="measure-inches"
              type="number"
              min={4}
              max={30}
              step={0.25}
              value={inches}
              onChange={(e) =>
                setInches(
                  e.target.value === ""
                    ? ""
                    : Number.parseFloat(e.target.value)
                )
              }
              className="mt-1 w-full rounded-lg border border-white/10 bg-gem-ink px-3 py-2.5 text-gem-mist"
              placeholder='e.g. 6.5'
            />
            {recommended && typeof inches === "number" && (
              <p className="mt-2 text-sm text-gem-gold">
                Suggested: {recommended.label}
                {recommended.description ? ` · ${recommended.description}` : ""}{" "}
                ({recommended.slot_count} beads)
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {recommended && (
            <button
              type="button"
              onClick={() => {
                onApplyLength(
                  recommended,
                  typeof inches === "number" ? inches : undefined
                );
                onClose();
              }}
              className="flex-1 rounded-xl bg-gem-gold py-2.5 text-sm font-semibold text-gem-ink"
            >
              Use suggested size
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/15 py-2.5 text-sm text-gem-mist"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
