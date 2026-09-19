import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo/metadata";
import { homeGraph } from "@/lib/seo/schema";
import Hero from "@/components/sections/Hero";
import ServicesSection from "@/components/sections/services/ServicesSection";
import CraftSection from "@/components/sections/craft/CraftSection";
import ShowcaseSection from "@/components/sections/ShowcaseSection";
import ProcessSection from "@/components/sections/process/ProcessSection";
import PricingSection from "@/components/sections/pricing/PricingSection";
import FAQSection from "@/components/sections/faq/FAQSection";
import ContactSection from "@/components/sections/contact/ContactSection";
import Footer from "@/components/layout/Footer";
import StickyCta from "@/components/ui/StickyCta";

/**
 * Home metadata + structured data (CP4_17-seo).
 *
 * The description is not the hero subtitle verbatim: a SERP snippet has ~155
 * characters and has to answer "what is this and what does it cost" for
 * someone who has not seen the page. The founding-rate line is the only
 * concrete, checkable fact the studio can offer a stranger, so it earns its
 * space here.
 */
export const metadata: Metadata = pageMetadata({
  title: "Tworzenie stron internetowych Warszawa | Webcraft",
  description:
    "Studio cyfrowe: strony szyte na miarę, opieka nad stroną, krótkie wideo i materiały marki. Stawki założycielskie od 3 500 zł, wycena przed startem prac.",
  path: "/",
});

export default function Home() {
  return (
    <main>
      <JsonLd data={homeGraph} />

      <Hero />

      <ServicesSection />

      <CraftSection />

      <ShowcaseSection />

      <ProcessSection />

      <PricingSection />

      <FAQSection />

      <ContactSection />

      <Footer />

      <StickyCta />
    </main>
  );
}
