-- ============================================================================
-- Webcraft — post-setup verification, ALL CHECKS IN ONE GRID.
-- Run this in the Supabase SQL editor AFTER schema.sql.
--
-- Why this file exists alongside verify.sql: the Supabase SQL editor only
-- displays the result of the LAST statement in a script. verify.sql is nine
-- separate statements, so it only ever shows you the ninth. This file folds
-- the table/policy/function checks into a SINGLE query, so every row — PASS or
-- FAIL — appears together in one result grid. Same checks, one look.
--
-- Read the grid top to bottom. Every row should say PASS, with one expected
-- exception before you finish setup: `admin_seeded` stays FAIL until you add
-- yourself as an admin (SETUP.md step 5). Check #4 (no_anon_policies) is the
-- one that matters most — it proves the public key in your JavaScript bundle
-- cannot read a single inquiry.
--
-- The rate-limiter self-test can't live in a plain query (it writes rows), so
-- it runs first below and prints its verdict in the "Messages"/logs tab as
-- `rate_limiter: PASS`. The visible grid is everything else.
-- ============================================================================

-- Rate-limiter self-test — verdict appears in the Messages tab, not the grid.
do $$
declare a boolean; b boolean; c boolean;
begin
  delete from public.rate_limits where bucket = 'verify:selftest';
  select public.check_rate_limit('verify:selftest', 2, 60) into a;  -- true
  select public.check_rate_limit('verify:selftest', 2, 60) into b;  -- true
  select public.check_rate_limit('verify:selftest', 2, 60) into c;  -- false
  delete from public.rate_limits where bucket = 'verify:selftest';
  if a and b and not c then
    raise notice 'rate_limiter: PASS';
  else
    raise warning 'rate_limiter: FAIL (% % %)', a, b, c;
  end if;
end $$;

-- The eight structural checks, unioned into one result grid (ordered 1..8).
select "check", result
from (

  -- 1. Do all five tables exist?
  select 1 as n, 'tables' as "check",
         case when count(*) = 5 then 'PASS'
              else 'FAIL — expected 5, found ' || count(*) end as result
  from information_schema.tables
  where table_schema = 'public'
    and table_name in ('inquiries','events','consent_log','admin_users','rate_limits')

  union all

  -- 2. Is RLS enabled on every one of them?
  select 2, 'rls_enabled',
         case when bool_and(relrowsecurity) then 'PASS'
              else 'FAIL — RLS off on: ' || string_agg(relname, ', ') filter (where not relrowsecurity)
         end
  from pg_class
  where relnamespace = 'public'::regnamespace
    and relname in ('inquiries','events','consent_log','admin_users','rate_limits')

  union all

  -- 3. Is RLS FORCED on the three data tables? (owner connections obey it too)
  select 3, 'rls_forced',
         case when bool_and(relforcerowsecurity) then 'PASS'
              else 'FAIL — not forced on: ' || string_agg(relname, ', ') filter (where not relforcerowsecurity)
         end
  from pg_class
  where relnamespace = 'public'::regnamespace
    and relname in ('inquiries','events','consent_log')

  union all

  -- 4. THE IMPORTANT ONE. Does `anon` have any policy anywhere?
  select 4, 'no_anon_policies',
         case when count(*) = 0 then 'PASS'
              else 'FAIL — anon can reach: ' || string_agg(tablename || '.' || policyname, ', ')
         end
  from pg_policies
  where schemaname = 'public' and 'anon' = any(roles)

  union all

  -- 5. Does anon hold direct table grants that would bypass the policy story?
  select 5, 'no_anon_grants',
         case when count(*) = 0 then 'PASS'
              else 'FAIL — anon granted ' || string_agg(distinct privilege_type || ' on ' || table_name, ', ')
         end
  from information_schema.role_table_grants
  where grantee = 'anon' and table_schema = 'public'
    and table_name in ('inquiries','events','consent_log','admin_users','rate_limits')

  union all

  -- 6. Can anon or authenticated execute the privileged functions?
  select 6, 'privileged_fns_locked',
         case when count(*) = 0 then 'PASS'
              else 'FAIL — ' || string_agg(p.proname || ' executable by ' || r.rolname, ', ')
         end
  from pg_proc p
  cross join lateral (values ('anon'),('authenticated')) as r(rolname)
  where p.pronamespace = 'public'::regnamespace
    and p.proname in ('check_rate_limit','purge_old_data')
    and has_function_privilege(r.rolname, p.oid, 'execute')

  union all

  -- 7. Are the functions security definer with a pinned search_path?
  select 7, 'fn_hardening',
         case when bool_and(p.prosecdef and p.proconfig::text like '%search_path%') then 'PASS'
              else 'FAIL — check: ' || string_agg(p.proname, ', ')
                   filter (where not (p.prosecdef and p.proconfig::text like '%search_path%'))
         end
  from pg_proc p
  where p.pronamespace = 'public'::regnamespace
    and p.proname in ('is_admin','check_rate_limit','admin_overview','purge_old_data')

  union all

  -- 8. Is anyone actually an admin yet? (0 = the dashboard will bounce you)
  select 8, 'admin_seeded',
         case when count(*) >= 1 then 'PASS — ' || count(*) || ' admin(s)'
              else 'FAIL — admin_users is empty; see step 5 of SETUP.md' end
  from public.admin_users

) as checks
order by n;
