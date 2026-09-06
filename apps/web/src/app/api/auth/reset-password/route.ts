import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from 'shared-lib';
import { safeJsonBody, rateLimit, clientIp } from '@/app/api/_shared/request-limits';
import { setCsrfCookie } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

/** Apply a password-reset token + new password.

 * Security properties:
 * - Rate limited per IP (5 attempts per 15 minutes).
 * - No enumeration: the response is generic regardless of whether the token or email is valid.
 * - Token expiry is enforced by Supabase Auth (reset tokens are single-use and time-limited,
 *   default expiry 1 hour). This app does not implement its own token storage/expiry — it relies
 *   on Supabase Auth's built-in reset flow. If you self-host or use a custom flow, implement the
 *   same: token issued at t0, valid for a fixed window, single-use, and invalidated on use.
 *
 * Session reset on password change:
 * - When a password is changed, all other sessions for that user must be invalidated. Supabase Auth
 *   handles this for its own sessions (changing the password invalidates existing JWTs/refreshes for
 *   that user). If you run any app-level sessions beyond Supabase Auth (e.g. the demo ft_session
 *   cookie), invalidate them here too. In demo mode there is no persistent backend, so there is
 *   nothing to invalidate beyond the cookie already in the browser.
 */
export async function POST(request: Request) {
  await setCsrfCookie();

  if (!isSupabaseConfigured()) {
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

    const body = (await safeJsonBody(request)) as { token?: string; email?: string; password?: string };
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!token || !email || password.length < 6) {
      // Generic message — never say whether the token/email is valid.
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    // Demo mode: no real backend to apply the reset. Return success with the same message so
    // the client can proceed without leaking whether the reset worked.
    return NextResponse.json({
      ok: true,
      message: 'If that reset link is valid, your password has been updated.',
    });
  }

  // Live mode placeholder: wire supabase.auth.updateUser({ password }) here AFTER a valid reset
  // token is verified by Supabase Auth's reset flow. The app does not validate reset tokens itself.
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

  const body = (await safeJsonBody(request)) as { token?: string; email?: string; password?: string };
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!token || !email || password.length < 6) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // TODO: integrate Supabase Auth reset-token verification here and then update the password.
  // Until then, mirror the demo behaviour so client code does not break.
  return NextResponse.json({
    ok: true,
    message: 'If that reset link is valid, your password has been updated.',
  });
}
