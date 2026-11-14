import type { Metadata } from "next";
import PortfolioPage from "@/components/landing/PortfolioPage";
import { pageMetadata } from "@/lib/seo/metadata";
import { PORTFOLIO, PORTFOLIO_PATH } from "@/lib/seo/portfolio";

/** Portfolio outline; copy and rationale live in lib/seo/portfolio.ts. */
const pl = PORTFOLIO.pl;

export const metadata: Metadata = pageMetadata({
  title: pl.title,
  description: pl.description,
  path: PORTFOLIO_PATH,
});

export default function Page() {
  return <PortfolioPage />;
}
