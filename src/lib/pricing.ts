import type { SlotAssignment } from "@/types/database";

export type PaymentMethod = "cash" | "card" | "other";

export function calculateOrderTotalCents(layout: SlotAssignment[]): number {
  return layout.reduce((sum, slot) => sum + (slot.unit_cost_cents ?? 0), 0);
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  other: "Other",
};
