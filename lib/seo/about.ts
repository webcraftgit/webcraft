/**
 * /about copy (agent readiness pass, 2026-10-08).
 *
 * A trust page: it is what search engines and AI agents read to decide
 * whether a small site is a real business before recommending it. So it says
 * only things that are already true elsewhere on the site — who runs it (the
 * same person /privacy names as data controller), where, since when, what we
 * sell (lib/pricing.ts) and what we do NOT claim (no clients shown as real, no
 * invented reviews). Same rule as lib/seo/landings.ts: no new promises.
 *
 * Shape is LandingCopy so it renders through components/landing/LandingPage
 * and the Markdown mirror without a second template.
 */
import { CARE_PLAN, FOUNDING_SLOTS, TIERS, fmt } from "@/lib/pricing";
import { CONTACT_EMAIL, CONTACT_PHONE, ORG } from "@/lib/site";
import type { Locale } from "@/lib/i18n/config";
import type { LandingCopy } from "@/lib/seo/landings";

export const ABOUT_PATH = "/about" as const;

const minFrom = Math.min(...TIERS.map((t) => t.from));
const p = (n: number) => fmt(n, "pl", "zł");
const e = (n: number) => fmt(n, "en", "PLN");

export const ABOUT: Record<Locale, LandingCopy> = {
  pl: {
    title: "O nas | Weturn Studio",
    description:
      "Kim jesteśmy: Weturn Studio to warszawskie studio stron internetowych prowadzone przez Krzysztofa Powierżę. Kto stoi za stroną, jak pracujemy i czego nie obiecujemy.",
    label: "O nas",
    eyebrow: `O studiu · ${ORG.city}, od ${ORG.founded}`,
    h1: "Weturn Studio: kto stoi za tą stroną.",
    intro: `${ORG.name} (Weturn Studio) to studio cyfrowe z Warszawy, założone w ${ORG.founded} roku. Projektujemy i budujemy strony internetowe dla firm, a po starcie się nimi opiekujemy. Pracujemy zdalnie z klientami z całej Polski, po polsku i po angielsku.`,
    sections: [
      {
        h: "Kto prowadzi studio",
        p: [
          "Studio prowadzi Krzysztof Powierża. To on prowadzi rozmowę wstępną, projektuje i pisze kod, więc od pierwszego maila do publikacji rozmawiasz z osobą, która faktycznie robi Twoją stronę, a nie z opiekunem klienta.",
          "Weturn nie jest zarejestrowaną spółką: działalność prowadzi osoba prywatna, co uczciwie opisujemy też w polityce prywatności.",
        ],
      },
      {
        h: "Co robimy",
        list: [
          `Strony internetowe dla firm: od jednej strony sprzedażowej po rozbudowane serwisy, od ${p(minFrom)} netto`,
          `Opiekę nad stroną po starcie: hosting, aktualizacje i drobne zmiany za ${p(CARE_PLAN.monthly)} miesięcznie`,
          "Krótkie formy wideo do mediów społecznościowych",
          "Materiały marki i projekty do druku",
        ],
      },
      {
        h: "Jak pracujemy",
        list: [
          "Każdą stronę piszemy od podstaw, bez gotowych motywów i wtyczek",
          "Teksty strony piszemy za Ciebie, na podstawie rozmowy i krótkiej ankiety",
          "Cenę ustalamy przed startem prac, płatność dzielimy 50% / 50%",
          "Domena i kod należą do Ciebie, a na życzenie przekazujemy cały projekt",
        ],
      },
      {
        h: "Czego nie twierdzimy",
        p: [
          `Studio jest nowe. Strony w sekcji „Demo” to koncepcyjne projekty fikcyjnych marek, zbudowane jako pokaz możliwości, a nie realizacje dla klientów. Nie publikujemy opinii ani ocen, bo nie wymyślamy referencji. Dlatego pierwsze ${FOUNDING_SLOTS} projektów realizujemy w stawkach założycielskich.`,
        ],
      },
    ],
    faqHeading: "Krótko o nas",
    faq: [
      {
        q: "Gdzie jesteście?",
        a: `W Warszawie (${ORG.region}). Nie mamy biura dla klientów: rozmowy i kolejne etapy prowadzimy online, z firmami z całej Polski.`,
      },
      {
        q: "Jak się z Wami skontaktować?",
        a: `Przez formularz na stronie głównej, mailowo (${CONTACT_EMAIL}) albo telefonicznie (${CONTACT_PHONE}). Odpowiadamy w ciągu jednego dnia roboczego.`,
      },
    ],
    ctaHeading: "Porozmawiajmy o Twojej stronie.",
    ctaBody: "Odpowiadamy w ciągu jednego dnia roboczego, z konkretną propozycją zakresu i ceny.",
    cta: "Rozpocznij projekt",
    relatedHeading: "Zobacz też",
  },
  en: {
    title: "About | Weturn Studio",
    description:
      "Who we are: Weturn Studio is a Warsaw web design studio run by Krzysztof Powierża. Who is behind the site, how we work and what we don't claim.",
    label: "About",
    eyebrow: `About the studio · Warsaw, since ${ORG.founded}`,
    h1: "Weturn Studio: who is behind this site.",
    intro: `${ORG.name} (Weturn Studio) is a digital studio in Warsaw, founded in ${ORG.founded}. We design and build websites for businesses, and look after them once they are live. We work remotely with clients across Poland, in Polish and English.`,
    sections: [
      {
        h: "Who runs the studio",
        p: [
          "The studio is run by Krzysztof Powierża. He takes the discovery call, designs and writes the code, so from the first email to launch you talk to the person actually building your site, not an account manager.",
          "Weturn is not a registered company: it is run by a private individual, which our privacy policy states plainly too.",
        ],
      },
      {
        h: "What we do",
        list: [
          `Websites for businesses, from a single sales page to multi-page sites, from ${e(minFrom)} excl. VAT`,
          `Care after launch: hosting, updates and small changes for ${e(CARE_PLAN.monthly)} a month`,
          "Short-form video for social media",
          "Brand assets and print design",
        ],
      },
      {
        h: "How we work",
        list: [
          "Every site is written from scratch, no off-the-shelf themes or plugins",
          "We write the site's copy for you, from a call and a short questionnaire",
          "The price is fixed before work starts, paid 50% / 50%",
          "The domain and the code are yours, and we hand over the whole project on request",
        ],
      },
      {
        h: "What we don't claim",
        p: [
          `The studio is new. The sites in the “Showcase” section are concept builds for fictional brands, made to show what we can do, not client work. We publish no reviews or ratings, because we don't invent testimonials. That is why our first ${FOUNDING_SLOTS} projects are priced at founding rates.`,
        ],
      },
    ],
    faqHeading: "About us, briefly",
    faq: [
      {
        q: "Where are you based?",
        a: "In Warsaw, Poland. There is no client-facing office: calls and every later step happen online, with businesses all over Poland.",
      },
      {
        q: "How do I get in touch?",
        a: `Through the form on the home page, by email (${CONTACT_EMAIL}) or by phone (${CONTACT_PHONE}). We reply within one business day.`,
      },
    ],
    ctaHeading: "Let's talk about your website.",
    ctaBody: "We reply within one business day with a concrete scope and price.",
    cta: "Start a project",
    relatedHeading: "See also",
  },
};
