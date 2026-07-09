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
