import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/auth';
import { isSupabaseConfigured } from 'shared-lib';

export const dynamic = 'force-dynamic';

export async function POST() {
  const cookieStore = await cookies();

  // Live mode: also end the Supabase session server-side.
  if (isSupabaseConfigured()) {
    const { createServerClient } = await import('@supabase/ssr');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}
      }
    });
    await supabase.auth.signOut();
  }

  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
