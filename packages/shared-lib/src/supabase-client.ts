import { createServerClient } from '@supabase/ssr'
import type { Database } from 'shared-types'
import { createBrowserClient } from '@supabase/ssr'

// Server Client (for API Routes, Pages, Server Components)
export function createServerSupabaseClient(
  supabaseUrl: string, 
  supabaseAnonKey: string,
  cookies: any
) {
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookies.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookies.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Browser Client (for Client Components)
export function createBrowserSupabaseClient(
  supabaseUrl: string, 
  supabaseAnonKey: string
) {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
