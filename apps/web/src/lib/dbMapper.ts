import { WorkerProfile, WorkerApplicant, LatLng, Booking } from '../types';

/** Supabase match_workers() result row (see supabase/migrations/20260904000002_core_functions.sql). */
export interface MatchWorkerRow {
  id: string;
  name: string;
  role_title?: string | null;
  society_name?: string | null;
  distance_m?: number | null;
  lat?: number | null;
  lng?: number | null;
  rating?: number | null;
  completed_jobs?: number | null;
  skills?: string[] | null;
  available?: boolean | null;
}

/** Supabase list_pending_workers() result row. */
export interface PendingWorkerRow {
  id: string;
  name: string;
  email?: string | null;
  society_id?: string | null;
  society_name?: string | null;
  services?: string[] | null;
  radius_m?: number | null;
  aadhaar_last4?: string | null;
  geo_verified?: boolean | null;
  created_at?: string | null;
}

/** Fixed 10-service enum → friendly labels the UI already uses. */
export function humanizeServiceType(type: string): string {
  const t = (type || '').toLowerCase();
  const map: Record<string, string> = {
    electrician: 'Licensed Electrician',
    plumber: 'Master Plumber & HVAC',
    carpenter: 'Master Carpenter',
    painter: 'Certified Painter',
    domestic_helper: 'Domestic Helper',
    caregiver: 'Caregiver',
    driver: 'Driver',
    gardener: 'Gardener',
    cleaner: 'Deep Cleaner',
    technician: 'Technician',
  };
  return map[t] ?? type;
}

/** Friendly label (from the registration form) → fixed service_type enum value. */
export function serviceTypeFromLabel(label: string): string {
  const l = (label || '').toLowerCase();
  if (l.includes('electric')) return 'electrician';
  if (l.includes('plumb')) return 'plumber';
  if (l.includes('hvac')) return 'technician';
  if (l.includes('carpent')) return 'carpenter';
  if (l.includes('paint')) return 'painter';
  if (l.includes('weld')) return 'technician';
  if (l.includes('mason')) return 'technician';
  if (l.includes('equipment') || l.includes('operat')) return 'driver';
  if (l.includes('helper') || l.includes('domestic')) return 'domestic_helper';
  if (l.includes('care')) return 'caregiver';
  if (l.includes('garden')) return 'gardener';
  if (l.includes('clean')) return 'cleaner';
  return 'technician';
}

const SERVICE_ICONS: Record<string, string> = {
  electrician: 'bolt',
  plumber: 'plumbing',
  carpenter: 'build',
  painter: 'format_paint',
  domestic_helper: 'home_work',
  caregiver: 'favorite',
  driver: 'local_shipping',
  gardener: 'yard',
  cleaner: 'cleaning_services',
  technician: 'build',
};

function serviceIcon(type: string): string {
  return SERVICE_ICONS[(type || '').toLowerCase()] ?? 'build';
}

const AVATAR_COLORS = ['#FF7448', '#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#0EA5E9'];

/** Self-contained initials avatar (data URI — no external image dependency). */
export function initialsAvatar(name: string, size = 96): string {
  const clean = (name || '?').trim();
  const initial = clean.charAt(0).toUpperCase() || '?';
  let hash = 0;
  for (let i = 0; i < clean.length; i++) hash = (hash * 31 + clean.charCodeAt(i)) | 0;
  const color = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<rect width="100%" height="100%" fill="${color}"/>` +
    `<text x="50%" y="54%" fill="#ffffff" font-family="Arial, sans-serif" font-size="${Math.round(size * 0.5)}" ` +
    `font-weight="bold" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function metersToDisplay(row: MatchWorkerRow): { distanceMiles: number; driveTimeMin: number } {
  const miles = Math.max(0.1, Math.round(((row.distance_m ?? 1000) * 0.000621371) * 10) / 10);
  return { distanceMiles: miles, driveTimeMin: Math.max(1, Math.ceil(miles * 2.5)) };
}

/** match_workers() row → the marketplace card/map WorkerProfile shape. */
export function mapMatchRowToWorker(row: MatchWorkerRow): WorkerProfile {
  const { distanceMiles, driveTimeMin } = metersToDisplay(row);
  const skills: string[] = Array.isArray(row.skills) && row.skills.length ? row.skills : [];
  const primary = skills[0] ?? row.role_title ?? 'technician';
  const coords: LatLng = { lat: row.lat ?? 0, lng: row.lng ?? 0 };

  return {
    id: row.id,
    name: row.name ?? 'Co-op Member',
    avatar: initialsAvatar(row.name ?? 'FT'),
    roleTitle: humanizeServiceType(primary),
    societyAffiliation: row.society_name || 'Cooperative Society',
    guildNumber: '',
    rating: Number(row.rating ?? 0) || 0,
    reviewCount: Number(row.completed_jobs ?? 0),
    completedJobsCount: Number(row.completed_jobs ?? 0),
    distanceMiles,
    driveTimeMin,
    verified: true,
    insuranceStatus: 'Enrolled',
    responseTime: '< 1 Hour',
    hourlyRateConsultation: 50,
    hourlyRateLabor: 90,
    skills: skills.length
      ? skills.map((s) => ({ name: humanizeServiceType(s), icon: serviceIcon(s) }))
      : [{ name: humanizeServiceType(primary), icon: serviceIcon(primary) }],
    bio: `Verified cooperative member of ${row.society_name || 'the federation'} — background-checked and peer-accredited.`,
    recentProjects: [],
    mapCoordinates: { xPercent: 50, yPercent: 50 },
    coordinates: coords,
  };
}

/** Supabase bookings row (a signed-in customer's own rows, from GET /api/bookings). */
export interface BookingRow {
  id: string;
  worker_id?: string | null;
  service_type?: string | null;
  status?: string | null;
  is_emergency?: boolean | null;
  scheduled_at?: string | null;
  scheduled_end_at?: string | null;
  overtime_hours?: number | null;
  cancelled_by?: string | null;
  created_at?: string | null;
  invoices?: { amount?: number | null; status?: string | null }[] | null;
}

const CATEGORY_FROM_SERVICE: Record<string, Booking['serviceCategory']> = {
  electrician: 'Electrical',
  plumber: 'Plumbing',
  carpenter: 'Carpentry',
  painter: 'Painting',
  domestic_helper: 'Delivery',
  caregiver: 'Inspection',
  driver: 'Delivery',
  gardener: 'Inspection',
  cleaner: 'Inspection',
  technician: 'HVAC'
};

function formatBookingTime(d: Date): string {
  const now = new Date();
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return `Today, ${time}`;
  return (
    d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) +
    `, ${time}`
  );
}

