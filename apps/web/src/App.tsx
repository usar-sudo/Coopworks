import { personPhoto } from './lib/portraits';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  UserRole,
  WorkerProfile,
  Booking,
  WorkerApplicant,
  ActivityFeedItem,
  GovernanceRule,
  LatLng,
  BulkOrder
} from './types';
import { createClient } from './utils/supabase/client';
import { AuthUI } from './components/Auth';
import {
  INITIAL_WORKERS,
  INITIAL_BOOKINGS,
  INITIAL_SOCIETIES,
  INITIAL_APPLICANTS,
  INITIAL_ACTIVITY,
  GOVERNANCE_RULES,
  INITIAL_BULK_ORDERS
} from './data/mockData';
import {
  getCurrentPosition,
  reverseGeocodeLatLng,
  updateWorkersWithNewUserLocation
} from './services/geolocationService';

import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { LandingPage } from './components/LandingPage';
import { CustomerHome } from './components/CustomerHome';
import { MarketplaceSearch } from './components/MarketplaceSearch';
import { WorkerProfileView } from './components/WorkerProfile';
import { BookingTracker } from './components/BookingTracker';
import { WorkerDashboard } from './components/WorkerDashboard';
import { FederationDashboard } from './components/FederationDashboard';
import { SocietyAdminDashboard } from './components/SocietyAdminDashboard';
import { PendingApprovals } from './components/PendingApprovals';
import { EmergencyAlertModal } from './components/EmergencyAlertModal';
import { NewBookingModal } from './components/NewBookingModal';
import { ReviewModal } from './components/ReviewModal';
import { PayoutDetailModal } from './components/PayoutDetailModal';
import { WorkerRegistration, RegisterMode } from './components/WorkerRegistration';
import { BulkOrderModal } from './components/BulkOrderModal';
import { ProfileView } from './components/ProfileView';
import { LoginView } from './components/LoginView';
import { LocalResourceLocator } from './components/LocalResourceLocator';
import { Footer } from './components/Footer';
import {
  MatchWorkerRow,
  PendingWorkerRow,
  mapMatchRowToWorker,
  mapPendingWorkerToApplicant,
  mapBookingRowToBooking,
  serviceTypeFromLabel
} from './lib/dbMapper';

// Role-to-allowed-views mapping. The landing/ad page is NOT part of any signed
// in role — it only exists for logged-out visitors. Each role sees only its own
// workspace pages.
const ROLE_ALLOWED_VIEWS: Record<UserRole, string[]> = {
  customer: ['customer_home', 'marketplace', 'worker_profile', 'tracker', 'profile'],
  worker: ['worker_roster', 'tracker', 'worker_profile', 'profile'],
  society_admin: ['federation', 'society_admin', 'approvals', 'profile'],
  federation_admin: ['federation', 'society_admin', 'approvals', 'profile']
};

const ROLE_DEFAULT_VIEW: Record<UserRole, string> = {
  customer: 'customer_home',
  worker: 'worker_roster',
  society_admin: 'federation',
  federation_admin: 'federation'
};

// Demo-mode booking scoping — every demo login sees ONLY their own data:
// a worker sees the jobs assigned to them, a customer sees the orders they
// placed, and admins keep the aggregate roster (their dashboards are
// society/federation-wide by design). Previously every login saw the same
// global seed, so a worker logged in as Vikram Joshi would see Rahul Patil's
// jobs on their dashboard.
const scopeDemoBookings = (role: UserRole, name: string): Booking[] => {
  if (role === 'worker') {
    return INITIAL_BOOKINGS.filter((b) => b.workerName === name);
  }
  if (role === 'customer') {
    return INITIAL_BOOKINGS.filter((b) => b.clientName === name);
  }
  return INITIAL_BOOKINGS;
};

