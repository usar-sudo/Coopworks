import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSupabaseConfigured } from 'shared-lib';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings — the signed-in user's own bookings from the database:
 * customers see bookings they placed, workers see bookings assigned to them
 * (both sides are covered by RLS policies). Only exposes the invoice amount
 * (participants-only policy); worker identity stays hidden from customers
 * (worker_profiles RLS), so the client renders the service title instead.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ bookings: [] });
  }

  const supabase = await createClient();
  // NOTE: getSession() returns { data: { session } } — bind the OUTER data
  // object so `session.session` is the real auth session. (Destructuring
  // `data: { session }` here made `session?.session` always undefined, so
  // this route returned 401 for every signed-in user and live bookings
  // never loaded — the app fell back to mock data instead.)
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id, worker_id, service_type, status, is_emergency, scheduled_at, scheduled_end_at, overtime_hours, cancelled_by, created_at, invoices(amount, status)'
    )
    .or(
      `customer_id.eq.${session.session.user.id},worker_id.eq.${session.session.user.id}`
    )
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookings: data ?? [] });
}