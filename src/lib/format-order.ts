import type { Order, OrderSizingMetadata } from "@/types/database";

export function formatSizingSummary(
  sizing: OrderSizingMetadata | null | undefined
): string | null {
  if (!sizing) return null;

  const parts: string[] = [];
  if (sizing.template_name) parts.push(sizing.template_name);
  if (sizing.length_label) parts.push(sizing.length_label);
  if (sizing.strand_count === 2) parts.push("Double strand");
  if (sizing.measured_circumference_in != null) {
    parts.push(`Measured ${sizing.measured_circumference_in}"`);
  }
  if (sizing.ar_preview_used) parts.push("AR preview used");

  return parts.length > 0 ? parts.join(" · ") : null;
}

export function orderMatchesSearch(order: Order, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    order.order_code.toLowerCase().includes(q) ||
    order.assembly_script?.toLowerCase().includes(q) === true
  );
}
