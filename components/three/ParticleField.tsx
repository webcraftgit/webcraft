"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { damp } from "maath/easing";
import { heroScroll } from "@/lib/scroll-state";
import { pointerState, ensurePointerTracking } from "@/lib/pointer-state";
import { cursorPush, type Vec2 } from "@/lib/cube-interaction";

const PARALLAX = 1.4; // fragments drift faster than the W — depth cue

// Cursor reactivity — a GENTLE PUSH AWAY only. The pointer nudges nearby cubes
// slightly outward as it passes; it never rotates, spins, or scales them. Their
// idle float + tumble is untouched. HeroCursorLight glow sits on top.
//
// The cursor (normalized [-1,1]) is projected onto the swarm plane using these
// half-extents. Camera z=320, fov 45 → at the particles' avg depth the visible
// half-height ≈ 150 world units and half-width ≈ that × aspect.
const CURSOR_SPAN_X = 260;

/* Visible world width at the reference desktop (16:10). Same anchor FitGroup
 * uses — see components/three/FitGroup.tsx. */
const REFERENCE_WIDTH = 424;
const CURSOR_SPAN_Y = 150;
const PUSH_RADIUS = 90; // world units of influence around the cursor
const PUSH_STRENGTH = 18; // small outward nudge at the cursor

type Props = { count?: number };

/**
 * Instanced pixel-cubes echoing the logo's fragment motif.
 * One draw call regardless of count.
 */
export default function ParticleField({ count = 400 }: Props) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  /* ————— SWARM DENSITY ON NARROW VIEWPORTS —————
   * The swarm orbits at a radius of 130-290 world units, so it is ~580 units
   * across. A desktop sees ~424 of that (73%); a 390px phone sees ~122 (21%).
   * At a fixed count the phone therefore shows barely a quarter of the cubes
   * the desktop does, and the hero reads sparse and empty.
   *
   * Two ways out. Raising the count until the VISIBLE number matches would
   * need ~1400 instances to put 400 on screen — most of them rendered off
   * frame forever, which is pure waste. Instead the orbit contracts with the
   * viewport, so a phone sees most of the swarm rather than a slice of it.
   *
   * Only the ORBIT scales. Cube size is left alone: scaling that too would
   * shrink the cubes to specks on the device with the least screen area.
   * Vertical spread is left alone as well — the visible world height is a
   * constant 265 units on this fixed camera and the swarm already spans ±220,
   * so it fills the frame top to bottom at every size. Exactly 1 on desktop.
   */
  const viewportWidth = useThree((s) => s.viewport.width);
  const spread = Math.min(1, viewportWidth / REFERENCE_WIDTH);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Eased pointer so the reaction glides instead of snapping to raw events, and
  // a single reusable output vector so the per-frame loop allocates nothing.
  const pointer = useRef({ x: 0, y: 0 });
  const out = useMemo<Vec2>(() => ({ x: 0, y: 0 }), []);

  // The swarm sits behind the hero copy (pointer-events-none) so it can't rely
  // on its own canvas pointer events near the buttons — read the shared
  // window-level cursor, same source the Services scene uses.
  useEffect(() => {
    ensurePointerTracking();
  }, []);

  const seeds = useMemo(() => {
    return Array.from({ length: count }, () => ({
      radius: 130 + Math.random() * 160,
      angle: Math.random() * Math.PI * 2,
      yBase: (Math.random() - 0.5) * 220,
      speed: 0.05 + Math.random() * 0.12,
      size: 1.5 + Math.random() * 4.5,
      wobble: Math.random() * Math.PI * 2,
    }));
  }, [count]);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;
    const scrollShift = heroScroll.progress * 60 * PARALLAX;

    // Glide the local pointer toward the shared cursor, then project it onto
    // the swarm plane so the reaction lands where the cursor visually is.
    damp(pointer.current, "x", pointerState.x, 0.2, delta);
    damp(pointer.current, "y", pointerState.y, 0.2, delta);
    // the cursor projection contracts with the swarm, or the push would land
    // in empty space on a narrow viewport
    const cx = pointer.current.x * CURSOR_SPAN_X * spread;
    const cy = pointer.current.y * CURSOR_SPAN_Y;

    seeds.forEach((s, i) => {
      const a = s.angle + t * s.speed;
      const bx = Math.cos(a) * s.radius * spread;
      const by = s.yBase + Math.sin(t * 0.5 + s.wobble) * 6 - scrollShift;
      const z = Math.sin(a) * s.radius * spread * 0.5 - 40;

      // Cursor only nudges the cube slightly away — no rotation, no scaling.
      cursorPush(bx, by, cx, cy, PUSH_RADIUS, PUSH_STRENGTH, out);

      dummy.position.set(out.x, out.y, z);
      dummy.rotation.set(t * s.speed, a, 0); // idle tumble, cursor-independent
      dummy.scale.setScalar(s.size);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#38BDF8" metalness={0.6} roughness={0.4} transparent opacity={0.6} emissive="#0EA5E9" emissiveIntensity={0.2} />
    </instancedMesh>
  );
}
