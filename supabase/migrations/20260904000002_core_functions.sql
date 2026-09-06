-- ============================================================
-- Cooperative Gig Platform — Core SQL Functions
-- ============================================================
-- Run AFTER 20260903000000_init.sql and 20260904000001_account_delete.sql
-- in Supabase Dashboard → SQL Editor (no Docker needed).
--
-- Adds the server-side logic the app's API routes call:
--   1. match_workers            — PostGIS ST_DWithin search (verified+available only)
--   2. submit_worker_onboarding — worker self-onboarding (role escalation + profile + skills)
--   3. list_pending_workers     — society/federation admin pending-verification queue
--   4. approve_worker           — society/federation admin approve/reject (flips verified)
--
-- All four derive the caller from auth.uid() — the client never supplies a
-- role / society / federation id that is trusted.

create extension if not exists postgis;
create extension if not exists btree_gist;

-- ------------------------------------------------------------
-- 1. Geo-matching: nearest verified, available workers
-- ------------------------------------------------------------
create or replace function match_workers(
  p_lat double precision,
  p_lng double precision,
  p_service_type text default null
)
returns table (
  id             uuid,
  name           text,
  role_title     text,
  society_name   text,
  distance_m     numeric,
  lat            double precision,
  lng            double precision,
  rating         numeric,
  completed_jobs bigint,
  skills         text[],
  available      boolean
)
language plpgsql stable security definer
set search_path = public, extensions
as $$
begin
  return query
  with candidate as (
    select
      wp.profile_id                                    as wid,
      p.name                                           as wname,
      so.name                                          as socname,
      st_distance(
        wp.home_location::geography,
        st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
      )                                                as dm,
      wp.home_location                                 as home,
      wp.available                                     as avail,
      coalesce(
        array_agg(sk.service_type::text order by sk.service_type)
          filter (where sk.service_type is not null),
        '{}'
      )                                                as skills
    from worker_profiles wp
    join profiles    p  on p.id  = wp.profile_id
    left join societies so on so.id = p.society_id
    left join worker_skills sk on sk.worker_id = wp.profile_id
    where wp.verified
      and wp.available
      and st_dwithin(
            wp.home_location::geography,
            st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
            wp.service_area_radius_m
          )
      and (
        p_service_type is null
        or exists (
          select 1 from worker_skills s2
          where s2.worker_id = wp.profile_id
            and s2.service_type::text = lower(btrim(p_service_type))
        )
      )
    group by wp.profile_id, p.name, so.name, wp.home_location, wp.available
  )
  select
    c.wid,
    c.wname,
    case
      when p_service_type is not null then lower(btrim(p_service_type))
      else coalesce(c.skills[1], 'general')
    end as role_title,
    c.socname,
    round(c.dm::numeric) as distance_m,
    -- Deterministic small jitter (±~0.004 deg) so the map shows the worker's
    -- *area* without exposing an exact home pin before booking.
    st_y(c.home) + (((('x' || substr(md5(c.wid::text), 1, 8))::bit(32))::bigint % 801) - 400) / 100000.0 as lat,
    st_x(c.home) + (((('x' || substr(md5(c.wid::text), 1, 8))::bit(32))::bigint % 801) - 400) / 100000.0 as lng,
    (select round(avg(r.stars)::numeric, 1)
     from bookings b
     left join ratings r on r.booking_id = b.id
     where b.worker_id = c.wid and b.status = 'completed') as rating,
    (select count(*)
     from bookings b
     where b.worker_id = c.wid and b.status = 'completed') as completed_jobs,
    c.skills,
    c.avail
  from candidate c
  order by c.dm asc
  limit 25;
end;
$$;

-- ------------------------------------------------------------
-- 2. Worker self-onboarding (called once the applicant's role
--    intent is 'worker'). Escalates the caller's profile to
--    worker, creates/refreshes worker_profiles (verified=false)
--    and replaces their skill tags.
-- ------------------------------------------------------------
create or replace function submit_worker_onboarding(
  p_society_name text,
  p_radius_m     int,
  p_lat          double precision,
  p_lng          double precision,
  p_services     text[],
  p_aadhaar_last4 text default null
)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_uid       uuid := auth.uid();
  v_society   uuid;
  v_service   text;
  v_aadhaar   text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_radius_m is null or p_radius_m < 100 or p_radius_m > 100000 then
    raise exception 'Service radius must be between 100 and 100000 metres';
  end if;

  if p_services is null or cardinality(p_services) = 0 then
    raise exception 'At least one service type is required';
  end if;

  -- Aadhaar: keep only the last 4 digits if supplied (prototype KYC marker).
  v_aadhaar := nullif(regexp_replace(coalesce(p_aadhaar_last4, ''), '\D', '', 'g'), '');
  if v_aadhaar is not null and length(v_aadhaar) <> 4 then
    v_aadhaar := right(v_aadhaar, 4);
  end if;

  -- Validate service types against the fixed enum.
  foreach v_service in array p_services loop
    if not exists (
      select 1 from unnest(enum_range(null::service_type)::text[]) t
      where t = lower(btrim(v_service))
    ) then
      raise exception 'Invalid service type: %', v_service;
    end if;
  end loop;

  -- Resolve society by the name the client showed (never a client-set society id).
  select s.id into v_society
  from societies s
  where lower(btrim(s.name)) = lower(btrim(p_society_name))
  limit 1;

  if v_society is null then
    raise exception 'Unknown society "%" — pick one from the society list', p_society_name;
  end if;

  update profiles
  set role       = 'worker',
      society_id = v_society,
      name       = coalesce(nullif(name, ''), 'Worker Member'),
      phone      = coalesce(nullif(phone, ''), '+91 00000 00000')
  where id = v_uid;

  insert into worker_profiles (
    profile_id, home_location, service_area_radius_m,
    insurance_status, verified, available
  )
  values (
    v_uid,
    st_setsrid(st_makepoint(p_lng, p_lat), 4326),
    p_radius_m,
    'enrolled',
    false,
    true
  )
  on conflict (profile_id) do update
    set home_location         = excluded.home_location,
        service_area_radius_m = excluded.service_area_radius_m,
        verified              = false,
        available             = true;

  delete from worker_skills where worker_id = v_uid;

  insert into worker_skills (worker_id, service_type)
  select v_uid, lower(btrim(s))::service_type
  from unnest(p_services) as s
  on conflict do nothing;

  -- Record the KYC marker (no real KYC pipeline — see PRD §3).
  if v_aadhaar is not null then
    update worker_profiles set aadhaar_last4 = v_aadhaar where profile_id = v_uid;
  end if;
