/** Store branding — set in Vercel env for production */

export const STORE_NAME =
  process.env.NEXT_PUBLIC_STORE_NAME?.trim() || "GemOps";

export const STORE_TAGLINE =
  process.env.NEXT_PUBLIC_STORE_TAGLINE?.trim() ||
  "Design your bracelet in-store";

export function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "https://gemops.vercel.app";
}

export function getCustomizeUrl(): string {
  return `${getAppUrl()}/customize`;
}

/** Human-readable pickup window for checkout and fit confirmation. */
export function getPickupEstimateLabel(): string {
  const min = process.env.NEXT_PUBLIC_PICKUP_DAYS_MIN?.trim();
  const max = process.env.NEXT_PUBLIC_PICKUP_DAYS_MAX?.trim();

  if (min && max && min !== max) {
    return `Ready in ${min}–${max} business days`;
  }
  if (max) {
    return `Ready in about ${max} business days`;
  }
  if (min) {
    return `Ready in about ${min} business days`;
  }
  return "Ready in 3–5 business days";
}

/** QR payload — order code staff can find on POS. */
export function getOrderProofCode(orderCode: string): string {
  return orderCode.replace(/^#/, "");
}
