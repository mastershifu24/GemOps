"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildAssemblyScript,
  countFilledSlots,
  createEmptySlots,
  findNextEmptySlotIndex,
  generateOrderCode,
  SEED_COMPONENTS,
  SEED_TEMPLATES,
  toSlotAssignment,
} from "@/lib/constants";
import { calculateOrderTotalCents, formatCurrency } from "@/lib/pricing";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  formatLengthLabel,
  getDefaultLengthOption,
  getLengthOptions,
  getPreviewCenterLabel,
  getProductType,
  getSizePickerLabel,
  getTemplateLayout,
  isSequentialFill,
  resolveSlotCount,
} from "@/lib/template-layout";
import { StoreHeader } from "@/components/brand/StoreHeader";
import { BulkActions } from "@/components/customizer/BulkActions";
import { CheckoutScreen } from "@/components/customizer/CheckoutScreen";
import { ClaspPicker } from "@/components/customizer/ClaspPicker";
import { DesignControls } from "@/components/customizer/DesignControls";
import { SplineViewer } from "@/components/customizer/SplineViewer";
import { StonePalette } from "@/components/customizer/StonePalette";
import type {
  BeadShape,
  BraceletLengthOption,
  Component,
  DesignTemplate,
  SlotAssignment,
  SlotState,
} from "@/types/database";

type Phase = "designing" | "finalized";

interface PatternDraft {
  stoneA: Component;
  stoneB: Component | null;
}

const INITIAL_TEMPLATE = SEED_TEMPLATES[0];
const INITIAL_LENGTH = getDefaultLengthOption(INITIAL_TEMPLATE);

