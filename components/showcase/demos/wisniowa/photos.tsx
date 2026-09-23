"use client";

import { useState } from "react";
import { useWisCopy } from "./copy";

/* ————————————————————————————————————————————————————————————————
 * WIŚNIOWA — photography slots.  LOCAL FIRST, REMOTE FALLBACK.
 *
 * HISTORY, BECAUSE THIS FILE HAS FAILED THREE TIMES
 *  v4  `PHOTOS` was all-`null` → every slot was a stripe, unfixable without
 *      editing code.
 *  v5  real paths + onError fallback → right idea, but a silent empty slot
 *      looked identical whether the file was missing, wrongly named, or
 *      CSP-blocked.
 *  v6a diagnostic empty state + extension probing → told you WHAT was wrong,
 *      but still could not put a photograph on the page.
 *  v6  (this) every slot now ALSO has a high-resolution Unsplash fallback, so
 *      the page is fully art-directed out of the box and a local file is an
 *      upgrade rather than a prerequisite.
 *
 * RESOLUTION ORDER PER SLOT
 *   1. public/demo/wisniowa/<file>, if that file is listed in LOCAL below
 *   2. the Unsplash URL below, requested at the width this slot actually needs
 *   3. diagnostic placeholder naming the file it wanted
 * So: DROP A FILE IN AND LIST IT IN `LOCAL` AND IT TAKES OVER. (Until v6.1
 * the extensions were probed blind — see the note on LOCAL for why not now.)
 *
 * MEASURED ON THE RUNNING SITE (CP4_4, 2381px-wide viewport) — why these
 * particular slots were overridden:
 *   hero       1024×1024 displayed at 2381×919  → a SQUARE image stretched
 *              across a full-bleed banner. Worst offender on the page.
 *   reception    564×423 displayed at  535×668  → 31KB. 564px is Pinterest's
 *              standard thumbnail width; provenance worth checking before this
 *              ships commercially.
 *   detail     404 — no file in any extension.
 *   street     404 — no file in any extension.
 *   gallery-2    800×531 displayed at  397×530  → landscape squeezed into a
 *              3:4 portrait slot.
 *   team       1289×860 displayed at 1240×543  → no retina headroom, soft on
 *              a 2× display.
 *   quote / gallery-1 / gallery-3 were adequate (~1290×860 at small sizes) and
 *   are listed here only so that deleting them still leaves the page complete.
 *
 * WIDTHS: each slot requests roughly 2× its largest rendered width, which is
 * what a 2× display needs. Do not raise these "for quality" — past ~2400px you
 * are shipping megabytes for pixels nobody can see.
 *
 * LICENCE — every URL below is the STANDARD Unsplash Licence: free, commercial
 * use, redistribution permitted, no attribution required. NONE are Unsplash+
 * (`plus.unsplash.com`), which is a paid Getty tier and would be a licence
 * breach on an agency site. If you swap any of these, check the host: an
 * `images.unsplash.com` URL is free, a `plus.unsplash.com` one is not.
 * Photographer credits are in CREDITS below — not legally required, but cheap
 * to honour and it keeps the provenance auditable.
 *
 * REMOTE URLS ONLY WORK BECAUSE CP4_3 ADDED `https:` TO `img-src` in
 * next.config.mjs. A bare `'self'` blocks off-domain images at the policy
 * layer, before the network, with no error to read. Do not narrow it back
 * without self-hosting these files first.
 *
 * NO FACES UNDER INVENTED NAMES — the `quote` slot sits beside a quotation
 * attributed to "lek. dent. A. Kowalska", who does not exist. Its fallback is
 * therefore deliberately an INTERIOR, not a portrait: putting a real
 * photographed person's face under a fabricated name and a fabricated
 * quotation is the one thing this demo has refused to do since CP4_2. If you
 * drop a portrait into quote.jpg, change the attribution to a real person or
 * remove it.
 * ———————————————————————————————————————————————————————————————— */

export type PhotoSlot =
  | "hero"
  | "reception"
  | "detail"
  | "team"
  | "quote"
  | "gallery1"
  | "gallery2"
  | "gallery3";

