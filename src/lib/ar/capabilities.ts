/** MediaPipe task-vision needs iOS 16+ Safari (official requirement). */
export const MIN_IOS_FOR_BODY_TRACKING = 16;

export function getIosMajorVersion(): number | null {
  if (typeof navigator === "undefined") return null;

  const ua = navigator.userAgent;

  // iPhone / iPod / iPad (classic UA)
  const mobileMatch = ua.match(/(?:iPhone|iPod|iPad).*OS (\d+)[_.]/i);
  if (mobileMatch) {
    return Number.parseInt(mobileMatch[1], 10);
  }

  // iPadOS 13+ sometimes reports as Mac — treat as iOS for version gating
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) {
    const padMatch = ua.match(/Version\/(\d+)/);
    if (padMatch) return Number.parseInt(padMatch[1], 10);
    // Can't read version — assume tracking may work (iPadOS 16+ typical)
    return MIN_IOS_FOR_BODY_TRACKING;
  }

  return null;
}

export function supportsWasm(): boolean {
  return typeof WebAssembly === "object";
}

/** Whether to attempt MediaPipe body tracking (vs manual camera overlay only). */
export function supportsBodyTracking(): boolean {
  if (!supportsWasm()) return false;

  const ios = getIosMajorVersion();
  if (ios !== null && ios < MIN_IOS_FOR_BODY_TRACKING) {
    return false;
  }

  return true;
}

export type ArPlacementMode = "tracking" | "manual";

export function resolveArPlacementMode(): {
  mode: ArPlacementMode;
  reason: string | null;
} {
  if (!supportsWasm()) {
    return {
      mode: "manual",
      reason: "Manual placement — drag the jewelry onto your body",
    };
  }

  const ios = getIosMajorVersion();
  if (ios !== null && ios < MIN_IOS_FOR_BODY_TRACKING) {
    return {
      mode: "manual",
      reason: `Manual placement (iOS ${ios}) — drag & pinch to fit on your wrist`,
    };
  }

  return { mode: "tracking", reason: null };
}
