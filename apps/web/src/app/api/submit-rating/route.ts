import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSupabaseConfigured } from 'shared-lib';
import { safeJsonBody } from '@/app/api/_shared/request-limits';

export async function POST(req: Request) {
  try {
    const payload = await safeJsonBody(req) as { bookingId?: string; stars?: number; comment?: string };
    const bookingId = String(payload.bookingId ?? '');
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    // Sanitise user-generated text before it is stored: strip tags and cap length.
    const rawComment = typeof payload.comment === 'string' ? payload.comment : '';
    const stars = Number(payload.stars);
    if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
      return NextResponse.json({ error: 'stars must be a number from 1 to 5' }, { status: 400 });
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

    // 1. Verify booking is COMPLETED
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('status, customer_id')
      .eq('id', bookingId)
      .single();

    if (fetchError) throw fetchError;
    if (booking.status !== 'completed') {
      return NextResponse.json({ error: 'Can only rate completed bookings' }, { status: 400 });
    }
    if (booking.customer_id !== session.session.user.id) {
       return NextResponse.json({ error: 'Only the customer can leave a rating' }, { status: 403 });
    }

    // 2. Insert Rating (comment is sanitised before storage).
    const { error } = await supabase
      .from('ratings')
      .insert({
        booking_id: bookingId,
        stars,
        comment: stripHtml(rawComment).slice(0, 1000),
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const message = error instanceof Response ? (error as Response).status === 413 ? 'Request body too large' : error.body : error?.message ?? 'Internal server error';
    const status = error instanceof Response ? (error as Response).status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** Strip anything that looks like an HTML tag and collapse whitespace. Primitive,
 * enough for a short review comment field in this prototype. */
function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;|&gt;|&amp;/gi, (m) => (m === '&lt;' ? '<' : m === '&gt;' ? '>' : '&'))
    .replace(/\s+/g, ' ')
    .trim();
}
