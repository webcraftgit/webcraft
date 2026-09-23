"use client";

import { useLocale } from "@/components/i18n/LanguageProvider";

/* ————————————————————————————————————————————————————————————————
 * WIŚNIOWA — DEMO COPY, PL + EN (CP4_13)
 *
 * WHY THIS LIVES HERE AND NOT IN lib/i18n/dictionaries.ts
 * That file is imported by the site shell, so everything in it ships to every
 * visitor of the Webcraft homepage. This is ~8kb of copy for a fictional dental
 * clinic that most visitors never open. The demo is deliberately a lazy chunk
 * (see PROJECT_STATE on the 233kb first-load budget) and its copy belongs in
 * that chunk with it. The PATTERN is copied from dictionaries.ts on purpose:
 * `en` is the typed source of truth and `pl` is declared `typeof en`, so a key
 * added to one language and not the other fails the build. Same drift guard,
 * different bundle.
 *
 * WHAT IS *NOT* TRANSLATED, AND WHY
 *  · Personal names. The clinic is in Warsaw; Anna Kowalska stays Anna Kowalska
 *    on the English page. Only TITLES and roles change — "lek. dent." is a
 *    Polish licence, so English gets "Dr" rather than a US credential like DDS
 *    that nobody here holds.
 *  · The street. `ul.` is left as-is; an expat reading the English page needs
 *    the form they will actually see on the building, not "Wiśniowa Street".
 *  · Prices stay in PLN, written `150 zł` in Polish and `PLN 150` in English.
 *    NOT converted to euro or pounds: a converted number would be a false claim
 *    the moment the rate moves, and the patient pays złoty either way.
 *  · SCOPES ids. They are React state values, not copy — they must be identical
 *    across languages or switching language would reset the booking selection.
 *
 * ONE COPY DECISION WORTH KNOWING: the primary CTA is "Book a visit", not the
 * more idiomatic "Book an appointment". MEASURED in a browser at the real
 * `heroXl` size (26px, px-16): "Umów wizytę" 291px, "Book a visit" 274px,
 * "Book an appointment" 394px. A 390px viewport with the hero's px-6 gutters
 * leaves 342px, so the idiomatic phrasing overflows by ~50px — and still
 * overflows at 346px even if the pill's padding is cut to px-10. So the string
 * had to be the short one; no layout change buys enough room to avoid it.
 * "Book a visit" is 17px NARROWER than the Polish it replaces, so it cannot
 * introduce an overflow anywhere the Polish already fits.
 * ———————————————————————————————————————————————————————————————— */

export type Claim = { text: string; bold: string[] };

