"use client";

import { useEffect, useRef, useState } from "react";
import { ProductModelViewer } from "@/components/customizer/ProductModelViewer";
import {
  useArBodyTracking,
  useArManualGestures,
} from "@/hooks/useArBodyTracking";
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

function anchorHint(anchor: ArPlacementHint["anchor"]): string {
  switch (anchor) {
    case "neck":
      return "Face the camera — necklace follows your neckline";
    case "ankle":
      return "Point camera at your ankle — tracking adjusts the anklet";
    default:
      return "Show your wrist to the camera — bracelet locks on automatically";
  }
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

  const mirrorX = placement.camera_facing === "user";

  const { transform, tracking, modelsLoading, manualAdjust, setManualAdjust } =
    useArBodyTracking(videoRef, open, productType, mirrorX);

  const gestures = useArManualGestures(setManualAdjust);

  useEffect(() => {
    if (!open) return;

    let stream: MediaStream | null = null;
    setError(null);
    setReady(false);

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera not supported in this browser");
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: placement.camera_facing },
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
            : "Camera access denied — allow camera in browser settings"
        );
      }
    })();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, placement.camera_facing]);

  if (!open) return null;

  const vw = typeof window !== "undefined" ? window.innerWidth : 390;
  const vh = typeof window !== "undefined" ? window.innerHeight : 844;

  const ringSize = Math.min(vw, vh);
  const x = (transform?.x ?? vw * 0.5) + manualAdjust.dx;
  const y =
    (transform?.y ?? (vh * placement.overlay_y_percent) / 100) +
    manualAdjust.dy;
  const pixelScale =
    (transform?.scale ?? ringSize * 0.42 * placement.overlay_scale) *
    manualAdjust.scaleMul;
  const scaleFactor = pixelScale / ringSize;
  const rotation = transform?.rotation ?? 0;
  const scaleX = transform?.scaleX ?? 1;
  const scaleY = transform?.scaleY ?? 1;

  return (
    <div className="fixed inset-0 z-[60] touch-none bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 h-full w-full object-cover ${
          mirrorX ? "-scale-x-100" : ""
        }`}
      />

      <div className="absolute inset-0 bg-black/10" />

      <div
        className="absolute left-0 top-0 will-change-transform"
        style={{
          transform: `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rotation}deg) scale(${scaleFactor * scaleX}, ${scaleFactor * scaleY})`,
          transformOrigin: "center center",
          width: ringSize,
          height: ringSize,
          pointerEvents: "auto",
        }}
        onPointerDown={gestures.onPointerDown}
        onPointerMove={gestures.onPointerMove}
        onPointerUp={gestures.onPointerUp}
        onPointerCancel={gestures.onPointerUp}
        onTouchStart={gestures.onTouchStart}
        onTouchMove={gestures.onTouchMove}
        onTouchEnd={gestures.onTouchEnd}
      >
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
          className="drop-shadow-[0_8px_32px_rgba(0,0,0,0.55)]"
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/75 to-transparent px-4 pb-10 pt-4">
        <div className="pointer-events-auto max-w-[75%]">
          <p className="text-xs uppercase tracking-[0.25em] text-gem-gold">
            Live try-on
          </p>
          <p className="mt-1 text-sm leading-snug text-gem-mist/90">
            {anchorHint(placement.anchor)}
          </p>
          <p className="mt-2 text-[11px] text-gem-mist/50">
            {modelsLoading
              ? "Loading body tracking…"
              : tracking
                ? "Tracking locked — drag to fine-tune, pinch to resize"
                : "Show your body in frame — drag & pinch to adjust manually"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto shrink-0 rounded-full border border-white/20 bg-black/50 px-4 py-2 text-sm text-gem-mist"
        >
          Done
        </button>
      </div>

      {tracking && (
        <div className="pointer-events-none absolute left-4 top-24 rounded-full border border-gem-gold/40 bg-gem-gold/15 px-3 py-1 text-[10px] uppercase tracking-wider text-gem-gold">
          Tracking
        </div>
      )}

      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-gem-mist/70">Starting camera…</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-x-4 bottom-24 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <p className="pointer-events-none absolute inset-x-4 bottom-4 text-center text-[10px] text-gem-mist/45">
        Drag to move · pinch to resize · works best in good lighting
      </p>
    </div>
  );
}
