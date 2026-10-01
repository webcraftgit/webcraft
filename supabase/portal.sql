-- ============================================================================
-- Weturn — client portal (phase 1: intake + uploads). See docs/PORTAL_PLAN.md.
-- Run in the Supabase SQL editor AFTER schema.sql (it uses is_admin() and
-- touch_updated_at()). Idempotent: safe to re-run.
--
-- SECURITY MODEL — same as schema.sql:
--   * Clients never hold a Supabase session. /portal/<token> is served by our
--     server, which looks the token up with the service role and only then
--     reads or writes that one project's rows. anon gets nothing, ever.
--   * Admin reads (and project create/update) run with the admin's JWT and
--     every policy re-checks is_admin().
--   * Files live in a PRIVATE bucket. Uploads use short-lived signed upload
--     URLs minted server-side after the token check; downloads use signed
--     read URLs minted for admins.
--
-- DATA PROTECTION: intake answers are client business data plus the contact
-- details of one decision-maker (Art. 6(1)(b), performing the contract).
-- Deleting a project cascades to its answers and file rows; the storage
-- objects are removed by the app when it deletes a project.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Projects. One row per client project. access_token is the secret in the
--    client's link: 43 chars of base64url (32 random bytes), generated in
--    lib/portal/token.ts, never by the database.
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  client_name         text not null check (char_length(client_name) between 1 and 120),
  package             text not null check (package in ('launch','business','signature')),
  locale              text not null default 'pl' check (locale in ('pl','en')),

  status              text not null default 'intake'
                        check (status in ('intake','submitted','active','launched','archived')),

  access_token        text unique check (access_token ~ '^[A-Za-z0-9_-]{43}$'),
  token_created_at    timestamptz,

  intake_submitted_at timestamptz,
  admin_notes         text check (char_length(admin_notes) <= 8000),

  inquiry_id          uuid references public.inquiries(id) on delete set null
);

create index if not exists projects_created_at_idx on public.projects (created_at desc);
create index if not exists projects_status_idx     on public.projects (status);

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Intake answers. One row per project; `answers` maps question id → value
--    (lib/portal/questions.ts is the schema). Capped at 256 KB so a runaway
--    client or a bug can't fill the database.
-- ---------------------------------------------------------------------------
create table if not exists public.intake_answers (
  project_id  uuid primary key references public.projects(id) on delete cascade,
  answers     jsonb not null default '{}'::jsonb
                check (jsonb_typeof(answers) = 'object' and pg_column_size(answers) <= 262144),
  updated_at  timestamptz not null default now()
);

drop trigger if exists intake_answers_touch on public.intake_answers;
create trigger intake_answers_touch before update on public.intake_answers
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Uploaded files. A row is written only after the upload is confirmed in
--    storage, so every row points at a real object.
-- ---------------------------------------------------------------------------
create table if not exists public.project_files (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  kind          text not null check (kind in ('logo','photo')),
  storage_path  text not null unique check (char_length(storage_path) <= 300),
  original_name text not null check (char_length(original_name) between 1 and 200),
  mime          text not null check (char_length(mime) <= 100),
  size_bytes    bigint not null check (size_bytes between 1 and 52428800)
);

create index if not exists project_files_project_idx on public.project_files (project_id, created_at);

-- ---------------------------------------------------------------------------
-- 4. Storage bucket. Private; 50 MB per file; images and PDFs only (logos
--    often arrive as PDF or SVG). The same limits are enforced in the app
--    before a signed upload URL is ever issued.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portal-uploads', 'portal-uploads', false, 52428800,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif',
        'image/svg+xml','image/gif','image/tiff','application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- No storage.objects policies for anon or authenticated: the bucket is
-- reachable only through signed URLs minted by the service role.

-- ---------------------------------------------------------------------------
-- 5. RLS. Admin-only, via the JWT. The portal itself uses the service role.
-- ---------------------------------------------------------------------------
alter table public.projects       enable row level security;
alter table public.intake_answers enable row level security;
alter table public.project_files  enable row level security;

alter table public.projects       force row level security;
alter table public.intake_answers force row level security;
alter table public.project_files  force row level security;

-- See schema.sql §6: default grants would leave TRUNCATE/REFERENCES to anon.
revoke all on public.projects, public.intake_answers, public.project_files
  from anon, public;