const DIR = "/demo/wisniowa";

/* LOCAL FILES ARE NOW DECLARED, NOT PROBED (v6.1).
 * Every slot used to try .jpg → .jpeg → .webp → .png in sequence before
 * falling back to Unsplash. With one local file in the folder that was 28
 * guaranteed 404s per page view, and each one sat in front of the image it
 * delayed — the hero, the largest paint on the page, waited on four round
 * trips before it even started downloading. Now a slot only asks for a local
 * file that is listed here. Dropping a photo in is still one step: copy the
 * file into public/demo/wisniowa/ and add its name below. */
const LOCAL: Partial<Record<PhotoSlot, string>> = {
  quote: "quote.jpg",
};

/**
 * Unsplash photo id + the EXACT pixel box this slot renders.
 * `w` and `h` are both sent so Unsplash crops server-side to the slot's aspect
 * ratio. This is not cosmetic: measured in the browser, the raw files are
 * 900×1350 portrait, 900×600 landscape, 900×1283 portrait etc., and dropping
 * them into 4:3 / 3:4 / 16:7 slots on `object-cover` alone produced heads cut
 * off and instruments sliced in half. Sizes are ~2× the rendered CSS box for
 * retina; do not inflate them further.
 */
/* ————————————————————————————————————————————————————————————————
 * CP4_11 — `team` SLOT. EVERY CANDIDATE BELOW WAS OPENED AND LOOKED AT
 * in a real browser (CP4_10 picked one from alt text alone and got it wrong —
 * see WHY THE PREVIOUS PICK FAILED).
 *
 * Brief: front-facing, four people, masks acceptable. Masks settle the honesty
 * half — a masked clinician is not identifiable, so no real person is being
 * labelled a dentist they never agreed to be. Headcount is the part that could
 * not be met, for a reason that survives inspection:
 *
 * FILTERED unsplash to license=free + orientation=landscape, which is what a
 * 2:1 band actually needs. `dental-team` collapses from 2.2k to 390 photos.
 * What is in those 390: masked clinicians treating patients, dental interiors,
 * and a large number of US Navy / humanitarian dental-mission frames (camo and
 * branded scrubs — unusable for a Warsaw private practice). There is exactly
 * one big group shot and it is ~20 people in matching charity t-shirts, i.e. a
 * specific real organisation. No four-across dental lineup exists free.
 *
 * WHY THE PREVIOUS PICK FAILED — photo-1657470179447-0f5aa16daa91 (Ozkan Guner)
 * was chosen off its alt text, "a dentist working on a patient". Looking at it:
 * it is PORTRAIT (would be sliced to a strip or decapitated in a 2:1 band), one
 * clinician not a team, and a mid-procedure frame with an instrument in an
 * identifiable patient's mouth — the exact register the fear section exists to
 * counter. Same faults across the other alt-text picks: Borba hl6uG9cHW5A and
 * Grobgaard joILn6p_oeM are both portrait procedure shots with the patient's
 * face in frame. DO NOT PICK FROM ALT TEXT HERE.
 *
 * OR-REGISTER OPTIONS, ALL REJECTED ON SIGHT: Akram Huseyn brbF5FSnSgI is a
 * dark-teal operating theatre, portrait. Piron Guillaume U4FyCp3-KzY is
 * landscape but a desaturated surgical suite with an instrument tray. NCI
 * 701-FJcjLAQ is eight masked surgeons shot from the patient's POV looking down
 * into the lens — genuinely four-plus and front-facing, and completely wrong
 * unless the clinic wants to look like the last thing you see before anaesthetic.
 *
 * CURRENT — photo-1685022036259-04cf91a89af1, Divaris Shirichena, standard
 * Unsplash Licence (surfaced under the license=free filter, no Unsplash+ lock).
 * Landscape, masked clinician turning to camera, a second clinician soft-focus
 * mid-right, dental chairs and daylight, NO patient and NO procedure in frame.
 * Two people rather than four; the roster below the band is monogrammed and
 * nothing on the page claims a headcount, so register was the better trade.
 * VERIFIED CROP: the exact URL this file builds (w=2400&h=1200) was loaded and
 * inspected — Unsplash's default centre crop puts the subject left and the
 * colleague mid-right with nothing clipped. See FOCUS below.
 * ———————————————————————————————————————————————————————————————— */

