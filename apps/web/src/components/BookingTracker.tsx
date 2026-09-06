import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Booking, BookingStatus, LatLng, UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { MapView, RoadRouteMeta } from './MapView';
import { pointAlongRoute } from '../lib/osrm';
import { ChatModal, CallModal, ContactPerson, avatarFor } from './BookingContact';

interface BookingTrackerProps {
  booking: Booking;
  onAdvanceStatus: (bookingId: string) => void;
  onCancelBooking: (bookingId: string) => void;
  onOpenReview: (booking: Booking) => void;
  onViewPayout: (booking: Booking) => void;
  userLocation?: LatLng;
  /** Compact "area, city" label resolved from the live GPS coordinates. */
  userRegion?: string;
  /** Who is looking at this tracker — decides who the contact card shows. */
  viewerRole?: UserRole;
  /** Whether the viewer is a customer — Review/Pay buttons are restricted to customers only. */
  isCustomer?: boolean;
}

const STATUS_TRIP: Record<string, { label: string; color: string }> = {
  requested: { label: 'Request sent — awaiting acceptance', color: '#3B82F6' },
  accepted: { label: 'Accepted — head to job site', color: '#F59E0B' },
  en_route: { label: 'En route to job site', color: '#FF7448' },
  in_progress: { label: 'On site — job in progress', color: '#10B981' },
  completed: { label: 'Job completed', color: '#10B981' },
  cancelled: { label: 'Cancelled', color: '#EF4444' }
};

// Great-circle distance (haversine) in kilometres between two points.
function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371; // earth radius in km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// Simulated live-GPS pace: 1 tick every second, ~35 s to drive the full route.
// Module-scoped so reopening the same booking resumes where it left off instead
// of restarting (and it never refetches the road route — see lib/osrm.ts).
const GPS_TICK_MS = 1000;
const GPS_TICKS_PER_TRIP = 35;
const tripProgressStore: Record<string, number> = {};

