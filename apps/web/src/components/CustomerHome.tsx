import React from 'react';
import { motion } from 'motion/react';
import { Booking, WorkerProfile } from '../types';
import { Avatar } from './Avatar';

interface CustomerHomeProps {
  userName: string;
  userRegion: string;
  workers: WorkerProfile[];
  bookings: Booking[];
  onNavigate: (view: string) => void;
  onOpenNewBooking: () => void;
  onOpenBookingForWorker: (worker: WorkerProfile, mode: 'consultation' | 'labor') => void;
  onTrackBooking: (booking: Booking) => void;
  onTriggerEmergency: () => void;
  onSelectWorker: (worker: WorkerProfile) => void;
  onOpenResourceLocator: () => void;
}

const LIVE_STATUSES = ['requested', 'accepted', 'en_route', 'in_progress'];

const statusPill = (status: Booking['status']) => {
  const base =
    'px-2.5 py-1 rounded-full text-[11px] font-bold capitalize border ';
  switch (status) {
    case 'cancelled':
      return base + 'bg-[#EF4444]/10 dark:bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]';
    case 'in_progress':
      return base + 'bg-[#FF7448]/10 dark:bg-[#FF7448]/15 border-[#FF7448]/30 text-[#FF7448]';
    case 'accepted':
    case 'en_route':
      return base + 'bg-[#10B981]/10 dark:bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]';
    case 'requested':
      return base + 'bg-[#F59E0B]/10 dark:bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#D97706]';
    default:
      return base + 'bg-[#F7EFE8] dark:bg-[#0F151D] text-[#71717A] border-[#F0E5DC] dark:border-[#2E3946]';
  }
};

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  userName,
  userRegion,
  workers,
  bookings,
  onNavigate,
  onOpenNewBooking,
  onOpenBookingForWorker,
  onTrackBooking,
  onTriggerEmergency,
  onSelectWorker,
  onOpenResourceLocator
}) => {
  const firstName = (userName || '').trim().split(' ')[0] || 'there';
  const activeBookings = bookings.filter((b) =>
    (LIVE_STATUSES as string[]).includes(b.status)
  );
  const topWorkers = workers.filter((w) => w.verified).slice(0, 3);

  return (
    <div className="pt-20 pb-20 md:pb-12 min-h-screen bg-[#FFF9F6] dark:bg-[#0F151D] text-[#0F151D] dark:text-[#FBFBFB] transition-colors">
      <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-6">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1B232E] p-6 sm:p-8 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-sm dark:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FF7448]/10 dark:bg-[#FF7448]/20 text-[#FF7448] flex items-center justify-center border border-[#FF7448]/25 shadow-md">
              <span className="material-symbols-outlined text-[30px]">person</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-['Outfit'] text-2xl font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                  Welcome back, {firstName}! 👋
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#FF7448]/10 text-[#FF7448] dark:bg-[#FF7448]/20 border border-[#FF7448]/30">
                  Customer
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] mt-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">location_on</span>
                {userRegion || 'Coopworks cooperative network'}
              </p>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                Book verified local workers — fair pay, no middlemen.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenNewBooking}
            className="px-5 py-3 bg-[#FF7448] hover:bg-[#FF8D69] text-white font-['Outfit'] font-bold text-xs rounded-xl shadow-md shadow-[#FF7448]/25 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Book a Worker
          </button>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: 'build',
              label: 'Find a Worker',
              sub: 'Verified & rated',
              onClick: () => onNavigate('marketplace')
            },
            {
              icon: 'event_note',
              label: 'New Request',
              sub: 'Book a service slot',
              onClick: onOpenNewBooking
            },
            {
              icon: 'pending',
              label: 'My Bookings',
              sub: `${activeBookings.length} active`,
              onClick: () => onNavigate('tracker')
            },
            {
              icon: 'emergency',
              label: 'Emergency',
              sub: 'Priority dispatch',
              onClick: onTriggerEmergency,
              urgent: true
            }
          ].map((action) => (
            <motion.button
              key={action.label}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.onClick}
              className={`bg-white dark:bg-[#1B232E] p-5 rounded-2xl border shadow-xs dark:shadow-md text-left transition-all ${
                action.urgent
                  ? 'border-[#EF4444]/30 hover:border-[#EF4444]/60'
                  : 'border-[#F0E5DC] dark:border-[#2A3441] hover:border-[#D3E1FF] dark:hover:border-[#3F3F46]'
              }`}
            >
              <span
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  action.urgent
                    ? 'bg-[#EF4444]/10 dark:bg-[#EF4444]/15 text-[#EF4444]'
                    : 'bg-[#FF7448]/10 dark:bg-[#FF7448]/15 text-[#FF7448]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{action.icon}</span>
              </span>
              <p className="font-['Outfit'] text-sm font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                {action.label}
              </p>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">{action.sub}</p>
            </motion.button>
          ))}
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Active Bookings */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-['Outfit'] text-lg font-bold text-[#0F151D] dark:text-[#FBFBFB] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF7448]">assignment_turned_in</span>
                Active Bookings
              </h2>
              {activeBookings.length > 0 && (
                <button
                  onClick={() => onNavigate('tracker')}
                  className="text-xs font-bold text-[#FF7448] hover:text-[#FF8D69] transition-colors"
                >
                  View all →
                </button>
              )}
            </div>

            {activeBookings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#1B232E] p-8 rounded-2xl border border-dashed border-[#F0E5DC] dark:border-[#2E3946] text-center space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#FF7448]/10 dark:bg-[#FF7448]/15 text-[#FF7448] flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[26px]">event_available</span>
                </div>
                <h3 className="font-['Outfit'] text-base font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                  No active bookings yet
                </h3>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] max-w-sm mx-auto leading-relaxed">
                  Browse verified workers from cooperative societies near you and book a
                  consultation or on-site service in minutes.
                </p>
                <button
                  onClick={() => onNavigate('marketplace')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF7448] hover:bg-[#FF8D69] text-white font-['Outfit'] font-bold text-xs rounded-xl shadow-md shadow-[#FF7448]/20 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">search</span>
                  Find a Worker
                </button>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {activeBookings.map((booking) => (
                  <motion.div
                    key={booking.id}
                    whileHover={{ y: -2 }}
                    className="bg-white dark:bg-[#1B232E] p-5 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={booking.workerAvatar}
                          name={booking.workerName}
                          alt={booking.workerName}
                          className="w-12 h-12 rounded-xl object-cover border border-[#F0E5DC] dark:border-[#2E3946]"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold text-[#FF7448]">
                              {booking.referenceNumber}
                            </span>
                            {booking.isEmergency && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/25 px-2 py-0.5 rounded-full">
                                Emergency
                              </span>
                            )}
                            <span className={statusPill(booking.status)}>
                              {booking.status.replace('_', ' ')}
                            </span>
                          </div>
                          <h3 className="font-['Outfit'] text-base font-bold text-[#0F151D] dark:text-[#FBFBFB] mt-1">
                            {booking.serviceTitle}
                          </h3>
                          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            {booking.scheduledTime} · {booking.workerName}
                          </p>
                          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                            {booking.address}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:flex-col sm:items-end shrink-0">
                        <span className="text-sm font-['Outfit'] font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                          {booking.estimatedCostRange}
                        </span>
                        <button
                          onClick={() => onTrackBooking(booking)}
                          className="px-4 py-2 bg-[#0F151D] dark:bg-[#FFF9F6] hover:opacity-80 text-white dark:text-[#0F151D] text-xs font-['Outfit'] font-bold rounded-lg transition-opacity flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[14px]">route</span>
                          Track Live
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Nearby Workers + Co-op Promise */}
          <div className="lg:col-span-4 space-y-6">
            {/* Nearby Verified Workers */}
            <div className="bg-white dark:bg-[#1B232E] p-5 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-['Outfit'] text-base font-bold text-[#0F151D] dark:text-[#FBFBFB] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF7448] text-[20px]">groups</span>
                  Verified Workers
                </h3>
                <button
                  onClick={() => onNavigate('marketplace')}
                  className="text-[11px] font-bold text-[#FF7448] hover:text-[#FF8D69]"
                >
                  See all
                </button>
              </div>

              {topWorkers.length === 0 ? (
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] py-4 text-center">
                  No workers nearby yet — check back soon.
                </p>
              ) : (
                <div className="space-y-3">
                  {topWorkers.map((worker) => (
                    <div
                      key={worker.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FFF9F6] dark:hover:bg-[#141D28] transition-colors"
                    >
                      <button
                        onClick={() => onSelectWorker(worker)}
                        className="flex items-center gap-3 flex-1 text-left min-w-0"
                      >
                        <Avatar
                          src={worker.avatar}
                          name={worker.name}
                          alt={worker.name}
                          className="w-11 h-11 rounded-xl object-cover border border-[#F0E5DC] dark:border-[#2E3946] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-['Outfit'] text-sm font-bold text-[#0F151D] dark:text-[#FBFBFB] truncate">
                            {worker.name}
                          </p>
                          <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] truncate">
                            {worker.roleTitle} · {worker.societyAffiliation}
                          </p>
                          <p className="text-[11px] flex items-center gap-1 text-[#D97706]">
                            <span className="material-symbols-outlined text-[13px]">star</span>
                            {worker.rating.toFixed(1)}
                            <span className="text-[#71717A] dark:text-[#A1A1AA]">
                              ({worker.reviewCount}) · {worker.responseTime}
                            </span>
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={() => onOpenBookingForWorker(worker, 'labor')}
                        title="Quick book"
                        className="w-8 h-8 shrink-0 rounded-lg bg-[#FF7448]/10 dark:bg-[#FF7448]/15 text-[#FF7448] hover:bg-[#FF7448] hover:text-white flex items-center justify-center transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">bolt</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Co-op Promise */}
            <div className="bg-gradient-to-br from-[#FF7448]/10 to-[#FF7448]/5 dark:from-[#FF7448]/10 dark:to-[#141D28] border border-[#FF7448]/20 dark:border-[#FF7448]/15 p-5 rounded-2xl shadow-xs dark:shadow-md transition-colors">
              <h3 className="font-['Outfit'] text-base font-bold text-[#0F151D] dark:text-[#FBFBFB] flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[#FF7448] text-[20px]">verified_user</span>
                The Co-op Promise
              </h3>
              <ul className="space-y-2.5">
                {[
                  { icon: 'handshake', text: 'Workers are cooperative members — fair wages, not gig exploitation.' },
                  { icon: 'receipt_long', text: 'Every invoice shows the full split: worker, society fund & platform.' },
                  { icon: 'badge', text: 'Members are society-verified and insured before dispatch.' },
                  { icon: 'how_to_vote', text: 'One member, one vote — you hire from a worker-owned platform.' }
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-2.5">
                    <span className="text-[#FF7448] material-symbols-outlined text-[17px] shrink-0">
                      {item.icon}
                    </span>
                    <span className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resource Locator */}
            <button
              onClick={onOpenResourceLocator}
              className="w-full bg-white dark:bg-[#1B232E] p-5 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md hover:border-[#D3E1FF] dark:hover:border-[#3F3F46] transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 text-left">
                <span className="w-10 h-10 rounded-xl bg-[#10B981]/10 dark:bg-[#10B981]/15 text-[#10B981] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">storefront</span>
                </span>
                <div>
                  <p className="font-['Outfit'] text-sm font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                    Local Co-op Resources
                  </p>
                  <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                    Tools, materials & services near you
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#71717A] group-hover:text-[#FF7448] transition-colors">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
