"use client";
import { createBrowserClient } from "@supabase/ssr";

/** Browser client — anon key only. RLS gives it nothing without a session. */
export const supabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
