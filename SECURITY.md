# Security Policy — Coopworks

Coopworks is a worker-owned cooperative marketplace built on **Next.js 15 (App Router)** and **Supabase Cloud** (Postgres + PostGIS + Auth + Edge Functions). This document covers the security model, threat assumptions, and how to report vulnerabilities.

---

## Overview

| Layer | Mechanism |
|---|---|
| **Authentication** | Supabase Auth (email/password, session cookies via `@supabase/ssr`) |
| **Authorization** | Postgres **Row Level Security (RLS)** on every table + database-authoredity role checks |
| **State-changing operations** | Go through Supabase RPCs / Edge Functions running with the **service role**, never through broad client-side insert/update policies |
| **Secrets / keys** | Public `anon` key only on the client; server routes + middleware read env |
| **Demo mode** | Zero-config fallback when env keys are absent — fully open, no auth |

The app auto-detects Supabase connectivity from `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Without them it runs in demo mode with mock data; with them it switches to **live mode** with middleware-protected routes, real Auth, and RLS-scoped database access.

---

## Authentication

- **Sign-up**: standard Supabase Auth signup (email/password). A database trigger (`on_auth_user_created`) auto-creates a `profiles` row with role = `customer` and the name/phone from `raw_user_meta_data`. New users always start as customers.
- **Role escalation**: moving from `customer` → `worker`, or becoming `society_admin` / `federation_admin`, is **never** done by client-side role assignment. Worker onboarding goes through the `submit_worker_onboarding()` RPC, which re-derives the caller from `auth.uid()` and only the cooperative admins create admin accounts in the back office (seeded in demo data; in production they are created by cooperative staff in the admin console).
- **Session**: `@supabase/ssr` handles refresh/session cookies. Middleware reads the session and redirects unauthenticated users away from protected routes.
- **Account deletion**: exposed via a `delete_own_account()` SECURITY DEFINER RPC — a client can only delete its own `auth.users` row; the function asserts `auth.uid()` matches, then cascades to `profiles` → `worker_profiles` / `bookings` (on delete cascade). The RPC is revoked from `anon` and granted only to `authenticated`.

---

## Authorization (Row Level Security)

All 8 application tables have RLS enabled:

| Table | Visibility / access |
|---|---|
| `profiles` | Users read their own row. Society admins read profiles in their own society. Federation admins read profiles under their federation. |
| `worker_profiles` | Workers manage their own row (`FOR ALL USING profile_id = auth.uid()`). Public-facing details (name, society, skills, jittered pin) only come from the `match_workers()` RPC running as service role. |
| `worker_skills` | Tied to worker_profiles; discoverable via `match_workers()` only. |
| `bookings` | Customers see their own; assigned workers see theirs; customers insert their own bookings. State transitions (accept/complete/cancel) go through Edge Functions, not broad update policies. |
| `ratings` / `invoices` | Visible only to the customer and worker who participated in the booking. |
| `federations` / `societies` | RLS enabled; read patterns kept narrow and admin-scoped. |

RLS helper functions (`current_user_role()`, `current_user_society_id()`, `current_user_federation_id()`) are `SECURITY DEFINER`, `STABLE`, and read **only the caller's own profile** via `auth.uid()`. They intentionally do **not** query `profiles` inside a policy on `profiles` — that would be infinite recursion and break every profiles query (including the login-time role check).

---

## Trusted operations (service role / RPC)

These operations are **not** exposed as broad client-side insert/update policies. They run through Supabase RPCs (or Edge Functions) that re-derive the caller from the JWT and enforce domain rules server-side:

- Booking lifecycle: create → accept → complete → cancel — plus ratings and invoices.
- Worker onboarding (`submit_worker_onboarding`): resolves society by name from the DB (never trusts a client-supplied society id), validates service types against the real enum, enforces radius bounds.
- Admin queue (`list_pending_workers`) and approval (`approve_worker`): society admins are scoped to their own society; federation admins see their whole federation. `approve_worker` verifies the caller is an admin and, for society admins, that the worker belongs to their society.

---

## Demo mode (no Supabase keys)

Without the env keys, the app runs in a fully open demo mode:

- Middleware does not enforce auth.
- API routes return safe mock responses (`{ success: true, demo: true }` / in-memory mock data) instead of crashing.
- Demo "persona" switches in the UI simulate roles — nothing is persisted and they disappear automatically the moment live env keys are present.

This is intentional for judging/demoing. It is **not** suitable for production traffic.

---

## Secrets & configuration

- **`NEXT_PUBLIC_SUPABASE_URL`**, **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** — public, safe to ship to the browser (they are the Supabase "anon" key, not the service-role secret).
- The **service-role secret** is **never** shipped to the client. It is only relevant for Edge Functions / server-side RPC logic in the Supabase project.
- Local dev secrets live in `apps/web/.env.local` and are `.gitignore`d. The repo ships a `.env.example` with empty placeholders.
- Vercel env vars are injected at build/runtime by Vercel — they are not stored in the repo.

---

## Domain / transport

- The app is served over HTTPS (Vercel default). Supabase client is configured for the project's Supabase URL.
- Supabase Auth URL configuration (Site URL + redirect URLs) should include the production Vercel domain and `http://localhost:3000` for local development.

