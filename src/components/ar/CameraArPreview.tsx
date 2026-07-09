"use client";

import { useEffect, useRef, useState } from "react";
import { ProductModelViewer } from "@/components/customizer/ProductModelViewer";
import type { TemplateLayout } from "@/lib/template-layout";
import type { ArPlacementHint } from "@/types/ar";
import type { ProductType, SlotState, StrandCount } from "@/types/database";

interface CameraArPreviewProps {
  open: boolean;
  onClose: () => void;
  placement: ArPlacementHint;
  slots: SlotState[];
  activeSlotIndex: number | null;
  layout: TemplateLayout;
  productType: ProductType;
  previewLabel: string;
  sequentialOnly?: boolean;
  strandCount?: StrandCount;
  onSlotTap?: (index: number) => void;
}

export function CameraArPreview({
  open,
  onClose,
  placement,
  slots,
  activeSlotIndex,
  layout,
  productType,
  previewLabel,
  sequentialOnly,
  strandCount = 1,
  onSlotTap,
}: CameraArPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) return;

    let stream: MediaStream | null = null;
    setError(null);
    setReady(false);

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: placement.camera_facing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Camera access denied or unavailable"
        );
      }
    })();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, placement.camera_facing]);

  if (!open) return null;

  const anchorHint =
    placement.anchor === "neck"
      ? "Center the necklace on your neckline"
      : placement.anchor === "ankle"
        ? "Hold your ankle in the circle"
        : "Place your wrist inside the circle";

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-black/20" />

      <div
        className="pointer-events-none absolute w-[min(88vw,320px)]"
        style={{
          top: `${placement.overlay_y_percent}%`,
          left: "50%",
          transform: `translate(-50%, -50%) scale(${placement.overlay_scale})`,
        }}
      >
        <div className="pointer-events-auto">
          <ProductModelViewer
            slots={slots}
            activeSlotIndex={activeSlotIndex}
            layout={layout}
            productType={productType}
            centerLabel={previewLabel}
            sequentialOnly={sequentialOnly}
            strandCount={strandCount}
            onSlotTap={onSlotTap}
            enableSpin={false}
            className="drop-shadow-2xl"
          />
        </div>
      </div>

      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 pb-8 pt-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gem-gold">
            AR try-on
          </p>
          <p className="text-sm text-gem-mist/80">{anchorHint}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/20 bg-black/40 px-4 py-2 text-sm text-gem-mist"
        >
          Done
        </button>
      </div>

      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-gem-mist/70">Starting camera…</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-x-4 bottom-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <p className="absolute inset-x-4 bottom-4 text-center text-[10px] text-gem-mist/50">
        MVP camera overlay — future updates can add hand/neck tracking for
        precise fit.
      </p>
    </div>
  );
}
