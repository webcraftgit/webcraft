import SmoothScroll from "@/components/layout/SmoothScroll";
import Navbar from "@/components/layout/Navbar";
import ConsentProvider from "@/components/analytics/ConsentProvider";
import ConsentBanner from "@/components/analytics/ConsentBanner";
import Analytics from "@/components/analytics/Analytics";

/**
 * Marketing shell (CP6-backend). The route group `(site)` adds no path segment,
 * so `/`, `/showcase` and `/privacy` are unchanged — but /admin now sits
 * outside this tree and gets none of it: no Lenis, no navbar, no tracker.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsentProvider>
      <SmoothScroll>
        <Navbar />
        {children}
      </SmoothScroll>
      <ConsentBanner />
      <Analytics />
    </ConsentProvider>
  );
}
