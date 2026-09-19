/**
 * Shared cursor-reaction math for the pixel-cube swarms (Hero + Services band).
 *
 * Both scenes read the shared window-level `pointerState` (normalized [-1,1]),
 * project it onto the swarm's plane, then use this to nudge cubes GENTLY AWAY
 * from the pointer.
 *
 * Scope (design decision): the cursor's ONLY effect is a small outward push.
 * It does not rotate, spin, or scale the cubes — their idle float + tumble is
 * untouched; the pointer just parts the swarm a little as it moves through.
 * Quadratic falloff keeps the edge soft. No allocation — caller passes `out`.
 */

export type Vec2 = { x: number; y: number };

/**
 * Displace a cube slightly away from the cursor, with quadratic falloff inside
 * `radius`. Outside the radius the position is returned unchanged.
 *
 * @param x,y      cube position, in the swarm's world units
 * @param cx,cy    cursor position, projected into the same world units
 * @param radius   influence radius (world units)
 * @param strength max outward push at the cursor (world units) — keep it small
 * @param out      reusable vector that receives the displaced position
 */
export function cursorPush(
  x: number,
  y: number,
  cx: number,
  cy: number,
  radius: number,
  strength: number,
  out: Vec2
): void {
  const dx = x - cx;
  const dy = y - cy;
  const d2 = dx * dx + dy * dy;
  const r2 = radius * radius;

  if (d2 >= r2) {
    out.x = x;
    out.y = y;
    return;
  }

  const d = Math.sqrt(d2) || 1e-4;
  const f = 1 - d / radius; // 1 at the cursor → 0 at the edge
  const push = f * f * strength; // quadratic falloff feels softer than linear
  out.x = x + (dx / d) * push;
  out.y = y + (dy / d) * push;
}
