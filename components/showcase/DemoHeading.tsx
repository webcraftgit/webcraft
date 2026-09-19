"use client";

import { createContext, useContext, type CSSProperties, type ReactNode } from "react";

/**
 * Preview-aware heading for the demo sites (CP4_17-seo).
 *
 * THE PROBLEM THIS SOLVES. The gallery renders each concept site LIVE inside
 * its card on the home page (CP3.6). Those sites are complete pages, so each
 * one shipped its own <h1> plus a few hundred words of fictional brand copy —
 * a dental clinic, a whiskey label, a clothing store — straight into the DOM
 * of `/`. Consequences, in order of how much they cost:
 *   1. The home page had FOUR <h1>s, three of them about other businesses.
 *   2. The dominant body text on Webcraft's home page was not about Webcraft.
 *      A crawler weighing "what is this page about" reads far more Polish
 *      dental copy than studio copy.
 *   3. A fictional clinic's prices and phone CTA sat on a real domain.
 * They are not in the server-rendered HTML (the previews are
 * IntersectionObserver-gated), but Googlebot executes JavaScript and expands
 * the viewport to trigger lazy content, so the safe assumption is that it
 * sees them.
 *
 * WHY A CONTEXT rather than a `preview` prop on every heading: the headings
 * sit at different depths inside four independent site components, some
 * inside sub-components that never received `preview`. A context set once by
 * the gallery reaches all of them and cannot be forgotten when a fifth demo
 * is added.
 *
 * In `preview` the tag becomes a <div>: visually identical (all styling is on
 * className/style), semantically inert. Opened fullscreen — where the demo IS
 * the page and its heading structure is part of what is being shown off — it
 * is a real <h1> again.
 */
export const DemoPreviewContext = createContext(false);

export function useIsDemoPreview() {
  return useContext(DemoPreviewContext);
}

export default function DemoHeading({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const preview = useIsDemoPreview();
  // Cast so TS types the props as heading props in both branches; the runtime
  // value is what matters here.
  const Tag = (preview ? "div" : "h1") as "h1";
  return (
    <Tag className={className} style={style}>
      {children}
    </Tag>
  );
}
