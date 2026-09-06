/**
 * shared-types — canonical domain + database types for the Cooperative Gig Platform.
 *
 * Source of truth: supabase/migrations/20260903000000_init.sql.
 * Consumed by the web app, shared-lib, and (later) mobile + Edge Functions.
 * Must stay framework-agnostic — no React, Next, or Supabase client imports.
 */

// Supabase-generated Database type (typegen from the live schema) — powers
// typed queries on the live path (shared-lib factories, API routes).
export type * from './database';

// ---------------------------------------------------------------------------
// Enums (mirror the Postgres enums in the migration)
// ---------------------------------------------------------------------------

export const USER_ROLES = ['customer', 'worker', 'society_admin', 'federation_admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const SERVICE_TYPES = [
  'electrician',
  'plumber',
  'carpenter',
  'painter',
  'domestic_helper',
  'caregiver',
  'driver',
  'gardener',
  'cleaner',
  'technician'
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const BOOKING_STATUSES = [
  'requested',
  'accepted',
  'in_progress',
  'completed',
  'cancelled'
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const CANCELLED_BY_ROLES = ['customer', 'worker'] as const;
export type CancelledByRole = (typeof CANCELLED_BY_ROLES)[number];

export const INVOICE_STATUSES = ['unpaid', 'paid'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

// ---------------------------------------------------------------------------
// Tables (row shapes from the migration)
// ---------------------------------------------------------------------------

/** Geometry columns are returned by PostgREST as EWKB hex strings. */
export type GeoJsonPoint = { type: 'Point'; coordinates: [number, number] };
export type Geometry = string | GeoJsonPoint;

export interface FederationRow {
  id: string;
  name: string;
  created_at: string;
}

export interface SocietyRow {
  id: string;
  federation_id: string;
  name: string;
  service_area: Geometry | null;
  created_at: string;
}

/** profiles — 1:1 with auth.users */
export interface ProfileRow {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  society_id: string | null;
  federation_id: string | null;
  created_at: string;
}

/** worker_profiles — 1:1 extension of profiles (role = 'worker' only) */
export interface WorkerProfileRow {
  profile_id: string;
  home_location: Geometry;
  service_area_radius_m: number;
  insurance_status: string;
  verified: boolean;
  available: boolean;
  created_at: string;
}

export interface WorkerSkillRow {
  worker_id: string;
  service_type: ServiceType;
}

export interface BookingRow {
  id: string;
  customer_id: string;
  worker_id: string | null;
  service_type: ServiceType;
  status: BookingStatus;
  is_emergency: boolean;
  location: Geometry;
  scheduled_at: string;
  scheduled_end_at: string;
  cancelled_by: CancelledByRole | null;
  created_at: string;
  updated_at: string;
}

export interface RatingRow {
  booking_id: string;
  stars: number;
  comment: string | null;
  created_at: string;
}

export interface InvoiceRow {
  booking_id: string;
  amount: number;
  status: InvoiceStatus;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Auth / session (shared between demo mode and live Supabase auth)
// ---------------------------------------------------------------------------

export interface SessionUser {
  id: string;
  role: UserRole;
  name: string;
  /** phone (live auth) or phone-less demo marker */
  phone?: string;
  societyId?: string | null;
  federationId?: string | null;
}

export interface AuthSession {
  /** 'demo' = simulated persona (no Supabase project configured); 'live' = real Supabase session */
  mode: 'demo' | 'live';
  user: SessionUser;
}

// ---------------------------------------------------------------------------
// Payload types for booking lifecycle API routes
// ---------------------------------------------------------------------------

export interface MatchWorkerInput {
  lat: number;
  lng: number;
  service_type: ServiceType;
}

export interface CreateBookingInput {
  worker_id: string | null; // null = auto-match
  service_type: ServiceType;
  is_emergency: boolean;
  location: { lat: number; lng: number };
  scheduled_at: string;
  scheduled_end_at: string;
}

/** One step of the enforced booking state machine (see Phase 4). */
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  requested: ['accepted', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: []
};
