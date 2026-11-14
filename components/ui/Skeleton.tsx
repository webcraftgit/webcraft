import { cn } from "@/lib/utils";

/**
 * One grey placeholder block. The pulse is `motion-safe`, so with reduced
 * motion it stays a still block. Skeletons are decoration: a wrapper marks
 * them `aria-hidden` and carries one `role="status"` line for screen readers.
 */
export default function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-full bg-white/[0.06] motion-safe:animate-pulse", className)} />;
}
