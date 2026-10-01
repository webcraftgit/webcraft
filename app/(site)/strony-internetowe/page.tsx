import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import LandingPage from "@/components/landing/LandingPage";
import { pageMetadata } from "@/lib/seo/metadata";
import { landingGraph } from "@/lib/seo/schema";
import { LANDINGS } from "@/lib/seo/landings";

/** Indexable landing page; copy and rationale live in lib/seo/landings.ts. */
const PATH = "/strony-internetowe" as const;
const pl = LANDINGS[PATH].pl;

export const metadata: Metadata = pageMetadata({
  title: pl.title,
  description: pl.description,
  path: PATH,
});

export default function Page() {
  return (
    <>
      <JsonLd data={landingGraph(PATH)} />
      <LandingPage path={PATH} />
    </>
  );
}
