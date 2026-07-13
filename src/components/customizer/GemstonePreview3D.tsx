"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import type { Group } from "three";
import {
  beadScaleFromSlot,
  gemMaterialForSlot,
} from "@/lib/gems/materials";
import {
  layoutUsesArc,
  layoutUsesLayered,
  layoutUsesRing,
} from "@/lib/slot-layout-math";
import type { TemplateLayout } from "@/lib/template-layout";
import type { ProductType, SlotState } from "@/types/database";

interface GemstonePreview3DProps {
  slots: SlotState[];
  activeSlotIndex: number | null;
  layout: TemplateLayout;
  productType: ProductType;
  centerLabel: string;
  sequentialOnly?: boolean;
  strandCount?: 1 | 2;
  onSlotTap?: (index: number) => void;
  className?: string;
  enableSpin?: boolean;
}

function ringPositions(
  count: number,
  radius: number,
  y = 0
): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    out.push([radius * Math.cos(angle), y, radius * Math.sin(angle)]);
  }
  return out;
}

function arcPositions(
  count: number,
  radius: number
): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0.5 : i / (count - 1);
    const angle = Math.PI - t * Math.PI;
    out.push([
      radius * Math.cos(angle),
      -0.15,
      -radius * Math.sin(angle) * 0.55,
    ]);
  }
  return out;
}

function slotWorldPositions(
  total: number,
  layout: TemplateLayout,
  strandCount: 1 | 2
): [number, number, number][] {
  const isLayered = layoutUsesLayered(layout) || strandCount === 2;
  const isArc = layoutUsesArc(layout);
  const isRing = layoutUsesRing(layout) || !isArc;

  if (isArc) {
    return arcPositions(total, 1.55);
  }

  if (isLayered && total >= 2) {
    const per = Math.floor(total / 2);
    return [
      ...ringPositions(per, 1.15),
      ...ringPositions(total - per, 1.55),
    ];
  }

  if (isRing) {
    return ringPositions(total, 1.45);
  }

  return ringPositions(total, 1.45);
}

function Cord({
  radius,
  tube = 0.035,
}: {
  radius: number;
  tube?: number;
}) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, tube, 16, 96]} />
      <meshStandardMaterial
        color="#c9a962"
        metalness={0.75}
        roughness={0.35}
      />
    </mesh>
  );
}

