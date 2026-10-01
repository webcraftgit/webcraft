/**
 * The intake questionnaire, as data (client portal, phase 1).
 *
 * Source text: agency-kit/templates/intake/intake-questionnaire.{pl,en}.md.
 * Same 35 questions, same order, same numbers, so the kit's
 * "question → brief field" map still holds. When the kit's wording changes,
 * change it here too (and the other way round).
 *
 * Answers are stored flat, one key per field: `q1`, `q2.nip`, `q24.none`…
 * Flat keys keep validation an allow-list: anything not declared here is
 * dropped before it reaches the database.
 */

export type L = { pl: string; en: string };

export type FieldKind = "text" | "email" | "url" | "tel" | "textarea" | "choice" | "check";

export type Field = {
  key: string;
  kind: FieldKind;
  /** Sub-label for multi-field questions; single-field questions use the question title. */
  label?: L;
  required?: boolean;
  max: number;
  options?: { value: string; label: L }[];
  /** Only shown (and only required) when another field has this value. */
  showIf?: { key: string; equals: string };
};

export type FileSlot = {
  kind: "logo" | "photo";
  /** Checkbox key that stands in for an upload ("no logo yet", "no photos"). */
  fallbackKey: string;
  fallbackLabel: L;
};

export type Question = {
  n: number;
  id: string;
  section: number;
  title: L;
  hint?: L;
  required: boolean;
  /** Brief fields this answer fills (agency-kit/templates/brief.md). */
  brief: string[];
  fields: Field[];
  files?: FileSlot;
};

export const SECTIONS: L[] = [
  { pl: "Ty i Twoja firma", en: "You and your business" },
  { pl: "Co strona ma robić", en: "What the site should do" },
  { pl: "Twoi klienci", en: "Your customers" },
  { pl: "Co sprzedajesz", en: "What you sell" },
  { pl: "Jak mówisz", en: "How you talk" },
  { pl: "Wygląd i klimat", en: "Look and feel" },
  { pl: "Logo, zdjęcia i marka", en: "Logo, photos and brand" },
  { pl: "Podstrony i funkcje", en: "Pages and features" },
  { pl: "Domena i konta", en: "Domain and accounts" },
  { pl: "Coś jeszcze", en: "Anything else" },
];

export const INTRO: L = {
  pl: "Około 15–20 minut. Pisz tak, jak rozmawiasz z klientem, bo z Twoich słów napiszemy teksty na stronę. Krótkie odpowiedzi są w porządku. „Nie wiem” też, ustalimy to na rozmowie.",
  en: "About 15–20 minutes. Write the way you'd talk to a customer, because we'll use your own words to write your site. Short answers are fine. \"I don't know\" is fine too, and we'll sort it out on the call.",
};

export const CLOCK_NOTE: L = {
  pl: "Zegar projektu rusza, gdy mamy tę ankietę, Twoje logo i zdjęcia.",
  en: "Your project clock starts once this form, your logo and your photos are in.",
};

export const THANK_YOU: L = {
  pl: "Dziękujemy! Przeczytamy wszystko przed rozmową startową, napiszemy wszystkie teksty na stronę na podstawie tych odpowiedzi i rozmowy, a pierwszego dnia wyślemy je do Twojej akceptacji.",
  en: "Thank you! We'll read everything before the kickoff call, write all your site's text from these answers and the call, and send it for your approval on day one.",
};

const SHORT = 300;
const LONG = 4000;

/** Single-field question: the field key is the question id. */
const one = (id: string, kind: FieldKind, required: boolean, max = kind === "textarea" ? LONG : SHORT): Field[] => [
  { key: id, kind, required, max },
];

