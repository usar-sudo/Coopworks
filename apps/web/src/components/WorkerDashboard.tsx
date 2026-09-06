import { personPhoto } from '../lib/portraits';
import React from 'react';
import { motion } from 'motion/react';
import { Booking } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface WorkerDashboardProps {
  bookings: Booking[];
  onOpenBookingTracker: (booking: Booking) => void;
  onOpenPayoutDetail: (booking: Booking) => void;
  onAcceptBooking: (bookingId: string) => void;
  onRejectBooking: (bookingId: string) => void;
  onTriggerEmergency: () => void;
  userName?: string;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  bookings,
  onOpenBookingTracker,
  onOpenPayoutDetail,
  onAcceptBooking,
  onRejectBooking,
  onTriggerEmergency,
  userName = 'Rahul'
}) => {
  const { t } = useLanguage();
  return (
    <div className="pt-20 pb-20 md:pb-12 min-h-screen bg-[#FFF9F6] dark:bg-[#0F151D] text-[#0F151D] dark:text-[#FBFBFB] transition-colors">
      <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-6">
        {/* Welcome Header */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1B232E] p-6 sm:p-8 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-sm dark:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
        >
          <div className="flex items-center gap-4">
            <img
              src={personPhoto(userName)}
              alt="Worker avatar"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-[#F0E5DC] dark:border-[#2E3946] shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-['Outfit'] text-2xl font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                  {t('worker.greeting', { n: userName })}
                </h1>
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              </div>
              <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                {t('worker.assignmentsLine', { n: bookings.length })}
              </p>
            </div>
          </div>

          {/* Quick Simulation Action */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onTriggerEmergency}
            className="px-4 py-2.5 bg-[#FF7448]/10 dark:bg-[#FF7448]/15 border border-[#FF7448]/30 text-[#FF7448] hover:bg-[#FF7448] hover:text-white font-['Outfit'] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">emergency</span>
            <span>{t('worker.emergencyAlert')}</span>
          </motion.button>
        </motion.div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Today's Roster */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-['Outfit'] text-lg font-bold text-[#0F151D] dark:text-[#FBFBFB] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF7448]">calendar_today</span>
                <span>{t('worker.scheduleHeader')}</span>
              </h2>
              <span className="text-xs text-[#10B981] font-semibold bg-[#10B981]/10 dark:bg-[#10B981]/15 border border-[#10B981]/30 px-2.5 py-1 rounded-full">
                {t('worker.activeOnCall')}
              </span>
            </div>

            <div className="space-y-4">
              {bookings.map((job) => (
                <motion.div
                  key={job.id}
                  whileHover={{ y: -2 }}
                  className="bg-white dark:bg-[#1B232E] p-5 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md hover:border-[#D3E1FF] dark:hover:border-[#3F3F46] transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#FF7448]">{job.scheduledTime}</span>
                        <span className="text-xs text-[#71717A]">•</span>
                        <span className="text-xs font-bold text-[#0F151D] dark:text-[#FBFBFB]">{job.clientName}</span>
                      </div>
                      <h3 className="font-['Outfit'] text-base font-bold text-[#0F151D] dark:text-[#FBFBFB] mt-1">
                        {job.serviceTitle}
                      </h3>
                      <p className="text-xs text-[#71717A] flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                        {job.address}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                        job.status === 'cancelled'
                          ? 'bg-[#EF4444]/10 dark:bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]'
                          : job.status === 'in_progress' 
                            ? 'bg-[#FF7448]/10 dark:bg-[#FF7448]/15 border border-[#FF7448]/30 text-[#FF7448]'
                            : job.status === 'accepted'
                              ? 'bg-[#10B981]/10 dark:bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]'
                              : job.status === 'en_route'
                                ? 'bg-[#10B981]/10 dark:bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]'
                                : job.status === 'requested'
                                  ? 'bg-[#F59E0B]/10 dark:bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#D97706]'
                                  : 'bg-[#F7EFE8] dark:bg-[#0F151D] text-[#71717A] border border-[#F0E5DC] dark:border-[#2E3946]'
                      }`}>
                        {t(`status.${job.status}`)}
                      </span>
                    </div>
                  </div>

                  {/* Incoming Request Banner */}
                  {job.status === 'requested' && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#FF7448]/10 dark:bg-[#FF7448]/15 border border-[#FF7448]/25 rounded-xl">
                      <span className="w-2 h-2 rounded-full bg-[#FF7448] animate-pulse"></span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF7448]">{t('worker.newIncoming')}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-[#F0E5DC] dark:border-[#2A3441] gap-2">
                    <span className="text-xs font-semibold text-[#10B981]">
                      {t('worker.estPayout')} {job.estimatedCostRange}
                    </span>

                    <div className="flex items-center gap-2">
                      {job.status === 'requested' ? (
                        <>
                          <button
                            onClick={() => onRejectBooking(job.id)}
                            className="px-3.5 py-1.5 bg-[#FFF9F6] dark:bg-[#0F151D] hover:bg-[#EF4444]/10 text-[#EF4444] text-xs font-['Outfit'] font-bold rounded-lg border border-[#F0E5DC] dark:border-[#2E3946] hover:border-[#EF4444]/30 transition-colors"
                          >
                            {t('common.decline')}
                          </button>
                          <button
                            onClick={() => onAcceptBooking(job.id)}
                            className="px-4 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-['Outfit'] font-bold rounded-lg transition-colors shadow-xs shadow-[#10B981]/20 flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            {t('worker.acceptBooking')}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => onOpenBookingTracker(job)}
                            className="px-3.5 py-1.5 bg-[#FFF9F6] dark:bg-[#0F151D] hover:bg-[#F7EFE8] dark:hover:bg-[#2A3441] text-[#0F151D] dark:text-[#FBFBFB] text-xs font-['Outfit'] font-bold rounded-lg border border-[#F0E5DC] dark:border-[#2E3946] transition-colors"
                          >
                            {t('worker.dispatchTracker')}
                          </button>
                          <button
                            onClick={() => onOpenPayoutDetail(job)}
                            className="px-3.5 py-1.5 bg-[#FF7448] hover:bg-[#FF8D69] text-white text-xs font-['Outfit'] font-bold rounded-lg transition-colors shadow-xs shadow-[#FF7448]/20"
                          >
                            {t('worker.payoutBreakdown')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column: Weekly Summary & Co-op Bulletin */}
          <div className="lg:col-span-4 space-y-6">
            {/* Weekly Summary Card */}
            <div className="bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md space-y-4 transition-colors">
              <h3 className="font-['Outfit'] text-base font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                {t('worker.weeklySummary')}
              </h3>

              <div className="space-y-3">
                <div className="p-4 bg-[#FFF9F6] dark:bg-[#141D28] rounded-xl border border-[#F0E5DC] dark:border-[#2A3441]">
                  <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">{t('worker.estEarnings')}</p>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="font-['Outfit'] text-2xl font-bold text-[#0F151D] dark:text-[#FBFBFB]">₹8,450</span>
                    <span className="text-xs font-bold text-[#10B981]">+12% vs last wk</span>
                  </div>
                </div>

                <div className="p-4 bg-[#FFF9F6] dark:bg-[#141D28] rounded-xl border border-[#F0E5DC] dark:border-[#2A3441]">
                  <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">{t('worker.hoursLogged')}</p>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="font-['Outfit'] text-2xl font-bold text-[#0F151D] dark:text-[#FBFBFB]">32.5 hrs</span>
                    <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{t('worker.target', { n: '40 hrs' })}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenPayoutDetail(bookings[0])}
                className="w-full py-2.5 bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] text-[#0F151D] dark:text-[#FBFBFB] text-xs font-['Outfit'] font-bold rounded-xl hover:bg-[#F7EFE8] dark:hover:bg-[#2A3441] transition-colors text-center"
              >
                {t('worker.viewPayoutSlips')}
              </button>
            </div>

            {/* Co-op Bulletin Card */}
            <div className="bg-white dark:bg-[#1B232E] border border-[#F0E5DC] dark:border-[#2A3441] text-[#0F151D] dark:text-[#FBFBFB] p-6 rounded-2xl shadow-xs dark:shadow-md space-y-3 transition-colors">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF7448] text-[20px]">campaign</span>
                <h4 className="font-['Outfit'] font-bold text-sm text-[#0F151D] dark:text-[#FBFBFB]">{t('worker.coopBulletin')}</h4>
              </div>

              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                New voting item open: <strong>2024 Tool Sharing & Heavy Machinery Access policy</strong>. Ballot closes in 48 hours.
              </p>

              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/25 rounded-full px-3 py-1.5 mt-1">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {t('worker.votingCloses')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
