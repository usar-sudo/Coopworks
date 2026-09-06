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
-- checked via the RLS helper from migration 01 (no profiles subquery → no
-- recursion).
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