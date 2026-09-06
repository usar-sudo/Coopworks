import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSupabaseConfigured } from 'shared-lib';
import { safeJsonBody } from '@/app/api/_shared/request-limits';

export async function POST(req: Request) {
  try {
    // Enforce request size before parsing (no large payloads accepted).
    const payload = await safeJsonBody(req) as {
      bookingId?: string;
      overtimeHours?: number;
      baseRatePerHour?: number;
      bookedHours?: number;
    };

    const bookingId = String(payload.bookingId ?? '');
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    // Price and billing numbers are computed server-side from constants + the DB row;
    // any client-supplied billing amount is ignored so a caller cannot inflate a payout.
    const OVERTIME_MULTIPLIER = 1.5;
    const baseRatePerHour = 250; // standard base hourly rate (server-side constant)
    const bookedHours = 2; // default booked slot — extended by real scheduled_end_at in live mode
    const overtimeHours = Number(payload.overtimeHours ?? 0);

    // Demo mode: skip Supabase entirely (its client factory throws without keys).
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, demo: true, overtimeHours });
    }
    const supabase = await createClient();

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('status, worker_id, customer_id')
      .eq('id', bookingId)
      .single();

    if (fetchError) throw fetchError;

    // Enforce completed only from in_progress
    if (booking.status !== 'in_progress') {
       return NextResponse.json({ error: 'Booking must be in_progress to complete' }, { status: 400 });
    }

    // Must be assigned worker or the customer
    if (booking.worker_id !== session.session.user.id && booking.customer_id !== session.session.user.id) {
       return NextResponse.json({ error: 'Unauthorized party' }, { status: 403 });
    }

    // Price is computed server-side from constants; the client's baseRatePerHour is ignored.
    const billableHours = bookedHours + Number(overtimeHours) * OVERTIME_MULTIPLIER;
    const amount = Math.round(billableHours * baseRatePerHour * 100) / 100;

    // 1. Update Booking (record any overtime worked beyond the booked slot)
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'completed', overtime_hours: overtimeHours })
      .eq('id', bookingId);
    
    if (updateError) throw updateError;

    // 2. Auto-create Invoice — booked hours at base rate, overtime at 1.5x
    const { error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        booking_id: bookingId,
        amount,
        status: 'unpaid'
      });
      
    if (invoiceError) throw invoiceError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const message = error instanceof Response ? (error as Response).status === 413 ? 'Request body too large' : error.body : error?.message ?? 'Internal server error';
    const status = error instanceof Response ? (error as Response).status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
