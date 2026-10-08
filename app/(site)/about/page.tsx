import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import LandingPage from "@/components/landing/LandingPage";
import { pageMetadata } from "@/lib/seo/metadata";
import { aboutGraph } from "@/lib/seo/schema";
import { ABOUT, ABOUT_PATH } from "@/lib/seo/about";

/** Trust page; copy and rationale live in lib/seo/about.ts. */
const pl = ABOUT.pl;

export const metadata: Metadata = pageMetadata({
  title: pl.title,
  description: pl.description,
  path: ABOUT_PATH,
});

export default function Page() {
  return (
    <>
      <JsonLd data={aboutGraph} />
      <LandingPage path={ABOUT_PATH} />
    </>
  );
}
