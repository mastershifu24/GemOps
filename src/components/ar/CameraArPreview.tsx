"use client";

import { useEffect, useRef, useState } from "react";
import { ArTryOnOverlay } from "@/components/ar/ArTryOnOverlay";
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
  layout: TemplateLayout;
  productType: ProductType;
  strandCount?: StrandCount;
}

type CameraFacing = "user" | "environment";

async function openCamera(facing: CameraFacing): Promise<MediaStream> {
  const ideal = {
    video: {
      facingMode: { ideal: facing },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false as const,
  };

  try {
    return await navigator.mediaDevices.getUserMedia(ideal);
  } catch {
    // iOS Safari often rejects strict resolution — retry with facing mode only
    return navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing },
      audio: false,
    });
  }
}

function anchorHint(
  anchor: ArPlacementHint["anchor"],
  facing: CameraFacing,
  manualOnly: boolean
): string {
  if (manualOnly) {
    switch (anchor) {
      case "neck":
        return "Line up the necklace on your neck — drag and pinch to adjust";
      case "ankle":
        return "Line up the anklet on your ankle — drag and pinch to adjust";
      default:
        return "Line up the bracelet on your wrist — drag and pinch to adjust";
    }
  }

  switch (anchor) {
    case "neck":
      return "Face the camera — necklace follows your neckline";
    case "ankle":
      return facing === "user"
        ? "Hold phone low and show your ankle in frame"
        : "Point the back camera at your ankle";
    default:
      return facing === "user"
        ? "Hold your whole hand up — palm or back, fingers spread wide"
        : "Show your wrist to the camera — or tap Flip to use front camera";
  }
}

export function CameraArPreview({
  open,
  onClose,
  placement,
  slots,
  layout,
  productType,
  strandCount = 1,
}: CameraArPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>(
    placement.camera_facing
  );

  const mirrorX = cameraFacing === "user";

  const {
    transform,
    tracking,
    modelsLoading,
    modelsError,
    placementMode,
    manualOnlyReason,
    scanHint,
    manualAdjust,
    setManualAdjust,
  } = useArBodyTracking(videoRef, open, productType, mirrorX);

  const manualOnly = placementMode === "manual";

  const gestures = useArManualGestures(setManualAdjust);

  useEffect(() => {
    if (!open) return;
    setCameraFacing(placement.camera_facing);
  }, [open, placement.camera_facing]);

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

        stream = await openCamera(cameraFacing);

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
  }, [open, cameraFacing]);

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
  const scaleFactor = Math.max(0.36, pixelScale / ringSize);
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
        <ArTryOnOverlay
          slots={slots}
          layout={layout}
          productType={productType}
          strandCount={strandCount}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/75 to-transparent px-4 pb-10 pt-4">
        <div className="pointer-events-auto max-w-[75%]">
          <p className="text-xs uppercase tracking-[0.25em] text-gem-gold">
            {manualOnly ? "Camera try-on" : "Live try-on"}
          </p>
          <p className="mt-1 text-sm leading-snug text-gem-mist/90">
            {anchorHint(placement.anchor, cameraFacing, manualOnly)}
          </p>
          <p className="mt-2 text-[11px] text-gem-mist/50">
            {manualOnly && manualOnlyReason
              ? manualOnlyReason
              : modelsLoading
                ? "Loading body tracking…"
                : modelsError
                  ? modelsError
                  : tracking
                    ? "Tracking locked — drag to fine-tune, pinch to resize"
                    : scanHint
                      ? scanHint
                      : "Center your body in frame — drag & pinch to adjust manually"}
          </p>
        </div>
        <div className="pointer-events-auto flex shrink-0 flex-col gap-2">
          <button
            type="button"
            onClick={() =>
              setCameraFacing((f) => (f === "user" ? "environment" : "user"))
            }
            className="rounded-full border border-white/20 bg-black/50 px-3 py-2 text-xs text-gem-mist"
          >
            Flip
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 bg-black/50 px-4 py-2 text-sm text-gem-mist"
          >
            Done
          </button>
        </div>
      </div>

      {(manualOnly || (!tracking && ready)) && placement.anchor === "wrist" && (
        <div className="pointer-events-none absolute left-1/2 top-[52%] h-28 w-44 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-dashed border-gem-gold/35" />
      )}

      {manualOnly && ready && (
        <div className="pointer-events-none absolute left-4 top-24 rounded-full border border-white/25 bg-black/40 px-3 py-1 text-[10px] uppercase tracking-wider text-gem-mist/80">
          Manual
        </div>
      )}

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
