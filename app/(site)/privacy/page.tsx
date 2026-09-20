"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/LanguageProvider";
import { useConsent } from "@/components/analytics/ConsentProvider";
import { POLICY_VERSION } from "@/lib/analytics/consent";

/**
 * Privacy policy (CP6-backend).
 *
 * ⚠️  DRAFT — accurate about what the code actually does, but NOT legal advice.
 * A Polish lawyer must review this before launch. The controller-identity
 * fields below are legally required (Art. 13(1)(a) RODO). The site is run by a
 * private individual, not a registered company, so the controller is that
 * person — Krzysztof Powierża, kristofpow@gmail.com (there is no company name
 * or NIP to list). If this ever becomes a registered business, swap those in.
 *
 * Copy lives in this file rather than the shared dictionary on purpose: it is
 * long-form legal text that changes on a different schedule from the marketing
 * copy, and bumping POLICY_VERSION here is what re-triggers the consent banner.
 */

const COPY = {
  en: {
    title: "Privacy policy",
    updated: `Version ${POLICY_VERSION}`,
    intro:
      "This page explains what we collect when you visit this site, why, and how to make us stop. It describes what the code actually does — nothing here is boilerplate.",
    sections: [
      {
        h: "Who is responsible",
        p: "This site is run by a private individual, not a company. The controller of your data is Krzysztof Powierża, reachable at kristofpow@gmail.com. There is no registered business, so there is no company name or NIP to give — you deal directly with a person.",
      },
      {
        h: "What we collect without asking",
        p: "If you send the contact form: your name, email address and message, plus the optional project type, budget band and content-readiness you selected. We keep a salted, one-way hash of your IP address for 24 hours to stop spam — it is not reversible and it cannot be linked to you tomorrow. We do not store raw IP addresses at any point.",
      },
      {
        h: "What we collect only if you agree",
        p: "If you accept analytics, we store a random identifier in your browser and record which sections you reach, how far you scroll, which options you click, your device type, language, coarse country, and where you arrived from. This is first-party only: no advertising networks, no third-party trackers, no profiling, no cross-site tracking, no selling of anything to anyone.",
      },
      {
        h: "Why we are allowed to",
        p: "Contact form: Art. 6(1)(b) GDPR — steps taken at your request before entering a contract. Spam protection: Art. 6(1)(f), our legitimate interest in a working inbox. Analytics: Art. 6(1)(a), your consent, and nothing else.",
      },
      {
        h: "How long we keep it",
        p: "Analytics events are deleted automatically after 14 months. Consent records are kept for 3 years, because we have to be able to prove what you chose. Inquiries are kept while a business relationship is plausible, and deleted on request.",
      },
      {
        h: "Your rights",
        p: "You can ask for a copy of your data, correction, deletion, restriction, portability, or object to processing. You can withdraw analytics consent at any time using the “Cookie settings” link in the footer of every page — exactly as easy as granting it was. Withdrawal deletes the identifiers in your browser immediately. You may also complain to the Polish supervisory authority (UODO).",
      },
      {
        h: "Who else sees it",
        p: "Our hosting and database providers process data on our behalf under contract. We do not share your data with anyone else, and we never sell it.",
      },
    ],
    manage: "Change your cookie choices",
    home: "Back to home",
  },
  pl: {
    title: "Polityka prywatności",
    updated: `Wersja ${POLICY_VERSION}`,
    intro:
      "Ta strona wyjaśnia, co zbieramy podczas Twojej wizyty, po co i jak to zatrzymać. Opisuje to, co kod faktycznie robi — nie ma tu szablonowych formułek.",
    sections: [
      {
        h: "Kto odpowiada",
        p: "Tę stronę prowadzi osoba prywatna, a nie firma. Administratorem Twoich danych jest Krzysztof Powierża, kontakt: kristofpow@gmail.com. Nie ma zarejestrowanej działalności, więc nie podajemy nazwy firmy ani NIP-u — masz do czynienia bezpośrednio z osobą.",
      },
      {
        h: "Co zbieramy bez pytania",
        p: "Jeśli wyślesz formularz kontaktowy: imię i nazwisko, adres e-mail i wiadomość, a także opcjonalnie wybrany rodzaj projektu, przedział budżetu i gotowość treści. Przez 24 godziny przechowujemy jednokierunkowy, solony skrót (hash) Twojego adresu IP, żeby blokować spam — jest nieodwracalny i nie da się go z Tobą powiązać. Surowych adresów IP nie zapisujemy w żadnym momencie.",
      },
      {
        h: "Co zbieramy tylko za Twoją zgodą",
        p: "Jeśli zgodzisz się na analitykę, zapisujemy w Twojej przeglądarce losowy identyfikator i rejestrujemy, do których sekcji docierasz, jak daleko przewijasz, które opcje klikasz, typ urządzenia, język, przybliżony kraj i skąd trafiłeś na stronę. To wyłącznie analityka własna: bez sieci reklamowych, bez podmiotów trzecich, bez profilowania, bez śledzenia między stronami, bez sprzedaży czegokolwiek komukolwiek.",
      },
      {
        h: "Na jakiej podstawie",
        p: "Formularz kontaktowy: art. 6 ust. 1 lit. b RODO — działania na Twoje żądanie przed zawarciem umowy. Ochrona przed spamem: art. 6 ust. 1 lit. f, nasz prawnie uzasadniony interes. Analityka: art. 6 ust. 1 lit. a, czyli Twoja zgoda i nic poza nią.",
      },
      {
        h: "Jak długo to trzymamy",
        p: "Zdarzenia analityczne są usuwane automatycznie po 14 miesiącach. Zapisy zgód przechowujemy 3 lata, bo musimy umieć wykazać, co wybrałeś. Zapytania z formularza trzymamy tak długo, jak realna jest współpraca, i usuwamy na żądanie.",
      },
      {
        h: "Twoje prawa",
        p: "Możesz żądać kopii swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przeniesienia, a także wnieść sprzeciw. Zgodę na analitykę możesz wycofać w każdej chwili — linkiem „Ustawienia plików cookie” w stopce każdej strony, dokładnie tak samo łatwo, jak jej udzieliłeś. Wycofanie natychmiast usuwa identyfikatory z Twojej przeglądarki. Masz też prawo wnieść skargę do Prezesa UODO.",
      },
      {
        h: "Kto jeszcze to widzi",
        p: "Dostawcy hostingu i bazy danych przetwarzają dane w naszym imieniu, na podstawie umowy powierzenia. Nikomu innemu Twoich danych nie udostępniamy i nigdy ich nie sprzedajemy.",
      },
    ],
    manage: "Zmień ustawienia plików cookie",
    home: "Wróć na stronę główną",
  },
} as const;

export default function PrivacyPage() {
  const [locale] = useLocale();
  const { reopen } = useConsent();
  const c = COPY[locale] ?? COPY.pl;

  return (
    <main className="container-x py-[clamp(120px,14vw,180px)]">
      <div className="max-w-[70ch]">
        <p className="eyebrow">{c.updated}</p>
        <h1 className="heading-2 mt-3">{c.title}</h1>
        <p className="mt-5 text-lg text-ink-soft">{c.intro}</p>

        <div className="mt-12 space-y-10">
          {c.sections.map((s) => (
            <section key={s.h}>
              <h2 className="font-display text-[22px] font-medium text-ink">{s.h}</h2>
              <p className="mt-3 leading-relaxed text-ink-soft">{s.p}</p>
            </section>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={reopen}
            className="min-h-[48px] rounded-full bg-brand-400 px-7 text-[15px] font-semibold text-[#05080F] hover:bg-brand-300"
          >
            {c.manage}
          </button>
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center rounded-full border border-[var(--glass-border-hover)] px-7 text-[15px] font-medium text-ink hover:bg-[rgba(56,189,248,0.08)]"
          >
            {c.home}
          </Link>
        </div>
      </div>
    </main>
  );
}
