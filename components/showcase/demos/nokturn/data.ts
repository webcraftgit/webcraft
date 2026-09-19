/* ————————————————————————————————————————————————————————————————
 * NOKTURN — catalogue data.  STRUCTURE FIRST, ARTWORK LATER.
 *
 * Every product here is real in every respect EXCEPT the photography:
 * real variants, real per-size stock, real fabric specs, real prices.
 * The image slots resolve against /public/demo/nokturn/ and render a
 * registration frame until a file exists (see Frame in NokturnSite.tsx).
 * Drop a file in with the right name and it takes over — no code edit.
 *
 * BRAND NAME IS A PLACEHOLDER. `BRAND` below is the single source of
 * truth; change that one string and the whole demo follows. Nothing
 * else hardcodes it.
 *
 * PRICING, sanity-checked against the references in the brief:
 *   CROPP band tee (fast fashion, licensed)      79,99 zł
 *   AliExpress print tee (dropship)              25,39 zł
 *   → an independent label with heavyweight
 *     garments and original artwork sits well
 *     above both, or the fiction doesn't hold.   189–369 zł
 * ———————————————————————————————————————————————————————————————— */

export const BRAND = "NOKTURN";

/** Free-shipping threshold, in grosze-free whole złoty. */
export const FREE_SHIPPING_AT = 300;

/** The one promo code the demo accepts. Case-insensitive. */
export const PROMO = { code: "PIERWSZY", percent: 10 };

export type Category = "koszulki" | "bluzy" | "longsleeve";

export type Size = "S" | "M" | "L" | "XL" | "XXL";
export const SIZES: Size[] = ["S", "M", "L", "XL", "XXL"];

export type Colorway = {
  id: string;
  /** Fallback label. The SHOWN name comes from copy.ts (keyed by id) so it
   *  follows the language switch; this is what renders if an id is added here
   *  and not there. */
  name: string;
  /** Swatch fill — the garment colour, not the artwork. */
  hex: string;
  /** Per-size availability. Missing size = never produced in this colourway. */
  stock: Partial<Record<Size, number>>;
};

export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  /** Set only on reduced items — drives the strike-through and the tag. */
  compareAt?: number;
  colorways: Colorway[];
  /** Fabric facts. These are what make a store read as real.
   *  Only the NUMBER lives here — the composition, fit and origin are words,
   *  so they are in ./copy.ts keyed by product id. */
  spec: { gsm: number };
  /** Which shots this product expects. Order = gallery order. */
  shots: Shot[];
  /** Which shot the GRID leads with; the other one is the hover swap.
   *  Defaults to "front". Burn The Churches sets this to "back" because its
   *  front is a small cross on an otherwise empty black tee — as a thumbnail
   *  it is a black rectangle, while all of its artwork is on the back. The
   *  product page gallery still opens on `shots[0]`. */
  lead?: Shot;
  /** Sort key for "Nowości". Higher = newer. */
  dropped: number;
};

/** The four canonical shots. `front`/`back` are the garment; `detail` is a
 *  print close-up; `worn` is on-body.
 *
 *  CURRENTLY ONLY `front` AND `back` ARE USED — the shoot is two photos per
 *  product (CP4_19). `detail` and `worn` are kept in the type on purpose:
 *  they cost nothing, the README's shot vocabulary stays intact, and adding
 *  one later is a data edit rather than a type change. */
export type Shot = "front" | "back" | "detail" | "worn";

/** Target pixel dimensions per shot, surfaced in the empty frame so whoever
 *  makes the assets knows what to export. 2× the largest rendered box.
 *
 *  4:5, NOT 3:4. `Frame` renders at aspect-ratio 4/5, so the old 1400×1867
 *  spec here was asking for a 3:4 export that `object-cover` then cropped ~7%
 *  off the height of. The number and the frame now agree. If the grid ratio
 *  ever changes, change it HERE too — they are one decision in two places. */
export const SHOT_SIZE: Record<Shot, string> = {
  front: "1400×1750",
  back: "1400×1750",
  detail: "1400×1400",
  worn: "1400×1750",
};

const ALL_SIZES = (n: number): Partial<Record<Size, number>> => ({
  S: n,
  M: n,
  L: n,
  XL: n,
  XXL: n,
});