---

## Data handling

- **Geo data**: `match_workers()` returns real home coordinates only internally (used for distance computation and overlap checks). The public-facing map pin is **deterministically jittered** per worker (from the worker id), so the marketplace shows a worker's *service area* rather than an exact home address before a booking is accepted. Exact location is only relevant once a booking is in progress.
- **Phone numbers**: masked in in-app call flows — the app relays rather than exposing raw numbers until a job is accepted, per the product voice.
- **Aadhaar / KYC**: this prototype stores only the **last 4 digits** of the Aadhaar number (if supplied) as a verification marker via `submit_worker_onboarding`. There is no full KYC pipeline — see the product spec's "high-friction = simulated" rule. If you add real KYC, treat Aadhaar / document payloads as PII and route them through a dedicated, audited service (Supabase Storage with RLS, S3, or a KYC provider), and never store full numbers in plain columns.
- **Payments / insurance status**: currently simulated ("enrolled" badge + static invoice). The full payment split is shown openly on the invoice breakdown as product copy.

---

## Threat model (non-exhaustive)

| Assumption | Mitigation |
|---|---|
| An attacker can read any data the anon key + RLS permit | RLS on every table; narrow policies; sensitive fields never exposed through public policies |
| An attacker can call any client-facing function | State-changing mutations go through RPCs / Edge Functions that re-derive identity from the JWT, not from client input |
| A logged-in user tries to access another user's data | RLS + role-scoped admin helpers; bookings/ratings/invoices scoped to participants |
| A worker tries to book overlapping shifts | DB-level `EXCLUDE` constraint on `bookings(worker_id, tstzrange)` for accepted/in-progress bookings, not just app logic |
| A user deletes their account | `delete_own_account()` only deletes the caller's own `auth.users` row, with cascade |
| Demo / no-key environment mistaken for production | Demo mode is explicitly open and mock-only; production env vars must be set to enable real auth + RLS |

---

## Known limitations & future hardening

- **KYC**: full Aadhaar/document verification is simulated (last-4 marker only). Real KYC should be a separate service.
- **Payments**: payment flows are simulated. Any real payment integration should use a PCI-compliant provider and never handle raw card data in this stack.
- **SMS OTP** (for phone login per the PRD) needs an SMS provider configured in Supabase Auth; the prototype uses email/password as the zero-config path.
- **Secrets rotation / audit logs**: follow Supabase project best practices (rotate keys, enable audit logs, restrict project access) before any real production launch.
- **Dependency hygiene**: run `npm audit` / Dependabot / Renovate on the monorepo, especially for `@supabase/*`, `next`, and `tailwindcss`.

---

## Reporting a vulnerability

Please report security issues privately rather than opening a public issue.

- Prefer email to the maintainers listed in the repo (if available), or a private security advisory on GitHub.
- Include: what you found, the steps to reproduce, the impact, and (if available) a suggested fix.
- We aim to acknowledge reports promptly and work toward a coordinated disclosure.

---

*This file is part of the Coopworks repository. It reflects the security posture of this prototype as shipped; before any production use, review RLS policies, RPCs, environment variable handling, and Supabase project settings against your threat model.*
