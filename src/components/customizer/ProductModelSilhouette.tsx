"use client";

import type { ProductType } from "@/types/database";

interface ProductModelSilhouetteProps {
  productType: ProductType;
}

/** Faint 3D-style placeholder behind the live slot preview */
export function ProductModelSilhouette({
  productType,
}: ProductModelSilhouetteProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      style={{ perspective: "800px" }}
    >
      <div
        className="product-silhouette-float relative opacity-[0.18]"
        style={{ transform: "rotateX(12deg) rotateY(-8deg)" }}
      >
        {productType === "bracelet" && (
          <div
            className="h-44 w-44 rounded-full border-2 border-gem-gold/80"
            style={{
              boxShadow:
                "inset 0 0 40px rgba(201, 169, 98, 0.15), 0 20px 60px rgba(0,0,0,0.5)",
            }}
          />
        )}

        {productType === "necklace" && (
          <div className="relative h-40 w-52">
            <div
              className="absolute left-1/2 top-0 h-36 w-36 -translate-x-1/2 rounded-full border-2 border-gem-gold/80 border-b-transparent border-l-transparent"
              style={{ transform: "translateX(-50%) rotate(-45deg)" }}
            />
            <div className="absolute bottom-0 left-1/2 h-8 w-8 -translate-x-1/2 rounded-full border border-gem-gold/60 bg-gem-gold/10" />
          </div>
        )}

        {productType === "dog_collar" && (
          <div className="relative">
            <div
              className="h-36 w-48 rounded-[999px] border-2 border-gem-gold/80"
              style={{
                borderRadius: "40% / 50%",
                boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
              }}
            />
            <div className="absolute -right-1 top-1/2 h-5 w-3 -translate-y-1/2 rounded-sm border border-gem-gold/70 bg-gem-gold/20" />
          </div>
        )}

        {productType === "strand" && (
          <div className="flex h-8 w-56 items-center">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gem-gold/80 to-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}