export const QUESTIONS: Question[] = [
  // ── 1. You and your business ───────────────────────────────────────────
  {
    n: 1, id: "q1", section: 1, required: true,
    title: { pl: "Nazwa firmy", en: "Business name" },
    hint: { pl: "Dokładnie tak, jak ma być na stronie.", en: "Exactly as it should appear on the site." },
    brief: ["client.business_name"],
    fields: one("q1", "text", true, 120),
  },
  {
    n: 2, id: "q2", section: 1, required: true,
    title: { pl: "Dane firmy na stronę", en: "Company details for the site" },
    hint: {
      pl: "Godziny otwarcia tylko wtedy, gdy przyjmujesz klientów na miejscu.",
      en: "Opening hours only if customers visit you.",
    },
    brief: [
      "client.legal_name", "client.nip", "client.address", "client.public_phone",
      "client.public_email", "client.opening_hours", "legal.company_details_in_footer",
    ],
    fields: [
      { key: "q2.legal_name", kind: "text", required: true, max: 200, label: { pl: "Pełna nazwa firmy", en: "Full legal name" } },
      { key: "q2.nip", kind: "text", required: true, max: 20, label: { pl: "NIP", en: "NIP (tax ID)" } },
      { key: "q2.address", kind: "text", required: true, max: SHORT, label: { pl: "Adres", en: "Address" } },
      { key: "q2.public_phone", kind: "tel", max: 40, label: { pl: "Telefon widoczny na stronie", en: "Phone to show on the site" } },
      { key: "q2.public_email", kind: "email", max: 200, label: { pl: "E-mail widoczny na stronie", en: "Email to show on the site" } },
      { key: "q2.opening_hours", kind: "textarea", max: 1000, label: { pl: "Godziny otwarcia", en: "Opening hours" } },
    ],
  },
  {
    n: 3, id: "q3", section: 1, required: true,
    title: { pl: "Kto zatwierdza pracę?", en: "Who approves the work?" },
    hint: {
      pl: "Jedna osoba, która na każdym etapie mówi ostateczne „tak”.",
      en: "One person who gives the final \"yes\" at each stage.",
    },
    brief: ["client.decision_maker", "client.contact_email", "client.contact_phone"],
    fields: [
      { key: "q3.name", kind: "text", required: true, max: 120, label: { pl: "Imię i nazwisko", en: "Name" } },
      { key: "q3.email", kind: "email", required: true, max: 200, label: { pl: "E-mail", en: "Email" } },
      { key: "q3.phone", kind: "tel", required: true, max: 40, label: { pl: "Telefon", en: "Phone" } },
    ],
  },
  {
    n: 4, id: "q4", section: 1, required: false,
    title: { pl: "Obecna strona", en: "Current website" },
    hint: { pl: "Jeśli jest.", en: "If you have one." },
    brief: ["client.website_current"],
    fields: one("q4", "url", false),
  },
  {
    n: 5, id: "q5", section: 1, required: true,
    title: { pl: "Gdzie działasz?", en: "Where do you operate?" },
    hint: { pl: "Miasto, dzielnica albo „cała Polska / online”.", en: "City, district, or \"all of Poland / online\"." },
    brief: ["client.location", "seo.service_areas"],
    fields: one("q5", "text", true),
  },

  // ── 2. What the site should do ─────────────────────────────────────────
  {
    n: 6, id: "q6", section: 2, required: true,
    title: { pl: "Jaką JEDNĄ rzecz odwiedzający ma zrobić na stronie?", en: "What's the ONE thing a visitor should do on your site?" },
    hint: { pl: "Np. umówić wizytę, zadzwonić, wysłać zapytanie, kupić.", en: "E.g. book a visit, call, send an inquiry, buy." },
    brief: ["goals.primary_action"],
    fields: one("q6", "text", true),
  },
  {
    n: 7, id: "q7", section: 2, required: false,
    title: { pl: "Co jeszcze może zrobić?", en: "Anything else they might do?" },
    brief: ["goals.secondary_actions"],
    fields: one("q7", "textarea", false),
  },
  {
    n: 8, id: "q8", section: 2, required: false,
    title: { pl: "Po czym poznasz, że strona działa?", en: "How will you know the site is working?" },
    hint: { pl: "Np. „10 zapytań miesięcznie”.", en: "E.g. \"10 inquiries a month\"." },
    brief: ["goals.success_metric"],
    fields: one("q8", "text", false),
  },

  // ── 3. Your customers ──────────────────────────────────────────────────
  {
    n: 9, id: "q9", section: 3, required: true,
    title: { pl: "Kim są Twoi najlepsi klienci?", en: "Who are your best customers?" },
    hint: { pl: "Opisz ich tak, jak opisałbyś znajomego.", en: "Describe them like you'd describe a friend." },
    brief: ["audience.who"],
    fields: one("q9", "textarea", true),
  },
  {
    n: 10, id: "q10", section: 3, required: false,
    title: { pl: "Jak dziś do Ciebie trafiają?", en: "How do they find you today?" },
    hint: { pl: "Google, Instagram, polecenia, reklamy…", en: "Google, Instagram, recommendations, ads…" },
    brief: ["audience.arrives_from"],
    fields: one("q10", "textarea", false),
  },
  {
    n: 11, id: "q11", section: 3, required: true,
    title: { pl: "O co zawsze pytają przed zakupem?", en: "What do they always ask before buying?" },
    hint: { pl: "Wypisz pytania, które słyszysz najczęściej.", en: "List the questions you hear most." },
    brief: ["audience.top_questions"],
    fields: one("q11", "textarea", true),
  },
  {
    n: 12, id: "q12", section: 3, required: false,
    title: { pl: "Dlaczego niektórzy NIE kupują?", en: "Why do some of them NOT buy?" },
    hint: { pl: "Cena, strach, termin, zaufanie…", en: "Price, fear, timing, trust…" },
    brief: ["audience.objections"],
    fields: one("q12", "textarea", false),
  },

  // ── 4. What you sell ───────────────────────────────────────────────────
  {
    n: 13, id: "q13", section: 4, required: true,
    title: { pl: "W jednym zdaniu: co sprzedajesz, komu i dlaczego właśnie Ty?", en: "In one sentence: what do you sell, to whom, and why you?" },
    brief: ["offer.summary"],
    fields: one("q13", "textarea", true, 600),
  },
  {
    n: 14, id: "q14", section: 4, required: true,
    title: { pl: "Twoje usługi lub produkty, z cenami", en: "Your services or products, with prices" },
    hint: { pl: "Albo „wycena indywidualna”. Lista wystarczy.", en: "Or \"on request\". A list is perfect." },
    brief: ["offer.services_or_products"],
    fields: one("q14", "textarea", true, 8000),
  },
  {
    n: 15, id: "q15", section: 4, required: true,
    title: { pl: "Dlaczego Ty, a nie konkurencja?", en: "Why you and not a competitor?" },
    hint: {
      pl: "Fakty, nie przymiotniki. Na przykład „otwarte do 20:00” działa lepiej niż „profesjonalnie”.",
      en: "Facts, not adjectives. For example, \"open until 20:00\" beats \"professional\".",
    },
    brief: ["offer.differentiators"],
    fields: one("q15", "textarea", true),
  },
  {
    n: 16, id: "q16", section: 4, required: false,
    title: { pl: "Dowody", en: "Proof" },
    hint: {
      pl: "Lata na rynku, liczba klientów, ocena w Google, certyfikaty, prawdziwe opinie (nigdy ich nie wymyślamy).",
      en: "Years in business, number of clients, Google rating, certificates, real testimonials (we never invent them).",
    },
    brief: ["offer.proof"],
    fields: one("q16", "textarea", false, 8000),
  },

  // ── 5. How you talk ────────────────────────────────────────────────────
  {
    n: 17, id: "q17", section: 5, required: true,
    title: { pl: "Trzy słowa o tym, jak chcesz brzmieć", en: "Three words for how you want to sound" },
    hint: { pl: "Np. spokojnie, konkretnie, eksperckie.", en: "E.g. calm, direct, expert." },
    brief: ["voice.tone"],
    fields: one("q17", "text", true),
  },
  {
    n: 18, id: "q18", section: 5, required: false,
    title: { pl: "„Ty” czy „Pan/Pani”?", en: "\"Ty\" or \"Pan/Pani\"?" },
    hint: { pl: "Jak strona ma zwracać się do odwiedzających?", en: "How should the site address visitors?" },
    brief: ["voice.formality"],
    fields: [{
      key: "q18", kind: "choice", max: 20,
      options: [
        { value: "ty", label: { pl: "„Ty”", en: "\"Ty\" (informal)" } },
        { value: "pan", label: { pl: "„Pan/Pani”", en: "\"Pan/Pani\" (formal)" } },
        { value: "unsure", label: { pl: "Nie wiem", en: "Not sure" } },
      ],
    }],
  },
  {
    n: 19, id: "q19", section: 5, required: false,
    title: { pl: "Słowa, które lubisz, i słowa, których nie znosisz", en: "Words you love, and words you hate" },
    hint: { pl: "Np. „nie znosimy słowa »innowacyjny«”.", en: "E.g. \"we hate 'innovative'\"." },
    brief: ["voice.words_to_use", "voice.words_to_avoid"],
    fields: [
      { key: "q19.love", kind: "textarea", max: 1000, label: { pl: "Lubię", en: "Love" } },
      { key: "q19.hate", kind: "textarea", max: 1000, label: { pl: "Nie znoszę", en: "Hate" } },
    ],
  },
  {
    n: 20, id: "q20", section: 5, required: false,
    title: { pl: "Wklej coś, co napisałeś", en: "Paste something you've written" },
    hint: {
      pl: "Maila do klienta, post, cokolwiek. Pomoże nam to trafić w Twój styl.",
      en: "An email to a customer, a social post, anything. It helps us match your voice.",
    },
    brief: ["voice.sample_of_their_writing"],
    fields: one("q20", "textarea", false, 8000),
  },

  // ── 6. Look and feel ───────────────────────────────────────────────────
  {
    n: 21, id: "q21", section: 6, required: true,
    title: { pl: "2–3 strony, które Ci się podobają", en: "2–3 websites you like" },
    hint: {
      pl: "I co w każdej z nich lubisz (nie muszą być z Twojej branży).",
      en: "And what you like about each (they don't have to be from your industry).",
    },
    brief: ["direction.likes"],
    fields: one("q21", "textarea", true),
  },
  {
    n: 22, id: "q22", section: 6, required: true,
    title: { pl: "1 strona, która Ci się nie podoba", en: "1 website you dislike" },
    hint: { pl: "I dlaczego.", en: "And why." },
    brief: ["direction.dislikes"],
    fields: one("q22", "textarea", true),
  },
  {
    n: 23, id: "q23", section: 6, required: false,
    title: { pl: "Strony Twojej konkurencji", en: "Your competitors' websites" },
    hint: { pl: "Co robią dobrze, a co źle.", en: "What they do well and what they do badly." },
    brief: ["competitors"],
    fields: one("q23", "textarea", false),
  },

  // ── 7. Logo, photos and brand ──────────────────────────────────────────
  {
    n: 24, id: "q24", section: 7, required: true,
    title: { pl: "Twoje logo", en: "Your logo" },
    hint: {
      pl: "Prześlij je (najlepiej SVG, ewentualnie duży PNG). Nie masz logo? Możemy uruchomić stronę z nazwą firmy złożoną eleganckim krojem pisma i dodać logo później. Projekt logo to osobne zlecenie z własną wyceną i harmonogramem. Nigdy nie opóźnia strony.",
      en: "Please upload it (SVG is best, otherwise a large PNG). Don't have a logo? We can launch your site with your business name set in a clean typeface and add the logo later. Designing a logo is a separate project with its own quote and timeline. It never delays your website.",
    },
    brief: ["brand.logo", "brand.logo_files"],
    fields: [{
      key: "q24.none", kind: "check", max: 1,
      label: { pl: "Nie mam logo: na start nazwa firmy złożona krojem pisma", en: "No logo yet: launch with my business name set in type" },
    }],
    files: {
      kind: "logo", fallbackKey: "q24.none",
      fallbackLabel: { pl: "Brak logo: nazwa złożona krojem pisma", en: "No logo: name set in type" },
    },
  },
  {
    n: 25, id: "q25", section: 7, required: true,
    title: { pl: "Twoje zdjęcia", en: "Your photos" },
    hint: {
      pl: "Twoje miejsce, zespół, realizacje. Nie robimy i nie wyszukujemy zdjęć. Użyj własnych, zatrudnij fotografa albo kup zdjęcia stockowe, które Ci się podobają. Nie masz zdjęć? Nawet kilka z telefonu robi dużą różnicę: wyślemy Ci listę ujęć.",
      en: "Your space, your team, your work. We don't take or source photos. Use your own, hire a photographer, or buy stock photos you like. No photos? Even a few phone shots make a big difference: we'll send you a shot list.",
    },
    brief: ["brand.photos", "brand.photo_files"],
    fields: [{
      key: "q25.none", kind: "check", max: 1,
      label: { pl: "Projekt bez zdjęć: typografia, kolor i ruch", en: "Design without photos: type, colour and motion" },
    }],
    files: {
      kind: "photo", fallbackKey: "q25.none",
      fallbackLabel: { pl: "Projekt bez zdjęć", en: "Design without photos" },
    },
  },
  {
    n: 26, id: "q26", section: 7, required: false,
    title: { pl: "Kolory i fonty marki", en: "Brand colours and fonts" },
    hint: { pl: "Jeśli je masz (albo „dowolne”).", en: "If you have them (or \"open\")." },
    brief: ["brand.colors", "brand.fonts"],
    fields: one("q26", "textarea", false, 1000),
  },

  // ── 8. Pages and features ──────────────────────────────────────────────
  {
    n: 27, id: "q27", section: 8, required: false,
    title: { pl: "Jakich podstron potrzebujesz?", en: "Which pages do you need?" },
    hint: {
      pl: "Np. strona główna, usługi, cennik, o nas, kontakt. Jeśli nie wiesz, zaproponujemy strukturę.",
      en: "E.g. home, services, prices, about, contact. If you're unsure, we'll suggest a structure.",
    },
    brief: ["sitemap"],
    fields: one("q27", "textarea", false, 2000),
  },
  {
    n: 28, id: "q28", section: 8, required: false,
    title: { pl: "Chcesz samodzielnie edytować teksty i zdjęcia po starcie?", en: "Do you want to edit texts and photos yourself after launch?" },
    brief: ["features.cms"],
    fields: [{
      key: "q28", kind: "choice", max: 20,
      options: [
        { value: "yes", label: { pl: "Tak", en: "Yes" } },
        { value: "no", label: { pl: "Nie", en: "No" } },
        { value: "unsure", label: { pl: "Nie wiem", en: "Not sure" } },
      ],
    }],
  },
  {
    n: 29, id: "q29", section: 8, required: false,
    title: { pl: "Rezerwacje online?", en: "Online booking?" },
    brief: ["features.booking", "features.booking_url"],
    fields: [
      {
        key: "q29", kind: "choice", max: 20,
        options: [
          { value: "no", label: { pl: "Nie", en: "No" } },
          { value: "link", label: { pl: "Link do istniejącego systemu (Booksy, Calendly…)", en: "Link to an existing system (Booksy, Calendly…)" } },
          { value: "unsure", label: { pl: "Nie wiem", en: "Not sure" } },
        ],
      },
      {
        key: "q29.url", kind: "url", max: SHORT, showIf: { key: "q29", equals: "link" },
        label: { pl: "Wklej link", en: "Paste the link" },
      },
    ],
  },
  {
    n: 30, id: "q30", section: 8, required: false,
    title: { pl: "Języki?", en: "Languages?" },
    brief: ["project.languages"],
    fields: [{
      key: "q30", kind: "choice", max: 20,
      options: [
        { value: "pl", label: { pl: "Polski", en: "Polish" } },
        { value: "en", label: { pl: "Angielski", en: "English" } },
        { value: "both", label: { pl: "Oba", en: "Both" } },
      ],
    }],
  },
  {
    n: 31, id: "q31", section: 8, required: false,
    title: { pl: "Coś, co wymaga logowania, bazy danych, płatności albo sklepu?", en: "Anything that needs logins, a database, payments or a shop?" },
    hint: {
      pl: "Jeśli tak, wyceniamy to osobno, z osobnym harmonogramem.",
      en: "If yes, it's quoted separately with its own timeline.",
    },
    brief: ["features.custom"],
    fields: [
      {
        key: "q31", kind: "choice", max: 20,
        options: [
          { value: "no", label: { pl: "Nie", en: "No" } },
          { value: "yes", label: { pl: "Tak", en: "Yes" } },
        ],
      },
      {
        key: "q31.detail", kind: "textarea", max: 2000, showIf: { key: "q31", equals: "yes" },
        label: { pl: "Co dokładnie?", en: "What exactly?" },
      },
    ],
  },
  {
    n: 32, id: "q32", section: 8, required: true,
    title: { pl: "Na jaki adres mają trafiać wiadomości z formularza?", en: "Where should form messages go?" },
    hint: { pl: "Adres e-mail.", en: "An email address." },
    brief: ["features.form_recipient", "accounts.email_for_forms"],
    fields: one("q32", "email", true, 200),
  },

  // ── 9. Domain and accounts ─────────────────────────────────────────────
  {
    n: 33, id: "q33", section: 9, required: false,
    title: { pl: "Masz już domenę?", en: "Do you already own a domain?" },
    hint: { pl: "Jeśli tak, jaką i kto ma do niej dostęp?", en: "If yes, which one, and who has the login?" },
    brief: ["project.domain", "accounts.domain_registrar_access"],
    fields: one("q33", "textarea", false, 1000),
  },
  {
    n: 34, id: "q34", section: 9, required: false,
    title: { pl: "Słowa kluczowe", en: "Keywords" },
    hint: {
      pl: "Co wpisałbyś w Google, szukając firmy takiej jak Twoja?",
      en: "What would you type into Google to find a business like yours?",
    },
    brief: ["seo.primary_keywords"],
    fields: one("q34", "textarea", false, 1000),
  },

  // ── 10. Anything else ──────────────────────────────────────────────────
  {
    n: 35, id: "q35", section: 10, required: false,
    title: { pl: "Czy jest coś, o co nie zapytaliśmy, a powinniśmy wiedzieć?", en: "Anything we didn't ask that we should know?" },
    brief: ["kickoff call notes"],
    fields: one("q35", "textarea", false),
  },
];

