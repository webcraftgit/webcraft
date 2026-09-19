"use client";

import { useRef, type ReactNode, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { damp } from "maath/easing";
import type { Group } from "three";

const GAIN = 0.0085; // px of pointer travel → rad
const MAX_TILT = 0.3; // rad

/**
 * Grab-and-spin rig, tuned for smoothness:
 *  - while dragging, pointer velocity is low-pass filtered (no jitter)
 *  - on release the object glides on frame-rate-independent exponential
 *    inertia that settles into the idle spin instead of stopping dead
 *  - an optional scrollRot ref adds a scroll-driven base rotation on top,
 *    so a page can slowly turn the object while the user can still grab it
 */
export default function DragSpin({
  children,
  float = 0.08,
  idleSpeed = 0.22,
  scrollRot,
  onGrab,
}: {
  children: ReactNode;
  float?: number;
  /** rad/s of auto-rotation when untouched (0 = rest) */
  idleSpeed?: number;
  /** external base rotation in rad, e.g. driven by page scroll */
  scrollRot?: MutableRefObject<number>;
  onGrab?: (grabbing: boolean) => void;
}) {
  const group = useRef<Group>(null);
  const spin = useRef(0); // accumulated user rotation
  const vel = useRef(idleSpeed); // rad/s
  const tilt = useRef(0);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0, t: 0 });

  useFrame((state, rawDt) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(rawDt, 1 / 30);

    if (!dragging.current) {
      // glide: exponential settle from thrown velocity toward idle spin
      const k = 1 - Math.exp(-dt * 1.6);
      vel.current += (idleSpeed - vel.current) * k;
      spin.current += vel.current * dt;
      tilt.current *= Math.exp(-dt * 3);
    }

    // the model FOLLOWS the hand through a short critically-damped ease
    // instead of snapping to every pointer event — this is what makes the
    // drag feel fluid instead of steppy
    damp(g.rotation, "y", (scrollRot?.current ?? 0) + spin.current, 0.07, dt);
    damp(g.rotation, "x", tilt.current, 0.16, dt);
    g.position.y = Math.sin(state.clock.elapsedTime * 0.8) * float;
  });

  return (
    <group
      onPointerDown={(e) => {
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        dragging.current = true;
        last.current = { x: e.clientX, y: e.clientY, t: performance.now() };
        onGrab?.(true);
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        const now = performance.now();
        const dtE = Math.max(8, now - last.current.t) / 1000;
        const dx = e.clientX - last.current.x;
        const dy = e.clientY - last.current.y;
        last.current = { x: e.clientX, y: e.clientY, t: now };

        spin.current += dx * GAIN; // target follows the hand 1:1
        const instVel = Math.max(-12, Math.min(12, (dx * GAIN) / dtE)); // rad/s, spike-clamped
        vel.current += (instVel - vel.current) * 0.3; // low-pass → smooth throw
        tilt.current = Math.max(
          -MAX_TILT,
          Math.min(MAX_TILT, tilt.current + dy * 0.003)
        );
      }}
      onPointerUp={() => {
        dragging.current = false;
        vel.current = Math.max(-9, Math.min(9, vel.current));
        onGrab?.(false);
      }}
      onPointerLeave={() => {
        if (!dragging.current) return;
        dragging.current = false;
        onGrab?.(false);
      }}
    >
      <group ref={group}>{children}</group>
    </group>
  );
}
