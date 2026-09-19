/**
 * JSON-LD graph (CP4_17-seo).
 *
 * THE ONE RULE THIS FILE EXISTS TO ENFORCE: structured data must describe what
 * is actually on the page. So nothing here is retyped. Every question, answer,
 * service name and price is READ FROM THE SAME SOURCES THE PAGE RENDERS FROM —
 * `DICTS` for copy, `lib/pricing.ts` for numbers. Reprice in pricing.ts or
 * reword a FAQ answer in the dictionary and the markup follows automatically.
 * Hand-copied schema drifts within one checkpoint and then it is lying to
 * Google, which is a manual-action risk, not a missed opportunity.
 *
 * LOCALE: the graph is built for DEFAULT_LOCALE, because that is the only
 * locale that exists in the server-rendered HTML. Marking up English answers
 * on a page that serves Polish would be exactly the mismatch above.
 *
 * WHAT IS DELIBERATELY NOT HERE:
 *  - AggregateRating / Review. There are no clients yet. The no-fake-numbers
 *    rule that keeps testimonials off this site applies twice as hard in
 *    structured data, where invented ratings are a policy violation.
 *  - A limited-time Offer wrapper on the founding rates. "First 10 slots" is
 *    real but not tracked against a date, and priceValidUntil would be a
 *    guess presented as a fact.
 *  - Exact `price` on the tiers. They are genuinely "from" numbers, so they
 *    are emitted as a PriceSpecification with minPrice/maxPrice.
 *  - postalAddress. There is no public street address; inventing one to
 *    satisfy a schema validator is the same mistake the Wiśniowa demo
 *    refuses to make with ul. Wiśniowa.
 */
import { DICTS } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { CARE_PLAN, TIERS } from "@/lib/pricing";
import { CONTACT_EMAIL, ORG, SITE_URL } from "@/lib/site";
import { abs } from "@/lib/seo/metadata";

const t = DICTS[DEFAULT_LOCALE];
const lang = DEFAULT_LOCALE;

/** Stable @ids so the nodes reference each other instead of repeating
 *  themselves — this is what lets a crawler see one entity, not five. */
const ID = {
  org: `${SITE_URL}/#organization`,
  site: `${SITE_URL}/#website`,
  page: `${SITE_URL}/#webpage`,
  faq: `${SITE_URL}/#faq`,
};

const organization = {
  "@type": ["Organization", "ProfessionalService"],
  "@id": ID.org,
  name: ORG.name,
  url: SITE_URL,
  email: CONTACT_EMAIL,
  logo: { "@type": "ImageObject", url: abs("/logo-w.svg") },
  image: abs("/og.png"),
  description: t.hero.subtitle,
  foundingDate: ORG.founded,
  // City-level only, on purpose — see the file header.
  address: {
    "@type": "PostalAddress",
    addressLocality: ORG.city,
    addressRegion: ORG.region,
    addressCountry: ORG.country,
  },
  areaServed: ORG.areaServed.map((c) => ({ "@type": "Country", name: c })),
  knowsLanguage: ["pl", "en"],
  ...(ORG.sameAs.length ? { sameAs: ORG.sameAs } : {}),
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    email: CONTACT_EMAIL,
    availableLanguage: ["pl", "en"],
  },
};

const website = {
  "@type": "WebSite",
  "@id": ID.site,
  url: SITE_URL,
  name: ORG.name,
  inLanguage: lang,
  publisher: { "@id": ID.org },
};

/** One Service node per wheel disc, priced where a price genuinely exists.
 *  Titles/bodies come from services.items so the markup and the disc face
 *  cannot disagree. */
const services = [
  {
    "@type": "Service",
    name: t.services.items.sell.title,
    description: t.services.items.sell.body,
    provider: { "@id": ID.org },
    inLanguage: lang,
    serviceType: "Web design and development",
    areaServed: ORG.areaServed,
    offers: TIERS.map((tier) => ({
      "@type": "Offer",
      name: t.pricing.tiers[tier.id].name,
      description: t.pricing.tiers[tier.id].tagline,
      priceSpecification: {
        "@type": "PriceSpecification",
        priceCurrency: "PLN",
        minPrice: tier.from,
        maxPrice: tier.upTo,
        valueAddedTaxIncluded: false,
      },
      availability: "https://schema.org/InStock",
      url: abs("/#pricing"),
    })),
  },
  {
    "@type": "Service",
    name: t.services.items.care.title,
    description: t.services.items.care.body,
    provider: { "@id": ID.org },
    inLanguage: lang,
    serviceType: "Website maintenance and hosting",
    areaServed: ORG.areaServed,
    offers: {
      "@type": "Offer",
      name: t.pricing.care.title,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        priceCurrency: "PLN",
        price: CARE_PLAN.monthly,
        unitCode: "MON", // UN/CEFACT: per month
        valueAddedTaxIncluded: false,
      },
      url: abs("/#pricing"),
    },
  },
  {
    "@type": "Service",
    name: t.services.items.video.title,
    description: t.services.items.video.body,
    provider: { "@id": ID.org },
    inLanguage: lang,
    serviceType: "Short-form video production",
    areaServed: ORG.areaServed,
  },
  {
    "@type": "Service",
    name: t.services.items.print.title,
    description: t.services.items.print.body,
    provider: { "@id": ID.org },
    inLanguage: lang,
    serviceType: "Print and display design",
    areaServed: ORG.areaServed,
  },
];

/**
 * FAQPage, straight from faq.items. These answers are the most quotable
 * material on the site — they are specific, honest and answer questions people
 * genuinely type ("how long does a site take", "why does this cost more than
 * 3 000 zł"). That makes them the best candidates for rich results and for
 * being cited by an answer engine.
 */
const faq = {
  "@type": "FAQPage",
  "@id": ID.faq,
  inLanguage: lang,
  mainEntity: t.faq.items.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const webPage = {
  "@type": "WebPage",
  "@id": ID.page,
  url: SITE_URL,
  name: t.hero.titleA + " " + t.hero.titleAccent + t.hero.titleEnd,
  description: t.hero.subtitle,
  inLanguage: lang,
  isPartOf: { "@id": ID.site },
  about: { "@id": ID.org },
  primaryImageOfPage: { "@type": "ImageObject", url: abs("/og.png") },
};

/** The whole graph for `/`. One <script> tag, one @graph — not five sibling
 *  blocks, which makes cross-references impossible to express. */
export const homeGraph = {
  "@context": "https://schema.org",
  "@graph": [organization, website, webPage, faq, ...services],
};

export const privacyGraph = {
  "@context": "https://schema.org",
  "@graph": [
    organization,
    website,
    {
      "@type": "WebPage",
      url: abs("/privacy"),
      name: "Polityka prywatności",
      inLanguage: lang,
      isPartOf: { "@id": ID.site },
      about: { "@id": ID.org },
    },
  ],
};
