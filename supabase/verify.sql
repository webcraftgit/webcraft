-- ============================================================================
-- Webcraft — post-setup verification (CP6-backend)
-- Run this in the Supabase SQL editor AFTER schema.sql.
-- Every row must say PASS. A FAIL means the data is not protected yet.
--
-- Why this file exists: "I ran the schema" and "the schema is in force" are
-- different claims. RLS that is enabled but has an accidental permissive
-- policy is worse than no RLS, because it looks safe.
-- ============================================================================

-- 1. Do all five tables exist?
select 'tables' as check,
       case when count(*) = 5 then 'PASS' else 'FAIL — expected 5, found ' || count(*) end as result
from information_schema.tables
where table_schema = 'public'
  and table_name in ('inquiries','events','consent_log','admin_users','rate_limits');

-- 2. Is RLS enabled on every one of them?
select 'rls_enabled' as check,
       case when bool_and(relrowsecurity) then 'PASS'
            else 'FAIL — RLS off on: ' || string_agg(relname, ', ') filter (where not relrowsecurity)
       end as result
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('inquiries','events','consent_log','admin_users','rate_limits');

-- 3. Is RLS FORCED on the three data tables? (owner connections obey it too)
select 'rls_forced' as check,
       case when bool_and(relforcerowsecurity) then 'PASS'
            else 'FAIL — not forced on: ' || string_agg(relname, ', ') filter (where not relforcerowsecurity)
       end as result
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('inquiries','events','consent_log');

-- 4. THE IMPORTANT ONE. Does `anon` have any policy anywhere?
--    A single row here means the public key in your JavaScript can read data.
select 'no_anon_policies' as check,
       case when count(*) = 0 then 'PASS'
            else 'FAIL — anon can reach: ' || string_agg(tablename || '.' || policyname, ', ')
       end as result
from pg_policies
where schemaname = 'public' and 'anon' = any(roles);

-- 5. Does anon hold direct table grants that would bypass the policy story?
select 'no_anon_grants' as check,
       case when count(*) = 0 then 'PASS'
            else 'FAIL — anon granted ' || string_agg(distinct privilege_type || ' on ' || table_name, ', ')
       end as result
from information_schema.role_table_grants
where grantee = 'anon' and table_schema = 'public'
  and table_name in ('inquiries','events','consent_log','admin_users','rate_limits');

-- 6. Can anon or authenticated execute the privileged functions?
select 'privileged_fns_locked' as check,
       case when count(*) = 0 then 'PASS'
            else 'FAIL — ' || string_agg(p.proname || ' executable by ' || r.rolname, ', ')
       end as result
from pg_proc p
cross join lateral (values ('anon'),('authenticated')) as r(rolname)
where p.pronamespace = 'public'::regnamespace
  and p.proname in ('check_rate_limit','purge_old_data')
  and has_function_privilege(r.rolname, p.oid, 'execute');

-- 7. Are the functions security definer with a pinned search_path?
--    An unpinned search_path on a definer function is a privilege-escalation bug.
select 'fn_hardening' as check,
       case when bool_and(p.prosecdef and p.proconfig::text like '%search_path%') then 'PASS'
            else 'FAIL — check: ' || string_agg(p.proname, ', ')
                 filter (where not (p.prosecdef and p.proconfig::text like '%search_path%'))
       end as result
from pg_proc p
where p.pronamespace = 'public'::regnamespace
  and p.proname in ('is_admin','check_rate_limit','admin_overview','purge_old_data');

-- 8. Is anyone actually an admin yet? (0 = the dashboard will bounce you)
select 'admin_seeded' as check,
       case when count(*) >= 1 then 'PASS — ' || count(*) || ' admin(s)'
            else 'FAIL — admin_users is empty; see step 5 of SETUP.md' end as result
from public.admin_users;

-- 9. Sanity: the rate limiter actually increments and then blocks.
--    Uses a throwaway bucket, then cleans up after itself.
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
