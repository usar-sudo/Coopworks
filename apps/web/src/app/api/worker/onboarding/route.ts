import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSupabaseConfigured } from 'shared-lib';
import { safeJsonBody } from '@/app/api/_shared/request-limits';

export async function POST(req: Request) {
  try {
    const body = await safeJsonBody(req) as {
      societyName?: string;
      radiusM?: number;
      lat?: number;
      lng?: number;
      services?: string[];
      aadhaarLast4?: string;
    };
    const { societyName, radiusM, lat, lng, services, aadhaarLast4 } = body;

    if (!isSupabaseConfigured()) {
      // Demo mode: nothing to persist — the client keeps its local applicant.
      return NextResponse.json({ success: true, demo: true });
    }

    const supabase = await createClient();
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Whitelist/validate upload-adjacent fields before passing to the RPC.
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return NextResponse.json({ error: 'Valid lat/lng numbers are required' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('submit_worker_onboarding', {
      p_society_name: String(societyName ?? '').slice(0, 255),
      p_radius_m: Math.max(100, Math.min(50000, Number(radiusM) || 15000)),
      p_lat: latNum,
      p_lng: lngNum,
      p_services: Array.isArray(services) ? services.map((s) => String(s).slice(0, 120)) : [],
      p_aadhaar_last4: aadhaarLast4 ? String(aadhaarLast4).slice(-4) : null,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    const message = error instanceof Response ? (error as Response).status === 413 ? 'Request body too large' : error.body : error?.message ?? 'Internal server error';
    const status = error instanceof Response ? (error as Response).status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
