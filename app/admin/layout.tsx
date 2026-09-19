import type { Metadata } from "next";

/** Outer /admin shell. No auth here — the gate is in (dashboard)/layout.tsx,
 *  so /admin/login can render without one. */
export const metadata: Metadata = {
  title: "Webcraft — admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh">{children}</div>;
}