export const FIELDS: Field[] = QUESTIONS.flatMap((q) => q.fields);
const FIELD_BY_KEY = new Map(FIELDS.map((f) => [f.key, f]));

export type Answers = Record<string, string | boolean>;
/** Uploaded file counts per slot kind, for the required check. */
export type FileCounts = Partial<Record<FileSlot["kind"], number>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CTRL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/**
 * Allow-list sanitiser for anything the browser sends. Unknown keys are
 * dropped, strings are trimmed of control chars and capped, choices must be a
 * declared option, checks must be booleans. Empty strings are dropped so the
 * stored object only holds real answers.
 *
 * Emails and URLs are NOT rejected when malformed: a half-typed autosave must
 * not lose the client's text. `missingRequired` is where shape is enforced.
 */
export function sanitizeAnswers(input: unknown): Answers {
  const out: Answers = {};
  if (!input || typeof input !== "object" || Array.isArray(input)) return out;

  for (const [key, raw] of Object.entries(input as Record<string, unknown>)) {
    const f = FIELD_BY_KEY.get(key);
    if (!f) continue;

    if (f.kind === "check") {
      if (typeof raw === "boolean") out[key] = raw;
      continue;
    }
    if (typeof raw !== "string") continue;

    // Keep newlines and tabs in textareas; strip the rest.
    const s = raw.replace(CTRL_RE, "").slice(0, f.max);
    if (!s.trim()) continue;

    if (f.kind === "choice") {
      if (f.options?.some((o) => o.value === s)) out[key] = s;
      continue;
    }
    out[key] = f.kind === "textarea" ? s : s.trim();
  }
  return out;
}

