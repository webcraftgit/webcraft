import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/server";
import SignOutButton from "@/components/admin/SignOutButton";

export const dynamic = "force-dynamic"; // a cached dashboard is a leaked dashboard

/**
 * The real gate. Middleware only proved a session exists; this proves the
 * session belongs to someone in `admin_users`. A non-admin who somehow signs in
 * lands here and gets bounced — and even if they didn't, RLS would hand them
 * zero rows.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = await requireAdmin();
  if (!user) redirect("/admin/login");
  if (!isAdmin) redirect("/admin/login?denied=1");

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-[var(--glass-border)] bg-[rgba(5,8,15,0.85)] backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-6 py-4">
          <Link href="/admin" className="font-display text-[17px] font-medium text-ink">
            Webcraft <span className="text-brand-400">admin</span>
          </Link>
          <nav className="flex gap-4 text-[14px]">
            <Link href="/admin" className="text-ink-soft hover:text-ink">Overview</Link>
            <Link href="/admin/inquiries" className="text-ink-soft hover:text-ink">Inquiries</Link>
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden text-[13px] text-ink-soft sm:inline">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-6 py-10">{children}</main>
    </div>
  );
}
