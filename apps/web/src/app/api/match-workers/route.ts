import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSupabaseConfigured } from 'shared-lib';
import { INITIAL_WORKERS } from '@/data/mockData';
import { updateWorkersWithNewUserLocation } from '@/services/geolocationService';

export async function POST(req: Request) {
  try {
    const { lat, lng, serviceType } = await req.json();

    // Demo mode: skip Supabase entirely (its client factory throws without keys).
    if (!isSupabaseConfigured()) {
      const sortedMocks = updateWorkersWithNewUserLocation(INITIAL_WORKERS, { lat, lng });
      const filtered = serviceType 
        ? sortedMocks.filter(w => w.skills.some(s => s.name.toLowerCase() === serviceType.toLowerCase()))
        : sortedMocks;
      return NextResponse.json({ workers: filtered });
    }

    const supabase = await createClient();
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the PostGIS matching RPC function on Supabase
    const { data: workers, error } = await supabase.rpc('match_workers', {
      p_lat: lat,
      p_lng: lng,
      p_service_type: serviceType,
    });

    if (error) throw error;

    return NextResponse.json({ workers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