export function CustomerCustomizer() {
  const [phase, setPhase] = useState<Phase>("designing");
  const [templates, setTemplates] = useState<DesignTemplate[]>(SEED_TEMPLATES);
  const [components, setComponents] = useState<Component[]>(SEED_COMPONENTS);
  const [activeTemplate, setActiveTemplate] =
    useState<DesignTemplate>(INITIAL_TEMPLATE);
  const [selectedLength, setSelectedLength] =
    useState<BraceletLengthOption | null>(INITIAL_LENGTH);
  const [slots, setSlots] = useState<SlotState[]>(() =>
    createEmptySlots(resolveSlotCount(INITIAL_TEMPLATE, INITIAL_LENGTH))
  );
  const [selectedStone, setSelectedStone] = useState<Component | null>(null);
  const [selectedBeadMm, setSelectedBeadMm] = useState(8);
  const [selectedBeadShape, setSelectedBeadShape] = useState<BeadShape>("round");
  const [selectedClaspId, setSelectedClaspId] = useState<string | null>(null);
  const [patternDraft, setPatternDraft] = useState<PatternDraft | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [orderTotalCents, setOrderTotalCents] = useState(0);
  const [lockedLengthLabel, setLockedLengthLabel] = useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const client = createClient();
    if (!client) return;

    (async () => {
      const [templatesRes, componentsRes] = await Promise.all([
        client
          .from("design_templates")
          .select("*")
          .eq("is_active", true)
          .order("slot_count"),
        client
          .from("components")
          .select("*")
          .eq("is_active", true)
          .order("name"),
      ]);

      if (templatesRes.data?.length) {
        const loaded = templatesRes.data as DesignTemplate[];
        const first = loaded[0];
        const defaultLength = getDefaultLengthOption(first);
        setTemplates(loaded);
        setActiveTemplate(first);
        setSelectedLength(defaultLength);
        setSlots(createEmptySlots(resolveSlotCount(first, defaultLength)));
      }

      if (componentsRes.data?.length) {
        setComponents(componentsRes.data as Component[]);
      }
    })();
  }, []);

  const lengthOptions = getLengthOptions(activeTemplate);
  const activeSlotCount = resolveSlotCount(activeTemplate, selectedLength);
  const filledCount = useMemo(() => countFilledSlots(slots), [slots]);
  const remainingCount = activeSlotCount - filledCount;
  const nextEmptyIndex = useMemo(() => findNextEmptySlotIndex(slots), [slots]);
  const patternMode = patternDraft !== null && patternDraft.stoneB === null;
  const templateLayout = getTemplateLayout(activeTemplate);
  const productType = getProductType(activeTemplate);
  const sequentialOnly = isSequentialFill(activeTemplate);
  const showBulkActions = !sequentialOnly;
  const claspComponents = useMemo(
    () => components.filter((c) => c.component_type === "clasp"),
    [components]
  );

  const placeComponent = useCallback(
    (index: number, component: Component) => {
      setSlots((prev) => {
        if (index < 0 || index >= prev.length) return prev;
        const next = [...prev];
        next[index] = toSlotAssignment(component, index, {
          beadSizeMm: selectedBeadMm,
          beadShape: selectedBeadShape,
        });
        return next;
      });
    },
    [selectedBeadMm, selectedBeadShape]
  );

  const assignToSlot = useCallback(
    (index: number, component: Component) => {
      placeComponent(index, component);
    },
    [placeComponent]
  );

  const fillNextEmpty = useCallback(
    (component: Component) => {
      const index = findNextEmptySlotIndex(slots);
      if (index === null) return;
      assignToSlot(index, component);
    },
    [slots, assignToSlot]
  );

  const handleStoneSelect = useCallback(
    (component: Component) => {
      setError(null);

      if (patternDraft && patternDraft.stoneB === null) {
        const stoneA = patternDraft.stoneA;
        const stoneB = component;
        setPatternDraft(null);
        setSelectedStone(stoneA);

        setSlots((prev) => {
          const next = [...prev];
          let toggle = 0;
          for (let i = 0; i < next.length; i++) {
            if (next[i] !== null) continue;
            const pick = toggle % 2 === 0 ? stoneA : stoneB;
            next[i] = toSlotAssignment(pick, i, {
              beadSizeMm: selectedBeadMm,
              beadShape: selectedBeadShape,
            });
            toggle++;
          }
          return next;
        });
        return;
      }

      setSelectedStone(component);
      fillNextEmpty(component);
    },
    [patternDraft, fillNextEmpty, selectedBeadMm, selectedBeadShape]
  );

  const resetDesign = useCallback(
    (template: DesignTemplate, length: BraceletLengthOption | null) => {
      setSlots(createEmptySlots(resolveSlotCount(template, length)));
      setSelectedStone(null);
      setPatternDraft(null);
      setError(null);
    },
    []
  );

  const handleTemplateChange = useCallback(
    (template: DesignTemplate) => {
      const defaultLength = getDefaultLengthOption(template);
      setActiveTemplate(template);
      setSelectedLength(defaultLength);
      resetDesign(template, defaultLength);
    },
    [resetDesign]
  );

  const handleLengthChange = useCallback(
    (option: BraceletLengthOption) => {
      if (option.slot_count === activeSlotCount) return;
      setSelectedLength(option);
      resetDesign(activeTemplate, option);
    },
    [activeSlotCount, activeTemplate, resetDesign]
  );

  const handleClearAll = useCallback(() => {
    setSlots(createEmptySlots(activeSlotCount));
    setSelectedStone(null);
    setSelectedClaspId(null);
    setPatternDraft(null);
    setError(null);
  }, [activeSlotCount]);

  const handleClaspSelect = useCallback(
    (clasp: Component) => {
      setSelectedClaspId(clasp.id);
      placeComponent(0, clasp);
      setError(null);
    },
    [placeComponent]
  );

  const handlePatternAlternator = useCallback(() => {
    if (patternDraft) {
      setPatternDraft(null);
      return;
    }
    if (!selectedStone) {
      setError("Select a stone first, then tap Pattern Alternator.");
      return;
    }
    setPatternDraft({ stoneA: selectedStone, stoneB: null });
    setError(null);
  }, [patternDraft, selectedStone]);

  const handleFillRemaining = useCallback(() => {
    if (!selectedStone) {
      setError("Select a stone to fill remaining slots.");
      return;
    }
    setSlots((prev) =>
      prev.map((slot, index) =>
        slot === null
          ? toSlotAssignment(selectedStone, index, {
              beadSizeMm: selectedBeadMm,
              beadShape: selectedBeadShape,
            })
          : slot
      )
    );
    setPatternDraft(null);
    setError(null);
  }, [selectedStone, selectedBeadMm, selectedBeadShape]);

  const handleSlotTap = useCallback(
    (index: number) => {
      if (!selectedStone) return;
      if (
        sequentialOnly &&
        slots[index] === null &&
        index !== nextEmptyIndex
      ) {
        return;
      }
      assignToSlot(index, selectedStone);
    },
    [selectedStone, slots, assignToSlot, sequentialOnly, nextEmptyIndex]
  );

  const handleFinalize = useCallback(async () => {
    if (filledCount === 0) {
      setError("Place at least one bead before finalizing.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const layout = slots.filter((s): s is SlotAssignment => s !== null);
    const code = generateOrderCode();
    const script = buildAssemblyScript(layout);
    const totalCents = calculateOrderTotalCents(layout);
    const lengthLabel = selectedLength
      ? formatLengthLabel(selectedLength)
      : null;

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_code: code,
          design_template_id: activeTemplate.id,
          slot_layout: layout,
          total_slot_count: activeSlotCount,
          filled_slot_count: filledCount,
          assembly_script: script,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create order");
      }

      const data = await response.json();
      setOrderCode(data.order_code ?? code);
      setOrderTotalCents(data.total_cents ?? totalCents);
      setLockedLengthLabel(lengthLabel);
      setPhase("finalized");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finalize order");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    activeSlotCount,
    activeTemplate.id,
    filledCount,
    selectedLength,
    slots,
  ]);

  const handleStartOver = useCallback(() => {
    setPhase("designing");
    setOrderCode(null);
    setOrderTotalCents(0);
    setLockedLengthLabel(null);
    resetDesign(activeTemplate, selectedLength);
  }, [activeTemplate, selectedLength, resetDesign]);

  if (phase === "finalized" && orderCode) {
    return (
      <CheckoutScreen
        orderCode={orderCode}
        filledCount={filledCount}
        totalSlots={activeSlotCount}
        templateName={activeTemplate.name}
        wristLengthLabel={lockedLengthLabel}
        totalCents={orderTotalCents}
        onStartOver={handleStartOver}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gem-ink">
      <header className="sticky top-0 z-20">
        <SplineViewer
          className="h-[46vh] min-h-[300px] w-full sm:h-[42vh]"
          strand={{
            slots,
            activeSlotIndex: nextEmptyIndex,
            filledCount,
            totalSlots: activeSlotCount,
            layout: templateLayout,
            productType,
            previewLabel: getPreviewCenterLabel(activeTemplate),
            sequentialOnly,
            onSlotTap: handleSlotTap,
          }}
        />
      </header>

      <main className="flex flex-1 flex-col gap-5 px-4 pb-8 pt-3">
        <StoreHeader />

        <DesignControls
          templates={templates}
          activeTemplate={activeTemplate}
          onTemplateChange={handleTemplateChange}
          lengthOptions={lengthOptions}
          selectedLength={selectedLength}
          activeSlotCount={activeSlotCount}
          lengthLabel={getSizePickerLabel(activeTemplate)}
          onLengthChange={handleLengthChange}
          selectedBeadMm={selectedBeadMm}
          selectedBeadShape={selectedBeadShape}
          onBeadSizeChange={setSelectedBeadMm}
          onBeadShapeChange={setSelectedBeadShape}
          onClearAll={handleClearAll}
          filledCount={filledCount}
        />

        <section className="rounded-xl border border-white/10 bg-gem-slate/40 p-4">
          <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gem-gold">
            Stones &amp; Spacers
          </p>
          <p className="mb-3 text-xs text-gem-mist/50">
            Pick size and shape above, then tap a stone — the 3D preview updates
            instantly. Mix colors and sizes on the same piece.
          </p>
          <StonePalette
            components={components}
            selectedId={selectedStone?.id ?? null}
            onSelect={handleStoneSelect}
          />
        </section>

        <section className="rounded-xl border border-white/10 bg-gem-slate/40 p-4">
          <ClaspPicker
            clasps={claspComponents}
            selectedId={selectedClaspId}
            onSelect={handleClaspSelect}
          />
        </section>

        {showBulkActions && (
          <BulkActions
            patternMode={patternMode}
            onPatternAlternator={handlePatternAlternator}
            onFillRemaining={handleFillRemaining}
            hasSelection={selectedStone !== null}
            remainingCount={remainingCount}
          />
        )}

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        {filledCount > 0 && (
          <p className="text-center text-sm text-gem-mist/50">
            Est. total{" "}
            <span className="font-medium text-gem-gold">
              {formatCurrency(
                calculateOrderTotalCents(
                  slots.filter((s): s is SlotAssignment => s !== null)
                )
              )}
            </span>
          </p>
        )}

        <button
          type="button"
          onClick={handleFinalize}
          disabled={isSubmitting || filledCount === 0}
          className="mt-auto w-full rounded-xl bg-gem-gold py-4 text-center text-sm font-semibold uppercase tracking-wider text-gem-ink transition hover:bg-gem-gold/90 disabled:opacity-40"
        >
          {isSubmitting ? "Locking design…" : "Finalize Layout"}
        </button>
      </main>
    </div>
  );
}
