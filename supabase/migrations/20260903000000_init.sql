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