export const BookingTracker: React.FC<BookingTrackerProps> = ({
  booking,
  onAdvanceStatus,
  onCancelBooking,
  onOpenReview,
  onViewPayout,
  userLocation,
  userRegion,
  viewerRole = 'customer',
  isCustomer = false
}) => {
  const { t } = useLanguage();
  // In-app contact: a worker viewing the tracker talks to the client; everyone
  // else (customer / admins) talks to the assigned worker.
  const viewerIsWorker = viewerRole === 'worker';
  const [chatOpen, setChatOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const counterpart: ContactPerson = viewerIsWorker
    ? { name: booking.clientName || 'Client', tag: 'client' }
    : { name: booking.workerName, avatar: booking.workerAvatar, tag: 'worker' };
  // Once the road route loads, use its real distance/ETA instead of the air-line estimate.
  const [routeMeta, setRouteMeta] = useState<RoadRouteMeta | null>(null);
  // Simulated live-GPS progress along the cached road geometry (0..1).
  const [gpsProgress, setGpsProgress] = useState<number>(
    () => Math.min(1, Math.max(0, tripProgressStore[booking.id] ?? 0))
  );
  const lastStatusRef = useRef<BookingStatus>(booking.status);
  const steps: { key: BookingStatus; label: string; time: string; icon: string }[] = [
    { key: 'requested', label: t('tracker.stepConfirmed'), time: '09:00 AM', icon: 'check' },
    { key: 'en_route', label: t('tracker.stepEnRoute'), time: 'ETA 12 min', icon: 'near_me' },
    { key: 'in_progress', label: t('tracker.stepInProgress'), time: 'On Site', icon: 'build' },
    { key: 'completed', label: t('tracker.stepCompleted'), time: 'Inspected', icon: 'task_alt' }
  ];

  const getStepIndex = (status: BookingStatus) => {
    switch (status) {
      case 'requested':
      case 'accepted':
        return 0;
      case 'en_route':
        return 1;
      case 'in_progress':
        return 2;
      case 'completed':
        return 3;
      default:
        return 1;
    }
  };

  const currentStepIdx = getStepIndex(booking.status);

  // Derive coordinates for worker and destination (Delhi NCR defaults).
  // workerLocation doubles as the route ORIGIN: it stays fixed on the map while
  // the live marker below animates along the road geometry.
  const routeOrigin: LatLng = booking.workerCoordinates || {
    lat: (booking.coordinates?.lat || 28.6139) - 0.004,
    lng: (booking.coordinates?.lng || 77.209) - 0.004
  };

  const destinationLocation: LatLng = booking.coordinates || userLocation || {
    lat: 28.6139,
    lng: 77.209
  };

  // The worker marker's live position. Before the road geometry loads (or for
  // non-en_route stages) it sits at the route origin; once the simulated trip
  // reaches the end the worker stays at the job site (arrived, awaiting start).
  const moving =
    booking.status === 'en_route' && !!routeMeta && gpsProgress > 0 && gpsProgress < 1;
  const arrivedAtSite =
    booking.status === 'en_route' && gpsProgress >= 1 && !!routeMeta;
  const workerLocation: LatLng =
    booking.status === 'in_progress' || arrivedAtSite
      ? destinationLocation
      : moving
        ? pointAlongRoute(routeMeta!.points, gpsProgress)
        : routeOrigin;

  // Real distance + ETA between the worker and the job site (in km). Values are
  // upgraded to the actual road distance/ETA when the route finishes loading.
  const airDistanceKm = haversineKm(routeOrigin, destinationLocation);
  const distanceKm = routeMeta ? routeMeta.distanceKm : airDistanceKm;
  const etaMin = routeMeta ? routeMeta.durationMin : Math.max(2, Math.round(airDistanceKm * 3));

  // Start / reset the simulated GPS tick as the booking moves through stages.
  useEffect(() => {
    const prev = lastStatusRef.current;
    lastStatusRef.current = booking.status;

    if (booking.status === 'requested' || booking.status === 'accepted') {
      tripProgressStore[booking.id] = 0;
      setGpsProgress(0);
      return;
    }
    if (booking.status === 'in_progress' || booking.status === 'completed') {
      tripProgressStore[booking.id] = 1;
      setGpsProgress(1);
      return;
    }
    // en_route: a fresh dispatch starts from the origin; returning to a tracker
    // that is already mid-trip resumes from the stored tick.
    if (prev !== 'en_route') {
      tripProgressStore[booking.id] = 0;
      setGpsProgress(0);
    }
  }, [booking.id, booking.status]);

  // Advance the simulated live GPS while en route (only after the road
  // geometry is known so the marker genuinely follows the roads).
  useEffect(() => {
    if (booking.status !== 'en_route' || !routeMeta) return;
    const id = window.setInterval(() => {
      setGpsProgress((prev) => {
        const next = Math.min(1, prev + 1 / GPS_TICKS_PER_TRIP);
        tripProgressStore[booking.id] = next;
        return next;
      });
    }, GPS_TICK_MS);
    return () => window.clearInterval(id);
  }, [booking.id, booking.status, routeMeta]);

  // Fraction of the route still ahead — drives the remaining distance / ETA.
  const remainingFrac = Math.max(0, Math.min(1, 1 - gpsProgress));
  const remainingKm = distanceKm * remainingFrac;
  const remainingMin = Math.max(1, Math.round(etaMin * remainingFrac));
  const arrived = booking.status === 'en_route' && remainingFrac === 0 && !!routeMeta;
  const tripStatus = STATUS_TRIP[booking.status] || STATUS_TRIP.accepted;
  const isFinished = booking.status === 'completed' || booking.status === 'cancelled';
  const isCancelled = booking.status === 'cancelled';

  return (
    <div className="pt-20 pb-20 md:pb-12 min-h-screen bg-[#FFF9F6] dark:bg-[#0F151D] text-[#0F151D] dark:text-[#FBFBFB] transition-colors">
      <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6">
        {/* Header with Title & Reference */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-xl transition-colors"
        >
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  isCancelled
                    ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
                    : booking.status === 'completed'
                      ? 'bg-[#10B981]/10 dark:bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]'
                      : 'bg-[#FF7448]/10 dark:bg-[#FF7448]/15 border-[#FF7448]/30 text-[#FF7448]'
                }`}
              >
                {isFinished
                  ? isCancelled
                    ? 'Booking Cancelled'
                    : 'Service Completed'
                  : 'Live GPS Dispatch'}
              </span>
              <span className="text-xs font-mono text-[#71717A]">{booking.referenceNumber}</span>
            </div>
            <h1 className="font-['Outfit'] text-2xl font-bold text-[#0F151D] dark:text-[#FBFBFB] mt-1">
              {booking.serviceTitle}
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {booking.status !== 'completed' && booking.status !== 'cancelled' && (
              <button
                onClick={() => onAdvanceStatus(booking.id)}
                className="px-4 py-2 bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] hover:border-[#D3E1FF] dark:hover:border-[#3F3F46] text-[#0F151D] dark:text-[#FBFBFB] text-xs font-['Outfit'] font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-[#FF7448]">fast_forward</span>
                <span>{t('tracker.nextStage')}</span>
              </button>
            )}

            {booking.status !== 'completed' && booking.status !== 'cancelled' && (
              <button
                onClick={() => onCancelBooking(booking.id)}
                className="px-4 py-2 bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#EF4444]/30 hover:bg-[#EF4444]/10 text-[#EF4444] text-xs font-['Outfit'] font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                <span>{t('tracker.cancel')}</span>
              </button>
            )}{booking.status === 'completed' && isCustomer && (
                  <button
                    onClick={() => onOpenReview(booking)}
                    className="px-4 py-2 bg-[#FF7448] text-white text-xs font-['Outfit'] font-bold rounded-xl hover:bg-[#FF8D69] shadow-xs shadow-[#FF7448]/20 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">rate_review</span>
                    <span>{t('tracker.review')}</span>
                  </button>
                )}

            {booking.status === 'cancelled' && (
              <div className="px-4 py-2 bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs font-['Outfit'] font-bold rounded-xl flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                <span>Cancelled{booking.cancelled_by ? ` by ${booking.cancelled_by}` : ''}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Live Stepper Component */}
        <div className="bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md transition-colors">
          <div className="relative flex items-center justify-between">
            {/* Background connecting bar */}
            <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-[#F0E5DC] dark:bg-[#2E3946] -z-0"></div>

            {/* Active connecting bar */}
            <div
              className="absolute top-1/2 left-4 -translate-y-1/2 h-1 bg-[#FF7448] transition-all duration-500 -z-0 shadow-[0_0_8px_rgba(255,116,72,0.6)]"
              style={{ width: `${(currentStepIdx / (steps.length - 1)) * 90}%` }}
            ></div>

            {steps.map((step, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-[#FF7448] text-white ring-4 ring-[#FF7448]/30 shadow-lg shadow-[#FF7448]/20 scale-110'
                        : isPast
                          ? 'bg-[#10B981] text-white font-bold'
                          : 'bg-[#FFF9F6] dark:bg-[#0F151D] text-[#71717A] border border-[#F0E5DC] dark:border-[#2E3946]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isPast ? 'check' : step.icon}
                    </span>
                  </div>

                  <span
                    className={`font-['Outfit'] text-xs mt-2 ${
                      isCurrent
                        ? 'font-bold text-[#FF7448]'
                        : isPast
                          ? 'font-semibold text-[#0F151D] dark:text-[#FBFBFB]'
                          : 'text-[#71717A]'
                    }`}
                  >
                    {step.label}
                  </span>

                  <span className="text-[10px] text-[#71717A] mt-0.5">{step.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live dispatch map + telemetry — only while the job is active. Once the
            service is over (completed) or cancelled, these are replaced by a clear
            job-closed summary panel below. */}
        {!isFinished ? (
          <>
            <div className="h-80 sm:h-96 rounded-2xl overflow-hidden shadow-md">
              <MapView
                center={routeOrigin}
                zoom={14}
                userLocation={workerLocation}
                userLabel={viewerIsWorker ? undefined : booking.workerName}
                userAddress={booking.workerName}
                destinationLocation={destinationLocation}
                destinationLabel={booking.address}
                routeStart={routeOrigin}
                isDispatchRoute={true}
                onRouteReady={(meta) => {
                  setRouteMeta(meta);
                  // A route arriving mid-trip snaps the marker onto the road
                  // geometry at the progress already travelled.
                  const stored = tripProgressStore[booking.id] ?? 0;
                  if (booking.status === 'en_route' && stored > 0 && stored < 1) {
                    setGpsProgress(stored);
                  }
                }}
                trip={{
                  label: arrived ? 'Worker arrived at job site' : tripStatus.label,
                  color: tripStatus.color,
                  distanceText:
                    booking.status === 'in_progress'
                      ? '0.0 km left'
                      : booking.status === 'en_route' && arrived
                        ? 'Arrived'
                        : booking.status === 'en_route'
                          ? `${remainingKm.toFixed(1)} km left`
                          : `${distanceKm.toFixed(1)} km${routeMeta ? ' by road' : ''}`,
                  etaText:
                    booking.status === 'in_progress'
                      ? 'On site'
                      : booking.status === 'en_route' && arrived
                        ? 'now'
                        : booking.status === 'en_route'
                          ? `~${remainingMin} min`
                          : `~${etaMin} min`,
                  viaText:
                    booking.status === 'en_route' && routeMeta && gpsProgress > 0 && gpsProgress < 1
                      ? 'live GPS'
                      : routeMeta && booking.status === 'en_route'
                        ? 'follows roads'
                        : undefined
                }}
              />
            </div>

            {/* Live GPS Telemetry Bar */}
            <div className="p-4 bg-white dark:bg-[#1B232E] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF7448]/10 text-[#FF7448] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">directions_car</span>
                </div>
                <div>
                  <p className="font-['Outfit'] font-bold text-xs text-[#0F151D] dark:text-[#FBFBFB]">
                    {booking.status === 'en_route'
                      ? 'Worker En Route via Ring Road'
                      : booking.status === 'in_progress'
                        ? 'Worker On-Site'
                        : 'Worker Moving to Job Site'}
                  </p>
                  <p className="text-[11px] text-[#71717A]">
                    GPS: {workerLocation.lat.toFixed(4)}, {workerLocation.lng.toFixed(4)} • {userRegion || 'New Delhi, Delhi'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="px-3 py-1.5 bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] rounded-xl">
                  <span className="text-[#71717A]">Distance: </span>
                  <strong className="text-[#0F151D] dark:text-[#FBFBFB]">{distanceKm.toFixed(1)} km</strong>
                </div>
                <div className="px-3 py-1.5 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl text-[#10B981] font-bold">
                  ETA: {etaMin} min
                </div>
              </div>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-8 bg-white dark:bg-[#1B232E] rounded-2xl border shadow-sm dark:shadow-md transition-colors overflow-hidden relative"
          >
            {/* soft colour wash behind the panel */}
            <div
              className={`absolute inset-0 pointer-events-none ${
                isCancelled ? 'bg-[#EF4444]/5' : 'bg-gradient-to-br from-[#10B981]/10 via-transparent to-[#FF7448]/5'
              }`}
            ></div>
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                    isCancelled
                      ? 'bg-[#EF4444]/10 text-[#EF4444]'
                      : 'bg-[#10B981]/10 text-[#10B981]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[32px]">
                    {isCancelled ? 'cancel' : 'task_alt'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-['Outfit'] text-xl sm:text-2xl font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                    {isCancelled ? 'This booking was cancelled' : 'Service completed — thank you!'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] mt-1 leading-relaxed max-w-xl">
                    {isCancelled
                      ? `${booking.serviceTitle} at ${booking.address} was cancelled${booking.cancelled_by ? ` by the ${booking.cancelled_by}` : ''}. No charges apply and the worker has been notified.`
                      : `${booking.serviceTitle} at ${booking.address} is finished. The worker has been paid through the society, and your feedback helps the next customer choose well.`}
                  </p>
                </div>
              </div>

              {/* mini job summary strip */}
              <div className="mt-6 p-4 rounded-2xl bg-[#FFF9F6] dark:bg-[#141D28] border border-[#F0E5DC] dark:border-[#2A3441] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[#71717A]">Worker</p>
                  <p className="font-bold text-[#0F151D] dark:text-[#FBFBFB] mt-0.5 truncate">{booking.workerName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[#71717A]">Job</p>
                  <p className="font-bold text-[#0F151D] dark:text-[#FBFBFB] mt-0.5 capitalize truncate">{booking.serviceCategory}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[#71717A]">Date</p>
                  <p className="font-bold text-[#0F151D] dark:text-[#FBFBFB] mt-0.5 truncate">{booking.scheduledTime}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[#71717A]">Cost</p>
                  <p className="font-bold text-[#10B981] mt-0.5 truncate">{booking.estimatedCostRange}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {booking.status === 'completed' && isCustomer && (
                  <button
                    onClick={() => onOpenReview(booking)}
                    className="px-5 py-3 bg-[#FF7448] hover:bg-[#FF8D69] text-white rounded-xl font-['Outfit'] font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#FF7448]/20 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">rate_review</span>
                    <span>{t('tracker.reviewAndPay')}</span>
                  </button>
                )}
                <button
                  onClick={() => onViewPayout(booking)}
                  className="px-5 py-3 bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] hover:border-[#D3E1FF] dark:hover:border-[#3F3F46] text-[#0F151D] dark:text-[#FBFBFB] rounded-xl font-['Outfit'] font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                  <span>{t('tracker.viewBreakup')}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Assigned Professional & Job Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact card — workers see the client, everyone else sees the worker */}
          <div className="bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md space-y-4 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                {viewerIsWorker ? t('contact.client') : t('contact.worker')}
              </h3>
              <span
                className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                  viewerIsWorker
                    ? 'bg-[#D3E1FF]/50 text-[#33619F]'
                    : 'bg-[#10B981]/10 dark:bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]'
                }`}
              >
                {viewerIsWorker ? 'Co-op Client' : 'Co-op Verified'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {avatarFor(counterpart, 'w-14 h-14')}
              <div className="flex-1 min-w-0">
                <h4 className="font-['Outfit'] text-base font-bold text-[#0F151D] dark:text-[#FBFBFB] truncate">
                  {counterpart.name}
                </h4>
                <p className="text-xs text-[#FF7448] font-semibold truncate">
                  {booking.serviceTitle}
                  {viewerIsWorker ? ` • ${booking.address}` : ' • Member #308'}
                </p>
                {viewerIsWorker ? (
                  <div className="flex items-center gap-1 text-xs text-[#71717A] mt-1">
                    <span className="material-symbols-outlined text-[14px]">event</span>
                    <span className="font-semibold">{booking.scheduledTime}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-[#71717A] mt-1">
                    <span
                      className="material-symbols-outlined text-[14px] text-[#F59E0B]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span className="font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                      {booking.workerRating}
                    </span>
                    <span>({booking.workerJobsCount} jobs completed)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F0E5DC] dark:border-[#2A3441]">
              <button
                onClick={() => setCallOpen(true)}
                className="py-2.5 bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] hover:border-[#10B981]/50 dark:hover:border-[#10B981]/40 text-[#0F151D] dark:text-[#FBFBFB] text-xs font-['Outfit'] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-[#10B981]">call</span>
                <span>{t('contact.phone')}</span>
              </button>

              <button
                onClick={() => setChatOpen(true)}
                className="py-2.5 bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] hover:border-[#FF7448]/50 dark:hover:border-[#FF7448]/40 text-[#0F151D] dark:text-[#FBFBFB] text-xs font-['Outfit'] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-[#FF7448]">chat</span>
                <span>{t('contact.message')}</span>
              </button>
            </div>
          </div>

          {/* Job Details Card */}
          <div className="bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                Job Specifications
              </h3>
              <button
                onClick={() => onViewPayout(booking)}
                className="text-[11px] font-bold text-[#FF7448] hover:underline cursor-pointer"
              >
                {t('tracker.viewPayout')}
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between">
                <span className="text-[#71717A]">Scheduled Time:</span>
                <span className="font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                  {booking.scheduledTime}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-[#71717A]">Location:</span>
                <span className="font-bold text-[#0F151D] dark:text-[#FBFBFB] text-right max-w-[200px]">
                  {booking.address}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-[#71717A]">Estimated Cost:</span>
                <span className="font-bold text-[#10B981]">{booking.estimatedCostRange}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-[#71717A]">Service Type:</span>
                <span className="font-bold text-[#0F151D] dark:text-[#FBFBFB] capitalize">
                  {booking.serviceMode} ({booking.serviceCategory})
                </span>
              </div>
            </div>

            {booking.notes && (
              <div className="p-3 bg-[#FFF9F6] dark:bg-[#141D28] rounded-xl border border-[#F0E5DC] dark:border-[#2A3441] text-xs text-[#71717A] dark:text-[#A1A1AA]">
                <strong className="text-[#0F151D] dark:text-[#FBFBFB]">Notes:</strong> {booking.notes}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* In-app contact: chat + call with the other party on this booking */}
      <ChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        booking={booking}
        viewerRole={viewerRole}
        counterpart={counterpart}
      />
      <CallModal
        isOpen={callOpen}
        onClose={() => setCallOpen(false)}
        booking={booking}
        counterpart={counterpart}
      />
    </div>
  );
};
