/**
 * Supabase wiring with a demo-first seam.
 *
 * The platform runs in one of two modes:
 *  - 'demo'  — no NEXT_PUBLIC_SUPABASE_URL / ANON_KEY configured. Auth is a
 *              simulated persona session; data is in-memory mock data.
 *  - 'live'  — env vars present. Real Supabase Auth + PostgREST/PostGIS,
 *              enabled automatically the moment keys are added.
 *
 * Nothing here throws when unconfigured — callers branch on isSupabaseConfigured().
 */

/** True when a real Supabase project URL + anon key are present in env. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}
