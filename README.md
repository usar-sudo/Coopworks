# Coopworks 👷

### Worker-owned cooperative platform for verified household & community services

Coopworks connects **verified local workers** (electricians, plumbers, carpenters, helpers, drivers and more) with the homes and businesses that need them — **fair pay, no middlemen**, and every society run by the workers themselves.

Unlike app-based gig companies that keep 30–40% of every job, Coopworks is a **labour cooperative**: workers own the platform, each society keeps 15% for its welfare fund, and every payment split is open for anyone to see.

---

## The Problem

Labour cooperative federations and societies have a real, local, skilled workforce — but no structured digital channel to connect that workforce to demand. Private gig platforms capture this market instead, while cooperative workers, who carry better local trust and a fairer ownership/wage structure, stay underutilised.

**Coopworks is the cooperative-owned answer**: a digital marketplace that lets federations and societies offer verified services while protecting **fair wages, worker welfare, and consumer trust** — the things private platforms deprioritise.

The differentiator is the **cooperative ownership & governance layer**: workers are federation members, not gig-economy contractors. Transparent wage floors, society-level verification, worker welfare tracking and one-member-one-vote governance are visible product features, not just content.

---

## Core Features (by role)

### 🙋 Customer
- Browse / search 10 service categories with live **Leaflet/OpenStreetMap** results
- See a worker's skill, cooperative society, rating & verification badge before booking
- Book a specific time slot, or raise an **emergency / priority** booking
- Track the job **live on a road-route map** (OSRM routing, simulated GPS tick)
- **Chat + Call** the assigned worker in-app, with quick replies on both sides
- Rate & review after completion, view the invoice with the full payment split

### 🛠️ Worker (Cooperative Member)
- **Dual-track registration**: instant customer signup or a full membership application (custom trade, custom society, phone, Aadhaar checksum + name verification, certificates/documents, live GPS capture)
- Accept / reject incoming dispatch requests
- Live on-site job tracker with **road-route navigation** and location status
- Payment breakup (worker share, society welfare fund, platform fee)
- Society ballot & bulletin (one member, one vote)

### 🏢 Society Admin
- Verify new worker applications (**approve / reject** flips `verified`)
- Society booking overview + worker roster
- **Demand map** of your society's service area

### 🏛️ Federation Admin
- Cross-society analytics (job counts, active workers, revenue)
- Demand/heat map across regions
- Approvals + staffing oversight across all societies

> **Role isolation**: every dashboard is scoped to its role. Customers never see admin tools, admins never see customer booking flows, and the same is enforced server-side with Row Level Security. Admin accounts are opened by the cooperative in the back office — never by public registration.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Web | **Next.js 15** (App Router) + React 19 + TypeScript |
| Styling | **Tailwind CSS v4** + **shadcn/ui** (Radix primitives) + Motion (Framer Motion) |
| Maps | **Leaflet + React-Leaflet** + OpenStreetMap tiles + **OSRM** road routing (no API keys) |
| Database | **Supabase** — Postgres + **PostGIS** + Auth + Edge-function-ready RPCs |
| Monorepo | **Turborepo** (npm workspaces) |
| Mobile | Expo/React Native (scaffold) sharing the same API |
| Hosting | **Vercel** (web) + Supabase Cloud (database) |
| i18n | English + हिन्दी, in-app language toggle |
| Theme | Light (cream) + Dark (navy) with a warm orange accent |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js 15 (apps/web)                 │
│                                                              │
│  Public pages   Role dashboards    Maps (Leaflet/OSRM)       │
│  Auth (Supabase)  Chat & Call      Booking lifecycle UI      │
│            │                                │                │
└────────────┼────────────────────────────────┼────────────────┘
             │ API routes (server-side)       │ RLS-scoped writes
             ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (Supabase Cloud)                 │
│  Postgres + PostGIS  ──  Auth (email/password)              │
│  RPCs: match_workers (ST_DWithin), submit_worker_onboarding,│
│        list_pending_workers, approve_worker, delete account │
│  Row Level Security on every table                          │
└─────────────────────────────────────────────────────────────┘
```

### Monorepo layout

```
fieldwork-trust/
├─ apps/
│  └─ web/                 # Next.js 15 web app (the product)
│     └─ src/
│        ├─ app/           # App Router pages + API routes + middleware
│        ├─ components/    # UI components (+ ui/ = shadcn primitives)
│        ├─ context/       # Auth, Theme, Language providers
│        ├─ data/          # Demo-mode mock data
│        ├─ lib/           # i18n, chat store, OSRM, promise copy, utils
│        └─ services/      # geolocation etc.
├─ apps/mobile/            # Expo scaffold (shares the same API)
├─ packages/
│  ├─ shared-types/        # Canonical domain + DB types
│  └─ shared-lib/          # Supabase client factory + services
└─ supabase/
   ├─ migrations/          # 4 ordered migrations: schema → account-delete → core functions → bulk orders/overtime
   ├─ seed.sql             # Demo data (real users, real bookings)
   └─ one-shot-setup.sql   # 👈 All migrations + seed in one file (no Docker)
