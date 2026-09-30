"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

/** Copies the client's portal link. Falls back to selecting the text if the
 *  clipboard API is blocked (http, older browsers). */
export function CopyLink({ url }: { url: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <span className="flex min-w-0 items-center gap-2">
      <input
        readOnly
        value={url}
        aria-label="Client portal link"
        onFocus={(e) => e.currentTarget.select()}
        className="min-w-0 flex-1 truncate rounded-input border border-[var(--glass-border)] bg-[rgba(5,8,15,0.55)] px-3 py-2 font-mono text-[12px] text-ink-soft"
      />
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setState("copied");
          } catch {
            setState("failed");
          }
          setTimeout(() => setState("idle"), 2000);
        }}
        className="min-h-[36px] shrink-0 rounded-full bg-brand-400 px-4 text-[13px] font-semibold text-[#05080F] hover:bg-brand-300"
      >
        {state === "copied" ? "Copied ✓" : state === "failed" ? "Select + copy" : "Copy link"}
      </button>
    </span>
  );
}

/** A submit button that asks first. For actions that can't be undone. */
export function ConfirmSubmit({
  children, confirm, danger = false,
}: { children: React.ReactNode; confirm: string; danger?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
      className={`min-h-[36px] rounded-full border px-4 text-[13px] transition-colors disabled:opacity-50 ${
        danger
          ? "border-red-400/30 text-red-300 hover:border-red-400/60 hover:bg-red-400/10"
          : "border-[var(--glass-border)] text-ink-soft hover:border-[var(--glass-border-hover)] hover:text-ink"
      }`}
    >
      {pending ? "…" : children}
    </button>
  );
}

/** Plain submit with a pending state, so a slow network doesn't invite double clicks. */
export function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[40px] rounded-full bg-brand-400 px-5 text-[13.5px] font-semibold text-[#05080F] hover:bg-brand-300 disabled:opacity-50"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}
