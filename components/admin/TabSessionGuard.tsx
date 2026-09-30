"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Ends the admin session when its tab closes.
 *
 * Cookies are shared by every tab, so they can't do this alone (they already
 * end when the whole browser closes: lib/supabase/cookie-options.ts). The
 * login page leaves a mark in sessionStorage, which belongs to one tab,
 * survives reloads and is wiped when that tab closes. A dashboard tab without
 * the mark (a reopened tab, or a new tab) signs out and goes to the login.
 *
 * Side effect, on purpose: opening the admin in a second tab signs out the
 * first one too, because the sign-out clears the shared cookies. One admin
 * tab at a time.
 *
 * This is a convenience lock for a shared computer, not a security boundary:
 * the server still trusts the cookie, and RLS still gates every row.
 */
export const TAB_MARK = "weturn-admin-tab";

/** Called by the login page after a successful sign-in. */
export function markTabSignedIn() {
  try {
    sessionStorage.setItem(TAB_MARK, "1");
  } catch {
    // storage blocked: the guard below then lets the tab through
  }
}

function tabIsSignedIn(): boolean {
  try {
    return sessionStorage.getItem(TAB_MARK) === "1";
  } catch {
    // No sessionStorage (blocked by the browser): don't lock the admin out.
    return true;
  }
}

// sessionStorage has no change events within a tab; the value only matters at load.
const subscribe = () => () => {};

export default function TabSessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // false on the server (no storage there), the real answer in the browser.
  const ok = useSyncExternalStore(subscribe, tabIsSignedIn, () => false);

  useEffect(() => {
    // Check storage itself, not `ok`: during hydration `ok` is briefly the
    // server's `false` even in a signed-in tab.
    if (tabIsSignedIn()) return;
    (async () => {
      await supabaseBrowser()?.auth.signOut({ scope: "local" });
      router.replace("/admin/login");
      router.refresh();
    })();
  }, [ok, router]);

  // Keep the dashboard out of sight until this tab is confirmed.
  return ok ? <>{children}</> : <div className="min-h-dvh" aria-busy="true" />;
}
