# Coopworks — Go-Live Setup (no Docker needed)

This prototype runs on **Supabase Cloud** (hosted Postgres + PostGIS + Auth) and
**Vercel**. Docker is never required — all schema work happens in the browser
via Supabase's SQL Editor.

---

## 1. Create the hosted Supabase project

1. Go to https://supabase.com → **Start your project** (free tier is fine).
2. Pick a region close to your audience (e.g. Mumbai `ap-south-1`).
3. Note the database password you set — you won't need it for the app, but keep it safe.

You now have a Postgres database **with PostGIS already enabled** — this is the
part that needs `postgis` locally, and it's why Docker would normally be involved.

## 2. Run the schema migration (browser, no CLI)

1. In the Supabase dashboard open **SQL Editor → New query**.
2. Open `supabase/migrations/20260903000000_init.sql` and paste its contents.
3. Run it. This creates: enums, `federations`, `societies`, `profiles`
   (1:1 with `auth.users`, auto-created by trigger on signup), `worker_profiles`,
   `worker_skills`, `bookings` (with the double-booking `EXCLUDE` guard),
   `ratings`, `invoices`, all indexes, and **Row Level Security**.

> Verify: **Table Editor** should list all 8 tables.

## 2b. Run the core functions migration

After the schema, in the same SQL Editor open and run
`supabase/migrations/20260904000002_core_functions.sql`. This adds the
server-side logic the app calls — **without it, live mode will 500 on matching
and onboarding**:

- `match_workers(lat,lng,service?)` — PostGIS `ST_DWithin` search; returns only
  **verified + available** workers inside each worker's service radius, nearest
  first, with slightly jittered map pins so exact home locations aren't exposed.
- `submit_worker_onboarding(...)` — escalates the caller's profile to `worker`,
  creates/refreshes their `worker_profiles` row (verified = false) + skills.
- `list_pending_workers()` — the society/federation admin verification queue
  (society admins see only their own society).
- `approve_worker(id, approve)` — flips `verified`; only the worker's own
  society admin (or a federation admin) can call it.

> Verify: Dashboard → **Database → Functions** lists all four.

## 3. Seed demo data (optional but recommended for judging)

In the same SQL Editor, open `supabase/seed.sql`, paste, run.

This creates a federation, six societies (including the four shown in the
worker-onboarding dropdown), four demo auth users (one per role) and a
realistic spread of bookings. **Demo logins (all four):**

| Role | Email | Password |
|---|---|---|
| Customer | `customer@coopworks.demo` | `Fieldwork@2025` |
| Worker | `worker@coopworks.demo` | `Fieldwork@2025` |
| Society Admin | `societyadmin@coopworks.demo` | `Fieldwork@2025` |
| Federation Admin | `federationadmin@coopworks.demo` | `Fieldwork@2025` |

> Because demo users are **real Supabase users with real data**, the judges see
> a live product — no "demo persona" buttons anywhere on screen. Those buttons
> exist only in the no-backend fallback and are hidden automatically the moment
> env keys are present (see `Navbar`/`App` `isLiveMode` logic).

## 4. Point Auth at your real domain

Dashboard → **Authentication → URL Configuration**:

- `Site URL`: `https://<your-app>.vercel.app`
- `Redirect URLs`: add the same, plus `http://localhost:3000` for local dev.

## 5. Get the API keys

Dashboard → **Project Settings → API** → copy:
- Project URL  → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 6. Run locally with the keys

```bash
cd fieldwork-trust/apps/web
# edit .env.local and paste the two keys (keep GOOGLE_MAPS_API_KEY empty — Leaflet needs none)
npx next dev --turbopack -p 3000
```

The app auto-detects the keys and switches from demo fallback to **live mode**:
middleware protects routes, `/` shows the real email/password login, and after
sign-in your dashboard role comes from the `profiles` table — never client-set.

## 7. Deploy to Vercel (from the monorepo)

1. Push this repo to GitHub.
2. Vercel → **Add New Project** → import the repo.
3. Framework preset: **Next.js**. Root directory: `apps/web`.
4. Environment variables (both): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Deploy. Share the URL.

## 7b. Live-mode wiring map (already implemented in the app)

| App flow | API route | Supabase function |
|---|---|---|
| Customer marketplace map | `POST /api/match-workers` | `match_workers` (PostGIS) |
| Worker application (Join the Forge) | `POST /api/worker/onboarding` | `submit_worker_onboarding` |
| Admin accreditation queue | `GET /api/admin/workers` | `list_pending_workers` |
| Approve / reject applicant | `POST /api/admin/workers` | `approve_worker` |
| Booking lifecycle + ratings + invoices | `POST /api/{create,accept,complete}-booking`, `/api/submit-rating` | direct RLS-scoped writes |
| Account deletion | `POST /api/auth/delete-account` | `delete_own_account` |

Demo-mode behavior: without keys every one of these routes returns a safe
`{ success: true, demo: true }` / mock response instead of crashing — verified
against the production build.

## Notes / gotchas

- **Email confirmations**: signup confirmations are disabled by default in this
  setup, so `signInWithPassword` works immediately for seeded users. If you enable
  confirmations later, seeded users already have `email_confirmed_at` set.
- **Migration order matters**: run `…_init.sql` → `…_account_delete.sql` →
  `…_core_functions.sql` → `…_bulk_orders_overtime.sql` → `seed.sql` in that
  order. The seed depends on tables from the init migration; onboarding depends
  on the six society names in seed; `seed.sql` also inserts the demo bulk orders
  (table created by the bulk-orders migration).
- **Phone OTP** (per your PRD) needs an SMS provider (Twilio etc.) configured in
  Supabase Auth — email/password is the zero-config path for the prototype and
  is what `Auth.tsx` implements.
- **CLI alternative (still no Docker)**: you can also `supabase link --project-ref
  <ref>` + `supabase db push` from this folder — pushing migrations to the remote
  project needs no local container; only local `supabase start` would.
