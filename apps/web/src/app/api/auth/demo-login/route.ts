import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { AuthSession } from 'shared-types';
import { getDemoPersonaById } from 'shared-lib';
import { SESSION_COOKIE, demoCookieOptions } from '@/lib/auth';
import { isSupabaseConfigured } from 'shared-lib';
import { safeJsonBody, rateLimit, clientIp } from '@/app/api/_shared/request-limits';
import { setCsrfCookie } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

/**
 * Demo-mode sign-in: exchanges a persona id for a session cookie.
 * The persona is resolved server-side from the shared registry — the client
 * only ever supplies a persona id, never a role.
 *
 * Security hardening (non-breaking in demo mode):
 * - CSRF cookie is always set so client code learns the token.
 * - In live mode, this endpoint is disabled (real auth must be used) — so there
 *   is nothing to enumerate or brute-force here.
 */
export async function POST(request: Request) {
  // In live mode, demo persona login is disabled — real auth must be used.
  if (isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Demo login is disabled while Supabase is configured.' },
      { status: 400 }
    );
  }

  // No body-size enforcement needed for this tiny endpoint, but keep the CSRF
  // cookie flowing so the browser always has a current token.
  await setCsrfCookie();

  const body = (await safeJsonBody(request)) as { personaId?: string } | Record<string, unknown>;
  const persona = getDemoPersonaById(String(body.personaId ?? ''));
  if (!persona) {
    // Generic message — never reveal whether a persona id exists or not to a caller
    // that might probe the endpoint.
    return NextResponse.json({ error: 'Sign-in failed.' }, { status: 400 });
  }

  const session: AuthSession = {
    mode: 'demo',
    user: {
      id: persona.id,
      role: persona.role,
      name: persona.name,
      phone: persona.phone,
      societyId: persona.societyId ?? null,
      federationId: persona.federationId ?? null
    }
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, persona.id, demoCookieOptions);

  return NextResponse.json({ session });
}