end;
$$;

-- aadhaar_last4 isn't in the base schema; add as an optional verification column.
alter table worker_profiles
  add column if not exists aadhaar_last4 text;

-- ------------------------------------------------------------
-- 3. Pending-worker queue for society / federation admins
-- ------------------------------------------------------------
create or replace function list_pending_workers()
returns table (
  id             uuid,
  name           text,
  email          text,
  society_id     uuid,
  society_name   text,
  services       text[],
  radius_m       int,
  aadhaar_last4  text,
  geo_verified   boolean,
  created_at     timestamptz
)
language sql stable security definer
set search_path = public, extensions
as $$
  select
    p.id,
    p.name,
    u.email::text,
    p.society_id,
    so.name,
    coalesce(array_agg(sk.service_type::text order by sk.service_type), '{}'),
    wp.service_area_radius_m,
    wp.aadhaar_last4,
    wp.home_location is not null,
    wp.created_at
  from worker_profiles wp
  join profiles p  on p.id = wp.profile_id
  left join auth.users u on u.id = p.id
  left join societies so on so.id = p.society_id
  left join worker_skills sk on sk.worker_id = wp.profile_id
  where wp.verified = false
    and p.role = 'worker'
    and (
      -- society admins see only their own society
      exists (select 1 from profiles me
              where me.id = auth.uid() and me.role = 'society_admin'
                and me.society_id = p.society_id)
      or
      -- federation admins see everything under their federation
      exists (select 1 from profiles me
              where me.id = auth.uid() and me.role = 'federation_admin')
    )
  group by p.id, p.name, u.email, p.society_id, so.name,
           wp.service_area_radius_m, wp.aadhaar_last4, wp.home_location, wp.created_at
  order by wp.created_at desc;
$$;

-- ------------------------------------------------------------
-- 4. Approve / reject a pending worker (flips verified)
-- ------------------------------------------------------------
create or replace function approve_worker(
  p_worker uuid,
  p_approve boolean
)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_admin_role    text;
  v_admin_society uuid;
  v_worker_role   text;
  v_worker_society uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select role, society_id into v_admin_role, v_admin_society
  from profiles where id = auth.uid();

  if v_admin_role not in ('society_admin', 'federation_admin') then
    raise exception 'Society or federation admin access required';
  end if;

  select role, society_id into v_worker_role, v_worker_society
  from profiles where id = p_worker;

  if v_worker_role is null then
    raise exception 'Worker profile not found';
  end if;
  if v_worker_role <> 'worker' then
    raise exception 'Target profile is not a worker';
  end if;

  -- Society admins are scoped to their own society only.
  if v_admin_role = 'society_admin'
     and v_admin_society is distinct from v_worker_society then
    raise exception 'Not authorized for this worker''s society';
  end if;

  update worker_profiles
  set verified  = p_approve,
      available = case when p_approve then true else available end
  where profile_id = p_worker;

  if not found then
    raise exception 'Worker details not found';
  end if;
end;
$$;

-- ------------------------------------------------------------
-- Grants — authenticated callers only (RPC still runs security definer)
-- ------------------------------------------------------------
revoke execute on function match_workers(double precision, double precision, text) from anon, authenticated;
grant execute on function match_workers(double precision, double precision, text) to authenticated;

revoke execute on function submit_worker_onboarding(text, int, double precision, double precision, text[], text) from anon, authenticated;
grant execute on function submit_worker_onboarding(text, int, double precision, double precision, text[], text) to authenticated;

revoke execute on function list_pending_workers() from anon, authenticated;
grant execute on function list_pending_workers() to authenticated;

revoke execute on function approve_worker(uuid, boolean) from anon, authenticated;
grant execute on function approve_worker(uuid, boolean) to authenticated;
