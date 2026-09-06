import React, { useState } from 'react';
import { motion } from 'motion/react';
import { WorkerProfile } from '../types';
import { PromiseModal } from './PromiseModal';
import { Avatar } from './Avatar';
import { useLanguage } from '../context/LanguageContext';

interface WorkerProfileProps {
  worker: WorkerProfile;
  onBack: () => void;
  onOpenBooking: (worker: WorkerProfile, initialMode: 'consultation' | 'labor') => void;
  userRole: 'customer' | 'worker' | 'society_admin' | 'federation_admin';
}

export const WorkerProfileView: React.FC<WorkerProfileProps> = ({
  worker,
  onBack,
  onOpenBooking,
  userRole
}) => {
  const { t } = useLanguage();
  const [selectedServiceMode, setSelectedServiceMode] = useState<'consultation' | 'labor'>('labor');
  const [showPromise, setShowPromise] = useState(false);
  
  // Only customers can book workers; workers/admins can view profiles
  const isCustomer = userRole === 'customer';

  return (
    <div className="pt-20 pb-20 md:pb-12 min-h-screen bg-[#FFF9F6] dark:bg-[#0F151D] text-[#0F151D] dark:text-[#FBFBFB] transition-colors">
      <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-6">
        {/* Back navigation button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-['Outfit'] font-bold text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB] transition-colors py-1"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>{t('wp.backToWorkers')}</span>
        </button>

        {/* Worker Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1B232E] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] p-6 md:p-8 shadow-xs dark:shadow-xl transition-colors"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              <Avatar
                src={worker.avatar}
                name={worker.name}
                alt={worker.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-[#F0E5DC] dark:border-[#2E3946] shadow-md"
              />
              <div className="absolute -bottom-2 -right-2 bg-[#10B981] text-white p-1 rounded-lg shadow-md">
                <span className="material-symbols-outlined text-[16px] block font-bold">verified</span>            </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                      {worker.name}
                    </h1>
                    <span className="px-2 py-0.5 bg-[#10B981]/10 dark:bg-[#10B981]/15 text-[#10B981] text-xs font-semibold rounded-md border border-[#10B981]/30">
                      Verified Member
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#FF7448]">{worker.roleTitle} • {worker.societyAffiliation}</p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-2xl font-bold font-['Outfit'] text-[#0F151D] dark:text-[#FBFBFB]">
                    ₹{selectedServiceMode === 'labor' ? worker.hourlyRateLabor : worker.hourlyRateConsultation}
                    <span className="text-xs font-normal text-[#71717A]">{t('wp.perHour')}</span>
                  </div>
                  <span className="text-[11px] text-[#10B981] font-medium">{t('wp.fixedQuote')}</span>
                </div>            </div>

              {/* Stats badges bar */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#71717A]">
                <span className="flex items-center gap-1 font-semibold text-[#0F151D] dark:text-[#FBFBFB]">
                  <span className="material-symbols-outlined text-[16px] text-[#F59E0B]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  {worker.rating} <span className="font-normal text-[#71717A]">({worker.reviewCount} reviews)</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium text-[#0F151D] dark:text-[#FBFBFB]">
                  <span className="material-symbols-outlined text-[16px] text-[#10B981]">task_alt</span>
                  {worker.completedJobsCount} Jobs Completed
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium text-[#0F151D] dark:text-[#FBFBFB]">
                  <span className="material-symbols-outlined text-[16px] text-[#FF7448] dark:text-[#FF7448]">schedule</span>
                  Response: {worker.responseTime}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium text-[#0F151D] dark:text-[#FBFBFB]">
                  <span className="material-symbols-outlined text-[16px] text-[#10B981]">security</span>
                  {worker.insuranceStatus}
                </span>            </div>
            </div>
          </div>
        </motion.div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Info */}
          <div className="lg:col-span-8 space-y-6">
            {/* Verified Skills */}
            <div className="bg-white dark:bg-[#1B232E] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] p-6 shadow-xs dark:shadow-md transition-colors">
              <h2 className="font-['Outfit'] text-lg font-bold text-[#0F151D] dark:text-[#FBFBFB] mb-4">
                Verified Skills
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {worker.skills.map((skill) => (
                  <div
                    key={skill.name}
                    className="p-3 bg-[#FFF9F6] dark:bg-[#141D28] border border-[#F0E5DC] dark:border-[#2A3441] rounded-xl flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#FF7448]/10 dark:bg-[#FF7448]/15 text-[#FF7448] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">{skill.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-['Outfit'] font-bold text-xs text-[#0F151D] dark:text-[#FBFBFB]">{skill.name}</h4>
                      <p className="text-[10px] text-[#10B981] font-medium">{t('wp.checkedBySociety')}</p>
                    </div>
                  </div>
                ))}            </div>
            </div>

            {/* Bio & Experience */}
            <div className="bg-white dark:bg-[#1B232E] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] p-6 shadow-xs dark:shadow-md transition-colors">
              <h2 className="font-['Outfit'] text-lg font-bold text-[#0F151D] dark:text-[#FBFBFB] mb-3">
                {t('wp.experienceSociety')}
              </h2>
              <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                {worker.bio}
              </p>

              <div className="mt-6 pt-4 border-t border-[#F0E5DC] dark:border-[#2A3441] grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[11px] text-[#71717A]">{t('wp.regionalSociety')}</p>
                  <p className="font-['Outfit'] font-bold text-xs text-[#0F151D] dark:text-[#FBFBFB] mt-0.5">{worker.societyAffiliation}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#71717A]">{t('wp.membershipId')}</p>
                  <p className="font-['Outfit'] font-bold text-xs text-[#0F151D] dark:text-[#FBFBFB] mt-0.5">{worker.guildNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#71717A]">{t('wp.societyShare')}</p>
                  <p className="font-['Outfit'] font-bold text-xs text-[#10B981] mt-0.5">{t('wp.memberDividend')}</p>
                </div>            </div>
            </div>

            {/* Recent Projects */}
            <div className="bg-white dark:bg-[#1B232E] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] p-6 shadow-xs dark:shadow-md transition-colors">
              <h2 className="font-['Outfit'] text-lg font-bold text-[#0F151D] dark:text-[#FBFBFB] mb-4">
                Recent Cooperative Projects
              </h2>
              <div className="space-y-3">
                {worker.recentProjects.map((project, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#FFF9F6] dark:bg-[#141D28] border border-[#F0E5DC] dark:border-[#2A3441] rounded-xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] text-[#0F151D] dark:text-[#FBFBFB] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[22px]">{project.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-['Outfit'] font-bold text-sm text-[#0F151D] dark:text-[#FBFBFB]">{project.title}</h4>
                        <p className="text-xs text-[#71717A]">{project.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 font-semibold text-xs text-[#0F151D] dark:text-[#FBFBFB]">
                      <span className="material-symbols-outlined text-[16px] text-[#F59E0B]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                      <span>{project.rating}</span>
                    </div>
                  </div>
                ))}            </div>
            </div>
          </div>

          {/* Booking Widget Sidebar */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
            <div className="bg-white dark:bg-[#1B232E] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] p-6 shadow-sm dark:shadow-xl space-y-5 transition-colors">
              {isCustomer && (
                <>
                  <h3 className="font-['Outfit'] text-lg font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                    Book Service
                  </h3>

                  {/* Service Selection Radios */}
                  <div className="space-y-3">
                <label 
                  onClick={() => setSelectedServiceMode('consultation')}
                  className={`p-3.5 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                    selectedServiceMode === 'consultation'
                      ? 'border-[#FF7448] bg-[#FFF9F6] dark:bg-[#0F151D] ring-1 ring-[#FF7448]'
                      : 'border-[#F0E5DC] dark:border-[#2A3441] bg-[#FFF9F6] dark:bg-[#141D28] hover:border-[#D3E1FF] dark:hover:border-[#3F3F46]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="serviceMode"
                      checked={selectedServiceMode === 'consultation'}
                      onChange={() => setSelectedServiceMode('consultation')}
                      className="mt-0.5 text-[#FF7448] focus:ring-[#FF7448]"
                    />
                    <div>
                      <div className="font-['Outfit'] font-bold text-xs text-[#0F151D] dark:text-[#FBFBFB]">{t('booking.consultation')}</div>
                      <div className="text-[11px] text-[#71717A]">{t('wp.consultationDesc')}</div>
                    </div>
                  </div>
                  <div className="font-['Outfit'] font-bold text-xs text-[#0F151D] dark:text-[#FBFBFB]">
                    ₹{worker.hourlyRateConsultation}/hr
                  </div>
                </label>

                <label 
                  onClick={() => setSelectedServiceMode('labor')}
                  className={`p-3.5 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                    selectedServiceMode === 'labor'
                      ? 'border-[#FF7448] bg-[#FFF9F6] dark:bg-[#0F151D] ring-1 ring-[#FF7448]'
                      : 'border-[#F0E5DC] dark:border-[#2A3441] bg-[#FFF9F6] dark:bg-[#141D28] hover:border-[#D3E1FF] dark:hover:border-[#3F3F46]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="serviceMode"
                      checked={selectedServiceMode === 'labor'}
                      onChange={() => setSelectedServiceMode('labor')}
                      className="mt-0.5 text-[#FF7448] focus:ring-[#FF7448]"
                    />
                    <div>
                      <div className="font-['Outfit'] font-bold text-xs text-[#0F151D] dark:text-[#FBFBFB]">{t('wp.fullJob')}</div>
                      <div className="text-[11px] text-[#71717A]">{t('wp.fullJobDesc')}</div>
                    </div>
                  </div>
                  <div className="font-['Outfit'] font-bold text-xs text-[#0F151D] dark:text-[#FBFBFB]">
                    ₹{worker.hourlyRateLabor}/hr
                  </div>
                  </label>
                  </div>
                </>
              )}

              {/* Action Button - Only visible to customers */}
              {isCustomer && (
                <button
                  onClick={() => onOpenBooking(worker, selectedServiceMode)}
                  className="w-full py-3.5 bg-[#FF7448] text-white font-['Outfit'] font-bold text-sm rounded-xl hover:bg-[#FF8D69] shadow-md shadow-[#FF7448]/20 transition-all flex items-center justify-center gap-2"
                >
                  <span>{t('wp.requestAvailability')}</span>
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                </button>
              )}
              {!isCustomer && (
                <div className="w-full py-3.5 bg-[#F0E5DC] dark:bg-[#2A3441] text-[#71717A] dark:text-[#A1A1AA] font-['Outfit'] font-bold text-sm rounded-xl flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                  <span>{t('wp.restrictedToCustomers')}</span>
                </div>
              )}
              {isCustomer && (
                <div className="text-center">
                  <span className="text-[11px] text-[#71717A]">
                    You pay only after the work is done and you confirm it.
                  </span>
                </div>
              )}

              {/* Cooperative Guarantee Box */}
              <div className="bg-white dark:bg-[#1B232E] border border-[#F0E5DC] dark:border-[#2A3441] p-5 rounded-2xl space-y-3 shadow-xs dark:shadow-md transition-colors">
                <div className="flex items-center gap-2 text-[#10B981]">
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                  <span className="font-['Outfit'] font-bold text-xs uppercase tracking-wider">{t('wp.ourGuarantee')}</span>
                </div>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                  Every job booked through Coopworks is covered by our <strong>₹50L worker protection fund</strong>. If work is not done properly, your society fixes it or refunds you.
                </p>
                <button
                  onClick={() => setShowPromise(true)}
                  className="w-full py-2.5 mt-1 bg-[#FFF9F6] dark:bg-[#0F151D] hover:bg-[#F7EFE8] dark:hover:bg-[#2A3441] border border-[#F0E5DC] dark:border-[#2E3946] rounded-xl text-xs font-['Outfit'] font-bold text-[#0F151D] dark:text-[#FBFBFB] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#FF7448]">handshake</span>
                  <span>{t('wp.seeFullPromise')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our promise popup (shared — copy lives in lib/promise.ts) */}
      <PromiseModal
        open={showPromise}
        onClose={() => setShowPromise(false)}
        primary={{
          label: 'Book this worker',
          onAction: () => {
            setShowPromise(false);
            onOpenBooking(worker, selectedServiceMode);
          },
        }}
      />
    </div>
  );
};
