import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from 'shared-lib';
import { safeJsonBody, rateLimit, clientIp } from '@/app/api/_shared/request-limits';
import { setCsrfCookie } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

/** Request a password-reset email.

 * Security properties:
 * - Rate limited per IP (5 attempts per 15 minutes) to slow enumeration/brute-force.
 * - Never reveals whether the email address exists in the system (uniform response).
 * - In demo mode there is no real backend, but the same no-enumeration behaviour
 *   is preserved so the prototype never leaks user existence.
 *
 * Token expiry:
 * - Real password-reset tokens are generated and invalidated by Supabase Auth, which
 *   issues single-use, time-limited tokens (default 1 hour). The app does not manage
 *   token lifecycles itself. See Supabase docs /auth/v password reset flow.
 */
export async function POST(request: Request) {
  await setCsrfCookie();

  if (!isSupabaseConfigured()) {
    // Demo mode: no real backend. Still apply no-enumeration + rate limiting behaviour
    // so the prototype behaves consistently.
    const ip = clientIp(request);
    const { allowed, retryAfterMs } = rateLimit(ip, { maxAttempts: 5, windowMs: 15 * 60 * 1000 });
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { 'retry-after': String(Math.ceil(retryAfterMs / 1000)) },
        },
      );
    }

    const body = (await safeJsonBody(request)) as { email?: string };
    // Always the same response regardless of whether the email exists.
    return NextResponse.json({
      ok: true,
      message: "If that email is registered, a reset link has been sent.",
    });
  }

  // Live mode: the Supabase client + Auth handle the reset flow. The app does not
  // invent its own reset tokens. The endpoint here is a thin rate-limited wrapper
  // that could call supabase.auth.resetPasswordForEmail(...) when wired.
  const ip = clientIp(request);
  const { allowed, retryAfterMs } = rateLimit(ip, { maxAttempts: 5, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'retry-after': String(Math.ceil(retryAfterMs / 1000)) },
      },
    );
  }

  const body = (await safeJsonBody(request)) as { email?: string };
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  // In live mode, call Supabase Auth's reset flow here. For now, mirror the demo
  // no-enumeration response so the client code path exists.
  return NextResponse.json({
    ok: true,
    message: "If that email is registered, a reset link has been sent.",
  });
}
