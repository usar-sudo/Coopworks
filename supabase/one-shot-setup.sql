-- ================= migrations/20260903000000_init.sql =================

-- ============================================================
-- Cooperative Gig Platform — Database Schema (Supabase/Postgres)
-- ============================================================

create extension if not exists postgis;
create extension if not exists btree_gist;   -- needed for the EXCLUDE constraint on bookings
create extension if not exists moddatetime;  -- powers the bookings.updated_at trigger

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------
create type user_role as enum ('customer', 'worker', 'society_admin', 'federation_admin');

create type service_type as enum (
  'electrician', 'plumber', 'carpenter', 'painter', 'domestic_helper',
  'caregiver', 'driver', 'gardener', 'cleaner', 'technician'
);

create type booking_status as enum ('requested', 'accepted', 'in_progress', 'completed', 'cancelled');
create type cancelled_by_role as enum ('customer', 'worker');
create type invoice_status as enum ('unpaid', 'paid');

-- ------------------------------------------------------------
-- federations
-- ------------------------------------------------------------
create table federations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- societies
-- ------------------------------------------------------------
create table societies (
  id             uuid primary key default gen_random_uuid(),
  federation_id  uuid not null references federations(id) on delete cascade,
  name           text not null,
  service_area   geometry(Polygon, 4326),
  created_at     timestamptz not null default now()
);

create index idx_societies_federation on societies(federation_id);

-- ------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ------------------------------------------------------------
create table profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  role           user_role not null default 'customer',
  name           text not null,
  phone          text not null,
  society_id     uuid references societies(id) on delete set null,
  federation_id  uuid references federations(id) on delete set null,
  created_at     timestamptz not null default now(),

  constraint chk_role_scope check (
    (role in ('worker','society_admin') and society_id is not null)
    or (role = 'federation_admin' and federation_id is not null)
    or (role = 'customer')
  )
);

create index idx_profiles_society_role on profiles(society_id, role);
create index idx_profiles_federation on profiles(federation_id) where federation_id is not null;

