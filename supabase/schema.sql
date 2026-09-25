-- ============================================================================
-- Webcraft — database schema (CP6-backend)
-- Run once in the Supabase SQL editor. Idempotent: safe to re-run.
--
-- SECURITY MODEL (the whole point of this file):
--   * RLS is ON for every table, and there is NO permissive policy for `anon`.
--     The browser can never read or write these tables, even holding the
--     public anon key. Assume the anon key is public — it is, it ships in JS.
--   * All WRITES happen server-side through the service-role key, which lives
--     only in /app/api/* (never NEXT_PUBLIC_*). Service role bypasses RLS.
--   * All admin READS happen with the logged-in user's JWT, and every policy
--     re-checks membership in `admin_users`. "Authenticated" is NOT "admin" —
--     a stolen SIM that passes SMS OTP still reads nothing unless that user
--     row exists in the allowlist.
--
-- DATA PROTECTION (GDPR):
--   * Personal data (inquiries) and behavioural data (events) are separate
--     tables with separate lifetimes. They are joinable only via visitor_id,
--     and visitor_id is written ONLY when the person granted analytics consent.
--   * Raw IPs are never stored. We keep a salted daily-rotating HMAC (ip_hash)
--     for abuse control only; it de-links itself after 24h.
--   * consent_log is the Art. 7(1) "demonstrate consent" record.
--   * purge_old_data() enforces storage limitation. Schedule it (see bottom).
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Admin allowlist. Rows are created BY HAND (or by the seed block at the
--    bottom) — never by the app. Login cannot create one: the client calls
--    signInWithOtp({ shouldCreateUser: false }).
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  label      text,
  created_at timestamptz not null default now()
);

-- security definer so policies can call it without recursing into RLS.
-- search_path pinned: stops a hijacked search_path from shadowing admin_users.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Inquiries — PERSONAL DATA. Lawful basis: Art. 6(1)(b) pre-contractual
--    steps at the person's request. Attribution columns are nullable and stay
--    NULL unless analytics consent was granted.
-- ---------------------------------------------------------------------------
create table if not exists public.inquiries (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  name              text not null check (char_length(name) between 1 and 120),
  email             text not null check (char_length(email) between 3 and 200),
  message           text not null check (char_length(message) between 10 and 4000),

  tier              text check (tier in ('launch','business','signature')),
  content_readiness text check (content_readiness in ('ready','partly','none')),
  budget            text check (budget in ('lt5k','b5to10k','b10to20k','gt20k','unsure')),

  status            text not null default 'new'
                      check (status in ('new','contacted','quoted','won','lost','spam')),
  admin_notes       text check (char_length(admin_notes) <= 8000),

  locale            text check (locale in ('pl','en')),

  -- attribution: written only with analytics consent
  visitor_id        uuid,
  session_id        uuid,
  referrer_host     text,
  utm_source        text, utm_medium text, utm_campaign text,

  -- abuse control only. never a raw IP.
  ip_hash           text,
  user_agent        text check (char_length(user_agent) <= 512)
);

create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists inquiries_status_idx     on public.inquiries (status);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists inquiries_touch on public.inquiries;
create trigger inquiries_touch before update on public.inquiries
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Events — BEHAVIOURAL DATA. Written only after analytics consent.
--    Event names are constrained: an attacker who somehow reached the ingest
--    route still cannot invent dimensions to poison the dashboard.
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),

  visitor_id    uuid not null,
  session_id    uuid not null,

  name          text not null check (name in (
                  'page_view','session_start','section_view','form_start',
                  'form_submit','tier_select','budget_select','readiness_select',
                  'cta_click','demo_open','lang_switch','faq_open','scroll_depth'
                )),
  props         jsonb not null default '{}'::jsonb,

  path          text check (char_length(path) <= 256),
  locale        text check (locale in ('pl','en')),
  device        text check (device in ('mobile','tablet','desktop')),
  viewport_w    int check (viewport_w between 0 and 20000),
  viewport_h    int check (viewport_h between 0 and 20000),

  referrer_host text check (char_length(referrer_host) <= 253),
  utm_source    text, utm_medium text, utm_campaign text,
  country       text check (char_length(country) <= 2)
);

create index if not exists events_created_at_idx on public.events (created_at desc);
create index if not exists events_name_idx       on public.events (name, created_at desc);
create index if not exists events_visitor_idx    on public.events (visitor_id);
create index if not exists events_session_idx    on public.events (session_id);

-- ---------------------------------------------------------------------------
-- 4. Consent log — Art. 7(1): we must be able to demonstrate consent.
--    Deliberately NOT keyed by visitor_id: a person who REFUSES analytics gets
--    no visitor_id at all, but we still must record the refusal.
-- ---------------------------------------------------------------------------
create table if not exists public.consent_log (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  consent_id     uuid not null,
  analytics      boolean not null,
  policy_version text not null check (char_length(policy_version) <= 32),
  ip_hash        text,
  user_agent     text check (char_length(user_agent) <= 512)
);

create index if not exists consent_log_consent_idx on public.consent_log (consent_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 5. Rate limiting. Serverless has no shared memory, so the counter lives in
--    Postgres. `for update` makes the check-and-increment atomic — without it
--    two concurrent lambdas both read count=4 and both pass a max of 5.
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  bucket       text primary key,
  count        int not null default 0,
  window_start timestamptz not null default now()
);

create or replace function public.check_rate_limit(
  p_bucket text, p_max int, p_window_seconds int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_count int; v_start timestamptz;
begin
  insert into rate_limits (bucket) values (p_bucket) on conflict (bucket) do nothing;

  select count, window_start into v_count, v_start
    from rate_limits where bucket = p_bucket for update;

  if now() - v_start > make_interval(secs => p_window_seconds) then
    update rate_limits set count = 1, window_start = now() where bucket = p_bucket;
    return true;
  end if;

  if v_count >= p_max then
    return false;
  end if;

  update rate_limits set count = count + 1 where bucket = p_bucket;
  return true;
end $$;

-- only the service role may spend the rate limiter
revoke all on function public.check_rate_limit(text,int,int) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. RLS. Enable everywhere; grant nothing to anon. Service role bypasses RLS
--    by design, so the API routes keep working with zero policies for writes.
-- ---------------------------------------------------------------------------
alter table public.inquiries   enable row level security;
alter table public.events      enable row level security;
alter table public.consent_log enable row level security;
alter table public.admin_users enable row level security;
alter table public.rate_limits enable row level security;

-- force RLS even for the table owner: a leaked owner connection still obeys
alter table public.inquiries   force row level security;
alter table public.events      force row level security;
alter table public.consent_log force row level security;

-- Supabase's default privileges auto-grant ALL on every new public table to
-- anon and authenticated. anon must hold NOTHING here: it has no policies, so
-- RLS already blocks row access — but TRUNCATE and REFERENCES ignore RLS, so a
-- lingering grant is a real hole, not a formality. Strip anon (and the PUBLIC
-- pseudo-role it inherits from) back to zero. authenticated keeps its grants;
-- the policies below are what actually gate it. Revoking an absent privilege is
-- a no-op, so this stays safe to re-run.
revoke all on public.inquiries, public.events, public.consent_log,
               public.admin_users, public.rate_limits
  from anon, public;

drop policy if exists inquiries_admin_read   on public.inquiries;
drop policy if exists inquiries_admin_update on public.inquiries;
create policy inquiries_admin_read   on public.inquiries for select to authenticated using (public.is_admin());
create policy inquiries_admin_update on public.inquiries for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- no insert / delete policy on purpose: writes are service-role only,
-- and nothing in the product deletes an inquiry except an erasure request.

drop policy if exists events_admin_read on public.events;
create policy events_admin_read on public.events for select to authenticated using (public.is_admin());

drop policy if exists consent_admin_read on public.consent_log;
create policy consent_admin_read on public.consent_log for select to authenticated using (public.is_admin());

drop policy if exists admin_self_read on public.admin_users;
create policy admin_self_read on public.admin_users for select to authenticated using (user_id = auth.uid());

-- rate_limits: no policies at all → unreachable by anon/authenticated.

-- ---------------------------------------------------------------------------
-- 7. Dashboard aggregates. Done in SQL, not JS: the dashboard must never pull
--    the raw event stream into a Next.js server component just to count it.
--    security definer + an explicit is_admin() gate at the top.
-- ---------------------------------------------------------------------------
create or replace function public.admin_overview(p_days int default 30)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare v_from timestamptz := now() - make_interval(days => greatest(p_days, 1)); v json;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select json_build_object(
    'since', v_from,
    'days',  p_days,

    'visitors',      (select count(distinct visitor_id) from events where created_at >= v_from),
    'sessions',      (select count(distinct session_id) from events where created_at >= v_from),
    'pageviews',     (select count(*) from events where created_at >= v_from and name = 'page_view'),

    -- funnel, measured in SESSIONS (a visitor who returns twice counts twice)
    'reached_pricing', (select count(distinct session_id) from events
                          where created_at >= v_from and name = 'section_view'
                            and props->>'section' = 'pricing'),
    'form_starts',   (select count(distinct session_id) from events where created_at >= v_from and name = 'form_start'),
    'form_submits',  (select count(distinct session_id) from events where created_at >= v_from and name = 'form_submit'),

    'inquiries',     (select count(*) from inquiries where created_at >= v_from),
    'inquiries_new', (select count(*) from inquiries where status = 'new'),

    'by_status',    (select coalesce(json_agg(x), '[]') from (
                      select status as k, count(*) as c from inquiries
                      where created_at >= v_from group by 1 order by c desc) x),
    'by_tier',      (select coalesce(json_agg(x), '[]') from (
                      select coalesce(tier,'—') as k, count(*) as c from inquiries
                      where created_at >= v_from group by 1 order by c desc) x),
    'by_budget',    (select coalesce(json_agg(x), '[]') from (
                      select coalesce(budget,'—') as k, count(*) as c from inquiries
                      where created_at >= v_from group by 1 order by c desc) x),
    'by_readiness', (select coalesce(json_agg(x), '[]') from (
                      select coalesce(content_readiness,'—') as k, count(*) as c from inquiries
                      where created_at >= v_from group by 1 order by c desc) x),

    'by_device',    (select coalesce(json_agg(x), '[]') from (
                      select coalesce(device,'—') as k, count(distinct session_id) as c from events
                      where created_at >= v_from group by 1 order by c desc) x),
    'by_locale',    (select coalesce(json_agg(x), '[]') from (
                      select coalesce(locale,'—') as k, count(distinct session_id) as c from events
                      where created_at >= v_from group by 1 order by c desc) x),
    'by_country',   (select coalesce(json_agg(x), '[]') from (
                      select coalesce(country,'—') as k, count(distinct session_id) as c from events
                      where created_at >= v_from group by 1 order by c desc limit 12) x),
    'by_referrer',  (select coalesce(json_agg(x), '[]') from (
                      select coalesce(nullif(referrer_host,''),'direct') as k, count(distinct session_id) as c
                      from events where created_at >= v_from group by 1 order by c desc limit 12) x),
    'by_utm_source',(select coalesce(json_agg(x), '[]') from (
                      select coalesce(nullif(utm_source,''),'—') as k, count(distinct session_id) as c
                      from events where created_at >= v_from group by 1 order by c desc limit 12) x),

    -- which chips people actually click (the "studies" payload)
    'chip_tier',    (select coalesce(json_agg(x), '[]') from (
                      select props->>'value' as k, count(*) as c from events
                      where created_at >= v_from and name = 'tier_select' group by 1 order by c desc) x),
    'chip_budget',  (select coalesce(json_agg(x), '[]') from (
                      select props->>'value' as k, count(*) as c from events
                      where created_at >= v_from and name = 'budget_select' group by 1 order by c desc) x),
    'section_reach',(select coalesce(json_agg(x), '[]') from (
                      select props->>'section' as k, count(distinct session_id) as c from events
                      where created_at >= v_from and name = 'section_view' group by 1 order by c desc) x),
    'scroll_depth', (select coalesce(json_agg(x), '[]') from (
                      select props->>'pct' as k, count(distinct session_id) as c from events
                      where created_at >= v_from and name = 'scroll_depth' group by 1 order by k) x),

    'daily',        (select coalesce(json_agg(x), '[]') from (
                      select d::date as day,
                        (select count(distinct session_id) from events e
                           where e.created_at >= d and e.created_at < d + interval '1 day') as sessions,
                        (select count(*) from inquiries i
                           where i.created_at >= d and i.created_at < d + interval '1 day') as inquiries
                      from generate_series(date_trunc('day', v_from), date_trunc('day', now()), interval '1 day') d
                      order by d) x)
  ) into v;

  return v;
end $$;

revoke all on function public.admin_overview(int) from public, anon;
grant execute on function public.admin_overview(int) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Storage limitation (GDPR Art. 5(1)(e)). Behavioural data is not kept
--    forever. Inquiries are NOT auto-purged — they are business records; erase
--    them on request instead.
-- ---------------------------------------------------------------------------
create or replace function public.purge_old_data()
returns void
language sql
security definer
set search_path = public
as $$
  delete from events      where created_at < now() - interval '14 months';
  delete from consent_log where created_at < now() - interval '3 years';
  delete from rate_limits where window_start < now() - interval '1 day';
$$;

revoke all on function public.purge_old_data() from public, anon, authenticated;

-- Schedule it (Supabase → Database → Extensions → enable pg_cron, then):
--   select cron.schedule('wc-purge', '17 3 * * *', 'select public.purge_old_data()');

-- ---------------------------------------------------------------------------
-- 9. SEED THE ADMIN. Create the user first in
--    Dashboard → Authentication → Users → Add user, with your email and
--    "Auto Confirm User" ticked. Then run:
--
--   insert into public.admin_users (user_id, email, label)
--   select id, email, 'owner' from auth.users where email = 'you@example.com'
--   on conflict (user_id) do nothing;
-- ---------------------------------------------------------------------------
