import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSupabaseConfigured } from 'shared-lib';
import { safeJsonBody } from '@/app/api/_shared/request-limits';

export async function POST(req: Request) {
  try {
    const payload = await safeJsonBody(req) as {
      customerId?: string;
      workerId?: string;
      serviceType?: string;
      scheduledAt?: string;
      scheduledEndAt?: string;
      location?: { lat?: number; lng?: number };
    };
    const { customerId, workerId, serviceType, scheduledAt, scheduledEndAt, location } = payload;

    // Demo mode: skip Supabase entirely (its client factory throws without keys).
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, bookingId: `booking-${Date.now()}`, demo: true });
    }
    const supabase = await createClient();

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure customerId matches logged in user
    if (session.session.user.id !== String(customerId ?? '')) {
      return NextResponse.json({ error: 'Profiles mismatch' }, { status: 403 });
    }

    // Validate and sanitise inputs before inserting.
    const lat = Number(location?.lat);
    const lng = Number(location?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Valid location coordinates are required' }, { status: 400 });
    }
    if (!workerId || !serviceType) {
      return NextResponse.json({ error: 'workerId and serviceType are required' }, { status: 400 });
    }

    // service_type is a Postgres enum on bookings; validate the incoming string against the
    // known set before inserting so the app never sends an invalid enum value to the DB.
    const knownServiceTypes = [
      'electrician', 'plumber', 'carpenter', 'painter', 'domestic_helper',
      'caregiver', 'driver', 'gardener', 'cleaner', 'technician',
    ] as const;
    const normalised = String(serviceType).toLowerCase().trim();
    const validType = knownServiceTypes.find((t) => t === normalised);
    if (!validType) {
      return NextResponse.json({ error: 'serviceType is not a recognised trade' }, { status: 400 });
    }

    const { data, error } = await supabase.from('bookings').insert({
      customer_id: customerId,
      worker_id: workerId,
      service_type: validType,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString(),
      scheduled_end_at: scheduledEndAt ? new Date(scheduledEndAt).toISOString() : new Date(Date.now() + 2 * 3600000).toISOString(),
      location: `POINT(${lng} ${lat})` as any,
      status: 'requested',
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, booking: data });
  } catch (error: any) {
    const message = error instanceof Response ? (error as Response).status === 413 ? 'Request body too large' : error.body : error?.message ?? 'Internal server error';
    const status = error instanceof Response ? (error as Response).status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
