# Security controls — where they live

This document maps each item in the launch security checklist to the code or platform
that implements it, so reviewers can verify that nothing is assumed.

## Implemented in this repository

1. **HSTS** — `middleware.ts` sets `strict-transport-security` on HTTPS requests only
   (checks `x-forwarded-proto`). Vercel terminates TLS and injects the header.
2. **CSRF tokens** — `src/lib/csrf.ts` (double-submit cookie). Mutating routes in live
   mode reject missing/incorrect `x-ft-csrf`. Demo mode always sets the cookie but does
   not block requests (no real DB to protect). The `ft_session` cookie is httpOnly +
   sameSite=lax + secure-in-prod.
3. **Reset sessions on password change** — `api/auth/change-password/route.ts` clears the
   app session cookie on success; in live mode Supabase Auth invalidates the user's
   sessions when the password is changed (change the password via `updateUser`, which
   rotates the session). Do not rely on app-level sessions surviving a password change.
4. **Expire reset links** — reset tokens are **not** managed by this app. Supabase Auth
   issues single-use, time-limited reset tokens (default 1 hour). See
   `api/auth/request-reset/route.ts` and `api/auth/reset-password/route.ts`.
5. **Prevent user enumeration** — login/reset endpoints return a uniform response
   regardless of whether the email/persona exists. See `api/auth/request-reset` and
   `api/auth/reset-password`.
6. **Whitelist upload types** — `WorkerRegistration.tsx` rejects non-whitelisted MIME
   types client-side (image/jpeg, image/png, image/webp, application/pdf). The server
   routes (`worker/onboarding`) also validate coordinates and cap string lengths before
   persisting. If you add server-rendered file storage, enforce the same whitelist at
   the storage layer (Supabase Storage bucket rules or S3).
7. **Verify payment webhooks** — **not applicable yet**: payments are simulated in this
   prototype (`SECURITY.md` says so). When you add a real payment provider, verify
   webhook signatures with the provider's secret and never trust the payload body alone.
8. **Set prices server side** — booking creation/acceptance/payout endpoints do **not**
   trust client-supplied prices. `complete-booking/route.ts` recomputes the invoice from
   server-side constants + the DB row; `submit-rating` does not touch pricing. Do not let
   a client send `amount` or `rate` fields that this app trusts.
9. **Block prompt injection** — `maps-grounding/route.ts` sanitises user-supplied prompt
   text (strip tags, escape entities, cap length) **before** it would reach an AI model.
   The endpoint is currently disabled because no Gemini key is configured, so the
   sanitisation is defence-in-depth for when it is re-enabled.
10. **Cap AI usage** — **not applicable yet**: the AI path is disabled (no key). If you
    enable it, add a per-user usage cap (e.g. a DB row counting calls per window) and
    reject overflow with 429. The app currently has no AI billing path.
11. **Limit request size** — `api/_shared/request-limits.ts` enforces a 256 KB body cap
    (413 if exceeded) and is used by the mutating API routes.
12. **Rate limit password resets** — `api/auth/request-reset/route.ts` and
    `api/auth/reset-password/route.ts` rate-limit per IP (5 attempts / 15 min) and are
    also CSRF-cookie-aware.
13. **Sanitize before storing** — `submit-rating/route.ts` strips HTML and caps review
    comment length before persisting. `worker/onboarding/route.ts` truncates string fields
    before the RPC.
14. **Lock down CORS** — `middleware.ts` only allows the site's own origin(s) and
    localhost in demo mode; other origins are explicitly denied (not reflected).
15. **Disable directory listing** — Next.js serves the `public/` folder as static files
    without directory indexing by default. `robots.txt` additionally disallows `/_next/`
    and `/api/` crawling. No directory-index route exists in the app.
16. **Remove default admin route** — **intentionally NOT done**: admin flows are served
    through `api/admin/workers` and the `society_admin`/`federation_admin` dashboards, and
    the demo admin personas must still be able to log in. Removing the admin login flow would
    break the demo. The admin role is gated by RLS + the demo persona registry, not by a
    default "admin" URL.
17. **Log security events** — the app currently logs to the server console (Vercel function
    logs) for CSP violations (`api/security/report-csp`), auth errors, booking errors, and
    rate-limit rejections. For a production deploy, pipe these to a durable log sink.
18. **Set secure cookie flags** — `ft_session` is httpOnly, sameSite=lax, secure-in-prod.
    The CSRF cookie is httpOnly + sameSite=lax + secure-in-prod. Supabase Auth session
    cookies are managed by `@supabase/ssr` with its own secure defaults.
19. **Restrict database permissions** — enforced in Supabase via RLS on all tables
    (`profiles`, `bookings`, `worker_profiles`, `worker_skills`, `ratings`, `invoices`,
    `bulk_orders`) and via SECURITY DEFINER helper functions that read only the caller's
    own row from `auth.uid()`. State-changing operations go through RPCs/Edge Functions
    that re-derive identity from the JWT.

## Enforced by Supabase / the platform (not editable in this repo)

- **Password policy** — `supabase/config.toml` sets `minimum_password_length = 6` and can
  be tightened. The app's registration form currently accepts min 6; make the config match
  the app if you want consistent enforcement.
- **Reset token expiry** — handled by Supabase Auth (default 1 hour, single-use).
- **Session cookie flags** — `@supabase/ssr` manages the Auth session cookies with secure
  defaults; this app does not create them itself.
- **RLS / row permissions** — defined in `supabase/migrations/*.sql`. Changing them requires
  a Supabase project migration, not a frontend change.
- **Storage bucket privacy** — if you create Supabase Storage buckets, set them to private
  and add bucket/policy rules before any upload path is used. The app currently has no
  storage bucket in its migrations.

## Local prototype behaviour

- In demo mode (no Supabase env), CSRF is set but not enforced, rate limiting is present
  but in-memory (so it resets across requests on Vercel; use a KV/DB store for prod), HSTS
  is applied only on HTTPS requests, and all mutating routes are no-ops that return success
  without touching a backend.
- None of the above changes remove the demo admin login personas or the `society_admin` /
  `federation_admin` dashboards. The only admin-facing change is that admin API routes now
  use the shared body-size limiter (so a huge POST does not get accepted), which is
  non-breaking for the demo.