export const en = {
  meta: {
    disclaimer:
      "A demo project by Webcraft studio · Stomatologia Wiśniowa is a fictional brand. This page shows what the studio builds.",
    langLabel: "Language",
  },

  nav: {
    items: [
      { label: "Treatments", id: "oferta" },
      { label: "The practice", id: "gabinet" },
      { label: "First visit", id: "pierwsza-wizyta" },
      { label: "Prices", id: "cennik" },
      { label: "Team", id: "zespol" },
      { label: "Contact", id: "kontakt" },
    ],
    main: "Main",
    mobile: "Mobile menu",
    open: "Open menu",
    close: "Close menu",
    callAria: "Call",
    mailAria: "Send an email",
    railHours: "MON–FRI 8–20",
    book: "Book a visit",
    skip: "Skip to booking",
  },

  status: {
    open: (until: string) => `Open now · until ${until}`,
    closed: (when: "today" | "tomorrow" | "monday", at: string) =>
      `Closed now · we open ${{ today: "today", tomorrow: "tomorrow", monday: "on Monday" }[when]} at ${at}`,
  },

  hero: {
    eyebrow: "Warsaw · Mokotów",
    title: "Dentistry without the rush.",
    lead: "A private practice in Mokotów. Longer appointments, written estimates, and a pace you set, not the calendar.",
    cta: "Book a visit",
  },

  ticker: [
    "microscope",
    "intraoral scanner",
    "inhalation sedation",
    "digital radiography",
    "erythritol",
    "written estimates",
  ],

  offer: {
    eyebrow: "Treatments",
    titleA: "Precise treatment,",
    titleB: "explained in plain language",
    cta: "See prices",
    claims: [
      {
        text: "we cover the full range of restorative work and prosthetics, and we do root canal treatment under a microscope for greater precision and less risk of complications",
        bold: ["the full range of restorative work and prosthetics", "under a microscope"],
      },
      {
        text: "we clean with erythritol-based powder, the gentlest available, so your gums aren’t stinging when you leave the chair",
        bold: ["erythritol-based powder"],
      },
      {
        text: "we walk through the treatment plan on an intraoral scan, so you see on screen exactly what we’re describing, before anything begins",
        bold: ["an intraoral scan", "before anything begins"],
      },
      {
        text: "for patients who find a visit genuinely stressful, we offer inhalation sedation and longer, quieter morning slots",
        bold: ["inhalation sedation", "longer, quieter morning slots"],
      },
    ] as Claim[],
  },

  quote: {
    text: "Good equipment can be bought in a week. Trust takes years to build and one visit to lose. That’s why nobody here watches the clock.",
    name: "Dr A. Kowalska",
    role: "founder of the practice",
  },

  about: {
    eyebrow: "About us",
    titleA: "Time nobody here",
    titleB: "is counting",
    claims: [
      {
        text: "we’re a private practice and we don’t work under quota pressure, so a visit lasts as long as it needs to, not as long as a billing code allows",
        bold: ["we don’t work under quota pressure"],
      },
      {
        text: "every visit starts with a conversation, not with the chair; we agree on a hand signal that stops the work at any moment, with nothing to explain",
        bold: ["with a conversation, not with the chair", "a hand signal"],
      },
      {
        text: "you get the full treatment estimate in writing before it starts, and it doesn’t change without a conversation with you",
        bold: ["in writing before it starts"],
      },
      {
        text: "the waiting room is a separate room: you can’t hear reception from the chair, and you can’t hear the treatment room from the waiting room",
        bold: ["a separate room"],
      },
    ] as Claim[],
  },

  gallery: [
    "A consultation is the first step. It ends with a treatment plan and an estimate, not with a procedure.",
    "We work under magnification and under the microscope, for greater precision and less risk of complications.",
    "Every instrument set is packed and sterilised separately, with each load logged.",
  ],

  booking: {
    eyebrow: "Booking",
    titleA: "Book a visit",
    titleB: "in three steps",
    lead: "Choose the treatment and a time of day, then leave your number. Reception calls back the same working day to fix the exact time. No account, no passwords.",
    phone: "Prefer to call?",
    stepsAria: "Booking steps",
    steps: ["Treatment", "Time", "Your details"],
    stepOf: (n: number, label: string) => `Step ${n} of 3: ${label}`,
    legend: "What can we help with?",
    scopes: [
      { id: "konsultacja", name: "Consultation", meta: "30 min · check-up and plan" },
      { id: "higienizacja", name: "Hygiene visit", meta: "45 min · scaling and air polishing" },
      { id: "leczenie", name: "Restorative treatment", meta: "60 min · fillings" },
      { id: "niewiem", name: "Not sure", meta: "We’ll advise at the first visit" },
    ],
    legendTime: "When is easiest for you?",
    times: [
      { id: "rano", name: "Morning", meta: "8:00 – 12:00" },
      { id: "poludnie", name: "Afternoon", meta: "12:00 – 16:00" },
      { id: "wieczor", name: "Evening", meta: "16:00 – 20:00" },
      { id: "sobota", name: "Saturday", meta: "9:00 – 14:00" },
      { id: "obojetnie", name: "Any time", meta: "The first free slot" },
    ],
    legendContact: "Where should we call you?",
    name: "First name",
    tel: "Phone number",
    telHint: "We’ll only use it to call you about this visit.",
    msg: "Anything we should know?",
    msgOptional: "optional",
    msgPlaceholder: "e.g. a tooth hurts, or you’re nervous about injections",
    errName: "Enter your first name, so we know who to ask for.",
    errTel: "Enter a phone number with at least 9 digits, e.g. 600 000 000.",
    errSummary: "Check the highlighted fields.",
    choice: "Your choice",
    change: "Change",
    note: "This is a demo, so we don’t show real availability. Reception agrees the exact time with you by phone.",
    back: "Back",
    next: "Next: time",
    nextContact: "Next: your details",
    submit: "Send visit request",
    doneTitle: (name: string) => `Request sent. Thank you, ${name}.`,
    doneBody: (tel: string) => `Reception will call ${tel} the same working day to agree the exact time.`,
    doneDemo: "This is a demo page, so nothing was actually sent.",
    again: "Start a new request",
  },

  team: {
    eyebrow: "Team",
    title: "Conversation first, treatment second",
    members: [
      { initials: "AK", name: "Dr Anna Kowalska", role: "Restorative dentistry, endodontics" },
      { initials: "PW", name: "Dr Piotr Wilczyński", role: "Prosthetics and implants" },
      { initials: "MN", name: "Marta Nowak, dental hygienist", role: "Hygiene and prevention" },
      { initials: "JZ", name: "Dr Julia Zaremba", role: "Paediatric dentistry" },
    ],
    note: "Initials instead of photographs: the team is fictional, and this project doesn’t put models’ faces under invented names.",
  },

  promises: {
    eyebrow: "Our commitments",
    title: "Four things we promise every patient",
    items: [
      "The first visit can be a conversation and nothing else. You don’t have to decide anything that day.",
      "Before we start, we’ll tell you what we’re doing, how long it will take and what it will cost.",
      "A hand signal stops the work immediately. You don’t have to say anything or explain.",
      "We don’t suggest treatments we wouldn’t have done on ourselves.",
    ],
    note: "These are our commitments, not patient reviews. The practice is fictional, so no reviews are quoted here and none ever will be.",
  },

  fear: {
    line: "You don’t have to like the dentist. You only have to feel safe.",
    cta: "Book a first visit",
  },

  firstVisit: {
    eyebrow: "First visit",
    title: "What happens before anyone does anything",
    lead: "A consultation takes about 30 minutes and costs PLN 150. Here’s everything in it, so the first visit isn’t a surprise.",
    steps: [
      {
        title: "A conversation before you sit in the chair",
        body: "We ask about pain, about previous treatment, and about what worries you. We agree on a signal that stops us. It holds for the whole visit and every one after it.",
      },
      {
        title: "Examination and imaging",
        body: "We check every tooth, your gums and your bite. We take an X-ray when it would genuinely change the plan, not as a routine.",
      },
      {
        title: "A plan and a written estimate",
        body: "You get a list ordered by urgency: what needs treating now, what can wait, and what’s purely cosmetic. Every item has a price next to it.",
      },
      {
        title: "The decision is yours",
        body: "You can take the estimate home or get a second opinion elsewhere. We don’t ask for a decision the same day and we don’t call with offers.",
      },
    ],
    painTitle: "If you’re in pain, the order changes.",
    painBody: "We deal with the pain at that same visit and leave the examination and the plan for later. Call rather than filling in a form.",
    painCta: "Call",
  },

  faq: {
    eyebrow: "Questions",
    titleA: "Before",
    titleB: "you ask",
    lead: "The questions we’re asked most before a first visit. We’ll answer the rest by phone.",
    items: [
      {
        q: "I’m afraid of the dentist. What do you do about that?",
        a: "Every visit starts with a conversation, not with the chair. We tell you what we’re going to do before we do it, and we agree on a hand signal that always stops the work. The first visit can be a conversation and nothing more. If that isn’t enough on its own, we offer inhalation sedation.",
      },
      {
        q: "How long is the first visit and what happens in it?",
        a: "About 30 minutes: history, examination, and imaging if it’s needed. You leave with a treatment plan and a full estimate. We don’t begin treatment at the first visit unless you ask us to.",
      },
      {
        q: "Will I know what the treatment costs up front?",
        a: "Yes. You get the estimate in writing before treatment begins, and it doesn’t change without a conversation with you. Larger plans are split into stages and into payments.",
      },
      {
        q: "Do you treat patients under the NFZ?",
        a: "The practice is private. The NFZ is Poland’s public health fund, and we don’t contract with it. In exchange we don’t work under quota pressure: visits are longer, waiting times shorter, and the treatment plan doesn’t have to fit inside a schedule of public benefits.",
      },
    ],
  },

  pricing: {
    eyebrow: "Prices",
    titleA: "Prices without",
    titleB: "surprises",
    lead: "You get the estimate for the whole treatment in writing before it starts. Larger plans are split into stages and into payments.",
    rows: [
      { name: "Consultation with treatment plan", price: "PLN 150" },
      { name: "Hygiene visit (scaling and air polishing)", price: "PLN 350" },
      { name: "Filling", price: "from PLN 300" },
      { name: "Root canal treatment under a microscope", price: "from PLN 900" },
      { name: "Take-home tray whitening", price: "from PLN 1,200" },
    ],
    note: "You’ll always know the final cost of treatment before it begins.",
    cta: "Book a consultation",
  },

  contact: {
    title: "Let’s start with a conversation",
    lead: "Call us or leave a callback request, and we’ll get back to you the same working day.",
    labelAddress: "Address",
    labelHours: "Hours",
    labelContact: "Contact",
    addressA: "ul. Wiśniowa",
    addressB: "Mokotów, Warsaw",
    travel: [
      { label: "Getting here", body: "Tram and bus stops about three minutes’ walk from the entrance." },
      { label: "Parking", body: "Paid street parking along the road, two patient spaces in the courtyard." },
      { label: "Entrance", body: "Ground floor, no steps or thresholds. Lift in the building, wheelchair-accessible toilet." },
    ],
    note: "The address, directions and hours are illustrative, because the brand is fictional. We deliberately leave out the building number: ul. Wiśniowa is a real street and we won’t send anyone to a real address.",
  },

  hours: [
    { day: "Monday – Friday", short: "Mon–Fri", time: "8:00 – 20:00" },
    { day: "Saturday", short: "Sat", time: "9:00 – 14:00" },
    { day: "Sunday", short: "Sun", time: "closed" },
  ],

  footer: {
    practice: "Practice",
    hours: "Hours",
    contact: "Contact",
    addressA: "ul. Wiśniowa, Warsaw",
    addressB: "Mokotów",
    note: "The brand, the team and the contact details are fictional. This page is not medical advice.",
    credit: "Concept project · Webcraft",
  },

  bar: {
    call: "Call",
    book: "Book a visit",
  },

  photos: {
    alt: {
      hero: "Dental treatment room in daylight",
      reception: "Reception and waiting room",
      detail: "Close-up of hands and dental instruments",
      team: "A member of the team in the treatment room",
      quote: "Founder of the practice",
      gallery1: "Talking with a patient before treatment",
      gallery2: "A dentist during a careful examination",
      gallery3: "Dental instruments",
    },
    shot: {
      hero: "treatment room, wide frame, daylight",
      reception: "reception from the doorway",
      detail: "detail: hands and instruments",
      team: "team in the practice, wide frame (2:1)",
      quote: "portrait or practice interior",
      gallery1: "a moment during treatment",
      gallery2: "work under magnification",
      gallery3: "instruments and sterilisation",
    },
  },
};