drop policy if exists projects_admin_read   on public.projects;
drop policy if exists projects_admin_insert on public.projects;
drop policy if exists projects_admin_update on public.projects;
drop policy if exists projects_admin_delete on public.projects;
create policy projects_admin_read   on public.projects for select to authenticated using (public.is_admin());
create policy projects_admin_insert on public.projects for insert to authenticated with check (public.is_admin());
create policy projects_admin_update on public.projects for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy projects_admin_delete on public.projects for delete to authenticated using (public.is_admin());

drop policy if exists intake_answers_admin_read on public.intake_answers;
create policy intake_answers_admin_read on public.intake_answers for select to authenticated using (public.is_admin());

drop policy if exists project_files_admin_read on public.project_files;
create policy project_files_admin_read on public.project_files for select to authenticated using (public.is_admin());
-- answers and files are written only by the portal (service role).

-- ============================================================================
-- PHASE 2: checkpoints, revision rounds and the project clock.
-- Rules: lib/portal/checkpoints.ts (mirrors agency-kit
-- docs/process/checkpoints-and-revisions.md). Same security model as above:
-- the client writes through the service role after the token check; admin
-- reads and writes with its JWT.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 6. Clock fields. Day N is counted in business days from clock_started_at,
--    minus the days spent waiting on the client:
--      paused_days   = finished waits, in business days
--      waiting_since = start of the current wait (null = not waiting)
--    A wait is "a checkpoint is open" or "waiting_on is set" (lib/portal/clock.ts).
-- ---------------------------------------------------------------------------
alter table public.projects add column if not exists clock_started_at timestamptz;
alter table public.projects add column if not exists waiting_on      text;
alter table public.projects add column if not exists waiting_since   timestamptz;
alter table public.projects add column if not exists paused_days     integer not null default 0;

alter table public.projects drop constraint if exists projects_waiting_on_len;
alter table public.projects add constraint projects_waiting_on_len check (char_length(waiting_on) <= 200);
alter table public.projects drop constraint if exists projects_paused_days_range;
alter table public.projects add constraint projects_paused_days_range check (paused_days between 0 and 1000);

-- ---------------------------------------------------------------------------
-- 7. Checkpoints. One row per preview we send for review. The client answers
--    with Approve, or with ONE consolidated feedback list ("changes"), which
--    uses one revision round for that stage.
-- ---------------------------------------------------------------------------
create table if not exists public.project_checkpoints (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  project_id      uuid not null references public.projects(id) on delete cascade,

  stage           smallint not null check (stage between 1 and 4),
  preview_url     text not null check (preview_url ~ '^https?://' and char_length(preview_url) <= 500),
  note            text not null default '' check (char_length(note) <= 4000),

  status          text not null default 'open'
                    check (status in ('open','changes','approved','auto_approved','withdrawn')),
  decided_at      timestamptz,
  decided_by      text check (char_length(decided_by) <= 120),
  feedback        jsonb not null default '[]'::jsonb
                    check (jsonb_typeof(feedback) = 'array' and pg_column_size(feedback) <= 131072),

  reminders_sent  smallint not null default 0 check (reminders_sent between 0 and 2),
  last_reminder_at timestamptz
);

create index if not exists project_checkpoints_project_idx on public.project_checkpoints (project_id, created_at);
create index if not exists project_checkpoints_open_idx on public.project_checkpoints (status) where status = 'open';

alter table public.project_checkpoints enable row level security;
alter table public.project_checkpoints force row level security;
revoke all on public.project_checkpoints from anon, public;

drop policy if exists project_checkpoints_admin_read   on public.project_checkpoints;
drop policy if exists project_checkpoints_admin_insert on public.project_checkpoints;
drop policy if exists project_checkpoints_admin_update on public.project_checkpoints;
drop policy if exists project_checkpoints_admin_delete on public.project_checkpoints;
create policy project_checkpoints_admin_read   on public.project_checkpoints for select to authenticated using (public.is_admin());
create policy project_checkpoints_admin_insert on public.project_checkpoints for insert to authenticated with check (public.is_admin());
create policy project_checkpoints_admin_update on public.project_checkpoints for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy project_checkpoints_admin_delete on public.project_checkpoints for delete to authenticated using (public.is_admin());
