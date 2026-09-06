import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSupabaseConfigured } from 'shared-lib';

export async function GET() {
  try {
    // Demo mode: empty queue — the UI shows its seeded mock orders instead.
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ orders: [], demo: true });
    }
    const supabase = await createClient();
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data, error } = await supabase
      .from('bulk_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ orders: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { orgName, contactName, contactPhone, serviceType, workersNeeded, scheduledDate, locationArea, notes } =
      await req.json();

    // Demo mode: echo a created order id so the UI can optimistically add it.
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        demo: true,
        order: {
          id: `bulk-${Date.now()}`,
          orderNo: `#BLK-${Math.floor(1000 + Math.random() * 9000)}`,
          orgName,
          contactName,
          contactPhone,
          serviceType,
          workersNeeded,
          scheduledDate,
          locationArea,
          notes,
          status: 'open',
          createdAt: 'Just now',
        },
      });
    }

    const supabase = await createClient();
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('bulk_orders')
      .insert({
        org_name: orgName,
        contact_name: contactName,
        contact_phone: contactPhone,
        service_type: serviceType,
        workers_needed: workersNeeded,
        scheduled_date: scheduledDate || null,
        location_area: locationArea,
        notes: notes || null,
        status: 'open',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}