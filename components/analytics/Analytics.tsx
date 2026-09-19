"use client";

import { useEffect } from "react";
import { useConsent } from "./ConsentProvider";
import { installFlushHandlers, setAnalyticsEnabled, track, type EventName } from "@/lib/analytics/track";

/**
 * The instrumentation layer (CP6-backend).
 *
 * Everything is delegated or observed — no section component had to be
 * rewritten to be measured, which keeps the marketing code clean and means a
 * future section is tracked the moment it has an id.
 *
 *   section_view   IntersectionObserver over `section[id]`, once per session
 *   scroll_depth   25/50/75/100 thresholds, once each
 *   cta_click etc. one delegated listener reading [data-track]
 *   form_start     first focus inside the contact form
 *   form_submit    dispatched by ContactSection via the `wc:track` event
 *
 * Every one of these is behind `track()`, which is a no-op until consent.
 */
export default function Analytics() {
  const { consent } = useConsent();
  const on = Boolean(consent?.analytics);

  useEffect(() => {
    setAnalyticsEnabled(consent);
    if (!on) return;

    const teardown = installFlushHandlers();

    if (!sessionStorage.getItem("wc-started")) {
      sessionStorage.setItem("wc-started", "1");
      track("session_start");
    }
    track("page_view");

    // ——— sections seen ———
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = e.target.id;
          if (e.isIntersecting && id && !seen.has(id)) {
            seen.add(id);
            track("section_view", { section: id });
          }
        }
      },
      { threshold: 0.4 }
    );
    document.querySelectorAll("section[id]").forEach((s) => io.observe(s));

    // ——— scroll depth ———
    const hit = new Set<number>();
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const pct = Math.round((window.scrollY / max) * 100);
      for (const step of [25, 50, 75, 100]) {
        if (pct >= step && !hit.has(step)) {
          hit.add(step);
          track("scroll_depth", { pct: step });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // ——— delegated clicks: <button data-track="cta_click" data-track-value="hero"> ———
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest?.("[data-track]") as HTMLElement | null;
      if (!el) return;
      const name = el.dataset.track as EventName;
      const value = el.dataset.trackValue;
      track(name, value ? { value } : {});
    };
    document.addEventListener("click", onClick, true);

    // ——— form engagement ———
    let started = false;
    const onFocus = (e: FocusEvent) => {
      if (started) return;
      if ((e.target as HTMLElement)?.closest?.("#contact form")) {
        started = true;
        track("form_start");
      }
    };
    document.addEventListener("focusin", onFocus);

    // ——— explicit events from components ———
    const onCustom = (e: Event) => {
      const d = (e as CustomEvent<{ name: EventName; props?: Record<string, string | number> }>).detail;
      if (d?.name) track(d.name, d.props ?? {});
    };
    window.addEventListener("wc:track", onCustom);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("focusin", onFocus);
      window.removeEventListener("wc:track", onCustom);
      teardown();
    };
  }, [consent, on]);

  return null;
}