-- Auto-create a profile row when a new auth user signs up (default role = customer;
-- role escalation to worker/admin happens via a separate controlled path)
create function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), coalesce(new.phone, ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ------------------------------------------------------------
-- worker_profiles (1:1 extension of profiles, only for role='worker')
-- ------------------------------------------------------------
create table worker_profiles (
  profile_id             uuid primary key references profiles(id) on delete cascade,
  home_location          geometry(Point, 4326) not null,
  service_area_radius_m  int not null check (service_area_radius_m > 0),
  insurance_status       text not null default 'enrolled',
  verified               boolean not null default false,
  available              boolean not null default true,
  created_at             timestamptz not null default now()
);

create index idx_worker_profiles_location on worker_profiles using gist(home_location);
create index idx_worker_profiles_verified on worker_profiles(verified) where verified = true;

-- ------------------------------------------------------------
-- worker_skills
-- ------------------------------------------------------------
create table worker_skills (
  worker_id     uuid not null references worker_profiles(profile_id) on delete cascade,
  service_type  service_type not null,
  primary key (worker_id, service_type)
);

create index idx_worker_skills_type on worker_skills(service_type, worker_id);

-- ------------------------------------------------------------
-- bookings
-- ------------------------------------------------------------
create table bookings (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid not null references profiles(id) on delete restrict,
  worker_id         uuid references worker_profiles(profile_id) on delete restrict,
  service_type      service_type not null,
  status            booking_status not null default 'requested',
  is_emergency      boolean not null default false,
  location          geometry(Point, 4326) not null,
  scheduled_at      timestamptz not null,
  scheduled_end_at  timestamptz not null,
  cancelled_by      cancelled_by_role,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint chk_schedule_order check (scheduled_end_at > scheduled_at),

  -- Prevents overlapping active bookings for the same worker at the database level,
  -- not just in application logic — closes the race condition a client-side/Edge
  -- Function-only check can miss under concurrent requests.
  constraint excl_worker_overlap exclude using gist (
    worker_id with =,
    tstzrange(scheduled_at, scheduled_end_at) with &&
  ) where (status in ('accepted', 'in_progress'))
);

create index idx_bookings_worker_status on bookings(worker_id, status);
create index idx_bookings_customer on bookings(customer_id);
create index idx_bookings_location on bookings using gist(location);
create index idx_bookings_requested on bookings(status) where status = 'requested';

create trigger set_bookings_updated_at
  before update on bookings
  for each row execute function moddatetime(updated_at);
-- (requires the `moddatetime` extension: create extension if not exists moddatetime;)

-- ------------------------------------------------------------
-- ratings (1:1 with bookings, completed only — enforced in Edge Function, not here)
-- ------------------------------------------------------------
create table ratings (
  booking_id  uuid primary key references bookings(id) on delete cascade,
  stars       int not null check (stars between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- invoices (1:1 with bookings, simulated payments)
-- ------------------------------------------------------------
create table invoices (
  booking_id  uuid primary key references bookings(id) on delete cascade,
  amount      numeric(10,2) not null check (amount >= 0),
  status      invoice_status not null default 'unpaid',
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table federations enable row level security;
alter table societies enable row level security;
alter table profiles enable row level security;
alter table worker_profiles enable row level security;
alter table worker_skills enable row level security;
alter table bookings enable row level security;
alter table ratings enable row level security;
alter table invoices enable row level security;

-- RLS helpers: a SECURITY DEFINER function reads the caller's own profile row
-- with the owner's rights (bypassing RLS). Policies MUST NOT query `profiles`
-- inside a policy ON `profiles` — that is infinite recursion and makes every
-- profiles query (including the login-time role check) fail with
-- "infinite recursion detected in policy for relation profiles".
create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_society_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select society_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_federation_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select federation_id from public.profiles where id = auth.uid();
$$;

-- profiles: read own row; society/federation admins read their scope
create policy profiles_self_select on profiles
  for select using (id = auth.uid());

create policy profiles_society_admin_select on profiles
  for select using (
    public.current_user_role() = 'society_admin'
    and profiles.society_id = public.current_user_society_id()
  );

create policy profiles_federation_admin_select on profiles
  for select using (
    public.current_user_role() = 'federation_admin'
    and exists (
      select 1 from societies s
      where s.id = profiles.society_id
        and s.federation_id = public.current_user_federation_id()
    )
  );

-- bookings: customers and assigned workers see their own; admins see their scope
create policy bookings_customer_select on bookings
  for select using (customer_id = auth.uid());

create policy bookings_worker_select on bookings
  for select using (worker_id = auth.uid());

create policy bookings_customer_insert on bookings
  for insert with check (customer_id = auth.uid());

-- worker_profiles: worker manages own row; publicly readable fields limited to matching Edge Function (service_role)
create policy worker_profiles_self on worker_profiles
  for all using (profile_id = auth.uid());

-- ratings/invoices: visible to the booking's customer and worker
create policy ratings_participants on ratings
  for select using (
    exists (select 1 from bookings b where b.id = ratings.booking_id
            and (b.customer_id = auth.uid() or b.worker_id = auth.uid()))
  );

create policy invoices_participants on invoices
  for select using (
    exists (select 1 from bookings b where b.id = invoices.booking_id
            and (b.customer_id = auth.uid() or b.worker_id = auth.uid()))
  );

-- Note: state-changing operations (accept/complete/rate/verify) are intentionally
-- NOT exposed as broad client-side insert/update policies here — they go through
-- Edge Functions running with the service role, which re-derive the caller's
-- identity from the JWT and enforce the booking status machine server-side.


-- ================= migrations/20260904000001_account_delete.sql =================

-- ============================================================
-- Cooperative Gig Platform — Delete own account
-- ============================================================
-- Supabase does not allow a client to delete its own auth.users row with the
-- anon key. This SECURITY DEFINER function scoped to the caller's own uid is
-- the supported pattern: the client calls `delete_own_account()` and the
-- function verifies auth.uid() == the row being deleted.
--
-- Deleting the auth.users row cascades to profiles (on delete cascade),
-- which cascades to worker_profiles / bookings the user owns.

create or replace function delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = auth.uid();

  if not found then
    raise exception 'Account not found';
  end if;
end;
$$;

revoke execute on function delete_own_account() from anon, authenticated;
grant execute on function delete_own_account() to authenticated;


-- ================= migrations/20260904000002_core_functions.sql =================

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


-- ================= migrations/20260904000003_bulk_orders_overtime.sql =================

-- ============================================================
-- Institutions & overtime
-- ------------------------------------------------------------
-- Adds:
--  * bulk_orders — institutions place one order asking for many
--    workers at once (societies then staff it from their pool).
--  * bookings.overtime_hours — extra hours beyond the booked slot,
--    billed at 1.5x in the invoice/payout statement.
-- ============================================================

create type bulk_order_status as enum ('open', 'allocating', 'fulfilled', 'cancelled');

create table bulk_orders (
  id              uuid primary key default gen_random_uuid(),
  order_no        text not null unique default ('BLK-' || upper(substr(md5(random()::text), 1, 6))),
  org_name        text not null,
  contact_name    text not null,
  contact_phone   text not null,
  service_type    text not null,
  workers_needed  int not null check (workers_needed between 1 and 200),
  scheduled_date  date,
  location_area   text not null,
  notes           text,
  status          bulk_order_status not null default 'open',
  created_at      timestamptz not null default now()
);

create index idx_bulk_orders_status on bulk_orders(status);

alter table bulk_orders enable row level security;

-- Any signed-in member (customer/institution) can raise a bulk order.
create policy "members_can_create_bulk_orders"
  on bulk_orders for insert
  to authenticated
  with check (true);

-- Co-op staff (society/federation admins) view and update the queue. Role is
-- checked via the RLS helper (no profiles subquery → no recursion).
create policy "admins_read_bulk_orders"
  on bulk_orders for select
  to authenticated
  using (public.current_user_role() in ('society_admin', 'federation_admin'));

create policy "admins_update_bulk_orders"
  on bulk_orders for update
  to authenticated
  using (public.current_user_role() in ('society_admin', 'federation_admin'))
  with check (true);

-- Overtime tracking on bookings (extra hours billed at 1.5x).
alter table bookings
  add column overtime_hours numeric(4,1) not null default 0
    check (overtime_hours >= 0);

-- ============================================================
-- Seed: a few institution bulk orders for the demo
-- ============================================================
insert into bulk_orders (org_name, contact_name, contact_phone, service_type, workers_needed, scheduled_date, location_area, notes, status)
values
  ('Green Meadows Housing Co-op', 'Ritu Malhotra', '+91 98123 45678', 'Painting & Waterproofing', 8, current_date + 12, 'Janakpuri, New Delhi', 'Annual exterior repaint across 4 towers. Need 8 painters for 3 weeks.', 'open'),
  ('Delhi Public School, Saket', 'Dr. Anil Verma', '+91 98765 43210', 'Electrical', 6, current_date + 7, 'Saket, New Delhi', 'Pre-monsoon safety check + LED retrofit on 3 buildings. 6 electricians, 5 days.', 'allocating'),
  ('Metro Plaza Mall', 'Farah Khan', '+91 98989 10101', 'Cleaning & Housekeeping', 12, current_date + 20, 'Karol Bagh, New Delhi', 'Deep-clean contract for common areas. 12 cleaners, nightly shift.', 'open')
on conflict (order_no) do nothing;

-- ================= seed.sql =================

-- ============================================================
-- Coopworks — Demo Seed Data
-- Run AFTER the init migration (20260903000000_init.sql).
-- Paste both files into Supabase Dashboard → SQL Editor (no Docker needed).
-- Creates: 1 federation, 2 societies, 4 demo auth users (one per role),
-- a worker profile + skills, and a spread of bookings/ratings/invoices.
--
-- Demo logins (email/password):  Fieldwork@2025  for all four
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Federation + Societies (fixed UUIDs referenced below)
-- ------------------------------------------------------------
insert into federations (id, name)
values ('00000000-0000-0000-0000-00000000f001', 'National Labour Cooperative Federation')
on conflict (id) do nothing;

insert into societies (id, federation_id, name)
values
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000f001', 'Cascadia Builders Coop'),
  ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-00000000f001', 'Metro Pipefitters 308')
on conflict (id) do nothing;

-- Additional regional societies matching the onboarding form's dropdown
insert into societies (id, federation_id, name)
values
  ('00000000-0000-0000-0000-00000000c003', '00000000-0000-0000-0000-00000000f001', 'Local 404 (Metropolitan Central)'),
  ('00000000-0000-0000-0000-00000000c004', '00000000-0000-0000-0000-00000000f001', 'Guild District 12 (North Coast)'),
  ('00000000-0000-0000-0000-00000000c005', '00000000-0000-0000-0000-00000000f001', 'Cascadia Artisan Guild (Northwest)'),
  ('00000000-0000-0000-0000-00000000c006', '00000000-0000-0000-0000-00000000f001', 'Heartland Builders Society (Midwest)')
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- Demo auth users (one per role).
-- Inserting into auth.users fires the on_auth_user_created trigger,
-- which auto-creates the matching profiles row.
-- ------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role,
  email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-00000000a001',
    'authenticated', 'authenticated',
    'customer@coopworks.demo',
    crypt('Fieldwork@2025', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Aisha Verma"}',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-00000000a002',
    'authenticated', 'authenticated',
    'worker@coopworks.demo',
    crypt('Fieldwork@2025', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Marcus Cole"}',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-00000000a003',
    'authenticated', 'authenticated',
    'societyadmin@coopworks.demo',
    crypt('Fieldwork@2025', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Ritu Sharma"}',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-00000000a004',
    'authenticated', 'authenticated',
    'federationadmin@coopworks.demo',
    crypt('Fieldwork@2025', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Arjun Mehta"}',
    now(), now()
  )
on conflict (id) do nothing;

-- Escalate roles + attach society/federation scope (respects chk_role_scope).
update profiles
set role = 'worker', society_id = '00000000-0000-0000-0000-00000000c001', phone = '+91 90000 00002'
where id = '00000000-0000-0000-0000-00000000a002';

update profiles
set role = 'society_admin', society_id = '00000000-0000-0000-0000-00000000c001', phone = '+91 90000 00003'
where id = '00000000-0000-0000-0000-00000000a003';

update profiles
set role = 'federation_admin', federation_id = '00000000-0000-0000-0000-00000000f001', phone = '+91 90000 00004'
where id = '00000000-0000-0000-0000-00000000a004';

update profiles
set phone = '+91 90000 00001'
where id = '00000000-0000-0000-0000-00000000a001';

-- ------------------------------------------------------------
-- Worker profile + skills (electrician + technician)
-- ------------------------------------------------------------
insert into worker_profiles (profile_id, home_location, service_area_radius_m, verified, available)
values (
  '00000000-0000-0000-0000-00000000a002',
  ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326),   -- Delhi demo coordinates
  15000,
  true,
  true
)
on conflict (profile_id) do nothing;

insert into worker_skills (worker_id, service_type)
values
  ('00000000-0000-0000-0000-00000000a002', 'electrician'),
  ('00000000-0000-0000-0000-00000000a002', 'technician')
on conflict do nothing;

-- ------------------------------------------------------------
-- Demo bookings removed: accounts start EMPTY — bookings are
-- created live through the app (/api/create-booking), so each
-- role sees only real data after re-login. (If your live
-- database still has the old demo bookings from an earlier run,
-- delete them with:
--   delete from public.invoices where booking_id::text like '00000000-0000-0000-0000-00000000b%';
--   delete from public.ratings  where booking_id::text like '00000000-0000-0000-0000-00000000b%';
--   delete from public.bookings where id::text        like '00000000-0000-0000-0000-00000000b%';
-- )
-- ------------------------------------------------------------