function BeadMesh({
  slot,
  position,
  isActive,
  onTap,
}: {
  slot: NonNullable<SlotState>;
  position: [number, number, number];
  isActive: boolean;
  onTap?: () => void;
}) {
  const mat = useMemo(() => gemMaterialForSlot(slot), [slot]);
  const scale = useMemo(() => beadScaleFromSlot(slot), [slot]);
  const faceted = mat.flatShading;

  return (
    <group position={position} scale={[scale.x, scale.y, scale.z]}>
      <mesh
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          onTap?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = onTap ? "pointer" : "default";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        {faceted ? (
          <icosahedronGeometry args={[1, 1]} />
        ) : (
          <sphereGeometry args={[1, 32, 24]} />
        )}
        <meshPhysicalMaterial
          color={mat.color}
          roughness={mat.roughness}
          metalness={mat.metalness}
          clearcoat={mat.clearcoat}
          clearcoatRoughness={mat.clearcoatRoughness}
          transmission={mat.transmission}
          thickness={mat.thickness}
          ior={mat.ior}
          emissive={mat.emissive}
          emissiveIntensity={mat.emissiveIntensity}
          flatShading={mat.flatShading}
        />
      </mesh>
      {isActive && (
        <mesh scale={1.25}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshBasicMaterial
            color="#c9a962"
            transparent
            opacity={0.18}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

function EmptySlotMarker({
  position,
  isActive,
  onTap,
}: {
  position: [number, number, number];
  isActive: boolean;
  onTap?: () => void;
}) {
  return (
    <mesh
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onTap?.();
      }}
    >
      <sphereGeometry args={[0.06, 16, 12]} />
      <meshStandardMaterial
        color={isActive ? "#c9a962" : "#4a4a55"}
        roughness={0.6}
        metalness={0.1}
        transparent
        opacity={isActive ? 0.85 : 0.45}
      />
    </mesh>
  );
}

function JewelryScene({
  slots,
  activeSlotIndex,
  layout,
  productType,
  strandCount,
  onSlotTap,
  enableSpin,
}: {
  slots: SlotState[];
  activeSlotIndex: number | null;
  layout: TemplateLayout;
  productType: ProductType;
  strandCount: 1 | 2;
  onSlotTap?: (index: number) => void;
  enableSpin: boolean;
}) {
  const group = useRef<Group>(null);
  const total = slots.length;
  const positions = useMemo(
    () => slotWorldPositions(total, layout, strandCount),
    [total, layout, strandCount]
  );

  const showDoubleCord =
    (layoutUsesLayered(layout) || strandCount === 2) &&
    (productType === "bracelet" || productType === "strand");

  useFrame((_, delta) => {
    if (!enableSpin || !group.current) return;
    group.current.rotation.y += delta * 0.25;
  });

  return (
    <group ref={group} rotation={[0.35, 0.4, 0]}>
      {showDoubleCord ? (
        <>
          <Cord radius={1.15} tube={0.028} />
          <Cord radius={1.55} tube={0.028} />
        </>
      ) : layoutUsesArc(layout) ? (
        <mesh rotation={[0.2, 0, 0]} position={[0, -0.15, 0]}>
          <torusGeometry args={[1.55, 0.03, 12, 64, Math.PI]} />
          <meshStandardMaterial
            color="#c9a962"
            metalness={0.75}
            roughness={0.35}
          />
        </mesh>
      ) : (
        <Cord radius={1.45} />
      )}

      {slots.map((slot, index) => {
        const position = positions[index] ?? ([0, 0, 0] as [
          number,
          number,
          number,
        ]);
        const isActive = index === activeSlotIndex;
        if (!slot) {
          return (
            <EmptySlotMarker
              key={index}
              position={position}
              isActive={isActive}
              onTap={onSlotTap ? () => onSlotTap(index) : undefined}
            />
          );
        }
        return (
          <BeadMesh
            key={`${index}-${slot.component_id}-${slot.bead_size_mm}-${slot.bead_shape}`}
            slot={slot}
            position={position}
            isActive={isActive}
            onTap={onSlotTap ? () => onSlotTap(index) : undefined}
          />
        );
      })}
    </group>
  );
}

export function GemstonePreview3D({
  slots,
  activeSlotIndex,
  layout,
  productType,
  centerLabel,
  strandCount = 1,
  onSlotTap,
  className = "",
  enableSpin = true,
}: GemstonePreview3DProps) {
  const filled = slots.filter(Boolean).length;
  const total = slots.length;

  return (
    <div
      className={`relative mx-auto aspect-square w-full max-w-[min(78vw,340px)] ${className}`}
    >
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.1, 3.4], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        className="touch-none"
      >
        <color attach="background" args={["#0f0f12"]} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[3, 5, 2]} intensity={1.1} castShadow />
        <directionalLight position={[-3, 2, -2]} intensity={0.35} />
        <Environment preset="city" environmentIntensity={0.45} />
        <JewelryScene
          slots={slots}
          activeSlotIndex={activeSlotIndex}
          layout={layout}
          productType={productType}
          strandCount={strandCount}
          onSlotTap={onSlotTap}
          enableSpin={enableSpin}
        />
        <ContactShadows
          position={[0, -1.35, 0]}
          opacity={0.35}
          scale={6}
          blur={2.5}
          far={3}
        />
        <OrbitControls
          enablePan={false}
          minDistance={2.4}
          maxDistance={5}
          maxPolarAngle={Math.PI * 0.72}
          minPolarAngle={Math.PI * 0.2}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center">
        <p className="text-[10px] uppercase tracking-[0.25em] text-gem-gold">
          {centerLabel}
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-gem-mist/60">
          {filled} / {total}
        </p>
        <p className="mt-1 text-[10px] text-gem-mist/40">
          Drag to rotate · tap a bead to edit
        </p>
      </div>
    </div>
  );
}
