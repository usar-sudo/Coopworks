import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { AuthSession } from 'shared-types';
import { getDemoSessionFromCookies } from '@/lib/auth';
import { isSupabaseConfigured } from 'shared-lib';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  let session: AuthSession | null = getDemoSessionFromCookies(cookieStore);

  // Live mode: fall back to the Supabase session when no demo persona cookie
  // is present. Role/profile resolution from the profiles table happens here
  // server-side so clients never supply their own role.
  if (!session && isSupabaseConfigured()) {
    const { createServerClient } = await import('@supabase/ssr');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}
      }
    });
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, name, phone')
        .eq('id', user.id)
        .maybeSingle();
      session = {
        mode: 'live',
        user: {
          id: user.id,
          role: profile?.role ?? 'customer',
          name: profile?.name ?? user.email ?? 'Member',
          phone: profile?.phone ?? user.phone ?? '',
          societyId: null,
          federationId: null
        }
      };
    }
  }

  return NextResponse.json({ session });
}