const REMOTE: Record<PhotoSlot, { id: string; w: number; h: number }> = {
  hero: { id: "photo-1704455306251-b4634215d98f", w: 2400, h: 1200 },
  reception: { id: "photo-1704455306925-1401c3012117", w: 1200, h: 1500 },
  detail: { id: "photo-1771442873038-dda05b6ca447", w: 1200, h: 1500 },
  team: { id: "photo-1685022036259-04cf91a89af1", w: 2400, h: 1200 },
  quote: { id: "photo-1497366754035-f200968a6e72", w: 1200, h: 1500 },
  gallery1: { id: "photo-1777331903190-341a3dd0441b", w: 900, h: 675 },
  gallery2: { id: "photo-1662837625421-5fd8ed6131a0", w: 900, h: 1200 },
  gallery3: { id: "photo-1642844744022-d76a9af3711a", w: 900, h: 675 },
};

/** Attribution for the fallbacks. Keep in sync with REMOTE. */
export const CREDITS: Record<PhotoSlot, string> = {
  hero: "Kari Bjorn Photography / Unsplash",
  reception: "Kari Bjorn Photography / Unsplash",
  detail: "Katarzyna Zygnerska / Unsplash",
  team: "Divaris Shirichena / Unsplash",
  quote: "Nastuh Abootalebi / Unsplash",
  gallery1: "Harold Hisona / Unsplash",
  gallery2: "Ozkan Guner / Unsplash",
  gallery3: "Ozkan Guner / Unsplash",
};

/* SHOT (the shot list printed in the diagnostic placeholder) and PHOTO_ALT
 * (the alt attribute) both moved to ./copy.ts at CP4_13 — they are user-visible
 * copy and were the only Polish left in this file. Alt text in particular has
 * to follow the page language: a screen reader announcing a Polish alt string
 * inside an English page reads it with English phonemes and it comes out as
 * noise. Both are keyed by PhotoSlot, so `copy.photos.alt[slot]` is the same
 * lookup the old Record gave. */

