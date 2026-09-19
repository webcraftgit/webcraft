"use client";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await supabaseBrowser().auth.signOut();
        router.replace("/admin/login");
        router.refresh();
      }}
      className="rounded-full border border-[var(--glass-border)] px-4 py-1.5 text-[13px] text-ink-soft transition-colors hover:border-[var(--glass-border-hover)] hover:text-ink"
    >
      Sign out
    </button>
  );
}