```

### Database schema

| Table | Purpose |
|---|---|
| `federations` | Regional federations of cooperative societies |
| `societies` | Local societies (worker co-ops) with service-area polygons |
| `profiles` | 1:1 with `auth.users` — role (customer / worker / society_admin / federation_admin), name, phone |
| `worker_profiles` | Worker extension — home location, service radius, insurance badge, verified flag |
| `worker_skills` | Worker ↔ service-type tags |
| `bookings` | Full lifecycle with a **DB-level EXCLUDE constraint** preventing double-booking overlap |
| `ratings` | 1–5 stars + comment, tied to completed bookings |
| `invoices` | Payment split (worker share / society welfare / platform fee) |
| `bulk_orders` | Institution/organisation bulk requests (org books N verified workers) with an open → allocating → fulfilled status |

Geo indexes (PostGIS GIST) power nearest-worker matching, demand maps and overlap checks.

---

## Getting Started

### 1. Run locally (demo mode, zero setup)

```bash
cd fieldwork-trust
npm install --legacy-peer-deps

cd apps/web
npx next dev --turbopack -p 3000
```

Without env keys the app runs in **demo mode** with rich mock data — ideal for a quick look.

### 2. Go live with Supabase (no Docker needed 🤝)

Your Docker doesn't work on Windows LTSC — good news: **Coopworks runs on Supabase Cloud and never needs a local container.**

1. Create a free project at [supabase.com](https://supabase.com) (region: **Mumbai** `ap-south-1` — PostGIS is pre-enabled).
2. Open **SQL Editor** → paste the contents of `supabase/one-shot-setup.sql` → **Run**.
   - Creates all tables, enums, indexes, **Row Level Security**, core RPC functions, and seed demo data — in one shot.
3. Dashboard → **Project Settings → API** → copy the **Project URL** and **anon key**:

```bash
cd apps/web
# add to .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

4. Restart the dev server — the app auto-detects the keys and switches to **live mode** (middleware-protected routes, real auth, real PostGIS matching). The demo-persona switcher disappears automatically.

### Demo accounts (seeded — real users with real data)

| Role | Email | Password |
|---|---|---|
| Customer | `customer@coopworks.demo` | `Fieldwork@2025` |
| Worker | `worker@coopworks.demo` | `Fieldwork@2025` |
| Society Admin | `societyadmin@coopworks.demo` | `Fieldwork@2025` |
| Federation Admin | `federationadmin@coopworks.demo` | `Fieldwork@2025` |

> Demo users are **real Supabase users with real rows**, so judges see a live product — no demo buttons anywhere on screen.

### 3. Deploy to Vercel

1. Push this repo to GitHub.
2. Vercel → **Add New Project** → import the repo.
3. Framework: **Next.js**, root directory: `apps/web`.
4. Add both env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
5. In Supabase → **Authentication → URL Configuration**, set the Site URL to your Vercel URL (+ `http://localhost:3000` for dev).

---

## Live-mode wiring map

| App flow | API route | Database |
|---|---|---|
| Marketplace search map | `POST /api/match-workers` | `match_workers` (PostGIS `ST_DWithin`) |
| Worker application | `POST /api/worker/onboarding` | `submit_worker_onboarding` |
| Admin verification queue | `GET /api/admin/workers` | `list_pending_workers` |
| Approve / reject applicant | `POST /api/admin/workers` | `approve_worker` |
| Booking lifecycle | `POST /api/create-booking` · `accept-booking` · `complete-booking` | RLS-scoped writes |
| Ratings | `POST /api/submit-rating` | `ratings` table |
| Account deletion | `POST /api/auth/delete-account` | `delete_own_account` RPC |

Without env keys every route returns a safe mock response instead of crashing — so the app is always demoable.

---

## Hacking & Style

- **Design system**: Nomu-inspired — cream `#FFF9F6` / navy `#0F151D` core, orange `#FF7448` accent, dark surfaces `#1B232E`. Tokens live in `apps/web/src/app/globals.css` and are consumed via shadcn utilities (`bg-card`, `text-foreground`…).
- **i18n**: add a key to `apps/web/src/lib/i18n.ts` (EN + हिन्दी) and reference it via `t('key')`.
- **Copy**: worker-owned co-op voice — open pricing, peer verification, one member one vote. No self-deprecating "demo/prototype" wording on any public page.

## Status

Built for the **SIH prototype milestone**: the full spine (auth → worker profiles → geo-matching → booking lifecycle → ratings/invoices → role dashboards) is real and demoable, with live Supabase connectivity ready to switch on with the two env keys. Payments/insurance integrations are intentionally simulated (static invoice + "enrolled" badge) per the PRD's "high-friction = simulated" rule — and stated as such in the pitch.

---

**Coopworks — a worker-owned cooperative platform for verified trades.**