const isVisible = (f: Field, a: Answers) => !f.showIf || a[f.showIf.key] === f.showIf.equals;

const filled = (f: Field, a: Answers): boolean => {
  const v = a[f.key];
  if (f.kind === "check") return v === true;
  if (typeof v !== "string" || !v.trim()) return false;
  if (f.kind === "email") return EMAIL_RE.test(v.trim());
  return true;
};

/**
 * Which required questions are still unanswered. A file question counts as
 * answered with at least one upload OR its fallback ticked, matching the
 * kit's "required for the clock to start" rule.
 */
export function missingRequired(a: Answers, files: FileCounts = {}): Question[] {
  return QUESTIONS.filter((q) => {
    if (!q.required) return false;
    if (q.files) return !((files[q.files.kind] ?? 0) > 0 || a[q.files.fallbackKey] === true);
    return q.fields.some((f) => f.required && isVisible(f, a) && !filled(f, a));
  });
}

/** Share of all questions with any answer, 0–1. Drives the progress bar. */
export function progress(a: Answers, files: FileCounts = {}): number {
  const answered = QUESTIONS.filter((q) => {
    if (q.files && ((files[q.files.kind] ?? 0) > 0 || a[q.files.fallbackKey] === true)) return true;
    return q.fields.some((f) => isVisible(f, a) && filled(f, a));
  }).length;
  return answered / QUESTIONS.length;
}
