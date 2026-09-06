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
