import React from 'react';
import { UserRole } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LANG_LABEL } from '../lib/i18n';
import { initialsAvatar } from '../lib/dbMapper';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  userRole: UserRole;
  isLoggedIn: boolean;
  onOpenLogin: () => void;
  onOpenRegister: (mode?: 'customer' | 'worker') => void;
  onTriggerEmergency: () => void;
  onOpenNewBooking: () => void;
  pendingApprovalsCount: number;
  /** Signed-in display name (avatar monogram + pill label). */
  userName?: string;
  /** Opens the account profile view (avatar tap). */
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  userRole,
  isLoggedIn,
  onOpenLogin,
  onOpenRegister,
  onTriggerEmergency,
  onOpenNewBooking,
  pendingApprovalsCount,
  userName = '',
  onOpenProfile,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { t, lang, setLang } = useLanguage();

  const roleLabel =
    userRole === 'customer' ? t('role.customer') : userRole === 'worker' ? t('role.worker') : t('role.admin');
  const avatarName = userName || (userRole === 'customer' ? 'Customer' : userRole === 'worker' ? 'Worker' : 'Admin');

  const navBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-lg font-['Outfit'] text-sm font-medium transition-all ${
      active
        ? 'text-[#FF7448] font-semibold bg-white dark:bg-[#0F151D] shadow-xs border-b-2 border-[#FF7448]'
        : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB] hover:bg-black/5 dark:hover:bg-white/5'
    }`;
  const adminNavBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-lg font-['Outfit'] text-sm font-medium transition-all ${
      active
        ? 'text-[#2B3A4A] dark:text-[#9FB3C8] font-semibold bg-white dark:bg-[#0F151D] shadow-xs border-b-2 border-[#2B3A4A] dark:border-[#9FB3C8]'
        : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB] hover:bg-black/5 dark:hover:bg-white/5'
    }`;

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#FFF9F6]/75 dark:bg-[#0F151D]/70 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/60 dark:border-white/10 shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Role-Specific Nav Links */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              if (userRole === 'customer') onNavigate('landing');
              else if (userRole === 'worker') onNavigate('worker_roster');
              else onNavigate('federation');
            }}
            className="text-left font-['Outfit'] text-xl sm:text-2xl font-bold text-[#0F151D] dark:text-[#FBFBFB] tracking-tight hover:opacity-90 transition-opacity flex items-center gap-2.5"
          >
            <span className="w-8 h-8 rounded-lg bg-[#FF7448] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-[#FF7448]/25">
              CW
            </span>
            <span className="flex items-center gap-2">
              Coopworks
              {isLoggedIn && (
                <span className="hidden lg:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#FF7448]/10 text-[#FF7448] dark:bg-[#FF7448]/20 border border-[#FF7448]/30">
                  {roleLabel}
                </span>
              )}
            </span>
          </button>

          {/* Customer Navigation */}
          {isLoggedIn && userRole === 'customer' && (
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[#F0E5DC] dark:border-[#2A3441]">
              <button onClick={() => onNavigate('customer_home')} className={navBtn(currentView === 'customer_home')}>
                {t('nav.overview')}
              </button>
              <button
                onClick={() => onNavigate('marketplace')}
                className={navBtn(currentView === 'marketplace' || currentView === 'worker_profile')}
              >
                {t('nav.findWorker')}
              </button>
              <button onClick={() => onNavigate('tracker')} className={navBtn(currentView === 'tracker')}>
                {t('nav.bookings')}
              </button>
            </nav>
          )}

          {/* Worker Navigation */}
          {isLoggedIn && userRole === 'worker' && (
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[#F0E5DC] dark:border-[#2A3441]">
              <button onClick={() => onNavigate('worker_roster')} className={navBtn(currentView === 'worker_roster')}>
                {t('nav.dispatchDesk')}
              </button>
              <button onClick={() => onNavigate('tracker')} className={navBtn(currentView === 'tracker')}>
                {t('nav.activeJob')}
              </button>
              <button onClick={() => onNavigate('worker_profile')} className={navBtn(currentView === 'worker_profile')}>
                {t('nav.publicProfile')}
              </button>
            </nav>
          )}

          {/* Admin Navigation */}
          {isLoggedIn && (userRole === 'society_admin' || userRole === 'federation_admin') && (
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[#F0E5DC] dark:border-[#2A3441]">
              <button onClick={() => onNavigate('federation')} className={adminNavBtn(currentView === 'federation')}>
                {t('nav.federationCouncil')}
              </button>
              <button
                onClick={() => onNavigate('society_admin')}
                className={adminNavBtn(currentView === 'society_admin')}
              >
                {t('nav.societyOps')}
              </button>
              <button onClick={() => onNavigate('approvals')} className={`${adminNavBtn(currentView === 'approvals')} flex items-center gap-1.5`}>
                <span>{t('nav.accreditations')}</span>
                {pendingApprovalsCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#FF7448] text-white text-[10px] font-bold rounded-full">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
            </nav>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Logged-out entry actions (marketing header) */}
          {!isLoggedIn && (
            <>
              <button
                onClick={() => onOpenRegister()}
                className="flex items-center gap-1 px-3 py-1.5 border border-[#F0E5DC] dark:border-[#2E3946] text-[#0F151D] dark:text-[#FBFBFB] rounded-lg text-xs font-['Outfit'] font-bold hover:border-[#D3E1FF] dark:hover:border-[#3F3F46] transition-colors cursor-pointer"
              >
                Register
              </button>
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1 px-3.5 py-1.5 bg-[#FF7448] text-white rounded-lg hover:bg-[#FF8D69] text-xs font-['Outfit'] font-bold transition-colors shadow-sm shadow-[#FF7448]/20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">login</span>
                Log in
              </button>
            </>
          )}

          {isLoggedIn && userRole === 'customer' && (
            <button
              onClick={onOpenNewBooking}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-[#FF7448] text-white rounded-lg hover:bg-[#FF8D69] active:scale-95 transition-all font-bold text-xs uppercase tracking-wider shadow-sm shadow-[#FF7448]/20"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>{t('nav.bookTrade')}</span>
            </button>
          )}

          {isLoggedIn && userRole === 'worker' && (
            <button
              onClick={onTriggerEmergency}
              title={t('nav.emergency')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#FF7448]/10 dark:bg-[#FF7448]/20 text-[#FF7448] border border-[#FF7448]/30 rounded-lg hover:bg-[#FF7448] hover:text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                emergency
              </span>
              <span>{t('nav.emergency')}</span>
            </button>
          )}

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            title={t('common.lang')}
            aria-label={t('common.lang')}
            className="h-9 px-2 rounded-lg bg-white/70 dark:bg-[#1B232E]/80 backdrop-blur border border-[#F0E5DC] dark:border-[#2A3441] flex items-center gap-1.5 text-[11px] font-bold text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB] hover:border-[#D3E1FF] dark:hover:border-[#3F3F46] transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[15px]">language</span>
            <span>{lang === 'en' ? 'EN' : 'हिं'}</span>
            <span className="hidden sm:inline text-[#71717A] dark:text-[#A1A1AA] font-medium normal-case">
              {LANG_LABEL[lang === 'en' ? 'hi' : 'en']}
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={t('common.theme')}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-9 h-9 rounded-lg bg-white/70 dark:bg-[#1B232E]/80 backdrop-blur border border-[#F0E5DC] dark:border-[#2A3441] flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB] hover:border-[#D3E1FF] dark:hover:border-[#3F3F46] transition-all shadow-xs"
          >
            {theme === 'dark' ? (
              <span className="material-symbols-outlined text-[18px] text-[#F59E0B]">light_mode</span>
            ) : (
              <span className="material-symbols-outlined text-[18px] text-[#475569]">dark_mode</span>
            )}
          </button>

          {/* Profile (tap to open account profile) — signed in only */}
          {isLoggedIn && (
            <button
              onClick={onOpenProfile}
              title={t('profile.open')}
              aria-label={t('profile.open')}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-white dark:border-[#1B232E] ring-2 ring-[#FF7448]/40 hover:ring-[#FF7448] transition-all shadow-md active:scale-95"
            >
              <img src={initialsAvatar(avatarName, 72)} alt="My profile" className="w-full h-full object-cover" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
