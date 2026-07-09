"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildAssemblyScript,
  countFilledSlots,
  createEmptySlots,
  findNextEmptySlotIndex,
  generateOrderCode,
  migrateSlotsToCount,
  mirrorSlotsToDoubleStrand,
  SEED_COMPONENTS,
  SEED_TEMPLATES,
  toSlotAssignment,
} from "@/lib/constants";
import { calculateOrderTotalCents, formatCurrency } from "@/lib/pricing";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  formatLengthLabel,
  getDefaultLengthOption,
  getDefaultCustomizerTemplate,
  getLengthOptions,
  getProductType,
  getSizePickerLabel,
  isSequentialFill,
  resolveOrderTemplate,
  resolvePerRingSlotCount,
  resolvePreviewLayout,
  resolvePreviewLabel,
  resolveTotalSlotCount,
  sortCustomizerTemplates,
  supportsStrandToggle,
} from "@/lib/template-layout";
import { getArPlacement } from "@/lib/ar/scene-descriptor";
import { buildOrderSizingMetadata, supportsCamera } from "@/lib/ar/sizing";
import { StoreHeader } from "@/components/brand/StoreHeader";
import { CameraArPreview } from "@/components/ar/CameraArPreview";
import { WristMeasureGuide } from "@/components/ar/WristMeasureGuide";
import { BulkActions } from "@/components/customizer/BulkActions";
import { CheckoutScreen } from "@/components/customizer/CheckoutScreen";
import { ClaspPicker } from "@/components/customizer/ClaspPicker";
import { DesignControls } from "@/components/customizer/DesignControls";
import { SplineViewer } from "@/components/customizer/SplineViewer";
import { StrandStripBuilder } from "@/components/customizer/StrandStripBuilder";
import { StonePalette } from "@/components/customizer/StonePalette";
import type {
  BeadShape,
  BraceletLengthOption,
  Component,
  DesignTemplate,
  SlotAssignment,
  SlotState,
  StrandCount,
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
  const [templates, setTemplates] = useState<DesignTemplate[]>(
    sortCustomizerTemplates(SEED_TEMPLATES)
  );
  const [allTemplates, setAllTemplates] =
    useState<DesignTemplate[]>(SEED_TEMPLATES);
  const [components, setComponents] = useState<Component[]>(SEED_COMPONENTS);
  const [activeTemplate, setActiveTemplate] =
    useState<DesignTemplate>(INITIAL_TEMPLATE);
  const [strandCount, setStrandCount] = useState<StrandCount>(1);
  const [selectedLength, setSelectedLength] =
    useState<BraceletLengthOption | null>(INITIAL_LENGTH);
  const [slots, setSlots] = useState<SlotState[]>(() =>
    createEmptySlots(resolveTotalSlotCount(INITIAL_TEMPLATE, INITIAL_LENGTH, 1))
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
  const [showMeasureGuide, setShowMeasureGuide] = useState(false);
  const [showArPreview, setShowArPreview] = useState(false);
  const [measuredCircumferenceIn, setMeasuredCircumferenceIn] = useState<
    number | null
  >(null);
  const [arPreviewUsed, setArPreviewUsed] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(false);

  useEffect(() => {
    setCameraAvailable(supportsCamera());
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const client = createClient();
    if (!client) return;

    (async () => {
      const [templatesRes, componentsRes] = await Promise.all([
        client
          .from("design_templates")
          .select("*")
          .eq("is_active", true),
        client
          .from("components")
          .select("*")
          .eq("is_active", true)
          .order("name"),
      ]);

      if (templatesRes.data?.length) {
        const loaded = templatesRes.data as DesignTemplate[];
        const visible = sortCustomizerTemplates(loaded);
        const defaultTemplate = getDefaultCustomizerTemplate(visible);
        const defaultLength = getDefaultLengthOption(defaultTemplate);
        setAllTemplates(loaded);
        setTemplates(visible);
        setActiveTemplate(defaultTemplate);
        setStrandCount(1);
        setSelectedLength(defaultLength);
        setSlots(
          createEmptySlots(resolveTotalSlotCount(defaultTemplate, defaultLength, 1))
        );
      }

      if (componentsRes.data?.length) {
        setComponents(componentsRes.data as Component[]);
      }
    })();
  }, []);

  const lengthOptions = getLengthOptions(activeTemplate);
  const perRingSlotCount = resolvePerRingSlotCount(activeTemplate, selectedLength);
  const activeSlotCount = resolveTotalSlotCount(
    activeTemplate,
    selectedLength,
    strandCount
  );
  const filledCount = useMemo(() => countFilledSlots(slots), [slots]);
  const remainingCount = activeSlotCount - filledCount;
  const nextEmptyIndex = useMemo(() => findNextEmptySlotIndex(slots), [slots]);
  const patternMode = patternDraft !== null && patternDraft.stoneB === null;
  const previewLayout = resolvePreviewLayout(activeTemplate, strandCount);
  const previewLabel = resolvePreviewLabel(activeTemplate, strandCount);
  const productType = getProductType(activeTemplate);
  const sequentialOnly = isSequentialFill(activeTemplate);
  const showStrandToggle = supportsStrandToggle(activeTemplate);
  const showBulkActions = !sequentialOnly;
  const claspComponents = useMemo(
    () => components.filter((c) => c.component_type === "clasp"),
    [components]
  );

  const clearSlot = useCallback(
    (index: number, options?: { mirror?: boolean }) => {
      const shouldMirror =
        options?.mirror !== false &&
        strandCount === 2 &&
        supportsStrandToggle(activeTemplate);

      setSlots((prev) => {
        if (index < 0 || index >= prev.length || prev[index] === null) {
          return prev;
        }
        const next = [...prev];
        next[index] = null;

        if (shouldMirror) {
          const pair =
            index < perRingSlotCount
              ? index + perRingSlotCount
              : index - perRingSlotCount;
          if (pair >= 0 && pair < next.length) {
            next[pair] = null;
          }
        }

        return next;
      });
    },
    [strandCount, activeTemplate, perRingSlotCount]
  );

  const placeComponent = useCallback(
    (index: number, component: Component, options?: { mirror?: boolean }) => {
      const shouldMirror =
        options?.mirror !== false &&
        strandCount === 2 &&
        supportsStrandToggle(activeTemplate);

      setSlots((prev) => {
        if (index < 0 || index >= prev.length) return prev;
        const assignment = toSlotAssignment(component, index, {
          beadSizeMm: selectedBeadMm,
          beadShape: selectedBeadShape,
        });
        const next = [...prev];
        next[index] = assignment;

        if (shouldMirror) {
          const pair =
            index < perRingSlotCount
              ? index + perRingSlotCount
              : index - perRingSlotCount;
          if (pair >= 0 && pair < next.length) {
            next[pair] = { ...assignment, slot_index: pair };
          }
        }

        return next;
      });
    },
    [
      selectedBeadMm,
      selectedBeadShape,
      strandCount,
      activeTemplate,
      perRingSlotCount,
    ]
  );

  const assignToSlot = useCallback(
    (index: number, component: Component) => {
      placeComponent(index, component);
    },
    [placeComponent]
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

      if (selectedStone?.id === component.id) {
        setSelectedStone(null);
        return;
      }

      setSelectedStone(component);

      const nextIndex = findNextEmptySlotIndex(slots);
      if (nextIndex !== null) {
        placeComponent(nextIndex, component, { mirror: true });
      }
    },
    [
      patternDraft,
      selectedBeadMm,
      selectedBeadShape,
      selectedStone,
      slots,
      placeComponent,
    ]
  );

  const resetDesign = useCallback(
    (template: DesignTemplate, length: BraceletLengthOption | null) => {
      setStrandCount(1);
      setSlots(
        createEmptySlots(resolveTotalSlotCount(template, length, 1))
      );
      setSelectedStone(null);
      setPatternDraft(null);
      setError(null);
    },
    []
  );

  const handleTemplateChange = useCallback(
    (template: DesignTemplate) => {
      const defaultLength = getDefaultLengthOption(template);
      const perRing = resolvePerRingSlotCount(template, defaultLength);
      setActiveTemplate(template);
      setStrandCount(1);
      setSelectedLength(defaultLength);
      setSlots((prev) =>
        migrateSlotsToCount(prev.slice(0, perRingSlotCount), perRing)
      );
      setPatternDraft(null);
      setError(null);
    },
    [perRingSlotCount]
  );

  const handleStrandCountChange = useCallback(
    (count: StrandCount) => {
      if (count === strandCount) return;
      setStrandCount(count);
      setSlots((prev) => {
        const inner = migrateSlotsToCount(
          prev.slice(0, perRingSlotCount),
          perRingSlotCount
        );
        if (count === 2) {
          return mirrorSlotsToDoubleStrand(inner, perRingSlotCount);
        }
        return inner;
      });
      setPatternDraft(null);
      setError(null);
    },
    [strandCount, perRingSlotCount]
  );

  const handleLengthChange = useCallback(
    (option: BraceletLengthOption, measuredInches?: number) => {
      if (measuredInches !== undefined) {
        setMeasuredCircumferenceIn(measuredInches);
      }
      if (option.slot_count === perRingSlotCount) return;
      setSelectedLength(option);
      setSlots((prev) => {
        const inner = migrateSlotsToCount(
          prev.slice(0, perRingSlotCount),
          option.slot_count
        );
        if (strandCount === 2) {
          return mirrorSlotsToDoubleStrand(inner, option.slot_count);
        }
        return inner;
      });
      setPatternDraft(null);
      setError(null);
    },
    [perRingSlotCount, strandCount]
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
    (index: number, options?: { mirror?: boolean }) => {
      if (selectedStone) {
        if (
          sequentialOnly &&
          slots[index] === null &&
          index !== nextEmptyIndex
        ) {
          return;
        }
        placeComponent(index, selectedStone, options);
        return;
      }

      if (slots[index] !== null) {
        clearSlot(index, options);
      }
    },
    [
      selectedStone,
      slots,
      placeComponent,
      clearSlot,
      sequentialOnly,
      nextEmptyIndex,
    ]
  );

  const handleStripSlotTap = useCallback(
    (index: number) => {
      handleSlotTap(index, { mirror: false });
    },
    [handleSlotTap]
  );

  const handleRingSlotTap = useCallback(
    (index: number) => {
      handleSlotTap(index, { mirror: true });
    },
    [handleSlotTap]
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
    const orderTemplate = resolveOrderTemplate(
      allTemplates,
      activeTemplate,
      strandCount
    );
    const sizingMetadata = buildOrderSizingMetadata({
      productType,
      templateName:
        strandCount === 2
          ? `${activeTemplate.name} · Double strand`
          : activeTemplate.name,
      templateSlug: orderTemplate.slug,
      lengthLabel,
      slotCount: activeSlotCount,
      strandCount,
      measuredCircumferenceIn,
      arPreviewUsed,
    });

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_code: code,
          design_template_id: orderTemplate.id,
          slot_layout: layout,
          total_slot_count: activeSlotCount,
          filled_slot_count: filledCount,
          assembly_script: script,
          sizing_metadata: sizingMetadata,
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
    activeTemplate,
    allTemplates,
    arPreviewUsed,
    filledCount,
    measuredCircumferenceIn,
    productType,
    selectedLength,
    slots,
    strandCount,
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
        templateName={
          strandCount === 2
            ? `${activeTemplate.name} · Double strand`
            : activeTemplate.name
        }
        wristLengthLabel={lockedLengthLabel}
        totalCents={orderTotalCents}
        onStartOver={handleStartOver}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gem-ink">
      <header className="sticky top-0 z-20 bg-gem-ink shadow-lg shadow-black/40">
        <SplineViewer
          className="h-[36vh] min-h-[240px] w-full sm:h-[34vh]"
          strand={{
            slots,
            activeSlotIndex: nextEmptyIndex,
            filledCount,
            totalSlots: activeSlotCount,
            layout: previewLayout,
            productType,
            previewLabel,
            sequentialOnly,
            strandCount,
            onSlotTap: handleRingSlotTap,
          }}
        />
        {showStrandToggle && (
          <div className="border-t border-white/10 bg-gem-slate/90 px-4 py-3 backdrop-blur-sm">
            <StrandStripBuilder
              placement="hero"
              slots={slots}
              perRingSlotCount={perRingSlotCount}
              strandCount={strandCount}
              activeSlotIndex={nextEmptyIndex}
              onSlotTap={handleStripSlotTap}
            />
          </div>
        )}
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
          perRingSlotCount={perRingSlotCount}
          lengthLabel={getSizePickerLabel(activeTemplate)}
          onLengthChange={handleLengthChange}
          selectedBeadMm={selectedBeadMm}
          selectedBeadShape={selectedBeadShape}
          onBeadSizeChange={setSelectedBeadMm}
          onBeadShapeChange={setSelectedBeadShape}
          onClearAll={handleClearAll}
          filledCount={filledCount}
          onMeasureSize={() => setShowMeasureGuide(true)}
          onTryAr={() => {
            setArPreviewUsed(true);
            setShowArPreview(true);
          }}
          cameraAvailable={cameraAvailable}
          arPreviewUsed={arPreviewUsed}
          showStrandToggle={showStrandToggle}
          strandCount={strandCount}
          onStrandCountChange={handleStrandCountChange}
        />

        {showMeasureGuide && (
          <WristMeasureGuide
            productType={productType}
            lengthOptions={lengthOptions}
            currentLength={selectedLength}
            onApplyLength={handleLengthChange}
            onClose={() => setShowMeasureGuide(false)}
          />
        )}

        <CameraArPreview
          open={showArPreview}
          onClose={() => setShowArPreview(false)}
          placement={getArPlacement(productType)}
          slots={slots}
          activeSlotIndex={nextEmptyIndex}
          layout={previewLayout}
          productType={productType}
          previewLabel={previewLabel}
          sequentialOnly={sequentialOnly}
          strandCount={strandCount}
          onSlotTap={handleRingSlotTap}
        />

        <section className="rounded-xl border border-white/10 bg-gem-slate/40 p-4">
          <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gem-gold">
            Stones &amp; Spacers
          </p>
          <p className="mb-3 text-xs text-gem-mist/50">
            {showStrandToggle
              ? "Tap a stone to place on the next slot — strand and ring stay in sync. Tap any filled bead to replace; tap again with no stone selected to remove."
              : "Tap a stone to place on the next slot. Tap a filled bead to replace it."}
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
