"use client";

import ShowcaseGallery from "@/components/showcase/ShowcaseGallery";
import { useReveal } from "@/hooks/useReveal";
import { useT } from "@/components/i18n/LanguageProvider";

/**
 * Showcase, embedded on the home page (CP3.7): the two demo sites run live
 * right here — no detour link. Click a running preview to open it fullscreen.
 */
export default function ShowcaseSection() {
  const t = useT();
  const reveal = useReveal<HTMLDivElement>();

  return (
    <section id="showcase" className="container-x pb-[clamp(96px,12vw,160px)]">
      <div ref={reveal}>
        <p data-reveal className="eyebrow mb-4">
          {t.showcase.eyebrow}
        </p>
        <h2 data-reveal className="heading-2 max-w-[20ch]">
          {t.showcase.heading}
        </h2>
        <p data-reveal className="mt-5 max-w-[58ch] text-lg text-ink-soft">
          {t.showcase.intro}
        </p>
      </div>

      <div className="mt-12 md:mt-16">
        <ShowcaseGallery />
      </div>

      <p className="mt-10 max-w-[60ch] text-[14px] leading-relaxed text-ink-soft">
        {t.showcase.footnote}
      </p>
    </section>
  );
}
