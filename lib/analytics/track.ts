"use client";

import type { Consent } from "./consent";

/**
 * First-party analytics client (CP6-backend). No third party, no ad network,
 * no fingerprinting — the identifiers are two random UUIDs we mint ourselves
 * and delete the moment consent is withdrawn.
 *
 *   visitor_id  localStorage  — "is this the same browser as last week"
 *   session_id  sessionStorage — "is this the same visit"
 *
 * Events are BATCHED and flushed with sendBeacon on pagehide. A per-event
 * fetch would be a request storm during scroll and would drop the last event
 * of every session (the one that tells you where people leave).
 */

export type EventName =
  | "page_view" | "session_start" | "section_view" | "form_start" | "form_submit"
  | "tier_select" | "budget_select" | "readiness_select" | "cta_click"
  | "demo_open" | "lang_switch" | "faq_open" | "scroll_depth";

type Queued = { name: EventName; props: Record<string, string | number>; ts: number };

const VID = "wc-vid";
const SID = "wc-sid";
const UTM = "wc-utm";

let queue: Queued[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let enabled = false;

const device = (): "mobile" | "tablet" | "desktop" => {
  const w = window.innerWidth;
  return w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
};

function ids() {
  let vid = localStorage.getItem(VID);
  if (!vid) { vid = crypto.randomUUID(); localStorage.setItem(VID, vid); }
  let sid = sessionStorage.getItem(SID);
  if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem(SID, sid); }
  return { vid, sid };
}

/** Captured once per session: later page views keep the original attribution. */
function attribution() {
  const cached = sessionStorage.getItem(UTM);
  if (cached) return JSON.parse(cached) as Record<string, string>;
  const q = new URLSearchParams(location.search);
  const a = {
    utm_source: q.get("utm_source") ?? "",
    utm_medium: q.get("utm_medium") ?? "",
    utm_campaign: q.get("utm_campaign") ?? "",
    referrer: document.referrer ?? "",
  };
  sessionStorage.setItem(UTM, JSON.stringify(a));
  return a;
}

function payload() {
  const { vid, sid } = ids();
  return {
    visitor_id: vid,
    session_id: sid,
    locale: document.documentElement.lang || "pl",
    device: device(),
    viewport_w: window.innerWidth,
    viewport_h: window.innerHeight,
    path: location.pathname.slice(0, 256),
    ...attribution(),
    events: queue,
  };
}

function flush(beacon = false) {
  if (!enabled || queue.length === 0) return;
  const body = JSON.stringify(payload());
  queue = [];
  if (timer) { clearTimeout(timer); timer = null; }

  // sendBeacon survives the page unloading; fetch does not, reliably.
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function track(name: EventName, props: Record<string, string | number> = {}) {
  if (!enabled) return; // the hard gate. No consent → this is a no-op.
  queue.push({ name, props, ts: Date.now() });
  if (queue.length >= 20) return flush();
  if (!timer) timer = setTimeout(() => flush(), 3000);
}

/** Called by <Analytics/> whenever the consent decision changes. */
export function setAnalyticsEnabled(consent: Consent | null) {
  const next = Boolean(consent?.analytics);
  if (next === enabled) return;
  enabled = next;
  if (!enabled) {
    queue = [];
    if (timer) { clearTimeout(timer); timer = null; }
    try { localStorage.removeItem(VID); sessionStorage.removeItem(SID); sessionStorage.removeItem(UTM); } catch {}
  }
}

export function installFlushHandlers() {
  const onHide = () => { if (document.visibilityState === "hidden") flush(true); };
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", () => flush(true));
  return () => document.removeEventListener("visibilitychange", onHide);
}

/**
 * Attribution for the contact form. Returns nulls unless analytics consent is
 * live — the API re-checks the cookie anyway, but sending nothing is cleaner
 * than sending data the server will throw away.
 */
export function currentAttribution() {
  if (!enabled) return { analytics_consent: false as const };
  try {
    const a = JSON.parse(sessionStorage.getItem(UTM) ?? "{}") as Record<string, string>;
    return {
      analytics_consent: true as const,
      visitor_id: localStorage.getItem(VID),
      session_id: sessionStorage.getItem(SID),
      referrer: a.referrer || null,
      utm_source: a.utm_source || null,
      utm_medium: a.utm_medium || null,
      utm_campaign: a.utm_campaign || null,
    };
  } catch {
    return { analytics_consent: false as const };
  }
}
