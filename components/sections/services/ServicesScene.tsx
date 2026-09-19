"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { damp } from "maath/easing";
import { servicesScroll } from "@/lib/scroll-state";
import { pointerState, ensurePointerTracking } from "@/lib/pointer-state";
import { cursorPush, type Vec2 } from "@/lib/cube-interaction";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

// Cursor projection + reaction for the band swarm. Camera z=6, fov 45 → the
// visible half-height at the swarm plane is ≈ 2.9 world units; these spans put
// the reaction under the cursor. The cursor's ONLY effect is a small push away
// (no rotation, no scaling) — matches the hero; idle float/tumble is untouched.
const BAND_CURSOR_SPAN_X = 6.2;
const BAND_CURSOR_SPAN_Y = 3.4;
const BAND_PUSH_RADIUS = 1.6; // world units
const BAND_PUSH_STRENGTH = 0.4; // small outward nudge at the cursor

// The four larger fragment cubes push away the same way, tuned for their size.
const FRAG_PUSH_RADIUS = 3.0; // world units
const FRAG_PUSH_STRENGTH = 0.55; // small outward nudge at the cursor

/** Cheap procedural nebula — two breathing radial glows, no textures. */
function Nebula() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uScroll: { value: 0 } }),
    []
  );

  useFrame((state) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value = state.clock.elapsedTime;
    mat.current.uniforms.uScroll.value = servicesScroll.progress;
  });

  return (
    <mesh position={[0, 0, -4]} scale={[30, 18, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform float uTime;
          uniform float uScroll;
          void main() {
            vec2 uv = vUv;
            vec2 c1 = vec2(0.28 + sin(uTime * 0.05) * 0.02, 0.62 - uScroll * 0.12);
            vec2 c2 = vec2(0.74 - sin(uTime * 0.04) * 0.02, 0.30 + uScroll * 0.10);
            float g1 = smoothstep(0.55, 0.0, distance(uv, c1));
            float g2 = smoothstep(0.5, 0.0, distance(uv, c2));
            vec3 cyan = vec3(0.22, 0.741, 0.973);  // brand 400
            vec3 deep = vec3(0.027, 0.349, 0.522); // brand 700
            vec3 col = cyan * g1 * 0.2 + deep * g2 * 0.3;
            float a = clamp(g1 * 0.32 + g2 * 0.42, 0.0, 0.55);
            gl_FragColor = vec4(col, a);
          }
        `}
      />
    </mesh>
  );
}

/** Sparse drifting pixel-cubes — the hero's fragment motif continuing down-page. */
function BandParticles({ count = 150 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pointer = useRef({ x: 0, y: 0 });
  const out = useMemo<Vec2>(() => ({ x: 0, y: 0 }), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 16,
        y: (Math.random() - 0.5) * 9,
        z: (Math.random() - 0.5) * 4 - 1,
        size: 0.07 + Math.random() * 0.16,
        speed: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
      })),
    [count]
  );

  useFrame((state, delta) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;
    const scroll = servicesScroll.progress;

    // Ease toward the shared cursor so the reaction glides.
    damp(pointer.current, "x", pointerState.x, 0.25, delta);
    damp(pointer.current, "y", pointerState.y, 0.25, delta);
    const px = pointer.current.x;
    const py = pointer.current.y;
    // Cursor projected into the swarm's world units for the proximity reaction.
    const cx = px * BAND_CURSOR_SPAN_X;
    const cy = py * BAND_CURSOR_SPAN_Y;

    seeds.forEach((s, i) => {
      // Position comes from idle drift + scroll; the cursor only nudges it away.
      const bx = s.x + Math.sin(t * 0.05 * s.speed + s.phase) * 0.4;
      const by =
        s.y + Math.cos(t * 0.06 * s.speed + s.phase) * 0.3 + scroll * (i % 3) * 0.6;

      cursorPush(bx, by, cx, cy, BAND_PUSH_RADIUS, BAND_PUSH_STRENGTH, out);

      dummy.position.set(out.x, out.y, s.z);
      dummy.rotation.set(t * 0.05 * s.speed, s.phase + t * 0.04, 0); // idle only
      dummy.scale.setScalar(s.size);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#7DD3FC"
        transparent
        opacity={0.45}
        roughness={0.5}
        metalness={0.3}
        emissive="#0EA5E9"
        emissiveIntensity={0.25}
      />
    </instancedMesh>
  );
}

/** Four larger fragment cubes for foreground depth. */
function DriftFragments() {
  const group = useRef<THREE.Group>(null);
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#38BDF8",
        metalness: 0.6,
        roughness: 0.35,
        clearcoat: 0.8,
        emissive: "#0EA5E9",
        emissiveIntensity: 0.12,
      }),
    []
  );
  const cubes = useMemo(
    () => [
      { p: [-5.4, 1.6, -1.5] as const, s: 0.8, r: 0.4 },
      { p: [5.8, -1.2, -2] as const, s: 1.1, r: 1.2 },
      { p: [-4.6, -2.1, -1] as const, s: 0.55, r: 2.1 },
      { p: [4.9, 2.2, -1.2] as const, s: 0.68, r: 0.9 },
    ],
    []
  );

  const pointer = useRef({ x: 0, y: 0 });
  const out = useMemo<Vec2>(() => ({ x: 0, y: 0 }), []);

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;

    // Ease toward the shared cursor, projected into the scene's world units.
    damp(pointer.current, "x", pointerState.x, 0.18, delta);
    damp(pointer.current, "y", pointerState.y, 0.18, delta);
    const cx = pointer.current.x * BAND_CURSOR_SPAN_X;
    const cy = pointer.current.y * BAND_CURSOR_SPAN_Y;

    group.current.children.forEach((child, i) => {
      const restX = cubes[i].p[0];
      const restY =
        cubes[i].p[1] +
        Math.sin(t * 0.25 + i * 2) * 0.25 +
        servicesScroll.progress * (i % 2 ? 0.8 : -0.6);

      // Cursor only nudges the fragment slightly away — idle float + tumble stay.
      cursorPush(restX, restY, cx, cy, FRAG_PUSH_RADIUS, FRAG_PUSH_STRENGTH, out);
      child.position.x = out.x;
      child.position.y = out.y;
      child.rotation.x += delta * 0.12; // idle tumble, cursor-independent
      child.rotation.y += delta * 0.09;
    });
  });

  return (
    <group ref={group}>
      {cubes.map((c, i) => (
        <mesh key={i} position={[...c.p]} rotation={[c.r, c.r * 0.6, 0]} scale={c.s} material={mat}>
          <boxGeometry args={[1, 1, 1]} />
        </mesh>
      ))}
    </group>
  );
}

export default function ServicesScene({ active }: { active: boolean }) {
  const reduced = usePrefersReducedMotion();

  // Start the shared window-level cursor tracker so the background scene
  // (which never receives its own pointer events) can still react to it.
  useEffect(() => {
    if (!reduced) ensurePointerTracking();
  }, [reduced]);

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      frameloop={active && !reduced ? "always" : "demand"}
      aria-hidden
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 6]} intensity={0.9} color="#A5F3FC" />
      <Nebula />
      {!reduced && (
        <>
          <BandParticles />
          <DriftFragments />
        </>
      )}
    </Canvas>
  );
}
