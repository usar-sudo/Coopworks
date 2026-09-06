import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSupabaseConfigured } from 'shared-lib';

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ workers: [] });
    }
    const supabase = await createClient();
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase.rpc('list_pending_workers');
    if (error) throw error;

    return NextResponse.json({ workers: data ?? [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { workerId, approve } = await req.json();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, demo: true });
    }

    const supabase = await createClient();
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase.rpc('approve_worker', {
      p_worker: workerId,
      p_approve: !!approve,
    });
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
