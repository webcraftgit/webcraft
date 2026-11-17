import Skeleton from "@/components/ui/Skeleton";

/**
 * Loading shapes for the pages that wait on Supabase: the admin pages and the
 * client portal. The marketing pages are static, so they need none. Each
 * mirrors the real page's frame (heading, then cards) so nothing jumps when
 * the data arrives.
 */

/** Admin overview, inquiries, projects and project detail: heading plus rows. */
export function AdminSkeleton() {
  return (
    <div>
      <p role="status" className="sr-only">Loading</p>
      <div aria-hidden>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-3 w-80 max-w-full" />
        <div className="mt-8 space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="glass flex flex-wrap items-center gap-4 rounded-card p-5">
              <div className="min-w-[200px] flex-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="mt-3 h-3 w-3/4" />
              </div>
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-9 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Client portal: name and status header, the clock card, then the stage list. */
export function PortalSkeleton() {
  return (
    <main className="mx-auto max-w-[860px] px-4 py-10 sm:px-6 sm:py-16">
      <p role="status" className="sr-only">Loading</p>
      <div aria-hidden>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-4 h-8 w-64 max-w-full" />
            <Skeleton className="mt-3 h-3 w-48" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <section className="glass mt-8 rounded-panel p-6 sm:p-8">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="mt-5 h-1.5 w-full" />
          <Skeleton className="mt-5 h-3 w-3/4" />
          <Skeleton className="mt-3 h-3 w-1/2" />
        </section>

        <section className="mt-10">
          <Skeleton className="h-3 w-20" />
          <div className="glass mt-3 divide-y divide-[var(--glass-border)] rounded-card">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-5">
                <Skeleton className="h-6 w-6 shrink-0" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="ml-auto h-3 w-16" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
