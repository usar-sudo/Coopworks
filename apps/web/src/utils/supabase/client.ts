import { createBrowserSupabaseClient } from 'shared-lib';

export function createClient() {
  // Use non-null assertion or fallback for typing, since Next requires env vars to be present at runtime
  return createBrowserSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
