/**
 * Indexable landing pages (SEO pass, 2026-10-01).
 *
 * WHY THESE EXIST. The home page is one URL, and anchors are not URLs, so
 * `#services` and `#pricing` could never rank for "strona internetowa dla
 * firmy" or "ile kosztuje strona internetowa" on their own. Each entry here is
 * a real route with its own title, H1, canonical and FAQ, aimed at one query
 * people actually type.
 *
 * NO NEW PROMISES. Every timeline, price and term below is the same one the
 * home page makes (lib/i18n/dictionaries.ts) and the agency kit holds us to.
 * Prices are read from lib/pricing.ts, never retyped, so a reprice there moves
 * these pages too. If a commitment changes, change it in the dictionary and
 * check these pages in the same commit.
 *
 * LOCALE: server metadata and JSON-LD use `pl` (the only locale in the
 * server-rendered HTML, same rule as lib/seo/schema.ts). `en` is what the
 * language toggle swaps in client-side.
 */
import { CARE_PLAN, FOUNDING_SLOTS, TIERS, fmt } from "@/lib/pricing";
import type { Locale } from "@/lib/i18n/config";

export type LandingSection = { h: string; p?: string[]; list?: string[] };
export type LandingCopy = {
  /** Server <title> (pl) and the client-side tab title (en). */
  title: string;
  description: string;
  /** Short label for footer links. */
  label: string;
  eyebrow: string;
  h1: string;
  intro: string;
  sections: LandingSection[];
  faqHeading: string;
  faq: { q: string; a: string }[];
  ctaHeading: string;
  ctaBody: string;
  cta: string;
  relatedHeading: string;
};

export const LANDING_PATHS = [
  "/strony-internetowe",
  "/opieka-nad-strona",
  "/ile-kosztuje-strona-internetowa",
] as const;
export type LandingPath = (typeof LANDING_PATHS)[number];

const tier = (id: "launch" | "business" | "signature") => TIERS.find((t) => t.id === id)!;
const p = (n: number) => fmt(n, "pl", "zł");
const e = (n: number) => fmt(n, "en", "PLN");
const [L, B, S] = [tier("launch"), tier("business"), tier("signature")];