/** bookings row → the app's Booking shape (worker identity hidden by RLS). */
export function mapBookingRowToBooking(row: BookingRow): Booking {
  const service = (row.service_type ?? 'technician').toLowerCase();
  const title = humanizeServiceType(service);
  const invoice = Array.isArray(row.invoices) ? row.invoices[0] : null;
  const start = row.scheduled_at ? new Date(row.scheduled_at) : null;
  const end = row.scheduled_end_at ? new Date(row.scheduled_end_at) : null;
  const hours =
    start && end && end.getTime() > start.getTime()
      ? Math.max(1, Math.round(((end.getTime() - start.getTime()) / 3600000) * 10) / 10)
      : 2;
  const cost =
    invoice && invoice.amount != null
      ? `₹${invoice.amount.toLocaleString('en-IN')}`
      : 'Price on completion';

  // Worker identity is hidden from customers by RLS (customer sees the service
  // title). The booking row itself only carries `worker_id`, not a worker name
  // or avatar. The app resolves these AFTER load in App.tsx for the signed-in
  // worker's own bookings; for customers the worker_name field stays empty and
  // the service title is the safe display. avatar stays empty here and is filled
  // by the same post-load resolution so the tracker/contact card shows the real
  // worker picture (not an initials fallback) when the real worker is logged in.
  return {
    id: row.id,
    referenceNumber: `#CWS-${row.id.slice(0, 6).toUpperCase()}`,
    serviceTitle: title,
    serviceCategory: CATEGORY_FROM_SERVICE[service] ?? 'HVAC',
    serviceMode: 'labor',
    workerId: row.worker_id ?? '',
    workerName: '',
    workerAvatar: '',
    workerRating: 0,
    workerJobsCount: 0,
    status: (row.status as Booking['status']) ?? 'requested',
    isEmergency: !!row.is_emergency,
    scheduledTime: start ? formatBookingTime(start) : 'Scheduled',
    address: 'Live GPS location',
    estimatedCostRange: cost,
    clientName: 'You',
    durationHours: hours,
    baseRatePerHour: 250,
    overtimeHours: row.overtime_hours ?? 0,
    societyDividendPercent: 15,
    platformFeePercent: 2.5,
    createdAt: row.created_at ? new Date(row.created_at).toLocaleDateString() : '',
    cancelled_by: (row.cancelled_by as 'customer' | 'worker') ?? undefined
  };
}

function initialsOf(name: string): string {
  return (name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

/** list_pending_workers() row → the approvals-queue WorkerApplicant shape. */
export function mapPendingWorkerToApplicant(row: PendingWorkerRow): WorkerApplicant {
  const services: string[] = Array.isArray(row.services) && row.services.length ? row.services : [];
  const created = row.created_at ? new Date(row.created_at) : null;
  const appliedDate = created
    ? created.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    : 'Recently';

  return {
    id: row.id,
    name: row.name ?? 'Applicant',
    email: row.email ?? '',
    initials: initialsOf(row.name ?? ''),
    primarySkill: humanizeServiceType(services[0] ?? 'technician'),
    appliedDate,
    society: row.society_name || 'Unassigned society',
    status: 'review',
    experienceYears: 0,
    aadhaarLast4: row.aadhaar_last4 || undefined,
    aadhaarVerified: !!row.aadhaar_last4,
    documents: undefined,
    geoVerified: !!row.geo_verified,
  };
}
