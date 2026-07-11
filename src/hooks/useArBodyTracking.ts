"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  arModelsAvailable,
  detectArTransform,
  getHandLandmarker,
  getPoseLandmarker,
  pickTrackingMode,
  type ArOverlayTransform,
} from "@/lib/ar/body-tracking";
import { resolveArPlacementMode, type ArPlacementMode } from "@/lib/ar/capabilities";
import type { ProductType } from "@/types/database";

const SMOOTHING = 0.28;
const DETECT_INTERVAL_MS = 50;

function lerpTransform(
  prev: ArOverlayTransform | null,
  next: ArOverlayTransform
): ArOverlayTransform {
  if (!prev) return next;
  const t = SMOOTHING;
  return {
    x: prev.x + (next.x - prev.x) * t,
    y: prev.y + (next.y - prev.y) * t,
    scale: prev.scale + (next.scale - prev.scale) * t,
    rotation: prev.rotation + (next.rotation - prev.rotation) * t,
    scaleX: prev.scaleX + (next.scaleX - prev.scaleX) * t,
    scaleY: prev.scaleY + (next.scaleY - prev.scaleY) * t,
    confidence: next.confidence,
  };
}

export interface UseArBodyTrackingResult {
  transform: ArOverlayTransform | null;
  tracking: boolean;
  modelsLoading: boolean;
  modelsError: string | null;
  placementMode: ArPlacementMode;
  manualOnlyReason: string | null;
  scanHint: string | null;
  manualAdjust: { dx: number; dy: number; scaleMul: number };
  setManualAdjust: React.Dispatch<
    React.SetStateAction<{ dx: number; dy: number; scaleMul: number }>
  >;
}

