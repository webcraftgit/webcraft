/**
 * Shared mutable pointer state, written by a single global `pointermove`
 * listener and read inside R3F's useFrame without triggering React re-renders.
 *
 * Background <Canvas> layers (like the services scene) sit behind the page
 * content, so they never receive their own pointer events — R3F's built-in
 * `state.pointer` stays at 0,0 for them. Tracking the pointer once at the
 * window level and sharing it here lets those scenes react to the cursor
 * anyway, matching the scroll-state approach used elsewhere.
 *
 * x / y are normalized to [-1, 1] with the viewport center at 0,0 and +y up
 * (screen-Y is flipped so it lines up with three.js coordinates).
 */
export const pointerState = { x: 0, y: 0 };

let installed = false;

/** Idempotently attach the single window listener. Safe to call from any effect. */
export function ensurePointerTracking() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const onMove = (e: PointerEvent) => {
    pointerState.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointerState.y = -((e.clientY / window.innerHeight) * 2 - 1);
  };

  window.addEventListener("pointermove", onMove, { passive: true });
}
