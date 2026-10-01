# Weturn: project state

The current picture of this repo, kept short. The full checkpoint-by-checkpoint history (CP1 to CP4_65, every design decision and bug hunt) is archived in [docs/history/PROJECT_STATE_ARCHIVE.md](docs/history/PROJECT_STATE_ARCHIVE.md). Code comments that cite a checkpoint (for example "CP4_17") point there.

## What this repo is

1. **The Weturn marketing site** (`app/(site)`): Hero → Services → Craft → Showcase → Process → Pricing → FAQ → Contact. It's in PL and EN, with the copy in `lib/i18n/dictionaries.ts` and prices in `lib/pricing.ts`.
2. **The admin** (`/admin`): inquiries, analytics, projects. Sign-in is an emailed one-time code, admins are listed in `admin_users`, and closing the tab signs you out.
3. **The client portal** (`/portal/<token>`): a private link per client, no account. See [docs/PORTAL_PLAN.md](docs/PORTAL_PLAN.md).
   - Phase 1, live: the questionnaire, plus logo and photo uploads.
   - Phase 2: the project clock, checkpoints with Approve / Request changes, revision rounds, and email notices with reminders.

## Hosting and services

- **Vercel**: the project is `webcraft` (team `listyfi`, Pro plan) and the live URL is **https://weturnstudio.app** (bought through Vercel; `www.` redirects to it; `webcraft-listyfi.vercel.app` still works). `NEXT_PUBLIC_SITE_URL=https://weturnstudio.app` is set for Production only, so previews stay noindex.
- **Supabase**: one project shared by local and live. Its schema lives in `supabase/schema.sql` (site, admin, analytics) and `supabase/portal.sql` (portal). Both are idempotent, so re-run them after any edit.
- **Resend**: portal email. Until a domain is verified, only admin notices are delivered.
- **Vercel Cron**: `vercel.json` runs `/api/cron/portal` on weekday mornings to send checkpoint reminders.
- Env vars are documented in `.env.example`, and the setup runbook is `docs/SETUP.md`.

## Rules that still bind

- **Dark "Electric ice" theme everywhere.** There are no white sections and no light/dark alternation. Tokens are in `tailwind.config.ts` and `app/globals.css`.
- **Accent green is for conversion moments only**, at most one per viewport.
- **No fake proof.** That means no invented testimonials, numbers or addresses. The funnel figures are labelled illustrative.
- **The kit and the website must agree.** Every promise in `agency-kit` (timelines, rounds, payments, packages) must match the site copy. The portal's checkpoint rules mirror `agency-kit/docs/process/checkpoints-and-revisions.md` and are tested in `lib/portal/checkpoints.test.ts`.
- **Motion has an owner.** GSAP handles scroll-driven motion and Framer Motion handles pointer-driven motion; never both on the same property. There is one Lenis instance. Reduced motion turns off the smooth scroll, the particles and the reveals.
- **The hero copy enters with a CSS animation** (`.hero-reveal`), not Framer. Framer delayed the LCP text until hydration.
- **3D is budgeted.** There is one lazy canvas per band, the dpr is capped, and showcase demos are poster-gated so they never load on `/`.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

For a Lighthouse run, use `agency-kit/tools/qa/qa.mjs <url>`.

## Open items

- **Domain.** weturnstudio.app is live (2026-10-01). Still to do: verify it in Resend and set `EMAIL_FROM` to it.
- **Before launch.** Set the real contact email in `lib/site.ts`, and the registered legal name once one exists.
- **Performance.**
  - The latest mobile Lighthouse score on vercel.app (2026-10-01) is Performance 43 and SEO 69. SEO is low only because of the intentional noindex.
  - The lab LCP is driven by the JS bundle, which includes the 3D scene, GSAP and Framer. The real paint is fast, but the simulated score charges for script time.
  - Next steps: split or defer the 3D and animation bundles. (Clash Display is self-hosted since 2026-10-01.)
- **Portal phase 2 follow-ups.** Screenshots attached to feedback comments; the 30-day-silence pause; Studio reading clock and checkpoint data from `/admin/api/projects`.
