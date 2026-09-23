import type { Locale } from "./config";

/**
 * Site copy, EN + PL (CP5-i18n).
 *
 * `en` is the typed source of truth; `pl` is declared as `typeof en`, so if a
 * key is ever added to one language and not the other, the build fails. That's
 * the coherence guard — translations can't silently drift out of sync.
 *
 * Timelines here are the CP5 "half the delivery time" pass: process step badges
 * and tier weeks were halved from CP4.x (e.g. Business 4–6 → 2–3 weeks). Numbers
 * that carry a promise (delivery windows) live in copy, on purpose, so they're
 * easy to audit and honest — they're a claim about our own turnaround.
 *
 * All values use backticks to avoid apostrophe/quote escaping across two
 * languages. Tier NAMES (Launch/Business/Signature) stay untranslated — they're
 * product names, kept in English on the Polish side too.
 */

export const en = {
  nav: {
    services: `Services`,
    craft: `Craft`,
    showcase: `Showcase`,
    process: `Process`,
    pricing: `Pricing`,
    faq: `FAQ`,
    cta: `Start your project`,
    home: `Webcraft home`,
    openMenu: `Open menu`,
    closeMenu: `Close menu`,
    language: `Language`,
  },
  hero: {
    eyebrow: `Webcraft · Digital Studio`,
    titleA: `Websites that turn views into`,
    titleAccent: `sales`,
    titleEnd: `.`,
    subtitle: `We design, build and maintain digital experiences. From full websites to short-form content and brand assets, everything we make is engineered to convert.`,
    ctaPrimary: `Start your project`,
    ctaGhost: `See our craft`,
  },
  services: {
    eyebrow: `Services`,
    heading: `Everything your business needs to look serious online.`,
    prev: `Previous service`,
    next: `Next service`,
    tablist: `Services`,
    items: {
      sell: {
        title: `Websites that sell`,
        body: `Custom-designed sites structured around one job: turning visitors into inquiries.`,
        outcome: `Views → customers`,
        /** Mobile disc copy. The circle cannot hold the full body at a
         *  readable size — see ServiceCard. Same promise, fewer words. */
        bodyShort: `Custom-built sites with one job: turning visitors into inquiries.`,
      },
      care: {
        title: `Care & maintenance`,
        body: `Updates, security, backups, uptime and speed monitoring. Your site stays sharp while you run the business.`,
        outcome: `Always on, always fast`,
        /** Mobile disc copy. The circle cannot hold the full body at a
         *  readable size — see ServiceCard. Same promise, fewer words. */
        bodyShort: `Updates, security, backups and speed monitoring, all handled.`,
      },
      video: {
        title: `Short-form video`,
        body: `Reels and Shorts edited to hold attention from the first second: cut, captioned and paced for the feed.`,
        outcome: `Scrolls → views`,
        /** Mobile disc copy. The circle cannot hold the full body at a
         *  readable size — see ServiceCard. Same promise, fewer words. */
        bodyShort: `Reels and Shorts cut to hold attention from the first second.`,
      },
      print: {
        title: `Cards & banners`,
        body: `Print and display collateral that matches your site pixel-for-pixel. One brand, every surface.`,
        outcome: `One brand, every surface`,
        /** Mobile disc copy. The circle cannot hold the full body at a
         *  readable size — see ServiceCard. Same promise, fewer words. */
        bodyShort: `Print and display work that matches your site pixel-for-pixel.`,
      },
    },
  },
  craft: {
    eyebrow: `Craft`,
    heading: `Don't take our word for it. Try it.`,
    intro: `Four live demos, built with the exact techniques we ship on client sites. Drag, tap, replay: everything below is running code, not a video of it.`,
    cards: {
      resize: {
        title: `Fluid, not shrunken`,
        caption: `Grab the handle. The layout doesn't squeeze; it rethinks itself at every width.`,
        proof: `One build, every screen`,
      },
      theme: {
        title: `Any brand, one system`,
        caption: `Tap a swatch. Every color and corner re-skins from a single set of tokens.`,
        proof: `Your brand, pixel-for-pixel`,
      },
      speed: {
        title: `Fast where it counts`,
        caption: `Watch a page load in under a second. That's the window in which visitors decide whether to stay.`,
        proof: `Speed that keeps visitors`,
      },
      motion: {
        title: `Motion with intent`,
        caption: `The same move, three temperaments. Easing is why some sites feel expensive.`,
        proof: `Details visitors feel`,
      },
    },
  },
  showcase: {
    eyebrow: `Showcase`,
    heading: `Three demo sites, running live below.`,
    footnote: `All three brands are fictional and built for demonstration. Your project gets the same treatment, with your product at the center.`,
    live: `Live preview`,
    close: `Close`,
    openBadge: `Open fullscreen ↗`,
    playerCaption: `· concept site by Webcraft · scroll, click, explore`,
    openFullscreen: (name: string) => `Open the ${name} demo site fullscreen`,
    demoLabel: (name: string) => `${name} demo site`,
    demos: {
      blackwood: {
        blurb: `A Speyside single malt distillery. Concept site with a real-time 3D warehouse scene.`,
        facts: [`Concept site`, `Real-time 3D scene`],
      },
      wisniowa: {
        blurb: `A dental practice that reads like a quiet studio: warm off-white, editorial serif and a deep green that never raises its voice. The whole site is built around a clearly labelled booking prototype.`,
        facts: [`Booking prototype`, `Published price list`, `Warm clinical minimalism`],
      },
      nokturn: {
        blurb: `An alternative clothing label built as a working shop: variants, per-size stock, a real cart and offers that actually apply, all wrapped in a deliberately quiet interface.`,
        facts: [`Working cart`, `Per-size stock`, `Variant switching`],
      },
    },
  },
  process: {
    eyebrow: `Process`,
    heading: `From views to sales, one step at a time.`,
    introPre: `Every project runs through the same four steps, and most go from brief to a live site in `,
    introStrong: `2–3 weeks`,
    introPost: `. Each step exists to move a visitor one stage down the funnel; the panel on the right shows what happens to a thousand views along the way.`,
    footnote: `Step times are shown for a typical Business-scope build. Launch runs faster, Signature longer. Your quote comes with its own schedule.`,
    steps: {
      discover: {
        title: `Discover`,
        time: `2–3 days`,
        body: `We map who lands on your site, where they come from, and the one thing each of them needs to see first. Strategy before pixels: the funnel is designed before the homepage is.`,
        deliverable: `Structure & content plan`,
      },
      design: {
        title: `Design`,
        time: `4–6 days`,
        body: `An above-the-fold that earns the next scroll. Hierarchy, motion and copy tuned so the first three seconds answer "am I in the right place?", because most visitors decide right there.`,
        deliverable: `Interactive design prototype`,
      },
      build: {
        title: `Build`,
        time: `1–2 weeks`,
        body: `Sub-second loads, motion with intent, details that hold up under a slow scroll. Craftsmanship is a trust signal: a site that feels expensive makes the company behind it feel dependable.`,
        deliverable: `Production site, tested on real devices`,
      },
      launch: {
        title: `Launch & grow`,
        time: `2–3 days`,
        body: `Clear next steps for the visitor, analytics wired from day one for you. We watch where the funnel leaks after launch and tighten it. A website is a system, not a poster.`,
        deliverable: `Live site + measurement setup`,
      },
    },
    funnel: {
      eyebrow: `The funnel`,
      outOfPre: `Out of`,
      outOfPost: `monthly views, roughly:`,
      tiers: [
        `arrive on the site`,
        `stay past the first scroll`,
        `read far enough to trust you`,
        `take action`,
      ],
      footnote: `Illustrative shape, not a promise. Real numbers depend on your traffic. We instrument yours at launch and report the actual funnel.`,
      aria: `Illustrative funnel: what happens to a thousand views`,
    },
  },
  pricing: {
    eyebrow: `Pricing`,
    heading: `Founding rates, while our portfolio fills.`,
    introPre: `We're a new studio. You can see exactly how we build on this very site, but you can't scroll through twenty case studies yet. So the first `,
    introPost: ` client slots get our full process at rates we'll never offer again. As the portfolio grows, the prices do too.`,
    from: `from`,
    upToPre: `typically up to`,
    mostProjects: `Most projects`,
    ctaPrefix: `Start with`,
    footnote: `Every price above is a real starting point, not bait. The exact quote comes after a short discovery call, is fixed before work starts and is itemized so you can trim scope instead of quality. Founding-rate projects agree to let us publish the finished work as a case study.`,
    tiers: {
      launch: {
        name: `Launch`,
        tagline: `One sharp page that sells one thing well.`,
        weeks: `1–2 weeks`,
        includes: [
          `Single-page site, custom design`,
          `Copy direction & structure workshop`,
          `Motion & micro-interactions`,
          `Contact/lead capture wired to your inbox`,
          `Analytics + launch checklist`,
        ],
      },
      business: {
        name: `Business`,
        tagline: `A full site built around your sales funnel.`,
        weeks: `2–3 weeks`,
        includes: [
          `Multi-section site (up to ~7 sections/pages)`,
          `Everything in Launch`,
          `Editable content: update text & images yourself`,
          `Funnel instrumentation & post-launch report`,
          `Technical SEO foundation`,
        ],
      },
      signature: {
        name: `Signature`,
        tagline: `A site people send to each other. 3D, motion, the works.`,
        weeks: `3–5 weeks`,
        includes: [
          `Everything in Business`,
          `Custom 3D / WebGL scenes (like this site)`,
          `Bespoke scroll & interaction design`,
          `Performance budget kept under load`,
          `Priority build slot`,
        ],
      },
    },
    split: `Pay in 2: 50% to start, 50% at launch`,
    care: {
      title: `Care plan`,
      perMonth: `/month`,
      tagline: `After launch: we run the site so you can run the business.`,
      includes: [
        `Hosting, domain & SSL kept running`,
        `Updates, backups & security patches`,
        `Uptime & speed monitoring`,
        `Small monthly changes: text, images, prices (up to ~1h)`,
      ],
      note: `Optional, billed monthly, cancel anytime. Bigger changes and new features are quoted separately, always before the work starts.`,
    },
  },
  faq: {
    eyebrow: `FAQ`,
    heading: `The questions every client asks first.`,
    closingPre: `Something else on your mind? `,
    closingLink: `Ask us directly`,
    closingPost: `. We answer everything before you commit to anything.`,
    items: [
      {
        q: `How long does a website take?`,
        a: `Most projects land between two and four weeks from kickoff to launch. Discovery and design take the first half; build, content and testing the second. A tight one-pager can be faster, a site with custom 3D or a larger structure slower. You get a real timeline after Discover, not a guess before it.`,
      },
      {
        q: `What does a project cost?`,
        a: `Published starting prices are right above in the pricing section, currently at founding rates while our portfolio fills. The exact number is fixed after a short discovery call, before any work starts, and the quote is itemized so you can trim scope instead of quality. No hourly surprises.`,
      },
      {
        q: `Why does this cost more than the 3 000 zł websites I've seen?`,
        a: `Because it's a different product. Most cheap offers are a pre-made template with your logo and text dropped in. That's fast, and fine if it's all you need. What you see on this site is custom: the layout, motion, 3D and the whole funnel are designed around your business, not a theme's. That takes real design and build time, which is what you're paying for. If a template is genuinely the right call for you, we'll tell you and point you somewhere cheaper rather than sell you something you don't need.`,
      },
      {
        q: `Can I pay in instalments?`,
        a: `Yes. Every project splits 50% to start and 50% at launch by default, so you're never paying the full amount up front, and the second half only comes due once the site is ready to go live. For larger Signature builds we can break it into more milestones. No financing, no interest, just the work split into stages.`,
      },
      {
        q: `Will I be able to edit the site myself?`,
        a: `Yes. Content you'll touch often (text, images, offers) is wired to an editing setup you can use without us. The parts that keep the site fast and polished stay in code, so the design can't drift after handover.`,
      },
      {
        q: `Do you handle hosting, domains and maintenance?`,
        a: `We set up hosting and the domain as part of launch and hand you the keys. Everything stays in accounts you own. After launch you can run it yourself, or keep us on the monthly care plan from the pricing section, with hosting, updates, backups and small changes handled for you. Your call, no lock-in.`,
      },
      {
        q: `Is SEO included?`,
        a: `The technical side is built in on every project: fast loads, clean structure, proper metadata, sensible headings. That's the foundation search engines reward. Ongoing SEO campaigns and content strategy are a separate engagement, and we'll tell you honestly whether you need one.`,
      },
      {
        q: `Can you rework our existing site instead of starting over?`,
        a: `Sometimes. If the structure underneath is sound, a redesign on top of it is the cheaper path and we'll say so. If the foundation is the problem, patching it costs more than rebuilding. We audit first and recommend whichever is actually cheaper for the result you want.`,
      },
      {
        q: `What do you need from us to start?`,
        a: `About an hour for the discovery call, access to your brand materials if they exist, and honest answers about what the site should achieve. We draft structure and copy direction with you, and you review at fixed checkpoints instead of writing pages yourself.`,
      },
    ],
  },
  contact: {
    eyebrow: `Contact`,
    heading: `Tell us what the site should achieve.`,
    intro: `Three fields, no phone number required, no obligation on the other side of the send button. You'll get an honest reply, even if the honest reply is that you don't need us yet.`,
    replyPromise: `We reply within one business day.`,
    preferEmailPre: `Prefer email? `,
    sentTitle: `Got it, thank you!`,
    sentBodyPre: `Your message is in. `,
    sentBodyMid: ` If it's urgent, email us at `,
    sentBodyEnd: `.`,
    whatBuilding: `What are we building?`,
    optional: `(optional)`,
    contentQ: `Texts & photos for the site?`,
    budgetQ: `Budget in mind?`,
    estPre: `Projects like this typically land between `,
    estOver: ` over `,
    estEnd: `. Exact fixed quote after a short discovery call.`,
    nameLabel: `Name`,
    emailLabel: `Email`,
    msgLabel: `What should the site achieve?`,
    submit: `Send it`,
    sending: `Sending…`,
    microcopy: `No newsletter, no follow-up sequence. Just one human reply.`,
    fallbackPre: `The form backend isn't live yet. Please email us directly at `,
    fallbackPost: `. Same one-business-day promise applies.`,
    errorPre: `Something went wrong on our side. Try again, or email `,
    errorPost: `.`,
    readiness: {
      ready: `Content is ready`,
      partly: `Some of it`,
      none: `Starting from zero`,
    },
    notes: {
      none: `includes copywriting from scratch`,
      partly: `includes finishing your content with you`,
    },
    budgets: {
      lt5k: `under 5 000 PLN`,
      b5to10k: `5–10 000 PLN`,
      b10to20k: `10–20 000 PLN`,
      gt20k: `20 000+ PLN`,
      unsure: `Not sure yet`,
    },
  },
  footer: {
    tagline: `Websites that turn views into sales.`,
    rights: `All rights reserved.`,
  },
  sticky: {
    cta: `Start a project`,
  },
  /* Live craft demos — every visible string inside the four demo widgets,
   * incl. the fake client brands, the cursor-follower labels and aria text.
   * TTFB/FCP/LCP stay untranslated: they're industry acronyms, not words. */
  demos: {
    resize: {
      cursor: `Drag`,
      aria: `Resize the demo viewport`,
      brand: `Acme`,
      bp: { desktop: `Desktop`, tablet: `Tablet`, mobile: `Mobile` },
    },
    theme: {
      cursor: `Re-skin`,
      aria: `Demo brand theme`,
      themeAria: (name: string) => `${name} theme`,
      brandSuffix: ` Co.`,
      headline: `Open six days a week.`,
      sub: `Same layout, different brand. Nothing was redesigned.`,
      cta: `Book now`,
      secondary: `Menu`,
      names: { studio: `Studio`, bakery: `Bakery`, clinic: `Clinic`, gym: `Gym` },
    },
    speed: {
      cursor: `Replay`,
      headline: `Fresh coffee, faster site.`,
      sub: `Content painted. Nothing left to wait for.`,
      cta: `Order ahead`,
      msLabel: ` ms to loaded`,
      replay: `Replay load`,
    },
    motion: {
      cursor: `Play`,
      aria: `Easing`,
      moves: {
        linear: {
          name: `Linear`,
          note: `Constant speed. Reads mechanical, which is how default sites move.`,
        },
        expo: {
          name: `Expo out`,
          note: `Fast in, gentle landing: our scroll and reveal signature.`,
        },
        spring: {
          name: `Spring`,
          note: `Physics, not a curve. What buttons and cards run on here.`,
        },
      },
    },
  },
  notFound: {
    eyebrow: `Error 404`,
    heading: `This page took a wrong turn.`,
    body: `The link is broken or the page has moved. Everything that matters is one scroll away on the home page.`,
    home: `Back to home`,
    start: `Start a project →`,
  },
  consent: {
    title: `We only measure what you allow.`,
    body: `Necessary cookies keep this site working. Analytics cookies tell us which sections people read and where they leave, so we can build better sites. Nothing runs until you choose.`,
    policy: `Read the privacy policy`,
    acceptAll: `Accept analytics`,
    rejectAll: `Reject analytics`,
    manage: `Choose what to allow`,
    save: `Save choices`,
    back: `Back`,
    necessaryLabel: `Necessary`,
    necessaryDesc: `Remembers your language and this choice. Always on, because the site cannot work without it.`,
    analyticsLabel: `Analytics`,
    analyticsDesc: `Anonymous page and section statistics. No advertising, no third parties, no profiling.`,
    always: `Always on`,
    settingsLink: `Cookie settings`,
  },
  currency: `PLN`,
};

