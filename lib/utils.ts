import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Arrow-key handler for a `role="radiogroup"` of `role="radio"` buttons (the
 * ARIA radio pattern: one tab stop, arrows move AND select). Put it on the
 * group's onKeyDown; pair it with tabIndex 0 on the checked radio, -1 on the
 * rest. Selecting is done by clicking the target, so each radio's own
 * onClick stays the single source of truth.
 */
export function radioGroupKeys(e: React.KeyboardEvent<HTMLElement>) {
  const step =
    e.key === "ArrowRight" || e.key === "ArrowDown" ? 1
    : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1
    : 0;
  if (!step) return;
  const radios = Array.from(
    e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')
  );
  const cur = radios.indexOf(document.activeElement as HTMLElement);
  if (cur === -1) return;
  e.preventDefault();
  const next = radios[(cur + step + radios.length) % radios.length];
  next.focus();
  next.click();
}
