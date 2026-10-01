# Client portal: plan

A private page per client project on the Weturn site. Phase 1 replaces the Tally/Google Forms questionnaire from the agency kit (`agency-kit/templates/intake/`) with our own form, uploads and a one-click export for `/brief-to-plan`.

## Decisions

- **Lives in this repo.** It reuses Supabase, the `/admin` login, the design and the domain.
- **Clients get a private link.** `/portal/<token>` has no account and no password. The token is 32 random bytes, and admin can revoke it or issue a new one. The link is admin-only data in the database.
- **The client never touches Supabase directly.** Every portal read and write goes through server code that first checks the token (service role, like `/api/contact`). The tables are RLS-locked with admin-only read policies, following the same model as `supabase/schema.sql`.
- **Uploads go straight to Supabase Storage** (private bucket `portal-uploads`) through signed upload URLs. Vercel's 4.5 MB body limit doesn't apply, and a photo shoot can be large.
- **One source of truth for the questions:** `lib/portal/questions.ts` (PL + EN text, type, required flag, brief field). It matches the kit's questionnaire 1:1, and a test enforces the 35 questions and the required set.

## Phase 1: intake and uploads

| # | Step | Status |
|---|---|---|
| 1 | Plan (this file) | done |
| 2 | Database: `supabase/portal.sql` (projects, intake answers, files, storage bucket, RLS) | done |
| 3 | Question definitions + tests (`lib/portal/questions.ts`) | done |
| 4 | Token + data layer (`lib/portal/`): token check, load/save answers, required-field check, save rate limit | done |
| 5 | Client page `/portal/[token]`: PL/EN, sections with progress, autosave, "Send" with required check, thank-you state, noindex + no-referrer | done |
| 6 | Uploads: logo + photos (signed URLs, type and size limits), "no logo / no photos" fallbacks | done |
| 7 | Admin `/admin/projects`: list, create (name, package, language), copy link, revoke/new link, status | done |
| 8 | Admin project page: answers, missing required items, files with downloads, **Download brief input (.md)** | done |
| 9 | Kit side: intake README, `/brief-to-plan` reads the export, MANUAL EN/PL + PDFs | done (agency-kit 06ffae4, pushed) |
| 10 | End-to-end test on localhost against the real Supabase, then deploy | done (live on webcraft-listyfi.vercel.app, 2026-09-30) |

**Database:** `supabase/portal.sql` has been run in Supabase (2026-09-30). Re-run it after any change to that file; it is safe to re-run.

## Going live: notes

- Vercel needs, for **Production** (and Preview): `NEXT_PUBLIC_SUPABASE_URL` (`https://<ref>.supabase.co`, **.co**), `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`sb_publishable_…`), `SUPABASE_SERVICE_ROLE_KEY` (`sb_secret_…`) and `IP_HASH_SECRET`. The public ones are baked into the build, so redeploy after any change. Quick check: the `connect-src` in the live Content-Security-Policy header shows the Supabase host the build used.
- `NEXT_PUBLIC_SITE_URL=https://weturnstudio.app` is set for Production (2026-10-01), so admin portal links use the real domain. On previews and locally it is unset, and links use the host admin is opened on (`lib/portal/origin.ts`).
- Local and live share one Supabase project: test projects made locally show up in the live admin too.

## Phase 2: checkpoints

The rules live in `lib/portal/checkpoints.ts`. They mirror `agency-kit/docs/process/checkpoints-and-revisions.md`, and a test enforces the round table.

| # | Step | Status |
|---|---|---|
| 1 | Database: `project_checkpoints` + clock columns on `projects` (section 6–7 of `supabase/portal.sql`) | built; **re-run portal.sql before deploying** |
| 2 | Status timeline: "Day 3 of 10 · Waiting on: your feedback on Homepage". Business days, PL holidays, the clock pauses while we wait on the client (`lib/portal/days.ts`, `clock.ts`) | built |
| 3 | Checkpoint card in the portal: preview link, **Approve** / **Request changes** with ONE list of comments (where, which screen, what), draft kept in the browser | built |
| 4 | Comments for clients without a Vercel account (kit retro item #2): the comment list in step 3 | built |
| 5 | Revision rounds per package and stage; the client sees "round 1 of 2", past the limit sees the 200 zł/h note | built |
| 6 | Admin: start the clock, "waiting on" text, send a preview for review (optionally emails the client), mark approved / withdraw, rounds table | built |
| 7 | Email (Resend, `lib/email.ts`): admin notices (form sent, approved, changes), client email on each checkpoint | built; needs env vars |
| 8 | Daily job `/api/cron/portal` (`vercel.json`): reminders on business days 2 and 3, auto-approve on day 5, **only after both reminders were delivered** | built; needs `CRON_SECRET` |

**Going live with phase 2**, in this order:
1. Run `supabase/portal.sql` again in the Supabase SQL editor. The new code reads the new columns, so deploying first would break every portal link.
2. In Vercel (Production + Preview), add `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL` and `CRON_SECRET` (see `.env.example`). Until weturnstudio.app is verified in Resend, `EMAIL_FROM` is `Weturn <onboarding@resend.dev>` and only the admin notices are delivered. Client emails are refused, so reminders don't go out and nothing is auto-approved. Send clients the portal link yourself.
3. Deploy (push to main).

Later: screenshots attached to comments, the "silent 30+ days = paused" rule, Studio reading the clock and checkpoints.

## Testing before the admin screen exists

```bash
node --env-file=.env.local scripts/portal-test-project.mjs "Test client" business pl
```

It prints a `http://localhost:3000/portal/…` link for a new test project.