export type Dictionary = typeof en;

export const pl: Dictionary = {
  nav: {
    services: `Usługi`,
    craft: `Warsztat`,
    showcase: `Demo`,
    process: `Proces`,
    pricing: `Cennik`,
    faq: `FAQ`,
    cta: `Rozpocznij projekt`,
    home: `Strona główna Webcraft`,
    openMenu: `Otwórz menu`,
    closeMenu: `Zamknij menu`,
    language: `Język`,
  },
  hero: {
    eyebrow: `Webcraft · Studio cyfrowe`,
    titleA: `Strony, które zamieniają wyświetlenia w`,
    titleAccent: `sprzedaż`,
    titleEnd: `.`,
    subtitle: `Projektujemy, budujemy i utrzymujemy cyfrowe doświadczenia. Od kompletnych stron po treści wideo i materiały brandingowe: wszystko zaprojektowane tak, by sprzedawać.`,
    ctaPrimary: `Rozpocznij projekt`,
    ctaGhost: `Zobacz nasze rzemiosło`,
  },
  services: {
    eyebrow: `Usługi`,
    heading: `Wszystko, czego potrzebuje Twój biznes, by wyglądać poważnie w sieci.`,
    prev: `Poprzednia usługa`,
    next: `Następna usługa`,
    tablist: `Usługi`,
    items: {
      sell: {
        title: `Strony, które sprzedają`,
        body: `Indywidualnie zaprojektowane strony skupione na jednym zadaniu: zamianie odwiedzających w klientów.`,
        outcome: `Wyświetlenia → klienci`,
        /** Mobile disc copy. The circle cannot hold the full body at a
         *  readable size — see ServiceCard. Same promise, fewer words. */
        bodyShort: `Autorskie strony z jednym zadaniem: zamieniać odwiedzających w klientów.`,
      },
      care: {
        title: `Opieka i utrzymanie`,
        body: `Aktualizacje, bezpieczeństwo, kopie zapasowe, monitoring dostępności i szybkości. Twoja strona pozostaje w formie, a Ty możesz skupić się na biznesie.`,
        outcome: `Zawsze dostępna, zawsze szybka`,
        /** Mobile disc copy. The circle cannot hold the full body at a
         *  readable size — see ServiceCard. Same promise, fewer words. */
        bodyShort: `Aktualizacje, bezpieczeństwo, kopie i monitoring: wszystko po naszej stronie.`,
      },
      video: {
        title: `Krótkie formy wideo`,
        body: `Reels i Shorts montowane tak, by przykuć uwagę od pierwszej sekundy: cięte, z napisami, w rytmie social mediów.`,
        outcome: `Przewinięcia → wyświetlenia`,
        /** Mobile disc copy. The circle cannot hold the full body at a
         *  readable size — see ServiceCard. Same promise, fewer words. */
        bodyShort: `Reels i Shorts cięte tak, by utrzymać uwagę od pierwszej sekundy.`,
      },
      print: {
        title: `Wizytówki i banery`,
        body: `Materiały do druku i wyświetlania spójne z Twoją stroną co do piksela. Jedna marka na każdej powierzchni.`,
        outcome: `Jedna marka, każda powierzchnia`,
        /** Mobile disc copy. The circle cannot hold the full body at a
         *  readable size — see ServiceCard. Same promise, fewer words. */
        bodyShort: `Materiały do druku i na ekran, spójne z Twoją stroną co do piksela.`,
      },
    },
  },
  craft: {
    eyebrow: `Warsztat`,
    heading: `Nie wierz nam na słowo. Sprawdź sam.`,
    intro: `Cztery dema na żywo, zbudowane dokładnie tymi technikami, które wdrażamy u klientów. Przeciągaj, klikaj, odtwarzaj. Wszystko poniżej to działający kod, a nie jego nagranie.`,
    cards: {
      resize: {
        title: `Płynne, nie ściśnięte`,
        caption: `Złap uchwyt. Układ się nie ściska, tylko na każdej szerokości układa się od nowa.`,
        proof: `Jedna wersja, każdy ekran`,
      },
      theme: {
        title: `Każda marka, jeden system`,
        caption: `Kliknij próbkę. Każdy kolor i każde zaokrąglenie pochodzą z jednego zestawu tokenów, więc zmieniasz je tylko raz.`,
        proof: `Twoja marka, co do piksela`,
      },
      speed: {
        title: `Szybkie tam, gdzie trzeba`,
        caption: `Zobacz, jak strona ładuje się w mniej niż sekundę. To właśnie wtedy odwiedzający decydują, czy zostać.`,
        proof: `Szybkość, która zatrzymuje`,
      },
      motion: {
        title: `Ruch z zamysłem`,
        caption: `Ten sam ruch, trzy temperamenty. To właśnie sposób wyhamowania ruchu sprawia, że niektóre strony wyglądają na drogie.`,
        proof: `Detale, które czuć`,
      },
    },
  },
  showcase: {
    eyebrow: `Demo`,
    heading: `Trzy strony demo, działające na żywo poniżej.`,
    footnote: `Wszystkie marki są fikcyjne i stworzone na potrzeby prezentacji. Twój projekt dostanie to samo podejście, z Twoim produktem w centrum.`,
    live: `Podgląd na żywo`,
    close: `Zamknij`,
    openBadge: `Otwórz pełny ekran ↗`,
    playerCaption: `· strona koncepcyjna studia Webcraft · przewijaj, klikaj, odkrywaj`,
    openFullscreen: (name: string) => `Otwórz stronę demo ${name} na pełnym ekranie`,
    demoLabel: (name: string) => `Strona demo ${name}`,
    demos: {
      blackwood: {
        blurb: `Destylarnia single malt ze Speyside. Strona koncepcyjna ze sceną 3D magazynu renderowaną w czasie rzeczywistym.`,
        facts: [`Strona koncepcyjna`, `Scena 3D w czasie rzeczywistym`],
      },
      wisniowa: {
        blurb: `Gabinet stomatologiczny poprowadzony jak spokojne studio: ciepła biel, szeryfowy krój i stonowana zieleń. Całość zbudowana wokół wyraźnie oznaczonego prototypu umawiania wizyt.`,
        facts: [`Prototyp rezerwacji`, `Jawny cennik`, `Ciepły, kliniczny minimalizm`],
      },
      nokturn: {
        blurb: `Marka odzieżowa zbudowana jak działający sklep: warianty, stany magazynowe na rozmiarach, prawdziwy koszyk i rabaty, które faktycznie się naliczają, a to wszystko w celowo spokojnym interfejsie.`,
        facts: [`Działający koszyk`, `Stany na rozmiarach`, `Wybór wariantów`],
      },
    },
  },
  process: {
    eyebrow: `Proces`,
    heading: `Od wyświetleń do sprzedaży, krok po kroku.`,
    introPre: `Każdy projekt przechodzi przez te same cztery kroki, a większość trafia od briefu do działającej strony w `,
    introStrong: `2–3 tygodnie`,
    introPost: `. Każdy krok przesuwa odwiedzającego o etap dalej na ścieżce klienta; panel po prawej pokazuje, co po drodze dzieje się z tysiącem wyświetleń.`,
    footnote: `Czasy kroków podaliśmy dla typowego projektu w pakiecie Biznes. Start trwa krócej, Premium dłużej. Twoja wycena ma własny harmonogram.`,
    steps: {
      discover: {
        title: `Analiza`,
        time: `2–3 dni`,
        body: `Ustalamy, kto trafia na Twoją stronę, skąd przychodzi i co każdy z nich musi zobaczyć jako pierwsze. Strategia przed pikselami: ścieżkę klienta projektujemy, zanim powstanie strona główna.`,
        deliverable: `Struktura i plan treści`,
      },
      design: {
        title: `Projekt`,
        time: `4–6 dni`,
        body: `Pierwszy ekran, który zasługuje na kolejne przewinięcie. Hierarchia, ruch i tekst dostrojone tak, by pierwsze trzy sekundy odpowiadały: „czy jestem we właściwym miejscu?”, bo większość decyduje właśnie tam.`,
        deliverable: `Interaktywny prototyp projektu`,
      },
      build: {
        title: `Wdrożenie`,
        time: `1–2 tygodnie`,
        body: `Ładowanie poniżej sekundy, ruch z zamysłem, detale, które bronią się przy powolnym przewijaniu. Dopracowanie to sygnał zaufania: gdy strona sprawia wrażenie drogiej, firma za nią stojąca wydaje się solidna.`,
        deliverable: `Gotowa strona, przetestowana na prawdziwych urządzeniach`,
      },
      launch: {
        title: `Start i rozwój`,
        time: `2–3 dni`,
        body: `Jasne kolejne kroki dla odwiedzającego, analityka podłączona od pierwszego dnia. Po starcie sprawdzamy, w którym miejscu ścieżka się urywa, i uszczelniamy ją. Strona to system, a nie plakat.`,
        deliverable: `Działająca strona + konfiguracja pomiarów`,
      },
    },
    funnel: {
      eyebrow: `Ścieżka klienta`,
      outOfPre: `Z`,
      outOfPost: `miesięcznych wyświetleń, z grubsza:`,
      tiers: [
        `trafia na stronę`,
        `zostaje po pierwszym przewinięciu`,
        `czyta na tyle, by Ci zaufać`,
        `podejmuje działanie`,
      ],
      footnote: `Kształt poglądowy, nie obietnica. Realne liczby zależą od Twojego ruchu. Na starcie podłączamy pomiary i raportujemy Twoją rzeczywistą ścieżkę.`,
      aria: `Poglądowa ścieżka klienta: co dzieje się z tysiącem wyświetleń`,
    },
  },
  pricing: {
    eyebrow: `Cennik`,
    heading: `Stawki założycielskie, póki zapełnia się nasze portfolio.`,
    introPre: `Jesteśmy nowym studiem. To, jak budujemy, widzisz dokładnie na tej stronie, ale nie przewiniesz jeszcze dwudziestu case studies. Dlatego pierwszych `,
    introPost: ` klientów dostaje nasz pełny proces po stawkach, których nigdy więcej nie zaproponujemy. Wraz z portfolio rosną też ceny.`,
    from: `od`,
    upToPre: `zwykle do`,
    mostProjects: `Najczęściej wybierane`,
    ctaPrefix: `Zacznij od`,
    footnote: `Każda cena powyżej to realny punkt startowy, nie przynęta. Dokładna wycena powstaje po krótkiej rozmowie wstępnej, jest ustalana przed startem prac i rozpisana pozycjami, żebyś mógł ciąć zakres, a nie jakość. Projekty w stawce założycielskiej zgadzają się na publikację gotowej pracy jako case study.`,
    tiers: {
      launch: {
        name: `Start`,
        tagline: `Jedna dopracowana strona, która dobrze sprzedaje jedną rzecz.`,
        weeks: `1–2 tygodnie`,
        includes: [
          `Strona jednostronicowa, indywidualny projekt`,
          `Warsztat z kierunku i struktury treści`,
          `Ruch i mikrointerakcje`,
          `Formularz kontaktowy podłączony do Twojej skrzynki`,
          `Analityka + checklista startowa`,
        ],
      },
      business: {
        name: `Biznes`,
        tagline: `Kompletna strona zbudowana wokół Twojej ścieżki klienta.`,
        weeks: `2–3 tygodnie`,
        includes: [
          `Wielosekcyjna strona (do ~7 sekcji/podstron)`,
          `Wszystko z pakietu Start`,
          `Edytowalne treści: samodzielnie zmieniasz teksty i zdjęcia`,
          `Pomiar ścieżki klienta + raport po starcie`,
          `Techniczne fundamenty SEO`,
        ],
      },
      signature: {
        name: `Premium`,
        tagline: `Strona, którą ludzie przesyłają sobie nawzajem. 3D, ruch, pełen zakres.`,
        weeks: `3–5 tygodni`,
        includes: [
          `Wszystko z pakietu Biznes`,
          `Autorskie sceny 3D / WebGL (jak na tej stronie)`,
          `Projekt scrolla i interakcji szyty na miarę`,
          `Budżet wydajności utrzymany pod obciążeniem`,
          `Priorytetowy termin realizacji`,
        ],
      },
    },
    split: `Płatność w 2 ratach: 50% na start, 50% przy uruchomieniu`,
    care: {
      title: `Opieka nad stroną`,
      perMonth: `/mies.`,
      tagline: `Po starcie: my zajmujemy się stroną, Ty biznesem.`,
      includes: [
        `Hosting, domena i SSL pod kontrolą`,
        `Aktualizacje, kopie zapasowe i poprawki bezpieczeństwa`,
        `Monitoring dostępności i szybkości`,
        `Drobne zmiany co miesiąc: teksty, zdjęcia, ceny (do ~1 h)`,
      ],
      note: `Opcjonalnie, rozliczenie miesięczne, rezygnacja w każdej chwili. Większe zmiany i nowe funkcje wyceniamy osobno, zawsze przed rozpoczęciem prac.`,
    },
  },
  faq: {
    eyebrow: `FAQ`,
    heading: `Pytania, które każdy klient zadaje na początku.`,
    closingPre: `Coś jeszcze chodzi Ci po głowie? `,
    closingLink: `Zapytaj nas wprost`,
    closingPost: `. Odpowiadamy na wszystko, zanim się do czegokolwiek zobowiążesz.`,
    items: [
      {
        q: `Ile trwa stworzenie strony?`,
        a: `Większość projektów trwa od dwóch do czterech tygodni, licząc od rozpoczęcia do uruchomienia strony. Pierwsza połowa to analiza i projekt, druga to budowa, treści i testy. Zwięzły one-pager może powstać szybciej, a strona z autorskim 3D lub rozbudowaną strukturą wolniej. Realny harmonogram dostajesz po etapie analizy, zamiast zgadywać go wcześniej.`,
      },
      {
        q: `Ile kosztuje projekt?`,
        a: `Ceny startowe znajdziesz tuż wyżej, w sekcji cennika. Obecnie obowiązują stawki założycielskie, póki nasze portfolio się zapełnia. Dokładną kwotę ustalamy po krótkiej rozmowie wstępnej, przed rozpoczęciem prac, a wycena jest rozpisana pozycjami, żebyś mógł ciąć zakres, a nie jakość. Bez niespodzianek w rozliczeniu godzinowym.`,
      },
      {
        q: `Dlaczego to kosztuje więcej niż strony za 3 000 zł, które widziałem?`,
        a: `Bo to inny produkt. Większość tanich ofert to gotowy szablon z podmienionym logo i tekstem. To szybkie rozwiązanie i w porządku, jeśli tyle Ci wystarczy. To, co widzisz na tej stronie, jest autorskie: układ, ruch, 3D i całą ścieżkę klienta projektujemy wokół Twojego biznesu, a nie wokół motywu. To wymaga realnej pracy projektowej i programistycznej, i właśnie za nią płacisz. Jeśli szablon naprawdę jest dla Ciebie właściwym wyborem, powiemy to wprost i wskażemy coś tańszego, zamiast sprzedawać Ci coś, czego nie potrzebujesz.`,
      },
      {
        q: `Czy mogę zapłacić w ratach?`,
        a: `Tak. Każdy projekt domyślnie dzielimy na 50% na start i 50% przy uruchomieniu, więc nigdy nie płacisz całości z góry, a druga część staje się wymagalna dopiero wtedy, gdy strona jest gotowa do publikacji. Przy większych projektach Premium możemy rozbić to na więcej etapów. Bez finansowania i bez odsetek, po prostu praca podzielona na etapy.`,
      },
      {
        q: `Czy będę mógł samodzielnie edytować stronę?`,
        a: `Tak. Treści, które często zmieniasz (teksty, zdjęcia, oferty), podłączamy do panelu edycji, z którego skorzystasz bez naszej pomocy. Elementy, które trzymają stronę szybką i dopracowaną, zostają w kodzie, żeby projekt nie rozjechał się po przekazaniu.`,
      },
      {
        q: `Czy zajmujecie się hostingiem, domenami i utrzymaniem?`,
        a: `Hosting i domenę konfigurujemy w ramach startu i przekazujemy Ci klucze. Wszystko zostaje na kontach, które należą do Ciebie. Po starcie możesz prowadzić stronę sam albo skorzystać z miesięcznej opieki nad stroną z sekcji cennika. Wtedy hosting, aktualizacje, kopie zapasowe i drobne zmiany są po naszej stronie. Twój wybór, bez przywiązywania Cię do nas na siłę.`,
      },
      {
        q: `Czy SEO jest w cenie?`,
        a: `Techniczne SEO jest wbudowane w każdy projekt: szybkie ładowanie, czysta struktura, poprawne metadane i sensowne nagłówki. To fundament, który doceniają wyszukiwarki. Bieżące kampanie SEO i strategia treści to osobna współpraca, a my uczciwie powiemy, czy jej potrzebujesz.`,
      },
      {
        q: `Czy możecie przerobić naszą obecną stronę zamiast robić ją od zera?`,
        a: `Czasem. Jeśli struktura pod spodem jest zdrowa, przeprojektowanie na jej bazie jest tańszą drogą i powiemy to wprost. Jeśli problemem jest sam fundament, łatanie kosztuje więcej niż budowa od nowa. Najpierw robimy audyt i rekomendujemy to, co przy oczekiwanym efekcie faktycznie wyjdzie taniej.`,
      },
      {
        q: `Czego potrzebujecie od nas, żeby zacząć?`,
        a: `Około godziny na rozmowę wstępną, dostęp do materiałów marki, jeśli je macie, i szczere odpowiedzi na pytanie, co strona ma osiągnąć. Szkic struktury i kierunek treści tworzymy razem z Tobą, a Ty zatwierdzasz je w ustalonych punktach kontrolnych, zamiast samodzielnie pisać podstrony.`,
      },
    ],
  },
  contact: {
    eyebrow: `Kontakt`,
    heading: `Powiedz nam, co strona ma osiągnąć.`,
    intro: `Trzy pola, bez obowiązkowego numeru telefonu i bez zobowiązań po kliknięciu „Wyślij”. Dostaniesz uczciwą odpowiedź, nawet jeśli będzie brzmiała: „jeszcze nas nie potrzebujesz”.`,
    replyPromise: `Odpowiadamy w ciągu jednego dnia roboczego.`,
    preferEmailPre: `Wolisz e-mail? `,
    sentTitle: `Gotowe, dziękujemy!`,
    sentBodyPre: `Twoja wiadomość dotarła. `,
    sentBodyMid: ` Jeśli to pilne, napisz do nas na `,
    sentBodyEnd: `.`,
    whatBuilding: `Co budujemy?`,
    optional: `(opcjonalnie)`,
    contentQ: `Teksty i zdjęcia na stronę?`,
    budgetQ: `Masz budżet w głowie?`,
    estPre: `Projekty tego typu zwykle mieszczą się między `,
    estOver: ` w ciągu `,
    estEnd: `. Dokładna, stała wycena po krótkiej rozmowie wstępnej.`,
    nameLabel: `Imię i nazwisko`,
    emailLabel: `E-mail`,
    msgLabel: `Co strona ma osiągnąć?`,
    submit: `Wyślij`,
    sending: `Wysyłanie…`,
    microcopy: `Bez newslettera i automatycznych follow-upów. Tylko jedna odpowiedź od człowieka.`,
    fallbackPre: `Formularz nie jest jeszcze podłączony. Napisz do nas bezpośrednio na `,
    fallbackPost: `. Obowiązuje ta sama obietnica jednego dnia roboczego.`,
    errorPre: `Coś poszło nie tak po naszej stronie. Spróbuj ponownie albo napisz na `,
    errorPost: `.`,
    readiness: {
      ready: `Treści są gotowe`,
      partly: `Część z nich`,
      none: `Zaczynamy od zera`,
    },
    notes: {
      none: `obejmuje copywriting od zera`,
      partly: `obejmuje dokończenie Twoich treści razem z Tobą`,
    },
    budgets: {
      lt5k: `poniżej 5 000 zł`,
      b5to10k: `5–10 000 zł`,
      b10to20k: `10–20 000 zł`,
      gt20k: `20 000+ zł`,
      unsure: `Jeszcze nie wiem`,
    },
  },
  footer: {
    tagline: `Strony, które zamieniają wyświetlenia w sprzedaż.`,
    rights: `Wszelkie prawa zastrzeżone.`,
  },
  sticky: {
    cta: `Rozpocznij projekt`,
  },
  demos: {
    resize: {
      cursor: `Przeciągnij`,
      aria: `Zmień szerokość okna demo`,
      brand: `Acme`,
      bp: { desktop: `Komputer`, tablet: `Tablet`, mobile: `Telefon` },
    },
    theme: {
      cursor: `Zmień markę`,
      aria: `Motyw marki demo`,
      themeAria: (name: string) => `Motyw ${name}`,
      brandSuffix: ``,
      headline: `Otwarte sześć dni w tygodniu.`,
      sub: `Ten sam układ, inna marka. Nic nie zostało przeprojektowane.`,
      cta: `Zarezerwuj`,
      secondary: `Menu`,
      names: { studio: `Studio`, bakery: `Piekarnia`, clinic: `Klinika`, gym: `Siłownia` },
    },
    speed: {
      cursor: `Odtwórz`,
      headline: `Świeża kawa, szybsza strona.`,
      sub: `Treść wyświetlona. Nie ma już na co czekać.`,
      cta: `Zamów z wyprzedzeniem`,
      msLabel: ` ms do załadowania`,
      replay: `Odtwórz ładowanie`,
    },
    motion: {
      cursor: `Odtwórz`,
      aria: `Krzywa ruchu`,
      moves: {
        linear: {
          name: `Liniowy`,
          note: `Stała prędkość. Wygląda mechanicznie, bo tak porusza się domyślna strona.`,
        },
        expo: {
          name: `Wykładniczy`,
          note: `Szybki start, łagodne lądowanie: nasz znak firmowy przy przewijaniu.`,
        },
        spring: {
          name: `Sprężysty`,
          note: `Fizyka, nie krzywa. Na tym działają tu przyciski i karty.`,
        },
      },
    },
  },
  notFound: {
    eyebrow: `Błąd 404`,
    heading: `Ta strona skręciła nie tam, gdzie trzeba.`,
    body: `Link jest nieprawidłowy albo strona została przeniesiona. Wszystko, co ważne, znajdziesz na stronie głównej, o jedno przewinięcie stąd.`,
    home: `Wróć na stronę główną`,
    start: `Rozpocznij projekt →`,
  },
  consent: {
    title: `Mierzymy tylko to, na co pozwolisz.`,
    body: `Pliki niezbędne utrzymują działanie strony. Pliki analityczne pokazują nam, które sekcje ludzie czytają i w którym miejscu wychodzą. Dzięki temu budujemy lepsze strony. Nic nie działa, dopóki nie wybierzesz.`,
    policy: `Przeczytaj politykę prywatności`,
    acceptAll: `Zgadzam się na analitykę`,
    rejectAll: `Nie zgadzam się`,
    manage: `Wybierz, na co pozwalasz`,
    save: `Zapisz wybór`,
    back: `Wróć`,
    necessaryLabel: `Niezbędne`,
    necessaryDesc: `Zapamiętują język i ten wybór. Zawsze włączone, bo bez nich strona nie zadziała.`,
    analyticsLabel: `Analityczne`,
    analyticsDesc: `Anonimowe statystyki stron i sekcji. Bez reklam, bez podmiotów trzecich, bez profilowania.`,
    always: `Zawsze włączone`,
    settingsLink: `Ustawienia plików cookie`,
  },
  currency: `zł`,
};

export const DICTS: Record<Locale, Dictionary> = { en, pl };
