import type { Application } from "@splinetool/runtime";
import type { SlotState } from "@/types/database";

/**
 * Phase 2 Spline setup (in editor):
 * 1. Add a thread (thin cylinder/torus) along a curve
 * 2. Duplicate 48 spheres along it — name exactly bead_00 … bead_47
 * 3. Export → Code → copy scene.splinecode URL
 * 4. Set NEXT_PUBLIC_SPLINE_STRAND_SCENE_URL in Vercel / .env.local
 */

/** Spline object names: bead_00 … bead_47 */
export function beadObjectName(index: number): string {
  return `bead_${String(index).padStart(2, "0")}`;
}

const MAX_BEADS = 48;

/** True if scene has at least bead_00 (strand template exported from Spline). */
export function sceneHasStrandBeads(app: Application): boolean {
  return app.findObjectByName(beadObjectName(0)) !== undefined;
}

/**
 * Sync React slot state → Spline mesh beads.
 * Empty slots: hidden. Filled: visible + material color from catalog.
 */
export function syncSlotsToSpline(
  app: Application,
  slots: SlotState[],
  totalSlots: number
): void {
  for (let i = 0; i < MAX_BEADS; i++) {
    const obj = app.findObjectByName(beadObjectName(i));
    if (!obj) continue;

    const inLayout = i < totalSlots;
    const slot = inLayout ? slots[i] : null;

    if (!inLayout || slot === null) {
      obj.hide();
      continue;
    }

    obj.show();
    obj.color = slot.display_color;

    if (slot.component_type === "spacer") {
      obj.scale = { x: 0.55, y: 0.55, z: 0.55 };
    } else {
      obj.scale = { x: 1, y: 1, z: 1 };
    }
  }
}
