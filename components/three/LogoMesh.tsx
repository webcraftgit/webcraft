"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { damp } from "maath/easing";
import { getLogoShape, toScene, FRAGMENTS } from "@/lib/logo-shape";
import { heroScroll } from "@/lib/scroll-state";

/**
 * Partial rotation, not 360 — at 80° the beveled side profile reads clearly
 * without ever exposing the flat back. Tune this one constant to taste.
 */
const MAX_ROTATION = THREE.MathUtils.degToRad(80);
const DAMP = 0.15;

export default function LogoMesh({ interactive = true, hasEnvMap = true }: { interactive?: boolean; hasEnvMap?: boolean }) {
  const group = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(getLogoShape(), {
      depth: 40,
      bevelEnabled: true,
      bevelThickness: 4,
      bevelSize: 3,
      bevelSegments: 2,
      curveSegments: 4,
    });
    geo.center();
    return geo;
  }, []);

  // The four detached pixel squares from the source mark, in scene space
  const fragments = useMemo(
    () =>
      FRAGMENTS.map(([x, y, size]) => {
        const [px, py] = toScene(x + size / 2, y + size / 2);
        return { position: [px, py, 0] as [number, number, number], size };
      }),
    []
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;

    // Scroll-driven rotation with inertia + gentle idle sway
    const targetY = heroScroll.progress * MAX_ROTATION + Math.sin(t * 0.4) * 0.05;
    damp(group.current.rotation, "y", targetY, DAMP, delta);

    // Pointer tilt (desktop only)
    const px = interactive ? state.pointer.x : 0;
    const py = interactive ? state.pointer.y : 0;
    damp(group.current.rotation, "x", -py * 0.12 + Math.cos(t * 0.35) * 0.03, DAMP, delta);
    damp(group.current.rotation, "z", px * 0.05, DAMP, delta);

    // Recede slightly as the user scrolls past
    damp(group.current.position, "y", -heroScroll.progress * 30, DAMP, delta);
    const s = 1 - heroScroll.progress * 0.15;
    damp(group.current.scale, "x", s, DAMP, delta);
    damp(group.current.scale, "y", s, DAMP, delta);
    damp(group.current.scale, "z", s, DAMP, delta);
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry} castShadow>
        {/* `hasEnvMap` is now true on mobile too (LogoScene gives it a
            procedural cube map), so the metallic branch is what actually runs
            on every device and the mark keeps its bevel, highlights and side
            profile. The matte branch survives only for a genuine HDRI load
            failure on desktop — without it a metal surface with nothing to
            reflect renders almost black. The small emissive term rides with
            that same failure case, so it is zero in normal operation. */}
        <meshPhysicalMaterial
          color="#38BDF8"
          metalness={hasEnvMap ? 0.9 : 0.3}
          roughness={hasEnvMap ? 0.22 : 0.4}
          clearcoat={1}
          clearcoatRoughness={0.12}
          envMapIntensity={1.4}
          emissive="#0EA5E9"
          emissiveIntensity={hasEnvMap ? 0 : 0.25}
        />
      </mesh>
      {/* Detached pixel fragments — same material family, slightly brighter */}
      {fragments.map((f, i) => (
        <mesh key={i} position={f.position}>
          <boxGeometry args={[f.size, f.size, f.size]} />
          <meshPhysicalMaterial
            color="#7DD3FC"
            metalness={hasEnvMap ? 0.85 : 0.3}
            roughness={0.2}
            clearcoat={1}
            emissive="#0EA5E9"
            emissiveIntensity={0.15}
          />
        </mesh>
      ))}
    </group>
  );
}
