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
| 7 | Admin `/admin/projects`: list, create (name, package, language), copy link, revoke/new link, status | built; click-through waits on admin login |
| 8 | Admin project page: answers, missing required items, files with downloads, **Download brief input (.md)** | |
| 9 | Kit side: intake README, `/brief-to-plan` reads the export, MANUAL EN/PL + PDFs | |
| 10 | End-to-end test on localhost against the real Supabase, then deploy | |

**Database:** `supabase/portal.sql` has been run in Supabase (2026-09-30). Re-run it after any change to that file; it is safe to re-run.

## Phase 2: checkpoints (later)

- Checkpoint page per stage: preview link, "Approve" / "Request changes", one consolidated feedback list (the rule from `checkpoints-and-revisions.md`).
- Comments for clients without a Vercel account (kit retro open item #2).
- Status timeline: "Day 3 of 10 · waiting on: your photos".
- Email notifications (Resend): you get told when a client sends the form or approves. The client gets reminders on days 2, 3 and 5.
- Revision rounds counted per package.

## Testing before the admin screen exists

```bash
node --env-file=.env.local scripts/portal-test-project.mjs "Test client" business pl
```

It prints a `http://localhost:3000/portal/…` link for a new test project.
