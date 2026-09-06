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
-- Make re-runs safe: drop demo users from a previous run first.
-- Otherwise `on conflict (id) do nothing` skips the auth.users
-- insert, the sign-up trigger never fires, and profiles stays
-- empty (breaking the worker_profiles FK below).
-- Only relevant when tables are fresh (cleanup → schema → seed).
-- ------------------------------------------------------------
delete from auth.identities where user_id in (select id from auth.users where email like '%@coopworks.demo');
delete from auth.users where email like '%@coopworks.demo';

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

-- GoTrue (Supabase Auth) rejects NULLs in these columns at sign-in with
-- "500: Database error querying schema" — manual SQL inserts leave them
-- NULL, so normalize them to empty strings for the demo users.
update auth.users
set confirmation_token         = coalesce(confirmation_token, ''),
    recovery_token             = coalesce(recovery_token, ''),
    email_change               = coalesce(email_change, ''),
    email_change_token_new     = coalesce(email_change_token_new, ''),
    email_change_token_current = coalesce(email_change_token_current, ''),
    phone_change               = coalesce(phone_change, ''),
    phone_change_token         = coalesce(phone_change_token, ''),
    reauthentication_token     = coalesce(reauthentication_token, '')
where email like '%@coopworks.demo';

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
-- role sees only real data after re-login. (The original seed
-- added 4 demo bookings for the customer account; if your live
-- database still has them from an earlier run, delete them with:
--   delete from public.invoices where booking_id::text like '00000000-0000-0000-0000-00000000b%';
--   delete from public.ratings  where booking_id::text like '00000000-0000-0000-0000-00000000b%';
--   delete from public.bookings where id::text        like '00000000-0000-0000-0000-00000000b%';
-- )
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- Institution bulk orders for the demo queue
-- (table comes from the bulk_orders migration / schema.sql)
-- ------------------------------------------------------------
insert into bulk_orders (org_name, contact_name, contact_phone, service_type, workers_needed, scheduled_date, location_area, notes, status)
values
  ('Green Meadows Housing Co-op', 'Ritu Malhotra', '+91 98123 45678', 'Painting & Waterproofing', 8, current_date + 12, 'Janakpuri, New Delhi', 'Annual exterior repaint across 4 towers. Need 8 painters for 3 weeks.', 'open'),
  ('Delhi Public School, Saket', 'Dr. Anil Verma', '+91 98765 43210', 'Electrical', 6, current_date + 7, 'Saket, New Delhi', 'Pre-monsoon safety check + LED retrofit on 3 buildings. 6 electricians, 5 days.', 'allocating'),
  ('Metro Plaza Mall', 'Farah Khan', '+91 98989 10101', 'Cleaning & Housekeeping', 12, current_date + 20, 'Karol Bagh, New Delhi', 'Deep-clean contract for common areas. 12 cleaners, nightly shift.', 'open')
on conflict (order_no) do nothing;
