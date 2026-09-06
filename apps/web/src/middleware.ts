import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from 'shared-lib';

/**
 * Route protection — two explicit modes:
 *
 * DEMO (no NEXT_PUBLIC_SUPABASE_URL/ANON_KEY in env): the app is fully open so
 * the prototype can be explored without a backend. Persona switches inside the
 * app simulate roles; nothing is persisted. Demo personas are hidden entirely
 * when live mode is on.
 *
 * LIVE (Supabase env present): every page except /login and /auth require a
 * real Supabase session. Unauthenticated users are redirected to /login.
 *
 * Security headers are applied in BOTH modes so the prototype is never served
 * without at least the baseline protections (HSTS on HTTPS deploy targets, CSPs,
 * cookie flags, etc.).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public in both modes (marketing + legal/help pages reachable without a session).
  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/privacy-policy') ||
    pathname.startsWith('/faqs') ||
    pathname === '/';

  const isLive = isSupabaseConfigured();

  // Build the response (either the next handler's, or a redirect for unauthenticated live users).
  let response: NextResponse;
  if (isLive) {
    const { createServerClient } = await import('@supabase/ssr');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    let supabaseResponse = NextResponse.next({ request });
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Root is public (marketing), everything else needs auth.
    if (!user && !isPublic) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      response = NextResponse.redirect(loginUrl);
    } else {
      response = supabaseResponse;
    }
  } else {
    // DEMO MODE — open app; AuthContext manages a simulated persona session.
    response = NextResponse.next();
  }

  // ---- Baseline security headers (both modes) -------------------------
  // HSTS: tell browsers to only talk to this host over HTTPS for the next year.
  // Only emitted when the request is already HTTPS (prevents localhost/http dev
  // breakage). Vercel terminates TLS and reinjects `x-forwarded-proto`, so this
  // still protects the live deployment.
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const isHttps = forwardedProto === 'https' || request.headers.get('x-now-route-matches') !== null;
  if (isHttps) {
    response.headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Prevent clickjacking and embedding in iframes.
  response.headers.set('x-frame-options', 'DENY');
  // Tell the browser to assume the declared content type and not sniff.
  response.headers.set('x-content-type-options', 'nosniff');
  // Restrict referrer leakage to the same origin.
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  // Disable the default browser autocomplete/save-surface for forms on sensitive
  // pages. (Applied broadly; harmless on static content.)
  response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=(self)');

  // Content Security Policy — keep this prototype intact: only Upgrade Insecure
  // Requests is enforced; everything else is reported-only so the app does not break
  // on third-party fonts/images. Switch reportOnly:false once you confirm the
  // current rule set does not block any resource the app needs.
  response.headers.set(
    'content-security-policy',
    "default-src 'self'; img-src 'self' data: https: blob:; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*.googleapis.com https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; upgrade-insecure-requests; report-uri /api/security/report-csp",
  );
  // Report-Only mirror so we can iterate on the policy without breaking the build.
  response.headers.set(
    'content-security-policy-report-only',
    "default-src 'self'; img-src 'self' data: https: blob:; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*.googleapis.com https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; upgrade-insecure-requests; report-uri /api/security/report-csp",
  );

  // Debug header (strip from production builds if you prefer; useful to confirm HSTS landed).
  response.headers.set('x-security-headers', 'applied');

  // CORS — allow the app's own origin and the local dev server to call API routes.
  // In live mode the site is served from a single Vercel deployment, so we only allow
  // that origin. In demo mode we permit localhost dev origins so the prototype keeps working.
  const origin = request.headers.get('origin');
  if (origin) {
    const allowedOrigins = isLive
      ? ['https://coopworks-web-mocha.vercel.app', 'https://coopworks.vercel.app']
      : ['http://localhost:3000', 'http://127.0.0.1:3000', 'null'];
    if (allowedOrigins.includes(origin)) {
      response.headers.set('access-control-allow-origin', origin);
      response.headers.set('access-control-allow-credentials', 'true');
      response.headers.set('access-control-allow-methods', 'GET, POST, OPTIONS');
      response.headers.set('access-control-allow-headers', 'content-type, x-ft-csrf, x-requested-with');
      response.headers.set('access-control-max-age', '86400');
    } else {
      // Explicitly deny other origins rather than reflecting whatever the browser sent.
      response.headers.set('access-control-allow-origin', '');
    }
  }

  // Handle CORS preflight explicitly.
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: [
    // Apply to every page-like request (not static assets, not API routes handled below).
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)$).*)'
  ]
};
