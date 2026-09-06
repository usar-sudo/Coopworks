import React from 'react';
import { UserRole } from '../types';
import { initialsAvatar } from '../lib/dbMapper';
import { useLanguage } from '../context/LanguageContext';

interface ProfileViewProps {
  userRole: UserRole;
  isLiveMode?: boolean;
  userName?: string;
  userEmail?: string;
  /** Demo-mode only: switch the simulated workspace role. */
  onSwitchRole?: (role: UserRole) => void;
  onNavigate: (view: string) => void;
  onSignOut?: () => void;
  onDeleteAccount?: () => void;
}

const ROLE_INFO: Record<UserRole, { label: string; blurb: string; view: string; icon: string; color: string }> = {
  customer: {
    label: 'Customer',
    blurb: 'Find verified workers near you, book a job and track it live until it is done.',
    view: 'marketplace',
    icon: 'person',
    color: '#FF7448',
  },
  worker: {
    label: 'Worker',
    blurb: 'Your jobs, live on-site work, payment breakup and society voting.',
    view: 'worker_roster',
    icon: 'engineering',
    color: '#10B981',
  },
  society_admin: {
    label: 'Society Admin',
    blurb: 'Verify new workers, review society bookings and keep your local co-op healthy.',
    view: 'federation',
    icon: 'domain',
    color: '#2B3A4A',
  },
  federation_admin: {
    label: 'Federation Admin',
    blurb: 'Oversight across societies, approvals and federation-level decisions.',
    view: 'federation',
    icon: 'admin_panel_settings',
    color: '#2B3A4A',
  },
};

export const ProfileView: React.FC<ProfileViewProps> = ({
  userRole,
  isLiveMode = false,
  userName = '',
  userEmail,
  onSwitchRole,
  onNavigate,
  onSignOut,
  onDeleteAccount,
}) => {
  const { t } = useLanguage();
  const info = ROLE_INFO[userRole];
  const displayName = userName || info.label;

  return (
    <div className="pt-20 pb-20 md:pb-12 min-h-screen bg-[#FFF9F6] dark:bg-[#0F151D] text-[#0F151D] dark:text-[#FBFBFB] transition-colors">
      <div className="max-w-3xl mx-auto px-4 md:px-6 space-y-6">
        {/* Identity card */}
        <div className="bg-white dark:bg-[#1B232E] p-6 md:p-8 rounded-3xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-xl transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <img
              src={initialsAvatar(displayName, 112)}
              alt="Profile"
              className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl border border-[#F0E5DC] dark:border-[#2E3946] shadow-md"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border"
                style={{ color: info.color, borderColor: info.color + '55', background: info.color + '14' }}
              >
                {userRole === 'customer'
                  ? t('role.customer')
                  : userRole === 'worker'
                    ? t('role.worker')
                    : t('role.admin')}
              </span>
              {isLiveMode && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30">
                  {t('profile.verifiedAccount')}
                </span>
              )}
              </div>
              <h1 className="font-['Outfit'] text-2xl md:text-3xl font-bold mt-2">{displayName}</h1>
              {isLiveMode && userEmail && (
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">{userEmail}</p>
              )}
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed mt-2">{info.blurb}</p>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-2 mt-6 pt-6 border-t border-[#F0E5DC] dark:border-[#2A3441]">
            <button
              onClick={() => onNavigate(info.view)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#FFF9F6] dark:bg-[#0F151D] hover:bg-[#F7EFE8] dark:hover:bg-[#2A3441] rounded-xl border border-[#F0E5DC] dark:border-[#2E3946] text-xs font-['Outfit'] font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">{info.icon}</span>
              {t('profile.openWorkspace', {
                n:
                  userRole === 'customer'
                    ? t('role.customer')
                    : userRole === 'worker'
                      ? t('role.worker')
                      : t('role.admin')
              })}
            </button>
            <button
              onClick={() => onNavigate('tracker')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#FFF9F6] dark:bg-[#0F151D] hover:bg-[#F7EFE8] dark:hover:bg-[#2A3441] rounded-xl border border-[#F0E5DC] dark:border-[#2E3946] text-xs font-['Outfit'] font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              {t('profile.bookingsAndTracker')}
            </button>
          </div>
        </div>

        {/* Account actions — Sign Out & Delete are available in every mode so
            the user can always leave or remove the account. */}
        {(onSignOut || onDeleteAccount) && (
          <div className="bg-white dark:bg-[#1B232E] p-6 rounded-3xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-xl space-y-3 transition-colors">
            <h2 className="font-['Outfit'] text-base font-bold text-[#0F151D] dark:text-[#FBFBFB] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#FF7448]">manage_accounts</span>
              {t('profile.account')}
            </h2>
            {isLiveMode && (
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                Your role and society come from your verified account. You can only ever see the
                dashboards for your own role.
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="flex-1 py-3 bg-[#FFF9F6] dark:bg-[#0F151D] hover:bg-[#F7EFE8] dark:hover:bg-[#2A3441] rounded-xl border border-[#F0E5DC] dark:border-[#2E3946] text-xs font-['Outfit'] font-bold text-[#0F151D] dark:text-[#FBFBFB] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  {t('profile.signOut')}
                </button>
              )}
              {onDeleteAccount && (
                <button
                  onClick={onDeleteAccount}
                  className="flex-1 py-3 bg-[#B23A2E]/5 hover:bg-[#B23A2E]/15 rounded-xl border border-[#B23A2E]/30 text-[#B23A2E] text-xs font-['Outfit'] font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">person_remove</span>
                  {t('profile.deleteAccount')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Demo-mode workspace switcher (never shown on the hosted site) */}
        {!isLiveMode && onSwitchRole && (
          <div className="bg-white dark:bg-[#1B232E] p-6 rounded-3xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-xl space-y-4 transition-colors">
            <div>
              <h2 className="font-['Outfit'] text-base font-bold text-[#0F151D] dark:text-[#FBFBFB] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#FF7448]">swap_horiz</span>
                {t('profile.demoPreview')}
              </h2>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1 leading-relaxed">
                Switch between the customer, worker and admin workspaces to explore the platform —
                each role opens its own dashboards and permissions.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  { role: 'customer' as UserRole, label: 'Customer', icon: 'person' },
                  { role: 'worker' as UserRole, label: 'Worker', icon: 'engineering' },
                  { role: 'federation_admin' as UserRole, label: 'Federation Admin', icon: 'admin_panel_settings' },
                ]
              ).map(({ role, label, icon }) => (
                <button
                  key={role}
                  onClick={() => onSwitchRole(role)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-xs font-['Outfit'] font-bold transition-colors text-left ${
                    userRole === role
                      ? 'bg-[#FF7448]/10 border-[#FF7448]/40 text-[#FF7448]'
                      : 'bg-[#FFF9F6] dark:bg-[#0F151D] hover:bg-[#F7EFE8] dark:hover:bg-[#2A3441] border-[#F0E5DC] dark:border-[#2E3946] text-[#0F151D] dark:text-[#FBFBFB]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{icon}</span>
                  {role === 'customer'
                    ? t('role.customer')
                    : role === 'worker'
                      ? t('role.worker')
                      : t('role.admin')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
