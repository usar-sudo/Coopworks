import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSupabaseConfigured } from 'shared-lib';
import { safeJsonBody } from '@/app/api/_shared/request-limits';

export async function POST(req: Request) {
  try {
    const payload = await safeJsonBody(req) as { bookingId?: string };
    const bookingId = String(payload.bookingId ?? '');
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }
    // Demo mode: skip Supabase entirely (its client factory throws without keys).
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, demo: true });
    }
    const supabase = await createClient();

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // We must verify the person accepting is the assigned worker
    // Also enforcing state machine: from requested -> accepted
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('worker_id, status')
      .eq('id', bookingId)
      .single();

    if (fetchError) throw fetchError;
    if (booking.worker_id !== session.session.user.id) {
       return NextResponse.json({ error: 'Not the assigned worker' }, { status: 403 });
    }
    if (booking.status !== 'requested') {
      return NextResponse.json({ error: 'Booking no longer requested' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'accepted' })
      .eq('id', bookingId)
      .select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, booking: data });
  } catch (error: any) {
    const message = error instanceof Response ? (error as Response).status === 413 ? 'Request body too large' : error.body : error?.message ?? 'Internal server error';
    const status = error instanceof Response ? (error as Response).status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
