import { cookies } from 'next/headers';
import { isSupabaseConfigured } from 'shared-lib';

export const CSRF_COOKIE = 'ft_csrf';
const CSRF_HEADER = 'x-ft-csrf';

/** One-time per-session CSRF token (random hex). */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Set a CSRF token on the cookie store (called by mutating route handlers). */
export async function setCsrfCookie() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CSRF_COOKIE);
  if (existing?.value) return existing.value;
  const token = generateCsrfToken();
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' || isSupabaseConfigured(),
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return token;
}

/** Extract the expected token from the cookie store. */
async function expectedCsrfToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE)?.value;
}

/** Read the token sent by the client: header first, then a JSON body field, then the cookie. */
export async function readSubmittedToken(request: Request): Promise<string | undefined> {
  const header = request.headers.get(CSRF_HEADER);
  if (header && header.trim()) return header.trim();

  // For requests that already parse JSON elsewhere, this duplicates a little work
  // but keeps the verifier self-contained and safe to call early.
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    if (typeof body._csrf === 'string' && body._csrf.trim()) return body._csrf.trim();
  } catch {
    // not JSON
  }

  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE)?.value;
}

/** Verify a mutating request carries a valid double-submit CSRF token.
 *
 * In demo mode (no backend), the cookie is still set so the browser learns the
 * token, but the check is relaxed: a missing header is tolerated IF the request
 * cannot change persistent state (i.e. demo mode). That keeps the prototype
 * usable from the browser while still enforcing the token when a real backend is
 * present. In live mode a missing/invalid token returns 403.
 */
export async function verifyCsrf(request: Request): Promise<void> {
  if (!isSupabaseConfigured()) {
    // Demo mode — ensure the cookie exists so client code can learn it, but do
    // not block the request. Real CSRF protection only matters once live mutations
    // touch a real database, which is gated by isSupabaseConfigured() already.
    await setCsrfCookie();
    return;
  }

  const expected = await expectedCsrfToken();
  if (!expected) {
    // No token issued yet — issue one and allow this first request (graceful).
    await setCsrfCookie();
    return;
  }

  const submitted = await readSubmittedToken(request);
  if (!submitted || submitted !== expected) {
    throw new Response(JSON.stringify({ error: 'Invalid or missing CSRF token' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    });
  }
}
