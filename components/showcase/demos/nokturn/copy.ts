"use client";

import { useLocale } from "@/components/i18n/LanguageProvider";
import type { Category, Shot, Size } from "./data";

/* ————————————————————————————————————————————————————————————————
 * NOKTURN — DEMO COPY, PL + EN
 *
 * Same pattern and the same reason as demos/wisniowa|blackwood|zelazna:
 * lib/i18n/dictionaries.ts ships to every homepage visitor, this demo is a
 * lazy chunk, so its copy rides with the chunk. `pl` is the typed source of
 * truth (the store was written in Polish) and `en` is `typeof pl`, so a key
 * added to one and not the other fails the build.
 *
 * WHAT STAYS IN data.ts, AND WHY
 * data.ts keeps everything that is NOT language: ids, prices, per-size stock,
 * gsm, the size-chart centimetres, which shots exist. Those are the same
 * numbers in both languages and duplicating them per locale is how a store
 * ends up selling different stock depending on the language switch.
 *
 * WHAT IS NOT TRANSLATED, DELIBERATELY
 *  · PRODUCT NAMES. "Chained Inside Tee", "Burn The Churches", "Ferryman
 *    Hoodie", "Lobotomy Hoodie" — the names are printed on the garments and
 *    are the artwork's own words. A Polish shopper sees the English name on
 *    the shirt; translating it in the listing would describe a product that
 *    does not exist. Same rule the brand name follows.
 *  · CATEGORY IDS ("koszulki", "bluzy", "longsleeve") and SIZE IDS. They are
 *    React state and URL-shaped keys; translating them would reset the
 *    customer's filter and their chosen size on every language switch. Only
 *    the LABELS are looked up per locale.
 *  · The promo code PIERWSZY. It is a literal string the customer types.
 *
 * PRICES STAY IN ZŁOTY. `zl()` formats "249,00 zł" in Polish and
 * "PLN 249.00" in English — the separator and the placement move, the number
 * never does. Converting to euro would be false the moment the rate moves,
 * and the customer pays złoty either way.
 * ———————————————————————————————————————————————————————————————— */

type ProductCopy = {
  blurb: string;
  description: string;
  composition: string;
  fit: string;
  origin: string;
};