const unsplash = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=${w}&h=${h}`;

/** Every URL this slot will try, in order: the declared local file, then Unsplash. */
function candidates(slot: PhotoSlot): string[] {
  const r = REMOTE[slot];
  const local = LOCAL[slot];
  return [...(local ? [`${DIR}/${local}`] : []), unsplash(r.id, r.w, r.h)];
}

const expectedName = (slot: PhotoSlot) => LOCAL[slot] ?? `${slot.replace(/(\d)$/, "-$1")}.jpg`;

/* One warning per slot per load, not one per failed extension. */
const warned = new Set<string>();

/**
 * SCRIM (`scrim` prop): centred radial darkening plus a vertical one.
 * It used to be a LEFT-WEIGHTED horizontal gradient, built when the hero
 * headline sat bottom-left. Once the hero stack was centred (CP4_7) that left
 * the right half of the frame bright and the type unreadable across it. The
 * radial keeps the middle legible while the photograph still reads at the edges.
 *
 * CP4_8: opacities cut roughly in half (was .60→.80 radial over a .52/.28/.68
 * vertical) — the client's word was "clouded", and it was: the whole frame sat
 * under a haze so the photograph read as fog rather than a room. It is now
 * concentrated behind the type only. The headline carries its own text-shadow
 * (see .wis-hero-type) so legibility no longer depends on drowning the image.
 *
 * v6: the hero photo is a white treatment room, and at .40 the lead paragraph
 * over the chair measured well under 4.5:1. The centre is now a TIGHTER and
 * darker pool (.58) sized to the text block, so the edges of the room stay as
 * bright as before — it is not the full-frame haze the client objected to.
 */
const SCRIM =
  "radial-gradient(ellipse 52% 50% at 50% 54%, rgba(24,17,12,.58) 0%, rgba(24,17,12,.38) 55%, rgba(24,17,12,.12) 100%), linear-gradient(180deg, rgba(24,17,12,.38) 0%, rgba(24,17,12,.06) 38%, rgba(24,17,12,.34) 100%)";

/**
 * Vertical focal point per slot, used as CSS `object-position`.
 * Default `center` centre-crops, which is wrong for any shot where the subject
 * sits in the upper half: the wide `team` band was cutting the group off at
 * the chest and leaving a strip of window. Faces live high in a frame, so
 * group and portrait slots pull the crop upward.
 */
const FOCUS: Partial<Record<PhotoSlot, string>> = {
  /* `team` HAS NO ENTRY ON PURPOSE. Unsplash is asked for w=2400&h=1200, so the
   * file arrives already cropped to exactly the 2:1 box the band renders — an
   * object-position override has nothing left to move and can only misalign a
   * crop that was verified correct server-side. The old "center 42%" existed
   * because the previous hallway shot arrived 3:2 and needed nudging. If you
   * swap in a slot whose w/h no longer match the rendered box, re-add it. */
  gallery1: "center 35%",
  gallery2: "center 30%",
  quote: "68% 30%",
};

export function Figure({
  slot,
  className = "",
  rounded = "rounded-[20px]",
  scrim = false,
  priority = false,
}: {
  slot: PhotoSlot;
  className?: string;
  rounded?: string;
  scrim?: boolean;
  priority?: boolean;
}) {
  const c = useWisCopy();
  const alt = c.photos.alt[slot];
  const shot = c.photos.shot[slot];
  const urls = candidates(slot);
  const [attempt, setAttempt] = useState(0);
  const exhausted = attempt >= urls.length;

  const onError = () => {
    const next = attempt + 1;
    /* Warn when a DECLARED local file is missing and we fall back to stock. */
    if (LOCAL[slot] && next === 1 && !warned.has(slot)) {
      warned.add(slot);
      // eslint-disable-next-line no-console
      /* Developer-facing, so deliberately NOT in copy.ts and deliberately not
       * localised — it is read in a console by whoever maintains the site, not
       * by a patient, and every other comment and log in this repo is English.
       * Only user-visible strings follow the page language. */
      console.info(
        `[wiśniowa] slot "${slot}": public${DIR}/${expectedName(slot)} is listed in LOCAL ` +
          `but did not load — falling back to the Unsplash shot.`,
      );
    }
    setAttempt(next);
  };

  if (!exhausted) {
    return (
      <div className={`relative overflow-hidden ${rounded} ${className}`} style={{ background: "#EDE5D7" }}>
        <img
          key={urls[attempt]}
          src={urls[attempt]}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onError={onError}
          className="h-full w-full object-cover"
          style={{ objectPosition: FOCUS[slot] ?? "center" }}
        />
        {scrim && <span aria-hidden className="absolute inset-0" style={{ background: SCRIM }} />}
      </div>
    );
  }

  /* Only reachable if the local files are absent AND Unsplash is unreachable
   * (offline, or img-src narrowed again). Still names the file it wanted. */
  const onLight = !scrim;
  return (
    <div
      className={`relative overflow-hidden ${rounded} ${className}`}
      style={{ background: "linear-gradient(135deg, #EFE7D8 0%, #E4DAC8 46%, #D8CDB8 100%)" }}
      role="img"
      aria-label={`${alt} — ${expectedName(slot)}`}
    >
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, rgba(34,26,20,.05) 0 1px, transparent 1px 11px)",
        }}
      />
      {scrim && <span aria-hidden className="absolute inset-0" style={{ background: SCRIM }} />}
      <span className="absolute inset-x-3 bottom-3 flex flex-col gap-0.5">
        <span
          className="wis-mono truncate"
          style={{ fontSize: 11, fontWeight: 600, color: onLight ? "#7A6A52" : "rgba(246,239,227,.92)" }}
        >
          ↓ public{DIR}/{expectedName(slot)}
        </span>
        <span
          className="wis-mono truncate"
          style={{ fontSize: 10, color: onLight ? "#96897A" : "rgba(246,239,227,.6)" }}
        >
          {shot}
        </span>
      </span>
    </div>
  );
}
