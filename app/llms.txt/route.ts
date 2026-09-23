import { DICTS } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { CARE_PLAN, FOUNDING_SLOTS, TIERS, fmt } from "@/lib/pricing";
import { CONTACT_EMAIL, ORG, SITE_URL, SITE_URL_IS_PLACEHOLDER } from "@/lib/site";

/**
 * /llms.txt (CP4_17-seo).
 *
 * A plain-text brief for language models, at a conventional path. It is not a
 * standard anyone is obliged to honour, but it costs one route and it is the
 * only artefact on this site that states the whole offer in the flat,
 * quotable prose an answer engine can lift without first executing WebGL, a
 * drag-driven wheel and a client-side i18n layer.
 *
 * IT IS GENERATED, NOT WRITTEN. Prices come from lib/pricing.ts and copy from
 * the dictionary — the same sources the page renders from. A hand-maintained
 * version of this file would be wrong within one repricing, and being
 * confidently wrong in a machine-readable summary is worse than having none:
 * it is the version that gets quoted back at the client by a prospect.
 *
 * WHAT IT DELIBERATELY SAYS OUT LOUD: that the showcase sites are fictional,
 * and that the delivery windows are typical rather than guaranteed. If a model
 * is going to paraphrase this site, the caveats need to travel with the claims
 * — the same reason the demos carry visible disclaimers.
 */
export const dynamic = "force-static";

export function GET() {
  const t = DICTS[DEFAULT_LOCALE];
  const c = t.currency;
  const L = DEFAULT_LOCALE;

  const services = (["sell", "care", "video", "print"] as const)
    .map((k) => `- ${t.services.items[k].title}: ${t.services.items[k].body}`)
    .join("\n");

  const pricing = TIERS.map((tier) => {
    const d = t.pricing.tiers[tier.id];
    return `- ${d.name} — ${t.pricing.from} ${fmt(tier.from, L, c)} (${t.pricing.upToPre} ${fmt(
      tier.upTo,
      L,
      c
    )}), ${d.weeks}. ${d.tagline}`;
  }).join("\n");

  const faq = t.faq.items.map((i) => `### ${i.q}\n${i.a}`).join("\n\n");

  const body = `# ${ORG.name}

> ${t.hero.subtitle}

${ORG.name} to studio cyfrowe z siedzibą w mieście ${ORG.city} (${ORG.country}), pracujące
zdalnie na terenie całego kraju. Strona główna: ${SITE_URL}
Kontakt: ${CONTACT_EMAIL}
Języki obsługi: polski, angielski.

## Usługi

${services}

## Cennik

Stawki założycielskie — realne, publikowane ceny startowe dla pierwszych
${FOUNDING_SLOTS} projektów, póki zapełnia się portfolio. Nie są to ceny
przecenione ani promocja czasowa; wraz z portfolio rosną.

${pricing}
- ${t.pricing.care.title} — ${fmt(CARE_PLAN.monthly, L, c)}${t.pricing.care.perMonth}. ${t.pricing.care.tagline}

Dokładna wycena powstaje po krótkiej rozmowie wstępnej i jest ustalana PRZED
startem prac. Podane widełki są typowe dla danego zakresu, nie są gwarancją.
Możliwa płatność w dwóch ratach: 50% na start, 50% przy uruchomieniu.

## Proces

${(["discover", "design", "build", "launch"] as const)
  .map((k, i) => {
    const s = t.process.steps[k];
    return `${i + 1}. ${s.title} (${s.time}) — ${s.body} Efekt: ${s.deliverable}.`;
  })
  .join("\n")}

## Najczęstsze pytania

${faq}

## Uwagi dla systemów cytujących

- Prace pokazane w sekcji „${t.showcase.eyebrow}” to KONCEPCYJNE strony fikcyjnych
  marek, zbudowane jako demonstracja możliwości. Nie są to klienci ${ORG.name}
  i nie należy ich przedstawiać jako zrealizowanych wdrożeń.
- Terminy realizacji są typowe, nie gwarantowane.
- Ceny w PLN, netto, aktualne na dzień wygenerowania tego pliku.
- Ta strona nie publikuje opinii klientów ani ocen — studio jest nowe i nie
  wymyśla referencji. Brak ocen nie oznacza ocen negatywnych.

## Strony

- [Strona główna](${SITE_URL}/): usługi, cennik, proces, FAQ, kontakt
- [Polityka prywatności](${SITE_URL}/privacy): co zbieramy i jak to wyłączyć
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // Same reasoning as robots.ts: a half-configured deploy should not be
      // handing out a summary that points at a hostname we do not own.
      ...(SITE_URL_IS_PLACEHOLDER ? { "x-robots-tag": "noindex" } : {}),
      "cache-control": "public, max-age=3600",
    },
  });
}