export default function App() {
  // Live mode = real Supabase project configured. Demo mode = open prototype.
  const isLiveMode = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Memoized so auth effects subscribe once. (A fresh client per render used to
  // re-run getSession + profile fetch on every render, which could leave the
  // role/view in a stale customer state after a worker login.)
  const supabase = useMemo(() => (isLiveMode ? createClient() : null), [isLiveMode]);
  const [session, setSession] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  // Restored from the persisted demo session so a refresh keeps the signed-in
  // persona's own name everywhere (dashboard greeting, profile, navbar).
  const [userDisplayName, setUserDisplayName] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      const raw = localStorage.getItem('cw_demo_session');
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && parsed.name ? parsed.name : '';
    } catch {
      return '';
    }
  });
  // Live mode: true once the real role has been resolved from the profiles
  // table (or the fallback) so a worker never flashes the customer home.
  const [roleReady, setRoleReady] = useState(false);

  // Navigation & Role State. The signed-in role lives in a demo session so a
  // refresh keeps you logged in; logged-out visitors only ever see the landing
  // ad page and the login screen.
  const [demoUser, setDemoUser] = useState<{ role: UserRole; name: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('cw_demo_session');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && parsed.role && parsed.name ? parsed : null;
    } catch {
      return null;
    }
  });
  const [userRole, setUserRole] = useState<UserRole>(() => {
    if (typeof window === 'undefined') return 'customer';
    try {
      const raw = localStorage.getItem('cw_demo_session');
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && parsed.role ? parsed.role : 'customer';
    } catch {
      return 'customer';
    }
  });
  const [currentView, setCurrentView] = useState<string>('landing');

  // Signed in = real Supabase session (live) or a demo persona session.
  const isLoggedIn = isLiveMode ? !!session : !!demoUser;

  // Real Geolocation State (defaults to New Delhi for the demo)
  const [userLocation, setUserLocation] = useState<LatLng>({ lat: 28.6139, lng: 77.209 });
  const [userAddress, setUserAddress] = useState<string>('Connaught Place, New Delhi, Delhi');
  // Compact region label ("area, city") resolved from the live coordinates, so
  // maps show the user's actual district/region instead of a hardcoded hub.
  const [userRegion, setUserRegion] = useState<string>('Connaught Place, New Delhi');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  // Persist / clear the demo session so refresh keeps the signed-in persona.
  useEffect(() => {
    try {
      if (demoUser) {
        localStorage.setItem('cw_demo_session', JSON.stringify(demoUser));
      } else if (!isLiveMode) {
        localStorage.removeItem('cw_demo_session');
      }
    } catch {
      /* storage unavailable */
    }
  }, [demoUser, isLiveMode]);

  // Demo-mode role isolation: scope bookings (and the active booking) to the
  // signed-in persona on login AND on refresh-restore, so every page shows the
  // same person's data.
  useEffect(() => {
    if (isLiveMode || !demoUser) return;
    const scoped = scopeDemoBookings(demoUser.role, demoUser.name);
    setBookings(scoped);
    setActiveBooking((prev) =>
      prev && scoped.some((b) => b.id === prev.id) ? prev : (scoped[0] ?? null)
    );
  }, [isLiveMode, demoUser]);

  // Live-mode one-shot guards (per-location match, per-session queue load).
  const matchedLocationRef = useRef('');

  // Application Data States
  const [workers, setWorkers] = useState<WorkerProfile[]>(INITIAL_WORKERS);
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile>(INITIAL_WORKERS[0]);
  // Live mode starts EMPTY — real bookings arrive from the database via
  // /api/bookings. Demo mode keeps the mock roster so the prototype is
  // explorable without a backend. (Previously the mock INITIAL_BOOKINGS were
  // shown in live mode whenever the DB fetch failed, which is why a fake
  // "default booking" kept appearing no matter how often the DB was cleaned.)
  const [bookings, setBookings] = useState<Booking[]>(isLiveMode ? [] : INITIAL_BOOKINGS);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(
    isLiveMode ? null : INITIAL_BOOKINGS[0]
  );
  // In live mode the queue comes from the database (real applicant rows only).
  const [applicants, setApplicants] = useState<WorkerApplicant[]>(isLiveMode ? [] : INITIAL_APPLICANTS);
  const [societies] = useState(INITIAL_SOCIETIES);
  const [activity, setActivity] = useState<ActivityFeedItem[]>(INITIAL_ACTIVITY);
  const [rules, setRules] = useState<GovernanceRule[]>(GOVERNANCE_RULES);
  // Institution bulk orders — organisations book several workers at once.
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>(INITIAL_BULK_ORDERS);
  const [showBulkOrderModal, setShowBulkOrderModal] = useState(false);

  // Modal Control States
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [bookingWorkerContext, setBookingWorkerContext] = useState<WorkerProfile | null>(null);
  const [bookingInitialMode, setBookingInitialMode] = useState<'consultation' | 'labor'>('labor');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewBookingContext, setReviewBookingContext] = useState<Booking | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutBookingContext, setPayoutBookingContext] = useState<Booking | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationMode, setRegistrationMode] = useState<RegisterMode>('customer');
  const [showResourceLocator, setShowResourceLocator] = useState(false);
  const [showNewProposalModal, setShowNewProposalModal] = useState(false);
  const [newProposalTitle, setNewProposalTitle] = useState('');
  const [newProposalDesc, setNewProposalDesc] = useState('');

  // Toast Notification State
  const [toast, setToast] = useState<{
    message: string;
    type?: 'success' | 'urgent' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'urgent' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Acquire User GPS Geolocation
  const handleAcquireLocation = useCallback(async () => {
    setIsLocating(true);
    try {
      const position = await getCurrentPosition();
      setUserLocation(position);

      // Recalculate worker distances dynamically
      setWorkers((prev) => updateWorkersWithNewUserLocation(prev, position));

      // Reverse geocode to a human-friendly address + compact region label
      const reverseResult = await reverseGeocodeLatLng(position.lat, position.lng);
      if (reverseResult.formattedAddress) {
        setUserAddress(reverseResult.formattedAddress);
      }
      if (reverseResult.region) {
        setUserRegion(reverseResult.region);
        showToast(`📍 Location synchronized: ${reverseResult.region}`, 'success');
      } else {
        showToast(
          `📍 GPS coordinates locked: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`,
          'info'
        );
      }
    } catch (err: any) {
      console.warn('Geolocation acquisition skipped or denied:', err);
      showToast('Using default cooperative regional hub coordinates.', 'info');
    } finally {
      setIsLocating(false);
    }
  }, []);

  // Initial Geolocation acquisition on mount
  useEffect(() => {
    handleAcquireLocation();
  }, [handleAcquireLocation]);

  // Supabase Auth session: initial load + subscribe (live mode only).
  useEffect(() => {
    if (!supabase) {
      // Demo mode — no auth wall.
      setIsAuthLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_OUT') {
        try {
          localStorage.removeItem('cw_demo_session');
        } catch {
          /* storage unavailable */
        }
        setRoleReady(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Live-mode role resolution: whenever a real session appears (initial load,
  // fresh sign-in via the auth card, or token refresh) fetch the caller's row
  // from the profiles table and open that role's default workspace. A stale
  // demo persona in localStorage used to shadow this and made worker logins
  // render the customer site, so the demo session is cleared first. If the
  // direct query fails (e.g. older schema without a column), fall back to the
  // server-side /api/auth/me resolver.
  useEffect(() => {
    if (!isLiveMode || !session?.user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        localStorage.removeItem('cw_demo_session');
      } catch {
        /* storage unavailable */
      }

      let role: string | null = null;
      let name: string | null = null;

      const { data: profile, error: profileError } = await supabase!
        .from('profiles')
        .select('role, name')
        .eq('id', session.user.id)
        .maybeSingle();
      if (profileError) {
        console.warn('Profile fetch failed:', profileError.message);
      }
      if (profile) {
        role = profile.role;
        name = profile.name;
      }

      if (!role) {
        // Fallback: server-side resolver (same RLS scope, resilient to
        // client-side query/column issues).
        try {
          const res = await fetch('/api/auth/me', { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            role = data?.session?.user?.role ?? null;
            name = data?.session?.user?.name ?? null;
          }
        } catch (err) {
          console.warn('Server-side role fallback failed:', err);
        }
      }

      if (cancelled) return;
      if (role && role in ROLE_ALLOWED_VIEWS) {
        setUserRole(role as UserRole);
        setCurrentView(ROLE_DEFAULT_VIEW[role as UserRole]);
      } else {
        console.warn('No role resolved for user', session.user.id);
      }
      setUserDisplayName(name || session.user.email || '');
      setRoleReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isLiveMode, session, supabase]);

  // Live mode: load the signed-in user's REAL bookings from the database
  // (persisted by /api/create-booking + /api/complete-booking) so a re-login
  // shows actual data instead of the demo seed. Customers get the bookings
  // they placed; workers get the bookings assigned to them. Admins keep the
  // demo roster so their dashboards stay populated.
  //
  // Worker name resolution: the bookings API returns booking rows WITHOUT a
  // worker name (RLS keeps worker identity hidden from customers). For a WORKER
  // viewing their own bookings, we resolve each booking's worker display name
  // from the already-loaded marketplace workers list (suuid match). For a
  // CUSTOMER, the name stays empty and the booking renders the service title,
  // which is what RLS allows a customer to see.
  // For a WORKER viewing their own bookings, resolve the booked worker's
  // display name + avatar from the already-loaded marketplace workers list.
  // (RLS hides worker identity from customers, so there the name stays the
  // service title and the avatar stays empty — no real worker picture exposed.)
  const resolveBookingWorker = useCallback((booking: Booking, allWorkers: WorkerProfile[]): Booking => {
    if (booking.workerId && userRole === 'worker') {
      const w = allWorkers.find((x) => x.id === booking.workerId);
      if (w) {
        return { ...booking, workerName: w.name, workerAvatar: w.avatar };
      }
    }
    return booking;
  }, [userRole]);

  useEffect(() => {
    if (
      !isLiveMode ||
      !session?.user?.id ||
      (userRole !== 'customer' && userRole !== 'worker')
    )
      return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/bookings', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.bookings)) {
          let loaded = data.bookings.map(mapBookingRowToBooking);
          // Resolve worker names + avatars for the signed-in worker's own
          // bookings (customer's bookings keep the service title as display).
          if (userRole === 'worker' && loaded.length) {
            loaded = loaded.map((b) => resolveBookingWorker(b, workers));
          }
          setBookings(loaded);
        }
      } catch (err) {
        console.warn('Failed to load bookings from database:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLiveMode, session, userRole]);

  // Live mode: load the society's real pending-worker queue into Approvals.
  useEffect(() => {
    if (!isLiveMode || !session || (userRole !== 'society_admin' && userRole !== 'federation_admin')) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/workers');
        if (!res.ok) return;
        const { workers } = await res.json();
        if (cancelled || !Array.isArray(workers) || !workers.length) return;
        setApplicants((prev) => {
          const existing = new Set(prev.map((a) => a.id));
          const fresh = (workers as PendingWorkerRow[])
            .map(mapPendingWorkerToApplicant)
            .filter((a) => !existing.has(a.id));
          return fresh.length ? [...fresh, ...prev] : prev;
        });
      } catch (err) {
        console.warn('Failed to load pending workers:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLiveMode, session, userRole]);

  // Live mode: customer marketplace results come from PostGIS matching
  // (verified + available workers within service radius, nearest first).
  useEffect(() => {
    if (!isLiveMode || !session || userRole !== 'customer') return;
    const key = `${userLocation.lat.toFixed(4)},${userLocation.lng.toFixed(4)}`;
    if (matchedLocationRef.current === key) return;
    matchedLocationRef.current = key;
    (async () => {
      try {
        const res = await fetch('/api/match-workers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: userLocation.lat, lng: userLocation.lng }),
        });
        if (!res.ok) return;
        const { workers } = await res.json();
        if (Array.isArray(workers) && workers.length) {
          setWorkers((workers as MatchWorkerRow[]).map(mapMatchRowToWorker));
        }
      } catch (err) {
        console.warn('Live worker match failed:', err);
      }
    })();
  }, [isLiveMode, session, userRole, userLocation]);

  // Log out of a demo persona or a real Supabase session. Logged-out users land
  // back on the marketing page.
  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setDemoUser(null);
    setUserRole('customer');
    setUserDisplayName('');
    setCurrentView('landing');
    showToast('Signed out. See you soon!', 'info');
  };

  // Permanently delete the account (demo mode just ends the persona session;
  // live mode calls the delete_own_account RPC server-side).
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Delete your account and all associated data permanently? This cannot be undone.'
    );
    if (!confirmed) return;
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        window.alert(body.error || 'Account could not be deleted.');
        return;
      }
      setSession(null);
      setDemoUser(null);
      setUserRole('customer');
      setUserDisplayName('');
      setCurrentView('landing');
      if (supabase) await supabase.auth.signOut();
      showToast('Your account and data have been deleted.', 'info');
    } catch (err) {
      console.warn('Delete account failed:', err);
      window.alert('Account could not be deleted.');
    }
  };

  // Open the register modal on a specific account track (customer | worker).
  const openRegistration = (mode: RegisterMode = 'customer') => {
    setRegistrationMode(mode);
    setShowRegistrationModal(true);
  };

  // Public customer signup — creates the account and opens the marketplace.
  const handleRegisterCustomer = (data: {
    name: string;
    phone: string;
    email?: string;
    area?: string;
  }) => {
    setDemoUser({ role: 'customer', name: data.name });
    setUserRole('customer');
    setUserDisplayName(data.name);
    setCurrentView('marketplace');
    try {
      localStorage.setItem(
        'cw_demo_session',
        JSON.stringify({ role: 'customer', name: data.name })
      );
    } catch {
      /* storage unavailable */
    }
    showToast(`Welcome to Coopworks, ${data.name}! Your customer account is ready.`, 'success');
  };

  // Role-based demo login — selects the persona and opens that role's default
  // workspace (the marketing/ad page is no longer reachable once signed in).
  const handleDemoLogin = (role: UserRole, name: string) => {
    setDemoUser({ role, name });
    setUserRole(role);
    setUserDisplayName(name);
    setCurrentView(ROLE_DEFAULT_VIEW[role]);
    const roleLabel =
      role === 'customer'
        ? 'Customer'
        : role === 'worker'
          ? 'Worker'
          : role === 'society_admin'
            ? 'Society Admin'
            : 'Federation Admin';
    showToast(`Signed in as ${name} (${roleLabel}).`, 'success');
  };

  // Safe view navigation that validates permissions.
  const handleNavigate = (targetView: string) => {
    // Signed-in users never see the marketing/ad page — home means their workspace.
    const effective =
      targetView === 'landing' && isLoggedIn ? ROLE_DEFAULT_VIEW[userRole] : targetView;

    if (!isLoggedIn) {
      if (effective === 'landing' || effective === 'login') {
        setCurrentView(effective);
        return;
      }
      setCurrentView('login');
      showToast('Please log in to open that workspace.', 'info');
      return;
    }

    const allowed = ROLE_ALLOWED_VIEWS[userRole];
    if (allowed.includes(effective)) {
      setCurrentView(effective);
      return;
    }
    showToast(
      `Access Restricted: This page requires ${
        effective.includes('admin') || effective === 'approvals'
          ? 'Admin'
          : effective === 'worker_roster'
            ? 'Worker'
            : 'Customer'
      } credentials.`,
      'urgent'
    );
  };

  // Handler: Advance Booking Status
  const handleAdvanceStatus = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        let nextStatus = b.status;
        if (b.status === 'requested' || b.status === 'accepted') nextStatus = 'en_route';
        else if (b.status === 'en_route') nextStatus = 'in_progress';
        else if (b.status === 'in_progress') nextStatus = 'completed';

        const updated = { ...b, status: nextStatus };
        if (activeBooking?.id === bookingId) {
          setActiveBooking(updated);
        }
        return updated;
      })
    );

    // Persist completion to the database so it survives a re-login.
    const target = bookings.find((b) => b.id === bookingId);
    if (isLiveMode && target && target.status === 'in_progress') {
      fetch('/api/complete-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, overtimeHours: target.overtimeHours ?? 0 })
      }).catch(() => {});
    }

    showToast('Booking status updated to next milestone.', 'info');
  };

  // Handler: Accept Booking Request (worker accepts incoming booking)
  const handleAcceptBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const updated = { ...b, status: 'accepted' as const };
        if (activeBooking?.id === bookingId) {
          setActiveBooking(updated);
        }
        return updated;
      })
    );

    // Set the accepted booking as active and navigate to tracker
    const acceptedBooking = bookings.find((b) => b.id === bookingId);
    if (acceptedBooking) {
      setActiveBooking({ ...acceptedBooking, status: 'accepted' });
      setCurrentView('tracker');
    }

    // Persist the acceptance to the database so it survives a re-login.
    if (isLiveMode) {
      fetch('/api/accept-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      }).catch(() => {});
    }

    showToast('Booking accepted! Navigating to dispatch tracker...', 'success');
  };

  // Handler: Reject/Decline Booking Request (worker declines incoming booking)
  const handleRejectBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const updated = { ...b, status: 'cancelled' as const, cancelled_by: 'worker' as const };
        if (activeBooking?.id === bookingId) {
          setActiveBooking(updated);
        }
        return updated;
      })
    );
    showToast('Booking declined. The request has been reassigned.', 'info');
  };

  // Handler: Cancel Booking (customer or worker cancels an active booking)
  const handleCancelBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const updated = { ...b, status: 'cancelled' as const, cancelled_by: userRole === 'worker' ? 'worker' as const : 'customer' as const };
        if (activeBooking?.id === bookingId) {
          setActiveBooking(updated);
        }
        return updated;
      })
    );
    showToast('Booking has been cancelled.', 'info');
  };

  // Handler: Create New Booking
  const handleCreateBooking = async (newBookingData: Partial<Booking>) => {
    const bookingCoords = newBookingData.coordinates || userLocation;
    const assignedWorker = workers.find((w) => w.id === newBookingData.workerId) || workers[0];

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        // Trigger server-side creation
        const res = await fetch('/api/create-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: session?.user?.id || 'demo-client',
            workerId: assignedWorker.id,
            serviceType: serviceTypeFromLabel(newBookingData.serviceCategory || 'Carpentry'),
            scheduledAt: new Date().toISOString(),
            scheduledEndAt: new Date(Date.now() + 7200000).toISOString(), // + 2 hrs
            location: bookingCoords
          })
        });

        if (!res.ok) {
           console.error("Supabase booking creation failed (status", res.status, "):", await res.text().catch(() => ''));
           // Fallback to local state if server fails for demo robustness
        }
      }
    } catch (e) {
      console.warn("API Error, continuing locally", e);
    }

    const fullBooking: Booking = {
      id: `booking-${Date.now()}`,
      referenceNumber:
        newBookingData.referenceNumber || `#CWS-${Math.floor(1000 + Math.random() * 9000)}`,
      serviceTitle: newBookingData.serviceTitle || 'General Trade Service',
      serviceCategory: newBookingData.serviceCategory || 'Carpentry',
      serviceMode: newBookingData.serviceMode || 'labor',
      workerId: assignedWorker.id,
      workerName: assignedWorker.name,
      workerAvatar: assignedWorker.avatar,
      workerRating: assignedWorker.rating,
      workerJobsCount: assignedWorker.completedJobsCount,
      status: newBookingData.status || 'requested',
      isEmergency: !!newBookingData.isEmergency,
      scheduledTime: newBookingData.scheduledTime || 'Today, 2:00 PM',
      address: newBookingData.address || userAddress || 'Flat 402, Green Meadows Society, Janakpuri, New Delhi',
      estimatedCostRange: newBookingData.estimatedCostRange || '₹1,200 – ₹2,000',
      clientName: newBookingData.clientName || 'You (Homeowner)',
      durationHours: newBookingData.durationHours || 2.0,
      baseRatePerHour: newBookingData.baseRatePerHour || 85.0,
      societyDividendPercent: 15,
      platformFeePercent: 2.5,
      createdAt: 'Just now',
      notes: newBookingData.notes,
      coordinates: bookingCoords,
      workerCoordinates: assignedWorker.coordinates || {
        lat: bookingCoords.lat + 0.008,
        lng: bookingCoords.lng + 0.006
      }
    };

    setBookings((prev) => [fullBooking, ...prev]);
    setActiveBooking(fullBooking);
    setCurrentView('tracker');
    showToast(
      fullBooking.isEmergency
        ? 'Emergency dispatch alert sent to nearest available trade master!'
        : 'Trade booking request submitted to cooperative worker!',
      fullBooking.isEmergency ? 'urgent' : 'success'
    );
  };

  // Handler: Accept Emergency Dispatch
  const handleAcceptEmergency = () => {
    setShowEmergencyAlert(false);
    const emergencyBooking: Booking = {
      id: `booking-emerg-${Date.now()}`,
      referenceNumber: '#TRK-8924',
      serviceTitle: 'Emergency Pipe Repair',
      serviceCategory: 'Plumbing',
      serviceMode: 'labor',
      workerId: 'worker-marcus-t',
      workerName: 'Rahul Patil',
      workerAvatar:
        personPhoto('Rahul Patil'),
      workerRating: 4.9,
      workerJobsCount: 128,
      status: 'en_route',
      isEmergency: true,
      scheduledTime: 'Immediate (En Route)',
      address: 'Shop 12, Karol Bagh Market, New Delhi',
      estimatedCostRange: '₹1,850 – ₹2,200 (Urgent)',
      clientName: 'Kulkarni Textiles, Karol Bagh',
      durationHours: 2.5,
      baseRatePerHour: 90.0,
      societyDividendPercent: 15,
      platformFeePercent: 2.5,
      createdAt: 'Just now',
      notes: 'Burst main pipe in basement level. Water shutoff jammed.',
      coordinates: { lat: userLocation.lat + 0.005, lng: userLocation.lng + 0.004 },
      workerCoordinates: userLocation
    };

    setBookings((prev) => [emergencyBooking, ...prev]);
    setActiveBooking(emergencyBooking);
    setCurrentView('tracker');
    showToast('Emergency assignment accepted! GPS route activated.', 'urgent');
  };

  // Handler: Approve Worker Applicant
  const handleApproveApplicant = async (id: string) => {
    // Live mode: verification is a real database flip by the society admin.
    if (isLiveMode) {
      try {
        const res = await fetch('/api/admin/workers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workerId: id, approve: true }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Approval failed');
        setApplicants((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'approved' as const } : a))
        );
        showToast('Applicant verified and activated for dispatch.', 'success');
      } catch (err: any) {
        showToast(err.message || 'Approval failed.', 'urgent');
      }
      return;
    }

    const applicant = applicants.find((a) => a.id === id);
    if (!applicant) return;

    setApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'approved' as const } : a))
    );

    // Also add to active workers directory
    const newWorker: WorkerProfile = {
      id: `worker-${Date.now()}`,
      name: applicant.name,
      avatar:
        applicant.avatar ||
        personPhoto(applicant.name || 'New Member'),
      roleTitle: applicant.primarySkill,
      societyAffiliation: applicant.society,
      guildNumber: `Member #${Math.floor(100 + Math.random() * 800)}`,
      rating: 5.0,
      reviewCount: 1,
      completedJobsCount: 0,
      distanceMiles: 1.8,
      driveTimeMin: 8,
      verified: true,
      insuranceStatus: 'Enrolled & Verified',
      responseTime: '< 1 Hour',
      hourlyRateConsultation: 50,
      hourlyRateLabor: 95,
      skills: [
        { name: applicant.primarySkill, icon: 'handyman' },
        { name: 'Safety Certified', icon: 'verified' }
      ],
      bio: `Certified trade specialist accredited by ${applicant.society} with ${applicant.experienceYears} years of peer-verified craftsmanship.`,
      recentProjects: [],
      mapCoordinates: { xPercent: 45, yPercent: 40 },
      coordinates: {
        lat: userLocation.lat + (Math.random() - 0.5) * 0.02,
        lng: userLocation.lng + (Math.random() - 0.5) * 0.02
      }
    };

    setWorkers((prev) => [newWorker, ...prev]);

    // Add to activity feed
    setActivity((prev) => [
      {
        id: `act-${Date.now()}`,
        title: 'New Member Approved',
        description: `${applicant.name} accredited into ${applicant.society}.`,
        timestamp: 'Just now',
        type: 'verification',
        actor: 'Admin_Council'
      },
      ...prev
    ]);

    showToast(
      `${applicant.name} has been approved as an accredited cooperative member!`,
      'success'
    );
  };

  // Handler: Reject Worker Applicant
  const handleRejectApplicant = async (id: string) => {
    if (isLiveMode) {
      try {
        const res = await fetch('/api/admin/workers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workerId: id, approve: false }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Rejection failed');
        setApplicants((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'rejected' as const } : a))
        );
        showToast('Applicant dossier marked as rejected by committee review.', 'info');
      } catch (err: any) {
        showToast(err.message || 'Rejection failed.', 'urgent');
      }
      return;
    }
    setApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'rejected' as const } : a))
    );
    showToast('Applicant dossier marked as rejected by committee review.', 'info');
  };

  // Handler: Register New Worker
  const handleRegisterWorker = async (applicantData: Partial<WorkerApplicant>) => {
    // Live mode: persist profile + skills + home pin via submit_worker_onboarding.
    if (isLiveMode) {
      if (!applicantData.services?.length || !applicantData.homeCoordinates) {
        showToast('Complete the Aadhaar, documents and GPS capture steps first.', 'urgent');
        return;
      }
      try {
        const res = await fetch('/api/worker/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            societyName: applicantData.society,
            radiusM: applicantData.radiusM ?? 15000,
            lat: applicantData.homeCoordinates.lat,
            lng: applicantData.homeCoordinates.lng,
            services: applicantData.services,
            aadhaarLast4: applicantData.aadhaarLast4
          }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Submission failed');
        showToast(
          'Application submitted for society verification — your workspace updates once approved.',
          'success'
        );
        setTimeout(() => window.location.reload(), 1600);
        return;
      } catch (err: any) {
        console.warn('Worker onboarding failed:', err);
        showToast(err.message || 'Application could not be submitted. Please retry.', 'urgent');
        return;
      }
    }

    const newApplicant: WorkerApplicant = {
      id: `app-${Date.now()}`,
      name: applicantData.name || 'New Candidate',
      email: applicantData.email || 'candidate@trades.org',
      primarySkill: applicantData.primarySkill || 'Master Carpenter',
      society: applicantData.society || 'Janakpuri Workers Co-op',
      experienceYears: applicantData.experienceYears || 5,
      currentWorkplace: applicantData.currentWorkplace,
      status: 'review',
      appliedDate: 'Today',
      aadhaarLast4: applicantData.aadhaarLast4,
      aadhaarVerified: applicantData.aadhaarVerified,
      documents: applicantData.documents,
      geoVerified: applicantData.geoVerified
    };

    setApplicants((prev) => [newApplicant, ...prev]);
    showToast('Your application has been submitted. A society admin will review it.', 'success');
  };

  // Handler: Submit Review
  const handleSubmitReview = (_rating: number, _feedback: string, overtimeHours = 0) => {
    // Record extra hours worked so the payout statement bills overtime at 1.5×.
    if (overtimeHours > 0) {
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id !== (reviewBookingContext?.id ?? activeBooking?.id)) return b;
          const updated = { ...b, overtimeHours };
          if (activeBooking?.id === b.id) setActiveBooking(updated);
          return updated;
        })
      );
      showToast(
        `Overtime logged and paid at 1.5× — ${overtimeHours}h added to the worker's payout.`,
        'success'
      );
    } else {
      showToast(
        `Review submitted! Escrow released to worker's cooperative account.`,
        'success'
      );
    }
  };

  // Institution places a bulk order — added to the queue for society staffing.
  const handleCreateBulkOrder = async (data: Omit<
    BulkOrder,
    'id' | 'orderNo' | 'status' | 'createdAt' | 'estimatedCost'
  >) => {
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        await fetch('/api/bulk-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orgName: data.orgName,
            contactName: data.contactName,
            contactPhone: data.contactPhone,
            serviceType: data.serviceType,
            workersNeeded: data.workersNeeded,
            scheduledDate: data.scheduledDate,
            locationArea: data.locationArea,
            notes: data.notes,
          }),
        }).catch(() => {});
      }
    } catch {
      /* demo fallback — keep local */
    }

    const low = data.workersNeeded * 1800;
    const high = data.workersNeeded * 2250;
    const order: BulkOrder = {
      id: `bulk-${Date.now()}`,
      orderNo: `#BLK-${Math.floor(1000 + Math.random() * 9000)}`,
      ...data,
      status: 'open',
      createdAt: 'Just now',
      estimatedCost: `₹${low.toLocaleString('en-IN')} – ₹${high.toLocaleString('en-IN')}`,
    };
    setBulkOrders((prev) => [order, ...prev]);
    showToast(`Bulk order ${order.orderNo} submitted — the society will allocate ${order.workersNeeded} verified workers.`, 'success');
  };

  // Society / federation admin advances a bulk order: open → allocating → fulfilled.
  const handleAdvanceBulkOrder = (id: string) => {
    setBulkOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const next =
          o.status === 'open' ? 'allocating' : o.status === 'allocating' ? 'fulfilled' : o.status;
        const label =
          next === 'allocating'
            ? 'Workers being allocated from the verified pool'
            : next === 'fulfilled'
              ? `Bulk order fulfilled — ${o.workersNeeded} workers confirmed for ${o.orgName}`
              : '';
        if (label) showToast(label, next === 'fulfilled' ? 'success' : 'info');
        return { ...o, status: next };
      })
    );
  };

  // Handler: Create Governance Proposal
  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProposalTitle) return;

    const newRule: GovernanceRule = {
      id: `rule-${Date.now()}`,
      title: newProposalTitle,
      description:
        newProposalDesc ||
        'Proposed democratic resolution submitted by cooperative delegate.',
      status: 'voting_open',
      supportPercent: 50,
      quorumPercent: 65,
      category: 'Federation Policy'
    };

    setRules((prev) => [newRule, ...prev]);
    setShowNewProposalModal(false);
    setNewProposalTitle('');
    setNewProposalDesc('');
    showToast('New democratic proposal published to the federation ballot!', 'success');
  };

  const pendingApprovalsCount = applicants.filter((a) => a.status === 'review').length;

  // Check RBAC permission for the current view: logged-out visitors may only
  // see the landing (ad) page and the login screen; signed-in users see only
  // the views their role allows.
  const isViewPermitted = isLoggedIn
    ? ROLE_ALLOWED_VIEWS[userRole].includes(currentView)
    : currentView === 'landing' || currentView === 'login';

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9F6] dark:bg-[#0F151D] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF7448] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Live mode: show landing page first, then AuthUI when user clicks Login
  // The landing page is always the entry point — login/register are separate views.

  // Live mode: wait for role resolution so a worker never flashes the customer
  // home (or the access-restricted screen) before their real role loads.
  if (isLiveMode && session && !roleReady) {
    return (
      <div className="min-h-screen bg-[#FFF9F6] dark:bg-[#0F151D] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF7448] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F6] dark:bg-[#0F151D] text-[#0F151D] dark:text-[#FBFBFB] flex flex-col font-sans selection:bg-[#FF7448] selection:text-white transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        userRole={userRole}
        isLoggedIn={isLoggedIn}
        onOpenLogin={() => setCurrentView('login')}
        onOpenRegister={openRegistration}
        onTriggerEmergency={() => setShowEmergencyAlert(true)}
        onOpenNewBooking={() => {
          setBookingWorkerContext(null);
          setBookingInitialMode('labor');
          setShowNewBookingModal(true);
        }}
        pendingApprovalsCount={pendingApprovalsCount}
        userName={userDisplayName}
        onOpenProfile={() => setCurrentView('profile')}
      />

      {/* Main Dynamic View Area with RBAC enforcement */}
      <main className="flex-1">
        {!isViewPermitted ? (
          <div className="pt-28 pb-16 px-4 max-w-lg mx-auto text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FF7448]/10 dark:bg-[#FF7448]/20 text-[#FF7448] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">lock</span>
            </div>
            <h2 className="font-['Outfit'] text-2xl font-bold">Access Restricted</h2>
            <p className="text-xs text-[#71717A] leading-relaxed">
              This section is reserved for{' '}
              {userRole === 'customer'
                ? 'Cooperative Workers or Federation Admins'
                : userRole === 'worker'
                  ? 'Federation Admins or Clients'
                  : 'Authorized Personnel'}
              .
            </p>
            <button
              onClick={() => setCurrentView(ROLE_DEFAULT_VIEW[userRole])}
              className="px-5 py-2.5 bg-[#FF7448] text-white rounded-xl font-['Outfit'] font-bold text-xs uppercase tracking-wider shadow-md hover:bg-[#FF8D69] transition-colors cursor-pointer"
            >
              Return to Your Workspace
            </button>
          </div>
        ) : (
          <>
            {/* Logged-out screens: marketing ad page + role login */}
            {currentView === 'login' && !isLoggedIn && (
              isLiveMode ? (
                <AuthUI onAuthSuccess={() => setIsAuthLoading(false)} onOpenRegister={openRegistration} />
              ) : (
                <LoginView
                  onLogin={handleDemoLogin}
                  onOpenRegister={openRegistration}
                  onBackHome={() => setCurrentView('landing')}
                />
              )
            )}

            {currentView === 'landing' && !isLoggedIn && (
              <LandingPage
                onNavigate={handleNavigate}
                onOpenRegister={openRegistration}
              />
            )}

            {/* Logged-in customer home dashboard */}
            {currentView === 'customer_home' && (
              <CustomerHome
                userName={userDisplayName}
                userRegion={userRegion}
                workers={workers}
                bookings={bookings}
                onNavigate={handleNavigate}
                onOpenNewBooking={() => {
                  setBookingWorkerContext(null);
                  setBookingInitialMode('labor');
                  setShowNewBookingModal(true);
                }}
                onOpenBookingForWorker={(w, mode) => {
                  setSelectedWorker(w);
                  setBookingWorkerContext(w);
                  setBookingInitialMode(mode);
                  setShowNewBookingModal(true);
                }}
                onTrackBooking={(b) => {
                  setActiveBooking(b);
                  setCurrentView('tracker');
                }}
                onTriggerEmergency={() => setShowEmergencyAlert(true)}
                onSelectWorker={(w) => {
                  setSelectedWorker(w);
                  setCurrentView('worker_profile');
                }}
                onOpenResourceLocator={() => setShowResourceLocator(true)}
              />
            )}

            {currentView === 'marketplace' && (
              <MarketplaceSearch
                workers={workers}
                userLocation={userLocation}
                userAddress={userAddress}
                userRegion={userRegion}
                isLocating={isLocating}
                onLocateUser={handleAcquireLocation}
                onSelectWorker={(w) => {
                  setSelectedWorker(w);
                  setCurrentView('worker_profile');
                }}
                onOpenBookingForWorker={(w) => {
                  setSelectedWorker(w);
                  setBookingWorkerContext(w);
                  setBookingInitialMode('labor');
                  setShowNewBookingModal(true);
                }}
                onOpenResourceLocator={() => setShowResourceLocator(true)}
                bulkOrders={bulkOrders}
                onOpenBulkOrder={() => setShowBulkOrderModal(true)}
              />
            )}

            {currentView === 'worker_profile' && (
              <WorkerProfileView
                worker={selectedWorker}
                userRole={userRole}
                onBack={() => {
                  if (userRole === 'worker') setCurrentView('worker_roster');
                  else setCurrentView('marketplace');
                }}
                onOpenBooking={(w, initialMode) => {
                  setBookingWorkerContext(w);
                  setBookingInitialMode(initialMode);
                  setShowNewBookingModal(true);
                }}
              />
            )}

            {currentView === 'tracker' &&
              (activeBooking ? (
                <BookingTracker
                  booking={activeBooking}
                  userLocation={userLocation}
                  userRegion={userRegion}
                  viewerRole={userRole}
                  isCustomer={userRole === 'customer'}
                  onAdvanceStatus={handleAdvanceStatus}
                  onCancelBooking={handleCancelBooking}
                  onOpenReview={(b) => {
                    setReviewBookingContext(b);
                    setShowReviewModal(true);
                  }}
                  onViewPayout={(b) => {
                    setPayoutBookingContext(b);
                    setShowPayoutModal(true);
                  }}
                />
              ) : (
                <div className="pt-28 pb-20 px-4 max-w-lg mx-auto text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#FF7448]/10 text-[#FF7448] flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-[32px]">route</span>
                  </div>
                  <h2 className="font-['Outfit'] text-2xl font-bold">No booking selected</h2>
                  <p className="text-xs text-[#71717A] leading-relaxed">
                    Open a booking from your list to see its live tracker, then
                    return here to follow the job in real time.
                  </p>
                  <button
                    onClick={() => setCurrentView(ROLE_DEFAULT_VIEW[userRole])}
                    className="px-5 py-2.5 bg-[#FF7448] text-white rounded-xl font-['Outfit'] font-bold text-xs uppercase tracking-wider shadow-md hover:bg-[#FF8D69] transition-colors cursor-pointer"
                  >
                    Back to My Dashboard
                  </button>
                </div>
              ))}

            {/* Account Profile (avatar tap) */}
            {currentView === 'profile' && (
              <ProfileView
                userRole={userRole}
                isLiveMode={isLiveMode}
                userName={userDisplayName}
                userEmail={isLiveMode ? session?.user?.email : undefined}
                onNavigate={handleNavigate}
                onSignOut={handleSignOut}
                onDeleteAccount={handleDeleteAccount}
              />
            )}

            {/* Worker Views */}
            {currentView === 'worker_roster' && (
              <WorkerDashboard
                userName={userDisplayName || 'Rahul'}
                bookings={bookings}
                onOpenBookingTracker={(b) => {
                  setActiveBooking(b);
                  setCurrentView('tracker');
                }}
                onOpenPayoutDetail={(b) => {
                  setPayoutBookingContext(b);
                  setShowPayoutModal(true);
                }}
                onAcceptBooking={handleAcceptBooking}
                onRejectBooking={handleRejectBooking}
                onTriggerEmergency={() => setShowEmergencyAlert(true)}
              />
            )}

            {/* Admin & Shared Governance Views */}
            {currentView === 'federation' && (
              <FederationDashboard
                societies={societies}
                activity={activity}
                rules={rules}
                onNavigateSubView={handleNavigate}
                onOpenNewProposal={() => setShowNewProposalModal(true)}
                pendingApprovalsCount={pendingApprovalsCount}
                bulkOrders={bulkOrders}
                onAdvanceBulkOrder={handleAdvanceBulkOrder}
              />
            )}

            {currentView === 'society_admin' && (
              <SocietyAdminDashboard
                activity={activity}
                onNavigateSubView={handleNavigate}
                pendingApprovalsCount={pendingApprovalsCount}
                bulkOrders={bulkOrders}
                onAdvanceBulkOrder={handleAdvanceBulkOrder}
              />
            )}

            {currentView === 'approvals' && (
              <PendingApprovals
                applicants={applicants}
                onApprove={handleApproveApplicant}
                onReject={handleRejectApplicant}
                onBackToFederation={() => setCurrentView('federation')}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        userRole={userRole}
        isLoggedIn={isLoggedIn}
        onNavigate={handleNavigate}
        onOpenRegister={openRegistration}
        onOpenLogin={() => setCurrentView('login')}
        onOpenNewBooking={() => {
          setBookingWorkerContext(null);
          setBookingInitialMode('labor');
          setShowNewBookingModal(true);
        }}
      />

      {/* Mobile Bottom Navigation — signed-in workspaces only */}
      {isLoggedIn && currentView !== 'login' && (
        <BottomNav
          currentView={currentView}
          onNavigate={handleNavigate}
          onOpenNewBooking={() => {
            setBookingWorkerContext(null);
            setBookingInitialMode('labor');
            setShowNewBookingModal(true);
          }}
          userRole={userRole}
          onTriggerEmergency={() => setShowEmergencyAlert(true)}
        />
      )}

      {/* Modals & Dialogs */}
      <EmergencyAlertModal
        isOpen={showEmergencyAlert}
        onClose={() => setShowEmergencyAlert(false)}
        onAccept={handleAcceptEmergency}
      />

      <NewBookingModal
        isOpen={showNewBookingModal}
        onClose={() => setShowNewBookingModal(false)}
        workers={workers}
        preSelectedWorker={bookingWorkerContext}
        initialMode={bookingInitialMode}
        onCreateBooking={handleCreateBooking}
        userLocation={userLocation}
        userAddress={userAddress}
        onDetectLocation={handleAcquireLocation}
      />

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        booking={reviewBookingContext || activeBooking}
        onSubmitReview={handleSubmitReview}
      />

      <PayoutDetailModal
        isOpen={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        booking={payoutBookingContext || activeBooking}
      />

      <WorkerRegistration
        isOpen={showRegistrationModal}
        initialMode={registrationMode}
        onClose={() => setShowRegistrationModal(false)}
        onSubmitApplicant={handleRegisterWorker}
        onRegisterCustomer={handleRegisterCustomer}
      />

      {/* Institution bulk order — schools/societies/offices book a team of workers */}
      <BulkOrderModal
        isOpen={showBulkOrderModal}
        onClose={() => setShowBulkOrderModal(false)}
        onCreateOrder={handleCreateBulkOrder}
      />

      {/* Local Resource Locator with Google Maps Grounding */}
      <LocalResourceLocator
        isOpen={showResourceLocator}
        onClose={() => setShowResourceLocator(false)}
        userLocation={userLocation}
        userAddress={userAddress}
      />

      {/* New Governance Proposal Modal */}
      {showNewProposalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white/85 dark:bg-[#232E3A]/85 backdrop-blur-2xl backdrop-saturate-150 text-[#0F151D] dark:text-[#FBFBFB] w-full max-w-lg rounded-3xl border border-white/70 dark:border-white/10 shadow-2xl p-6 space-y-5 transition-colors">
            <div className="flex items-center justify-between border-b border-[#F0E5DC] dark:border-[#2A3441] pb-4">
              <h3 className="font-['Outfit'] text-lg font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                Submit Democratic Resolution
              </h3>
              <button
                onClick={() => setShowNewProposalModal(false)}
                className="w-8 h-8 rounded-full bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1.5">
                  Resolution Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2025 Autonomous Emergency Tool Library Fund"
                  value={newProposalTitle}
                  onChange={(e) => setNewProposalTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] rounded-xl text-xs text-[#0F151D] dark:text-[#FBFBFB] placeholder-[#71717A] focus:outline-none focus:border-[#FF7448]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1.5">
                  Resolution Scope & Details
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide rationale, expected dividend allocation, and quorum requirements..."
                  value={newProposalDesc}
                  onChange={(e) => setNewProposalDesc(e.target.value)}
                  className="w-full p-3 bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] rounded-xl text-xs text-[#0F151D] dark:text-[#FBFBFB] placeholder-[#71717A] focus:outline-none focus:border-[#FF7448]"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#FF7448] hover:bg-[#FF8D69] text-white font-['Outfit'] font-bold text-sm rounded-xl transition-colors shadow-md shadow-[#FF7448]/25 cursor-pointer"
              >
                Publish Federation Ballot
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toast && (
        <div className="fixed bottom-16 md:bottom-6 right-4 md:right-6 z-50 max-w-sm animate-in slide-in-from-bottom-5 duration-200 pointer-events-auto">
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-center gap-3 ${
              toast.type === 'urgent'
                ? 'bg-[#FF7448] text-white border-[#FF8D69]'
                : toast.type === 'info'
                  ? 'bg-white/85 dark:bg-[#0F151D]/80 text-[#0F151D] dark:text-[#FBFBFB] border-white/70 dark:border-white/10 backdrop-blur-xl'
                  : 'bg-white/85 dark:bg-[#1B232E]/80 text-[#0F151D] dark:text-[#FBFBFB] border-white/70 dark:border-white/10 backdrop-blur-xl'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">
              {toast.type === 'urgent'
                ? 'crisis_alert'
                : toast.type === 'info'
                  ? 'info'
                  : 'check_circle'}
            </span>
            <p className="text-xs font-medium leading-tight flex-1">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