export const pl = {
  /** "249,00 zł" */
  zl: (n: number) => `${n.toFixed(2).replace(".", ",")} zł`,

  categories: {
    koszulki: "Koszulki",
    bluzy: "Bluzy",
    longsleeve: "Longsleeve",
  } as Record<Category, string>,

  shots: {
    front: "Przód",
    back: "Tył",
    detail: "Detal nadruku",
    worn: "Na modelu",
  } as Record<Shot, string>,

  measures: {
    chest: "Szerokość w klatce",
    length: "Długość",
    sleeve: "Długość rękawa",
  } as Record<"chest" | "length" | "sleeve", string>,

  /** The single colourway in the catalogue, keyed by its id. */
  colorways: { czern: "Czerń" } as Record<string, string>,

  products: {
    "chained-inside-tee": {
      blurb: "Oversize, nadruk na całej powierzchni",
      description:
        "Nadruk pokrywa całą koszulkę — przód i tył, od ramion po dół. Drut kolczasty, cierniowy krzyż i ręcznie pisany tekst na spranym, szarym tle. Każda sztuka schodzi z prasy trochę inaczej.",
      composition: "100% bawełna czesana",
      fit: "Oversize, opadające ramię",
      origin: "Szyte w Portugalii",
    },
    "burn-the-churches": {
      blurb: "Oversize, mały znak z przodu, pełne plecy",
      description:
        "Z przodu tylko cierniowy krzyż nad sercem. Cała praca dzieje się na plecach: gotycka katedra odbita w wysokim kontraście, przekreślona pentagramem malowanym szerokim pędzlem, a nad wieżami napis.",
      composition: "100% bawełna organiczna",
      fit: "Oversize, prosty krój",
      origin: "Szyte w Portugalii",
    },
    "ferryman-hoodie": {
      blurb: "Bluza z kapturem, duży znak na plecach",
      description:
        "Przewoźnik z latarnią, jedyny ciepły punkt w całej kolekcji. Wokół sceny drobny, ręcznie pisany tekst i dwa cierniowe krzyże. Na plecach pełnowymiarowy znak marki.",
      composition: "80% bawełna / 20% poliester",
      fit: "Boxy, obniżony ściągacz",
      origin: "Szyte w Portugalii",
    },
    "lobotomy-hoodie": {
      blurb: "Bluza z kapturem, pełny znak na plecach",
      description:
        "Anatomiczna rycina w kwadratowej ramce, wydrukowana z grubym ziarnem, tak żeby wyglądała na przepuszczoną przez kserokopiarkę kilka razy za dużo. Na plecach pełnowymiarowy znak marki.",
      composition: "80% bawełna / 20% poliester",
      fit: "Boxy",
      origin: "Szyte w Portugalii",
    },
  } as Record<string, ProductCopy>,

  hero: {
    collection: "Kolekcja 01",
    limited: "nakład limitowany",
    cue: "Zobacz kolekcję",
    /** "4 rzeczy" — Polish needs the singular/plural split, English does not. */
    count: (n: number) => `${n} ${n === 1 ? "rzecz" : "rzeczy"}`,
  },

  intro:
    "Cztery rzeczy, każda z własną grafiką, drukowana w małym nakładzie. Ciężkie materiały, luźne kroje, nic w rozmiarówce, czego nie mamy naprawdę na półce.",

  shop: {
    all: "Wszystko",
    bag: "Koszyk",
    backToCollection: (brand: string) => `${brand} — wróć do kolekcji`,
    freeShipping: (threshold: string) =>
      `Wysyłka gratis od ${threshold}. Nakład limitowany.`,
    sizeChart: "Tabela rozmiarów",
    sortLabel: "Sortowanie",
    sortNew: "Nowości",
    sortAsc: "Cena rosnąco",
    sortDesc: "Cena malejąco",
  },

  stock: {
    soldOut: "Wyprzedane",
    left: (n: number) => `Zostały ${n} szt.`,
    available: "Dostępny",
  },

  frame: {
    /** alt text: "Burn The Churches — tył" */
    alt: (name: string, shot: string) => `${name} — ${shot.toLowerCase()}`,
    missing: (shot: string) => `Brak zdjęcia: ${shot.toLowerCase()}`,
  },

  sizeChart: {
    title: "Tabela rozmiarów",
    close: "Zamknij",
    closeAria: "Zamknij tabelę rozmiarów",
    size: "Rozmiar",
    note: "Wymiary ubrania leżącego płasko, tolerancja ±2 cm. Kroje są luźne — jeśli wolisz, żeby leżało bliżej ciała, weź rozmiar mniej.",
  },

  cart: {
    title: "Koszyk",
    close: "Zamknij",
    closeAria: "Zamknij koszyk",
    empty: "Koszyk jest pusty.",
    backToCollection: "Wróć do kolekcji",
    less: "Mniej",
    more: "Więcej",
    remove: "Usuń",
    maxedOut: "To wszystko, co mamy w tym rozmiarze.",
    toFree: (amount: string) => `Do darmowej wysyłki brakuje ${amount}`,
    freeReached: "Wysyłka gratis",
    promoPlaceholder: "Kod rabatowy",
    promoApply: "Użyj",
    promoBad: "Ten kod nie działa. Sprawdź pisownię.",
    promoBadShort: "Ten kod nie działa.",
    promoOk: (code: string, percent: number) =>
      `Kod ${code} przyjęty, −${percent}%.`,
    discount: (code: string) => `Rabat ${code}`,
    subtotal: "Suma",
    total: "Razem",
    checkout: "Przejdź do płatności",
    checkoutNote: "Demo, płatność nie jest realizowana",
    added: (name: string, size: Size) =>
      `${name}, rozmiar ${size}, dodano do koszyka.`,
  },

  suggestion: {
    closesGap: "Dobierz — i wysyłka gratis",
    goesWith: "Pasuje do tego",
    view: (name: string) => `Zobacz ${name}`,
    addGroup: (name: string) => `Dodaj ${name} w rozmiarze`,
    addSize: (name: string, size: Size) => `Dodaj ${name}, rozmiar ${size}`,
  },

  product: {
    back: "← Kolekcja",
    colour: "Kolor:",
    size: "Rozmiar",
    pickSize: "Wybierz rozmiar",
    addToBag: "Dodaj do koszyka",
    specHead: "Materiał i krój",
    gsm: "Gramatura",
    composition: "Skład",
    fit: "Krój",
    origin: "Produkcja",
    printHead: "Druk i pielęgnacja",
    printBody:
      "Sitodruk, farby wodne. Prać na lewej stronie w 30°C, nie prasować po nadruku, nie suszyć w suszarce bębnowej.",
    shipHead: "Wysyłka i zwroty",
    shipBody: (threshold: string) =>
      `Wysyłka w 1–2 dni robocze. Powyżej ${threshold} gratis. Zwrot w ciągu 30 dni, o ile metka nie została odcięta.`,
  },

  footer: {
    tagline:
      "Mała marka odzieżowa. Nakłady liczone w dziesiątkach, nie w tysiącach.",
    shop: "Sklep",
    help: "Pomoc",
    helpItems: ["Wysyłka", "Zwroty", "Kontakt"],
    brand: "Marka",
    brandItems: ["O nas", "Druk i materiały", "Newsletter"],
    disclaimer: (brand: string) =>
      `${brand} jest marką fikcyjną, stworzoną przez Webcraft jako projekt koncepcyjny. Marka, produkty, ceny i dostępność nie istnieją, a zamówienia nie są realizowane.`,
  },
};