export const LANDINGS: Record<LandingPath, Record<Locale, LandingCopy>> = {
  "/strony-internetowe": {
    pl: {
      title: "Strony internetowe dla firm, Warszawa | Weturn",
      description: `Projektowanie i tworzenie stron internetowych dla firm: indywidualny projekt, teksty w cenie, start w 1–2 tygodnie. Od ${p(L.from)}, stała wycena przed startem.`,
      label: "Strony internetowe dla firm",
      eyebrow: "Tworzenie stron internetowych · Warszawa",
      h1: "Strony internetowe dla firm, które mają sprzedawać.",
      intro:
        "Weturn to studio z Warszawy, które projektuje i buduje strony internetowe dla firm w całej Polsce. Bez gotowych szablonów: każdą stronę układamy wokół jednego celu, czyli zamiany odwiedzających w zapytania i klientów.",
      sections: [
        {
          h: "Co dostajesz",
          list: [
            "Indywidualny projekt graficzny, nie podmieniony motyw",
            "Teksty i strukturę strony, które piszemy za Ciebie",
            "Szybkie ładowanie i poprawne działanie na telefonach",
            "Formularz kontaktowy podłączony do Twojej skrzynki",
            "Techniczne podstawy SEO: metadane, nagłówki, mapa strony, dane strukturalne",
            "Analitykę podłączoną od pierwszego dnia",
          ],
        },
        {
          h: "Trzy pakiety, jasne ceny",
          p: [
            `Start: jednostronicowa strona, która dobrze sprzedaje jedną rzecz. Od ${p(L.from)}, zwykle do ${p(L.upTo)}, gotowa w 1 tydzień.`,
            `Biznes: rozbudowana strona do 7 podstron, dwie wersje językowe w cenie i panel do samodzielnej edycji treści. Od ${p(B.from)}, zwykle do ${p(B.upTo)}, gotowa w 2 tygodnie.`,
            `Premium: wszystko z pakietu Biznes plus autorskie sceny 3D i projekt interakcji szyty na miarę. Od ${p(S.from)}, zwykle do ${p(S.upTo)}, gotowa w 2 tygodnie.`,
            `Ceny netto, w stawkach założycielskich dla pierwszych ${FOUNDING_SLOTS} projektów. Dokładną kwotę ustalamy po krótkiej rozmowie, przed rozpoczęciem prac, a płatność dzielimy na 50% na start i 50% przy uruchomieniu.`,
          ],
        },
        {
          h: "Jak wygląda współpraca",
          list: [
            "Analiza (1 dzień): ustalamy, kto trafia na stronę i czego szuka",
            "Projekt (1 dzień): interaktywny prototyp pierwszego ekranu i struktury",
            "Wdrożenie (6 dni): gotowa strona, przetestowana na prawdziwych urządzeniach",
            "Start (2 dni): publikacja, pomiary i pierwsze poprawki",
          ],
          p: [
            "Czasy podajemy dla typowego projektu Biznes, w naszych dniach roboczych. Gdy czekamy na Twoją opinię lub treści, zegar staje.",
          ],
        },
        {
          h: "Dla kogo",
          p: [
            "Dla firm usługowych, gabinetów, sklepów i marek, które chcą, żeby strona realnie przynosiła zapytania, a nie tylko była. Pracujemy zdalnie z klientami z Warszawy i całej Polski, po polsku i po angielsku.",
          ],
        },
      ],
      faqHeading: "Pytania o tworzenie strony",
      faq: [
        {
          q: "Czy robicie strony na WordPressie?",
          a: "Nie budujemy na gotowych motywach. Każda strona jest pisana od podstaw, dzięki czemu ładuje się szybko i nie wymaga ciągłego aktualizowania wtyczek. W pakietach Biznes i Premium treści edytujesz samodzielnie w prostym panelu.",
        },
        {
          q: "Czy strona będzie dobrze wyglądać na telefonie?",
          a: "Tak. Układ projektujemy tak, by na każdej szerokości ekranu układał się od nowa, a nie tylko zmniejszał. Każdą stronę testujemy na prawdziwych telefonach przed publikacją.",
        },
        {
          q: "Czy pracujecie tylko z firmami z Warszawy?",
          a: "Nie. Siedzibę mamy w Warszawie, ale pracujemy zdalnie z firmami z całej Polski. Rozmowa wstępna i kolejne etapy odbywają się online.",
        },
        {
          q: "Do kogo należy strona po zakończeniu projektu?",
          a: "Do Ciebie. Domena jest zawsze zarejestrowana na Ciebie, a jeśli zechcesz prowadzić stronę samodzielnie, przekazujemy cały projekt razem z kodem na Twoje konta.",
        },
      ],
      ctaHeading: "Opowiedz nam o swojej firmie.",
      ctaBody: "Odpowiadamy w ciągu jednego dnia roboczego, z konkretną propozycją zakresu i ceny.",
      cta: "Rozpocznij projekt",
      relatedHeading: "Zobacz też",
    },
    en: {
      title: "Websites for businesses, Warsaw | Weturn",
      description: `Custom website design and development for businesses: copywriting included, live in 1–2 weeks. From ${e(L.from)}, fixed quote before work starts.`,
      label: "Websites for businesses",
      eyebrow: "Website design & development · Warsaw",
      h1: "Websites for businesses that need them to sell.",
      intro:
        "Weturn is a Warsaw studio that designs and builds websites for businesses across Poland. No off-the-shelf templates: every site is built around one job, turning visitors into inquiries and customers.",
      sections: [
        {
          h: "What you get",
          list: [
            "A custom design, not a re-skinned theme",
            "Copywriting and site structure, written for you",
            "Fast loading and solid behaviour on phones",
            "A contact form wired to your inbox",
            "A technical SEO foundation: metadata, headings, sitemap, structured data",
            "Analytics wired from day one",
          ],
        },
        {
          h: "Three packages, clear prices",
          p: [
            `Launch: a single page that sells one thing well. From ${e(L.from)}, typically up to ${e(L.upTo)}, live in 1 week.`,
            `Business: a multi-page site (up to 7 pages), two languages included and a panel to edit content yourself. From ${e(B.from)}, typically up to ${e(B.upTo)}, live in 2 weeks.`,
            `Signature: everything in Business plus custom 3D scenes and bespoke interaction design. From ${e(S.from)}, typically up to ${e(S.upTo)}, live in 2 weeks.`,
            `Net prices (excl. VAT), at founding rates for our first ${FOUNDING_SLOTS} projects. The exact number is fixed after a short call, before any work starts, and payment splits 50% to start and 50% at launch.`,
          ],
        },
        {
          h: "How we work",
          list: [
            "Discover (1 day): who lands on the site and what they need",
            "Design (1 day): an interactive prototype of the first screen and structure",
            "Build (6 days): the production site, tested on real devices",
            "Launch (2 days): go live, measurement and first fixes",
          ],
          p: [
            "Times are for a typical Business build, in our working days. The clock pauses while we wait for your feedback or content.",
          ],
        },
        {
          h: "Who it's for",
          p: [
            "Service businesses, clinics, shops and brands that want their website to bring in inquiries, not just exist. We work remotely with clients in Warsaw and across Poland, in Polish and English.",
          ],
        },
      ],
      faqHeading: "Questions about getting a website",
      faq: [
        {
          q: "Do you build on WordPress?",
          a: "We don't build on off-the-shelf themes. Every site is written from scratch, so it loads fast and doesn't need constant plugin updates. On Business and Signature you edit content yourself in a simple panel.",
        },
        {
          q: "Will the site look good on a phone?",
          a: "Yes. Layouts are designed to rearrange at every screen width, not just shrink, and every site is tested on real phones before launch.",
        },
        {
          q: "Do you only work with Warsaw businesses?",
          a: "No. We're based in Warsaw but work remotely with businesses all over Poland. The discovery call and every later step happen online.",
        },
        {
          q: "Who owns the site when the project ends?",
          a: "You do. Your domain is always registered in your name, and if you want to run the site yourself we hand over the whole project, code included, to your own accounts.",
        },
      ],
      ctaHeading: "Tell us about your business.",
      ctaBody: "We reply within one business day with a concrete scope and price.",
      cta: "Start your project",
      relatedHeading: "See also",
    },
  },

  "/opieka-nad-strona": {
    pl: {
      title: "Opieka nad stroną internetową | Weturn",
      description: `Opieka nad stroną www za ${p(CARE_PLAN.monthly)}/mies.: hosting, aktualizacje, kopie zapasowe, bezpieczeństwo, monitoring i drobne zmiany robione za Ciebie. Bez umowy na lata.`,
      label: "Opieka nad stroną",
      eyebrow: "Opieka i utrzymanie stron www",
      h1: "Opieka nad stroną internetową, żebyś nie musiał o niej myśleć.",
      intro: `Strona po starcie potrzebuje hostingu, aktualizacji, kopii zapasowych i kogoś, kto wprowadzi zmianę, gdy zmieni się cennik. W ramach opieki za ${p(CARE_PLAN.monthly)} miesięcznie robimy to wszystko za Ciebie.`,
      sections: [
        {
          h: "Co obejmuje opieka",
          list: [
            "Hosting, domena i certyfikat SSL pod stałą kontrolą",
            "Aktualizacje, kopie zapasowe i poprawki bezpieczeństwa",
            "Monitoring dostępności i szybkości strony",
            "Zmiany robione za Ciebie: teksty, zdjęcia, ceny (do ok. 1 godziny miesięcznie)",
          ],
        },
        {
          h: "Bez przywiązywania na siłę",
          p: [
            "Opieka jest opcjonalna, rozliczana co miesiąc i możesz z niej zrezygnować w każdej chwili. Domena zawsze jest zarejestrowana na Ciebie. Jeśli zechcesz prowadzić stronę samodzielnie, przenosimy cały projekt razem z kodem na Twoje konta.",
          ],
        },
        {
          h: "Większe zmiany",
          p: [
            "Nowe podstrony, funkcje czy przebudowy wyceniamy osobno, zawsze przed rozpoczęciem prac. Prace spoza pakietu rozliczamy po 200 zł/h, więc faktura Cię nie zaskoczy.",
          ],
        },
      ],
      faqHeading: "Pytania o opiekę nad stroną",
      faq: [
        {
          q: "Ile kosztuje opieka nad stroną?",
          a: `${p(CARE_PLAN.monthly)} miesięcznie. W tej kwocie jest hosting, aktualizacje, kopie zapasowe, monitoring i do około godziny drobnych zmian w miesiącu.`,
        },
        {
          q: "Jak zgłosić zmianę na stronie?",
          a: "Wystarczy wiadomość e-mail z tym, co ma się zmienić. Teksty, zdjęcia i ceny zmieniamy za Ciebie w ramach miesięcznego limitu.",
        },
        {
          q: "Czy mogę zrezygnować z opieki?",
          a: "Tak, w każdej chwili. Opieka jest rozliczana miesięcznie, bez umowy na lata. Po rezygnacji przekazujemy Ci stronę i dostępy.",
        },
      ],
      ctaHeading: "Chcesz oddać stronę w dobre ręce?",
      ctaBody: "Napisz, jaką masz stronę i czego potrzebujesz. Odpowiadamy w ciągu jednego dnia roboczego.",
      cta: "Napisz do nas",
      relatedHeading: "Zobacz też",
    },
    en: {
      title: "Website care & maintenance | Weturn",
      description: `Website care for ${e(CARE_PLAN.monthly)}/month: hosting, updates, backups, security, monitoring and small changes done for you. No multi-year contract.`,
      label: "Website care",
      eyebrow: "Website care & maintenance",
      h1: "Website care, so you never have to think about it.",
      intro: `After launch a site needs hosting, updates, backups and someone to change the price list when it changes. On the care plan, for ${e(CARE_PLAN.monthly)} a month, we handle all of it.`,
      sections: [
        {
          h: "What the care plan covers",
          list: [
            "Hosting, domain and SSL kept running",
            "Updates, backups and security patches",
            "Uptime and speed monitoring",
            "Changes done for you: text, images, prices (up to ~1 hour a month)",
          ],
        },
        {
          h: "No lock-in",
          p: [
            "The plan is optional, billed monthly and you can cancel anytime. Your domain is always registered in your name. If you want to run the site yourself, we move the whole project, code included, to your own accounts.",
          ],
        },
        {
          h: "Bigger changes",
          p: [
            "New pages, features or rebuilds are quoted separately, always before work starts. Work outside the plan is billed at 200 zł/h, so the invoice never surprises you.",
          ],
        },
      ],
      faqHeading: "Questions about website care",
      faq: [
        {
          q: "How much does website care cost?",
          a: `${e(CARE_PLAN.monthly)} a month. That covers hosting, updates, backups, monitoring and up to about an hour of small changes each month.`,
        },
        {
          q: "How do I request a change?",
          a: "Just send an email saying what should change. We update text, images and prices for you within the monthly allowance.",
        },
        {
          q: "Can I cancel?",
          a: "Yes, anytime. Care is billed monthly with no multi-year contract. When you cancel, we hand over the site and all access.",
        },
      ],
      ctaHeading: "Want your site in good hands?",
      ctaBody: "Tell us what site you have and what you need. We reply within one business day.",
      cta: "Get in touch",
      relatedHeading: "See also",
    },
  },

  "/ile-kosztuje-strona-internetowa": {
    pl: {
      title: "Ile kosztuje strona internetowa w 2026? Cennik | Weturn",
      description: `Ile kosztuje strona internetowa dla firmy: od czego zależy cena, szablon czy projekt indywidualny, ukryte koszty. Nasze ceny: od ${p(L.from)} do ${p(S.upTo)}.`,
      label: "Ile kosztuje strona internetowa",
      eyebrow: "Poradnik · Cennik stron www",
      h1: "Ile kosztuje strona internetowa?",
      intro: `Krótka odpowiedź: strona firmowa zbudowana indywidualnie kosztuje u nas od ${p(L.from)} za jedną stronę do ok. ${p(S.upTo)} za rozbudowaną stronę z grafiką 3D. Poniżej wyjaśniamy, od czego zależy cena i na co uważać przy porównywaniu ofert.`,
      sections: [
        {
          h: "Od czego zależy cena strony",
          list: [
            "Liczba podstron: jedna strona sprzedażowa to inny zakres niż serwis z 7 podstronami",
            "Teksty: napisanie treści od zera to realna praca, którą warto mieć w wycenie",
            "Projekt: gotowy szablon czy układ zaprojektowany pod Twoją firmę",
            "Funkcje: wersje językowe, panel edycji, animacje, sceny 3D",
            "Logowanie, baza danych lub sklep: to osobna kategoria i osobna wycena",
          ],
        },
        {
          h: "Szablon czy projekt indywidualny",
          p: [
            "Najtańsze oferty to zwykle gotowy szablon z podmienionym logo i tekstem. To szybkie rozwiązanie i bywa w porządku, jeśli potrzebujesz tylko wizytówki w sieci. Strona projektowana indywidualnie kosztuje więcej, bo układ, teksty i ścieżka klienta powstają wokół Twojego biznesu. Jeśli szablon naprawdę wystarczy, powiemy to wprost.",
          ],
        },
        {
          h: "Nasze ceny",
          list: [
            `Start (strona jednostronicowa): od ${p(L.from)}, zwykle do ${p(L.upTo)}, 1 tydzień`,
            `Biznes (do 7 podstron, 2 języki, panel edycji): od ${p(B.from)}, zwykle do ${p(B.upTo)}, 2 tygodnie`,
            `Premium (wszystko z Biznes + sceny 3D): od ${p(S.from)}, zwykle do ${p(S.upTo)}, 2 tygodnie`,
            `Opieka nad stroną po starcie: ${p(CARE_PLAN.monthly)}/mies., opcjonalnie`,
          ],
          p: [
            `Ceny netto, w stawkach założycielskich dla pierwszych ${FOUNDING_SLOTS} projektów. Dokładna, stała wycena powstaje po krótkiej rozmowie, przed rozpoczęciem prac.`,
          ],
        },
        {
          h: "Koszty, o które warto zapytać każdego wykonawcę",
          list: [
            "Czy teksty są w cenie, czy musisz je napisać sam?",
            "Na kogo jest zarejestrowana domena?",
            "Ile kosztuje hosting i zmiany po starcie?",
            "Jak rozliczane są prace spoza pakietu? (u nas 200 zł/h, zawsze wyceniane z góry)",
            "Czy płacisz całość z góry? (u nas 50% na start, 50% przy uruchomieniu)",
          ],
        },
      ],
      faqHeading: "Najczęstsze pytania o cenę strony",
      faq: [
        {
          q: "Ile kosztuje prosta strona internetowa dla firmy?",
          a: `U nas jednostronicowa strona w pakiecie Start kosztuje od ${p(L.from)}, zwykle do ${p(L.upTo)}, razem z projektem, tekstami, formularzem kontaktowym i analityką. Działa w ciągu tygodnia.`,
        },
        {
          q: "Czy logo jest wliczone w cenę strony?",
          a: "Nie. Projekt logo to osobne zlecenie, od 1 000 zł, z własnym terminem. Bez logo możemy uruchomić stronę z nazwą firmy złożoną krojem pisma i podmienić ją później.",
        },
        {
          q: "Czy można zapłacić za stronę w ratach?",
          a: "Tak. Domyślnie płacisz 50% na start i 50% przy uruchomieniu. Przy większych projektach Premium możemy rozbić płatność na więcej etapów, bez odsetek.",
        },
      ],
      ctaHeading: "Chcesz konkretną wycenę?",
      ctaBody: "Opisz, czego potrzebujesz, a w ciągu jednego dnia roboczego dostaniesz widełki ceny i termin.",
      cta: "Zapytaj o wycenę",
      relatedHeading: "Zobacz też",
    },
    en: {
      title: "How much does a website cost in 2026? | Weturn",
      description: `What a business website costs: what drives the price, template vs custom, hidden costs. Our prices: from ${e(L.from)} to ${e(S.upTo)}.`,
      label: "How much does a website cost",
      eyebrow: "Guide · Website pricing",
      h1: "How much does a website cost?",
      intro: `Short answer: a custom-built business website costs from ${e(L.from)} for a single page to about ${e(S.upTo)} for a full site with 3D graphics. Below is what drives the price and what to watch for when comparing quotes.`,
      sections: [
        {
          h: "What drives the price",
          list: [
            "Number of pages: one sales page is a different scope from a 7-page site",
            "Copy: writing the text from scratch is real work and belongs in the quote",
            "Design: a ready-made template or a layout designed for your business",
            "Features: language versions, an editing panel, animation, 3D scenes",
            "Logins, a database or a shop: a separate category with its own quote",
          ],
        },
        {
          h: "Template or custom",
          p: [
            "The cheapest offers are usually a pre-made template with your logo and text dropped in. That's fast, and fine if you only need a business card online. A custom site costs more because the layout, copy and customer path are built around your business. If a template genuinely is enough, we'll tell you.",
          ],
        },
        {
          h: "Our prices",
          list: [
            `Launch (single page): from ${e(L.from)}, typically up to ${e(L.upTo)}, 1 week`,
            `Business (up to 7 pages, 2 languages, editing panel): from ${e(B.from)}, typically up to ${e(B.upTo)}, 2 weeks`,
            `Signature (everything in Business + 3D scenes): from ${e(S.from)}, typically up to ${e(S.upTo)}, 2 weeks`,
            `Care plan after launch: ${e(CARE_PLAN.monthly)}/month, optional`,
          ],
          p: [
            `Net prices (excl. VAT), at founding rates for our first ${FOUNDING_SLOTS} projects. The exact fixed quote comes after a short call, before any work starts.`,
          ],
        },
        {
          h: "Costs to ask any studio about",
          list: [
            "Is copywriting included, or do you write it yourself?",
            "Whose name is the domain registered in?",
            "What do hosting and changes cost after launch?",
            "How is out-of-scope work billed? (ours: 200 zł/h, always quoted first)",
            "Do you pay everything up front? (ours: 50% to start, 50% at launch)",
          ],
        },
      ],
      faqHeading: "Common questions about website prices",
      faq: [
        {
          q: "How much does a simple business website cost?",
          a: `Our single-page Launch site costs from ${e(L.from)}, typically up to ${e(L.upTo)}, including design, copy, a contact form and analytics. It goes live within a week.`,
        },
        {
          q: "Is a logo included in the website price?",
          a: "No. Logo design is a separate project, from 1 000 zł, with its own timeline. Without a logo we can launch with your business name set in the site's typeface and swap it in later.",
        },
        {
          q: "Can I pay for a website in instalments?",
          a: "Yes. By default you pay 50% to start and 50% at launch. Larger Signature projects can be split into more milestones, with no interest.",
        },
      ],
      ctaHeading: "Want an exact quote?",
      ctaBody: "Describe what you need and within one business day you'll get a price range and a timeline.",
      cta: "Ask for a quote",
      relatedHeading: "See also",
    },
  },
};
