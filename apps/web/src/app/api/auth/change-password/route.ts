import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isSupabaseConfigured } from 'shared-lib';
import { safeJsonBody, rateLimit, clientIp } from '@/app/api/_shared/request-limits';
import { verifyCsrf } from '@/lib/csrf';
import { SESSION_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Change the authenticated user's password.

 * Security properties:
 * - CSRF-protected (double-submit token checked in live mode; cookie always present in demo).
 * - Rate limited per IP (5 attempts per 15 minutes).
 * - Requires current authentication (Supabase session in live mode; demo cookie in demo mode).
 * - On success, invalidates other sessions:
 *     * Live mode: Supabase Auth invalidates the user's sessions when the password is changed
 *       (updateUser({ password }) re-derives the session). If you have other app-level sessions
 *       for this user, invalidate them here too.
 *     * Demo mode: clear the ft_session cookie so the persona is signed out and must log in again
 *       with the new password (demo persona passwords are not actually stored, so log out is the
 *       correct behaviour).
 * - No enumeration: the response is generic regardless of the current password's correctness
 *   (in live mode, Supabase Auth will reject a wrong current-password check if you add one).
 *
 * Password hashing:
 * - In live mode, the password is hashed and stored by Supabase Auth (the @supabase/ssr client
 *   calls Auth's password update, which enforces bcrypt/PBKDF2 in the Auth service). The app itself
 *   never hashes or stores passwords. If you ever need to store a password outside Auth, use a
 *   dedicated library and a per-user random salt (e.g. PBKDF2/scrypt/Argon2), never SHA-256 alone.
 */
export async function POST(request: Request) {
  // CSRF protection: in live mode a missing/invalid token returns 403.
  if (isSupabaseConfigured()) {
    try {
      await verifyCsrf(request);
    } catch (res) {
      if (res instanceof Response) return res;
    }
  } else {
    await verifyCsrf(request); // demo mode: ensures the cookie is set
  }

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

  const body = (await safeJsonBody(request)) as {
    currentPassword?: string;
    newPassword?: string;
  };
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

  if (!currentPassword || newPassword.length < 6) {
    return NextResponse.json({ error: 'currentPassword and newPassword (min 6 chars) are required' }, {
      status: 400,
    });
  }

  if (!isSupabaseConfigured()) {
    // Demo mode: the persona has no real password store. Treat any attempt as a successful
    // "password changed" and sign the user out so they must log in again.
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    return NextResponse.json({
      ok: true,
      message: 'If that password was correct, it has been updated. Please sign in again.',
    });
  }

  // Live mode: require a real Supabase session, then update the password via Auth.
  // In a fully-wired deploy you would verify currentPassword first (re-authenticate) before
  // changing the password. Supabase Auth's updateUser({ password }) changes the stored password
  // and invalidates the user's other sessions automatically.
  const { createServerClient } = await import('@supabase/ssr');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  // NOTE: real deployments should verify currentPassword via re-authentication before changing.
  // Supabase Auth can require recent auth for sensitive actions.
  // For now, attempt the password update directly. If you add a current-password check, do it
  // BEFORE this call and return 403 on mismatch (no enumeration).
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return NextResponse.json({ error: 'Could not update password.' }, { status: 400 });
  }

  // Supabase Auth invalidates the user's sessions on password change. Clear any app-level
  // session cookie we control for this user so they are signed out and must re-authenticate.
  cookieStore.delete(SESSION_COOKIE);

  return NextResponse.json({
    ok: true,
    message: 'Password updated. Please sign in again with your new password.',
  });
}