export const pl: typeof en = {
  meta: {
    disclaimer:
      "Projekt demonstracyjny studia Webcraft · Stomatologia Wiśniowa to marka fikcyjna. Strona prezentuje możliwości studia.",
    langLabel: "Język",
  },

  nav: {
    items: [
      { label: "Oferta", id: "oferta" },
      { label: "Gabinet", id: "gabinet" },
      { label: "Pierwsza wizyta", id: "pierwsza-wizyta" },
      { label: "Cennik", id: "cennik" },
      { label: "Zespół", id: "zespol" },
      { label: "Kontakt", id: "kontakt" },
    ],
    main: "Główna",
    mobile: "Menu mobilne",
    open: "Otwórz menu",
    close: "Zamknij menu",
    callAria: "Zadzwoń",
    mailAria: "Napisz e-mail",
    railHours: "PON–PT 8–20",
    book: "Umów wizytę",
    skip: "Przejdź do rezerwacji",
  },

  status: {
    open: (until: string) => `Otwarte teraz · do ${until}`,
    closed: (when: "today" | "tomorrow" | "monday", at: string) =>
      `Teraz zamknięte · otwieramy ${{ today: "dziś", tomorrow: "jutro", monday: "w poniedziałek" }[when]} o ${at}`,
  },

  hero: {
    eyebrow: "Warszawa · Mokotów",
    title: "Stomatologia bez pośpiechu.",
    lead: "Prywatny gabinet na Mokotowie. Dłuższe wizyty, kosztorys na piśmie i tempo, które ustalasz Ty, a nie kalendarz.",
    cta: "Umów wizytę",
  },

  ticker: [
    "mikroskop",
    "skaner wewnątrzustny",
    "sedacja wziewna",
    "cyfrowa radiologia",
    "erytrytol",
    "kosztorys na piśmie",
  ],

  offer: {
    eyebrow: "Oferta",
    titleA: "Leczymy dokładnie",
    titleB: "i tłumaczymy po ludzku",
    cta: "Zobacz cennik",
    claims: [
      {
        text: "prowadzimy pełen zakres leczenia zachowawczego i protetyki, a leczenie kanałowe wykonujemy pod mikroskopem, co daje większą dokładność i mniejsze ryzyko powikłań",
        bold: ["pełen zakres leczenia zachowawczego i protetyki", "pod mikroskopem"],
      },
      {
        text: "higienizację prowadzimy piaskiem na bazie erytrytolu, najdelikatniejszym z dostępnych, więc dziąsła nie pieką po wyjściu z fotela",
        bold: ["piaskiem na bazie erytrytolu"],
      },
      {
        text: "plan leczenia pokazujemy na skanie wewnątrzustnym, więc widzisz na ekranie dokładnie to, o czym mówimy, zanim cokolwiek się zacznie",
        bold: ["skanie wewnątrzustnym", "zanim cokolwiek się zacznie"],
      },
      {
        text: "pacjentom, dla których wizyta jest realnym stresem, proponujemy sedację wziewną oraz dłuższe, spokojniejsze terminy poranne",
        bold: ["sedację wziewną", "dłuższe, spokojniejsze terminy poranne"],
      },
    ] as Claim[],
  },

  quote: {
    text: "Dobry sprzęt można kupić w tydzień. Zaufanie buduje się latami i traci w jedną wizytę. Dlatego u nas nikt nie patrzy na zegar.",
    name: "lek. dent. A. Kowalska",
    role: "założycielka gabinetu",
  },

  about: {
    eyebrow: "O nas",
    titleA: "Czas, którego",
    titleB: "nikt tu nie liczy",
    claims: [
      {
        text: "jesteśmy gabinetem prywatnym i nie pracujemy pod presją limitów, więc wizyta trwa tyle, ile trzeba, a nie tyle, ile przewiduje rozliczenie",
        bold: ["nie pracujemy pod presją limitów"],
      },
      {
        text: "każdą wizytę zaczynamy od rozmowy, nie od fotela; umawiamy się na znak ręką, który zatrzymuje pracę w każdej chwili, bez tłumaczenia się",
        bold: ["od rozmowy, nie od fotela", "znak ręką"],
      },
      {
        text: "pełny kosztorys leczenia dostajesz na piśmie przed jego rozpoczęciem i nie zmienia się bez rozmowy z Tobą",
        bold: ["na piśmie przed jego rozpoczęciem"],
      },
      {
        text: "poczekalnia jest osobnym pomieszczeniem: z fotela nie słychać recepcji, a z poczekalni nie słychać pracy gabinetu",
        bold: ["osobnym pomieszczeniem"],
      },
    ] as Claim[],
  },

  gallery: [
    "Konsultacja to pierwszy krok. Kończy się planem leczenia i kosztorysem, nie zabiegiem.",
    "Pracujemy w powiększeniu i pod mikroskopem, co daje większą dokładność i mniejsze ryzyko powikłań.",
    "Każdy zestaw narzędzi jest pakowany i sterylizowany osobno, z kontrolą każdego wsadu.",
  ],

  booking: {
    eyebrow: "Rezerwacja",
    titleA: "Umów wizytę",
    titleB: "w trzech krokach",
    lead: "Wybierasz zakres i porę dnia, zostawiasz numer, a recepcja oddzwania tego samego dnia roboczego i ustala dokładną godzinę. Bez zakładania konta i bez haseł.",
    phone: "Wolisz zadzwonić?",
    stepsAria: "Kroki rezerwacji",
    steps: ["Zakres", "Pora", "Kontakt"],
    stepOf: (n: number, label: string) => `Krok ${n} z 3: ${label}`,
    legend: "W czym możemy pomóc?",
    scopes: [
      { id: "konsultacja", name: "Konsultacja", meta: "30 min · przegląd i plan" },
      { id: "higienizacja", name: "Higienizacja", meta: "45 min · skaling i piaskowanie" },
      { id: "leczenie", name: "Leczenie zachowawcze", meta: "60 min · wypełnienia" },
      { id: "niewiem", name: "Nie wiem", meta: "Doradzimy przy pierwszej wizycie" },
    ],
    legendTime: "Kiedy najłatwiej Ci przyjść?",
    times: [
      { id: "rano", name: "Rano", meta: "8:00 – 12:00" },
      { id: "poludnie", name: "Po południu", meta: "12:00 – 16:00" },
      { id: "wieczor", name: "Wieczorem", meta: "16:00 – 20:00" },
      { id: "sobota", name: "W sobotę", meta: "9:00 – 14:00" },
      { id: "obojetnie", name: "Obojętnie", meta: "Pierwszy wolny termin" },
    ],
    legendContact: "Gdzie mamy oddzwonić?",
    name: "Imię",
    tel: "Numer telefonu",
    telHint: "Użyjemy go wyłącznie, żeby oddzwonić w sprawie tej wizyty.",
    msg: "Coś, o czym powinniśmy wiedzieć?",
    msgOptional: "opcjonalnie",
    msgPlaceholder: "np. boli mnie ząb albo boję się znieczulenia",
    errName: "Wpisz imię, żebyśmy wiedzieli, o kogo zapytać.",
    errTel: "Wpisz numer telefonu: co najmniej 9 cyfr, np. 600 000 000.",
    errSummary: "Sprawdź zaznaczone pola.",
    choice: "Twój wybór",
    change: "Zmień",
    note: "To wersja demonstracyjna, więc nie pokazujemy rzeczywistej dostępności. Dokładną godzinę recepcja ustala z Tobą telefonicznie.",
    back: "Wstecz",
    next: "Dalej: pora",
    nextContact: "Dalej: kontakt",
    submit: "Wyślij prośbę o wizytę",
    doneTitle: (name: string) => `Prośba wysłana. Dziękujemy, ${name}.`,
    doneBody: (tel: string) => `Recepcja oddzwoni na numer ${tel} tego samego dnia roboczego, żeby ustalić dokładną godzinę.`,
    doneDemo: "To strona demonstracyjna, więc w rzeczywistości nic nie zostało wysłane.",
    again: "Złóż nową prośbę",
  },

  team: {
    eyebrow: "Zespół",
    title: "Najpierw rozmowa, potem leczenie",
    members: [
      { initials: "AK", name: "lek. dent. Anna Kowalska", role: "Stomatologia zachowawcza, endodoncja" },
      { initials: "PW", name: "lek. dent. Piotr Wilczyński", role: "Protetyka i implanty" },
      { initials: "MN", name: "hig. stom. Marta Nowak", role: "Higienizacja i profilaktyka" },
      { initials: "JZ", name: "lek. dent. Julia Zaremba", role: "Stomatologia dziecięca" },
    ],
    note: "Inicjały zamiast zdjęć: zespół jest fikcyjny, a projekt nie podstawia twarzy modeli pod wymyślone nazwiska.",
  },

  promises: {
    eyebrow: "Nasze zobowiązania",
    title: "Cztery rzeczy, które obiecujemy każdemu pacjentowi",
    items: [
      "Pierwsza wizyta może być samą rozmową. Tego dnia nie musisz o niczym decydować.",
      "Zanim zaczniemy, powiemy, co robimy, ile to potrwa i ile będzie kosztować.",
      "Znak ręką zatrzymuje pracę natychmiast. Nie trzeba nic mówić ani tłumaczyć.",
      "Nie proponujemy zabiegów, których nie wykonalibyśmy sobie samym.",
    ],
    note: "To nasze zobowiązania, nie opinie pacjentów. Gabinet jest fikcyjny, więc nie ma i nie będzie tu cytowanych recenzji.",
  },

  fear: {
    line: "Nie musisz lubić dentysty. Wystarczy, że poczujesz się bezpiecznie.",
    cta: "Umów się na pierwszą wizytę",
  },

  firstVisit: {
    eyebrow: "Pierwsza wizyta",
    title: "Co się dzieje, zanim ktokolwiek cokolwiek zrobi",
    lead: "Konsultacja trwa około 30 minut i kosztuje 150 zł. Poniżej jej pełny przebieg, żeby pierwsza wizyta nie była niespodzianką.",
    steps: [
      {
        title: "Rozmowa, zanim usiądziesz w fotelu",
        body: "Pytamy o ból, o wcześniejsze leczenie i o to, czego się obawiasz. Ustalamy znak, na który przerywamy. Obowiązuje przez całą wizytę i każdą następną.",
      },
      {
        title: "Przegląd i zdjęcia",
        body: "Sprawdzamy wszystkie zęby, dziąsła i zgryz. Zdjęcie RTG wykonujemy wtedy, gdy może realnie zmienić plan leczenia, a nie rutynowo.",
      },
      {
        title: "Plan i kosztorys na piśmie",
        body: "Dostajesz listę uporządkowaną według pilności: co wymaga leczenia teraz, co może poczekać, a co jest wyłącznie kosmetyką. Przy każdej pozycji cena.",
      },
      {
        title: "Decyzja należy do Ciebie",
        body: "Kosztorys możesz zabrać do domu albo skonsultować gdzie indziej. Nie prosimy o decyzję tego samego dnia i nie dzwonimy z ofertami.",
      },
    ],
    painTitle: "Jeśli boli, kolejność się zmienia.",
    painBody: "Bólem zajmujemy się na tej samej wizycie, a przegląd i plan zostawiamy na później. Zadzwoń, zamiast wypełniać formularz.",
    painCta: "Zadzwoń",
  },

  faq: {
    eyebrow: "Pytania",
    titleA: "Zanim",
    titleB: "zapytasz",
    lead: "Najczęstsze pytania przed pierwszą wizytą. Na resztę odpowiemy przez telefon.",
    items: [
      {
        q: "Boję się dentysty. Co z tym robicie?",
        a: "Każdą wizytę zaczynamy od rozmowy, nie od fotela. Mówimy, co zamierzamy zrobić, zanim to zrobimy, i umawiamy się na znak ręką, który zawsze zatrzymuje pracę. Pierwsza wizyta może być samą rozmową, bez żadnego zabiegu. Dla osób, dla których to za mało, mamy sedację wziewną.",
      },
      {
        q: "Ile trwa pierwsza wizyta i co się na niej dzieje?",
        a: "Około 30 minut: wywiad, przegląd, w razie potrzeby diagnostyka obrazowa. Wychodzisz z planem leczenia i pełnym kosztorysem. Nie zaczynamy leczenia na pierwszej wizycie, chyba że sobie tego zażyczysz.",
      },
      {
        q: "Czy poznam koszt leczenia z góry?",
        a: "Tak. Kosztorys dostajesz na piśmie przed rozpoczęciem leczenia i nie zmienia się bez rozmowy z Tobą. Większe plany leczenia rozkładamy na etapy i na płatności.",
      },
      {
        q: "Czy przyjmujecie na NFZ?",
        a: "Gabinet jest prywatny. Za to nie pracujemy pod presją limitów: wizyty są dłuższe, terminy krótsze, a plan leczenia nie musi mieścić się w koszyku świadczeń.",
      },
    ],
  },

  pricing: {
    eyebrow: "Cennik",
    titleA: "Ceny bez",
    titleB: "niespodzianek",
    lead: "Kosztorys całego leczenia dostajesz na piśmie przed jego rozpoczęciem. Większe plany rozkładamy na etapy i płatności.",
    rows: [
      { name: "Konsultacja z planem leczenia", price: "150 zł" },
      { name: "Higienizacja (skaling i piaskowanie)", price: "350 zł" },
      { name: "Wypełnienie", price: "od 300 zł" },
      { name: "Leczenie kanałowe pod mikroskopem", price: "od 900 zł" },
      { name: "Wybielanie nakładkowe", price: "od 1 200 zł" },
    ],
    note: "Ostateczny koszt leczenia zawsze poznasz przed jego rozpoczęciem.",
    cta: "Umów konsultację",
  },

  contact: {
    title: "Zacznijmy od rozmowy",
    lead: "Zadzwoń albo zostaw prośbę o kontakt, a oddzwonimy tego samego dnia roboczego.",
    labelAddress: "Adres",
    labelHours: "Godziny",
    labelContact: "Kontakt",
    addressA: "ul. Wiśniowa",
    addressB: "Mokotów, Warszawa",
    travel: [
      { label: "Dojazd", body: "Przystanek tramwajowy i autobusowy około 3 minut pieszo od wejścia." },
      { label: "Parking", body: "Strefa płatnego parkowania wzdłuż ulicy, dwa miejsca dla pacjentów na podwórzu." },
      { label: "Wejście", body: "Parter, bez schodów i progów. Winda w budynku, toaleta dostępna dla wózków." },
    ],
    note: "Adres, dojazd i godziny są przykładowe, bo marka jest fikcyjna. Numeru budynku celowo nie podajemy: ul. Wiśniowa istnieje naprawdę i nie kierujemy nikogo pod prawdziwy adres.",
  },

  hours: [
    { day: "Poniedziałek – piątek", short: "Pon–Pt", time: "8:00 – 20:00" },
    { day: "Sobota", short: "Sob", time: "9:00 – 14:00" },
    { day: "Niedziela", short: "Nd", time: "nieczynne" },
  ],

  footer: {
    practice: "Gabinet",
    hours: "Godziny",
    contact: "Kontakt",
    addressA: "ul. Wiśniowa, Warszawa",
    addressB: "Mokotów",
    note: "Marka, zespół i dane kontaktowe są fikcyjne. Strona nie stanowi porady medycznej.",
    credit: "Projekt koncepcyjny · Webcraft",
  },

  bar: {
    call: "Zadzwoń",
    book: "Umów wizytę",
  },

  photos: {
    alt: {
      hero: "Gabinet stomatologiczny w świetle dziennym",
      reception: "Recepcja i poczekalnia",
      detail: "Zbliżenie na dłonie i narzędzia stomatologiczne",
      team: "Członkini zespołu w gabinecie stomatologicznym",
      quote: "Założycielka gabinetu",
      gallery1: "Rozmowa z pacjentem przed leczeniem",
      gallery2: "Stomatolog podczas dokładnego badania",
      gallery3: "Narzędzia stomatologiczne",
    },
    shot: {
      hero: "gabinet, kadr szeroki, światło dzienne",
      reception: "recepcja od strony drzwi",
      detail: "detal: dłonie i narzędzia",
      team: "zespół w gabinecie, kadr szeroki (2:1)",
      quote: "portret lub wnętrze gabinetu",
      gallery1: "moment zabiegu",
      gallery2: "praca w powiększeniu",
      gallery3: "narzędzia i sterylizacja",
    },
  },
};

/**
 * The demo follows the SITE-WIDE locale rather than holding its own. A visitor
 * reading the studio's homepage in English should not have a Polish clinic demo
 * open on top of it, and the in-demo toggle therefore sets the global locale —
 * one piece of state, already persisted to localStorage by LanguageProvider.
 *
 * Requires LanguageProvider above it in the tree; app/layout.tsx wraps the whole
 * app, so that holds for both the grid card and the fullscreen player.
 */
export function useWisCopy() {
  const [locale] = useLocale();
  return locale === "en" ? en : pl;
}
