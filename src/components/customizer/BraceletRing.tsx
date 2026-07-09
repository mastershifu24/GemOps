"use client";

import type { ComponentProps } from "react";
import { RadialSlotRing } from "@/components/customizer/RadialSlotRing";

/** @deprecated Use RadialSlotRing */
export function BraceletRing(props: ComponentProps<typeof RadialSlotRing>) {
  return (
    <RadialSlotRing
      {...props}
      centerLabel={props.centerLabel ?? "Your Bracelet"}
    />
  );
}