export function useArBodyTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  open: boolean,
  productType: ProductType,
  mirrorX: boolean
): UseArBodyTrackingResult {
  const [transform, setTransform] = useState<ArOverlayTransform | null>(null);
  const [tracking, setTracking] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [placementMode, setPlacementMode] = useState<ArPlacementMode>("tracking");
  const [manualOnlyReason, setManualOnlyReason] = useState<string | null>(null);
  const [scanHint, setScanHint] = useState<string | null>(null);
  const [manualAdjust, setManualAdjust] = useState({
    dx: 0,
    dy: 0,
    scaleMul: 1,
  });

  const smoothedRef = useRef<ArOverlayTransform | null>(null);
  const lastDetectRef = useRef(0);
  const detectTimestampRef = useRef(0);
  const detectInFlightRef = useRef(false);
  const sessionStartRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      smoothedRef.current = null;
      setTransform(null);
      setTracking(false);
      setModelsError(null);
      setPlacementMode("tracking");
      setManualOnlyReason(null);
      setScanHint(null);
      return;
    }

    setManualAdjust({ dx: 0, dy: 0, scaleMul: 1 });
    setModelsError(null);
    setScanHint(null);
    detectTimestampRef.current = 0;
    detectInFlightRef.current = false;
    sessionStartRef.current = performance.now();

    const { mode, reason } = resolveArPlacementMode();
    setPlacementMode(mode);
    setManualOnlyReason(reason);

    if (mode === "manual") {
      setModelsLoading(false);
      setTracking(false);
      smoothedRef.current = null;
      setTransform(null);
      return;
    }

    setModelsLoading(true);
    let trackingActive = true;
    let cancelled = false;

    const trackingMode = pickTrackingMode(productType);
    const loaders =
      trackingMode === "hand"
        ? [getHandLandmarker(), getPoseLandmarker()]
        : [getPoseLandmarker(), getHandLandmarker()];

    const startLoop = () => {
      if (cancelled || !trackingActive) return;

      const loop = (timestamp: number) => {
        if (cancelled || !trackingActive) return;

        const video = videoRef.current;
        if (
          !video ||
          video.readyState < 2 ||
          video.videoWidth <= 0 ||
          video.videoHeight <= 0
        ) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        if (detectInFlightRef.current) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        if (timestamp - lastDetectRef.current >= DETECT_INTERVAL_MS) {
          lastDetectRef.current = timestamp;
          const videoTs = Math.round(video.currentTime * 1000);
          detectTimestampRef.current = Math.max(
            detectTimestampRef.current + 1,
            videoTs > 0 ? videoTs : Math.round(timestamp - sessionStartRef.current)
          );

          detectInFlightRef.current = true;
          const vw = window.innerWidth;
          const vh = window.innerHeight;

          detectArTransform(
            video,
            detectTimestampRef.current,
            { productType, mirrorX },
            vw,
            vh
          )
            .then((detected) => {
              if (cancelled) return;
              if (detected) {
                smoothedRef.current = lerpTransform(
                  smoothedRef.current,
                  detected
                );
                setTransform({ ...smoothedRef.current });
                setTracking(true);
                setScanHint(null);
              } else {
                setTracking(false);
                if (smoothedRef.current) {
                  setTransform({ ...smoothedRef.current });
                }
                if (trackingMode === "hand") {
                  setScanHint(
                    "Show your whole hand — palm or back, fingers spread"
                  );
                }
              }
            })
            .catch(() => {
              if (!cancelled) setTracking(false);
            })
            .finally(() => {
              detectInFlightRef.current = false;
            });
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    };

    Promise.all(loaders)
      .then(async () => {
        if (cancelled) return;
        const available = await arModelsAvailable();
        const needsHand = trackingMode === "hand";
        const needsPose = trackingMode === "pose";
        const ok =
          (needsHand && available.hand) ||
          (needsPose && available.pose) ||
          available.hand ||
          available.pose;

        if (!ok) {
          trackingActive = false;
          smoothedRef.current = null;
          setTransform(null);
          setTracking(false);
          setPlacementMode("manual");
          setManualOnlyReason(
            "Manual placement — drag the jewelry onto your body"
          );
          setModelsError(
            "Auto-tracking unavailable — drag & pinch to fit"
          );
          return;
        }

        if (trackingMode === "hand") {
          setScanHint("Show your whole hand — palm or back, fingers spread");
        }
        startLoop();
      })
      .finally(() => {
        if (!cancelled) setModelsLoading(false);
      });

    return () => {
      cancelled = true;
      trackingActive = false;
      detectInFlightRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [open, productType, mirrorX, videoRef]);

  return {
    transform,
    tracking,
    modelsLoading,
    modelsError,
    placementMode,
    manualOnlyReason,
    scanHint,
    manualAdjust,
    setManualAdjust,
  };
}

export function useArManualGestures(
  setManualAdjust: React.Dispatch<
    React.SetStateAction<{ dx: number; dy: number; scaleMul: number }>
  >
) {
  const dragStart = useRef<{ x: number; y: number; dx: number; dy: number } | null>(
    null
  );
  const pinchStart = useRef<{ distance: number; scaleMul: number } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "touch" && e.isPrimary === false) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragStart.current = { x: e.clientX, y: e.clientY, dx: 0, dy: 0 };
      setManualAdjust((prev) => {
        dragStart.current = {
          x: e.clientX,
          y: e.clientY,
          dx: prev.dx,
          dy: prev.dy,
        };
        return prev;
      });
    },
    [setManualAdjust]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStart.current) return;
      const dx = dragStart.current.dx + (e.clientX - dragStart.current.x);
      const dy = dragStart.current.dy + (e.clientY - dragStart.current.y);
      setManualAdjust((prev) => ({ ...prev, dx, dy }));
    },
    [setManualAdjust]
  );

  const onPointerUp = useCallback(() => {
    dragStart.current = null;
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const [a, b] = [e.touches[0], e.touches[1]];
        const distance = Math.hypot(
          a.clientX - b.clientX,
          a.clientY - b.clientY
        );
        setManualAdjust((prev) => {
          pinchStart.current = { distance, scaleMul: prev.scaleMul };
          return prev;
        });
      }
    },
    [setManualAdjust]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && pinchStart.current) {
        const [a, b] = [e.touches[0], e.touches[1]];
        const distance = Math.hypot(
          a.clientX - b.clientX,
          a.clientY - b.clientY
        );
        const ratio = distance / pinchStart.current.distance;
        setManualAdjust((prev) => ({
          ...prev,
          scaleMul: Math.max(0.5, Math.min(2, pinchStart.current!.scaleMul * ratio)),
        }));
      }
    },
    [setManualAdjust]
  );

  const onTouchEnd = useCallback(() => {
    pinchStart.current = null;
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
