import type { AuthSession } from 'shared-types';
import { getDemoPersonaById } from 'shared-lib';

/** Cookie that carries the demo session persona id (demo mode only). */
export const SESSION_COOKIE = 'ft_session';

const DEMO_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Resolve a session from a cookie store (works in middleware with
 * `req.cookies` and in route handlers with `next/headers` `cookies()`).
 *
 * Demo mode: cookie stores a persona id; role/name are derived from the
 * server-side persona registry — never from a client-supplied value.
 */
export function getDemoSessionFromCookies(
  cookieStore: { get(name: string): { value: string } | undefined }
): AuthSession | null {
  const personaId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!personaId) return null;
  const persona = getDemoPersonaById(personaId);
  if (!persona) return null;
  return {
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
}

export const demoCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: DEMO_MAX_AGE
};
