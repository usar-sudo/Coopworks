import React from 'react';
import { UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenNewBooking: () => void;
  userRole: UserRole;
  onTriggerEmergency: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenNewBooking,
  userRole,
  onTriggerEmergency
}) => {
  const { t } = useLanguage();
  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-[#FFF9F6]/80 dark:bg-[#1B232E]/75 backdrop-blur-2xl backdrop-saturate-150 border-t border-white/60 dark:border-white/10 px-4 py-2 flex items-center justify-around shadow-lg dark:shadow-2xl transition-colors">
      {/* Customer Mobile Navigation */}
      {userRole === 'customer' && (
        <>
          <button
            onClick={() => onNavigate('customer_home')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentView === 'customer_home' 
                ? 'text-[#FF7448]' 
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">home</span>
            <span className="text-[10px] font-medium font-['Outfit']">{t('bottom.home')}</span>
          </button>

          {/* Floating Center Action */}
          <button
            onClick={onOpenNewBooking}
            className="w-11 h-11 -mt-5 rounded-full bg-[#FF7448] text-white flex items-center justify-center shadow-lg shadow-[#FF7448]/30 active:scale-95 transition-transform"
            title={t('bottom.book')}
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>

          <button
            onClick={() => onNavigate('tracker')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentView === 'tracker' 
                ? 'text-[#FF7448]' 
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">schedule</span>
            <span className="text-[10px] font-medium font-['Outfit']">{t('bottom.bookings')}</span>
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentView === 'profile' 
                ? 'text-[#FF7448]' 
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">account_circle</span>
            <span className="text-[10px] font-medium font-['Outfit']">{t('bottom.profile')}</span>
          </button>
        </>
      )}

      {/* Worker Mobile Navigation */}
      {userRole === 'worker' && (
        <>
          <button
            onClick={() => onNavigate('worker_roster')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentView === 'worker_roster' 
                ? 'text-[#FF7448]' 
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">dashboard</span>
            <span className="text-[10px] font-medium font-['Outfit']">{t('bottom.dispatch')}</span>
          </button>

          {/* Center Emergency Trigger */}
          <button
            onClick={onTriggerEmergency}
            className="w-11 h-11 -mt-5 rounded-full bg-[#FF7448] text-white flex items-center justify-center shadow-lg shadow-[#FF7448]/30 active:scale-95 transition-transform"
            title="Test Emergency Alert"
          >
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              emergency
            </span>
          </button>

          <button
            onClick={() => onNavigate('tracker')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentView === 'tracker' 
                ? 'text-[#FF7448]' 
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">route</span>
            <span className="text-[10px] font-medium font-['Outfit']">{t('bottom.onSite')}</span>
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentView === 'profile' 
                ? 'text-[#FF7448]' 
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">account_circle</span>
            <span className="text-[10px] font-medium font-['Outfit']">{t('bottom.profile')}</span>
          </button>
        </>
      )}

      {/* Admin Mobile Navigation */}
      {(userRole === 'society_admin' || userRole === 'federation_admin') && (
        <>
          <button
            onClick={() => onNavigate('federation')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentView === 'federation' 
                ? 'text-[#2B3A4A] dark:text-[#9FB3C8]' 
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">account_balance</span>
            <span className="text-[10px] font-medium font-['Outfit']">{t('bottom.council')}</span>
          </button>

          <button
            onClick={() => onNavigate('society_admin')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentView === 'society_admin' 
                ? 'text-[#2B3A4A] dark:text-[#9FB3C8]' 
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">domain</span>
            <span className="text-[10px] font-medium font-['Outfit']">{t('bottom.societies')}</span>
          </button>

          <button
            onClick={() => onNavigate('approvals')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentView === 'approvals' 
                ? 'text-[#2B3A4A] dark:text-[#9FB3C8]' 
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">fact_check</span>
            <span className="text-[10px] font-medium font-['Outfit']">{t('bottom.approvals')}</span>
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentView === 'profile' 
                ? 'text-[#2B3A4A] dark:text-[#9FB3C8]' 
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">account_circle</span>
            <span className="text-[10px] font-medium font-['Outfit']">{t('bottom.profile')}</span>
          </button>
        </>
      )}
    </div>
  );
};