export const PRODUCTS: Product[] = [
  {
    id: "chained-inside-tee",
    name: "Chained Inside Tee",
    category: "koszulki",
    price: 249,
    colorways: [
      { id: "czern", name: "Czerń", hex: "#0B0B0D", stock: { ...ALL_SIZES(5), S: 2, XXL: 0 } },
    ],
    spec: {
      gsm: 240,
    },
    shots: ["front", "back"],
    dropped: 4,
  },
  {
    id: "burn-the-churches",
    name: "Burn The Churches",
    category: "koszulki",
    price: 189,
    compareAt: 239,
    colorways: [
      { id: "czern", name: "Czerń", hex: "#0B0B0D", stock: ALL_SIZES(8) },
    ],
    spec: {
      gsm: 220,
    },
    shots: ["front", "back"],
    lead: "back",
    dropped: 3,
  },
  {
    id: "ferryman-hoodie",
    name: "Ferryman Hoodie",
    category: "bluzy",
    price: 369,
    colorways: [
      /* The scarce one. Sizes deliberately thin so the low-stock signal and
         the struck-through sold-out sizes both get exercised somewhere in the
         catalogue — but it must stay BUYABLE. */
      { id: "czern", name: "Czerń", hex: "#0B0B0D", stock: { S: 0, M: 1, L: 2, XL: 1, XXL: 0 } },
    ],
    spec: {
      gsm: 420,
    },
    shots: ["front", "back"],
    dropped: 2,
  },
  {
    id: "lobotomy-hoodie",
    name: "Lobotomy Hoodie",
    category: "bluzy",
    price: 349,
    colorways: [
      { id: "czern", name: "Czerń", hex: "#0B0B0D", stock: { S: 3, M: 5, L: 5, XL: 3, XXL: 2 } },
    ],
    spec: {
      gsm: 400,
    },
    shots: ["front", "back"],
    dropped: 1,
  },
];

/** Categories that actually have stock in PRODUCTS, in canonical order.
 *  DERIVED, not hardcoded: the filter row used to list every category in the
 *  type, so trimming the catalogue left a "Longsleeve" tab that filtered to an
 *  empty grid. A tab that leads nowhere reads as a broken shop, and deriving
 *  it means the row can never drift out of sync with the catalogue again. */
export const ACTIVE_CATEGORIES: Category[] = (
  ["koszulki", "bluzy", "longsleeve"] as const
).filter((c) => PRODUCTS.some((p) => p.category === c));

/* ———————————————————— size chart ————————————————————
 * "Tabela rozmiarów" appeared twice in the UI as an underlined span that did
 * nothing — a dead affordance on the exact control a customer reaches for
 * when choosing between M and L. These are the numbers behind it.
 *
 * Measurements are of the GARMENT laid flat, in centimetres, which is how
 * Polish stores publish them: `chest` is half the chest circumference (pit to
 * pit), `length` is centre-back neck to hem, `sleeve` is shoulder seam to cuff.
 * Hoodies carry a dropped shoulder, so their sleeve numbers are shorter than
 * the tees' relative to the fit — that is correct, not a typo. */
export type Measure = { size: Size; chest: number; length: number; sleeve: number };

export const SIZE_CHART: Record<Category, Measure[]> = {
  koszulki: [
    { size: "S", chest: 54, length: 70, sleeve: 22 },
    { size: "M", chest: 57, length: 72, sleeve: 23 },
    { size: "L", chest: 60, length: 74, sleeve: 24 },
    { size: "XL", chest: 63, length: 76, sleeve: 25 },
    { size: "XXL", chest: 66, length: 78, sleeve: 26 },
  ],
  bluzy: [
    { size: "S", chest: 58, length: 68, sleeve: 55 },
    { size: "M", chest: 61, length: 70, sleeve: 56 },
    { size: "L", chest: 64, length: 72, sleeve: 57 },
    { size: "XL", chest: 67, length: 74, sleeve: 58 },
    { size: "XXL", chest: 70, length: 76, sleeve: 59 },
  ],
  longsleeve: [
    { size: "S", chest: 54, length: 70, sleeve: 60 },
    { size: "M", chest: 57, length: 72, sleeve: 61 },
    { size: "L", chest: 60, length: 74, sleeve: 62 },
    { size: "XL", chest: 63, length: 76, sleeve: 63 },
    { size: "XXL", chest: 66, length: 78, sleeve: 64 },
  ],
};

/** Total units of a colourway across sizes — drives "wyprzedane" on a swatch. */
export const cwTotal = (c: Colorway) =>
  Object.values(c.stock).reduce((a: number, b) => a + (b ?? 0), 0);