export const en: typeof pl = {
  /** "PLN 249.00" — the number never changes, only its dress. */
  zl: (n: number) => `PLN ${n.toFixed(2)}`,

  categories: {
    koszulki: "T-shirts",
    bluzy: "Hoodies",
    longsleeve: "Longsleeves",
  } as Record<Category, string>,

  shots: {
    front: "Front",
    back: "Back",
    detail: "Print detail",
    worn: "On body",
  } as Record<Shot, string>,

  measures: {
    chest: "Chest width",
    length: "Length",
    sleeve: "Sleeve length",
  } as Record<"chest" | "length" | "sleeve", string>,

  colorways: { czern: "Black" } as Record<string, string>,

  products: {
    "chained-inside-tee": {
      blurb: "Oversize, all-over print",
      description:
        "The print covers the whole shirt — front and back, shoulders to hem. Barbed wire, a thorn cross and hand-lettered text on a washed grey ground. Every piece comes off the press slightly differently.",
      composition: "100% combed cotton",
      fit: "Oversize, dropped shoulder",
      origin: "Sewn in Portugal",
    },
    "burn-the-churches": {
      blurb: "Oversize, small front mark, full back print",
      description:
        "On the front, only a thorn cross over the heart. All the work happens on the back: a gothic cathedral pulled in high contrast, struck through with a broad-brush pentagram, and lettering above the towers.",
      composition: "100% organic cotton",
      fit: "Oversize, straight cut",
      origin: "Sewn in Portugal",
    },
    "ferryman-hoodie": {
      blurb: "Hooded sweatshirt, large back print",
      description:
        "The ferryman with his lantern — the only warm point in the whole collection. Fine hand-lettered text around the scene and two thorn crosses. Full-size brand mark across the back.",
      composition: "80% cotton / 20% polyester",
      fit: "Boxy, dropped hem rib",
      origin: "Sewn in Portugal",
    },
    "lobotomy-hoodie": {
      blurb: "Hooded sweatshirt, full back print",
      description:
        "An anatomical engraving in a square frame, printed with heavy grain so it reads as though it went through a photocopier a few times too many. Full-size brand mark across the back.",
      composition: "80% cotton / 20% polyester",
      fit: "Boxy",
      origin: "Sewn in Portugal",
    },
  } as Record<string, ProductCopy>,

  hero: {
    collection: "Collection 01",
    limited: "limited run",
    cue: "See the collection",
    count: (n: number) => `${n} ${n === 1 ? "piece" : "pieces"}`,
  },

  intro:
    "Four pieces, each with its own artwork, printed in a small run. Heavy fabrics, loose cuts, and nothing in the size list we do not actually have on the shelf.",

  shop: {
    all: "Everything",
    bag: "Bag",
    backToCollection: (brand: string) => `${brand} — back to the collection`,
    freeShipping: (threshold: string) =>
      `Free shipping over ${threshold}. Limited run.`,
    sizeChart: "Size guide",
    sortLabel: "Sort by",
    sortNew: "Newest",
    sortAsc: "Price, low to high",
    sortDesc: "Price, high to low",
  },

  stock: {
    soldOut: "Sold out",
    left: (n: number) => `${n} left`,
    available: "In stock",
  },

  frame: {
    alt: (name: string, shot: string) => `${name} — ${shot.toLowerCase()}`,
    missing: (shot: string) => `Photo missing: ${shot.toLowerCase()}`,
  },

  sizeChart: {
    title: "Size guide",
    close: "Close",
    closeAria: "Close the size guide",
    size: "Size",
    note: "Garment measured flat, tolerance ±2 cm. The cuts are loose — if you want it closer to the body, take one size down.",
  },

  cart: {
    title: "Bag",
    close: "Close",
    closeAria: "Close the bag",
    empty: "Your bag is empty.",
    backToCollection: "Back to the collection",
    less: "Fewer",
    more: "More",
    remove: "Remove",
    maxedOut: "That is everything we have in this size.",
    toFree: (amount: string) => `${amount} away from free shipping`,
    freeReached: "Free shipping",
    promoPlaceholder: "Discount code",
    promoApply: "Apply",
    promoBad: "That code does not work. Check the spelling.",
    promoBadShort: "That code does not work.",
    promoOk: (code: string, percent: number) =>
      `Code ${code} accepted, −${percent}%.`,
    discount: (code: string) => `Discount ${code}`,
    subtotal: "Subtotal",
    total: "Total",
    checkout: "Go to checkout",
    checkoutNote: "Demo — no payment is taken",
    added: (name: string, size: Size) =>
      `${name}, size ${size}, added to the bag.`,
  },

  suggestion: {
    closesGap: "Add this — and shipping is free",
    goesWith: "Goes with this",
    view: (name: string) => `View ${name}`,
    addGroup: (name: string) => `Add ${name} in size`,
    addSize: (name: string, size: Size) => `Add ${name}, size ${size}`,
  },

  product: {
    back: "← Collection",
    colour: "Colour:",
    size: "Size",
    pickSize: "Pick a size",
    addToBag: "Add to bag",
    specHead: "Fabric and fit",
    gsm: "Weight",
    composition: "Composition",
    fit: "Fit",
    origin: "Made in",
    printHead: "Print and care",
    printBody:
      "Screen print, water-based inks. Wash inside out at 30°C, do not iron over the print, do not tumble dry.",
    shipHead: "Shipping and returns",
    shipBody: (threshold: string) =>
      `Ships in 1–2 working days. Free over ${threshold}. Returns within 30 days, as long as the tag is still attached.`,
  },

  footer: {
    tagline:
      "A small clothing label. Runs counted in tens, not thousands.",
    shop: "Shop",
    help: "Help",
    helpItems: ["Shipping", "Returns", "Contact"],
    brand: "Brand",
    brandItems: ["About us", "Print and fabrics", "Newsletter"],
    disclaimer: (brand: string) =>
      `${brand} is a fictional brand, built by Webcraft as a concept project. The brand, the products, the prices and the availability do not exist, and no order is fulfilled.`,
  },
};

/** Follows the SITE-WIDE locale — see the note in demos/wisniowa/copy.ts. */
export function useNokturnCopy() {
  const [locale] = useLocale();
  return locale === "en" ? en : pl;
}
