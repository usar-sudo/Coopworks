import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/auth';
import { isSupabaseConfigured } from 'shared-lib';

export const dynamic = 'force-dynamic';

export async function POST() {
  const cookieStore = await cookies();

  if (isSupabaseConfigured()) {
    // Live mode: server-side account deletion via SECURITY DEFINER RPC
    // (see supabase/migrations/20260904000001_account_delete.sql).
    const { createServerClient } = await import('@supabase/ssr');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}
      }
    });
    const { error } = await supabase.rpc('delete_own_account');
    if (error) {
      return NextResponse.json(
        { error: `Account could not be deleted: ${error.message}` },
        { status: 400 }
      );
    }
  }

  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
