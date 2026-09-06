import React from 'react';
import { motion } from 'motion/react';
import { UserRole } from '../types';
import { initialsAvatar } from '../lib/dbMapper';
import { useLanguage } from '../context/LanguageContext';

// Role → i18n keys for the login cards (label + blurb).
const ROLE_LABEL_KEY: Record<string, string> = {
  customer: 'login.roleCustomer',
  worker: 'login.roleWorker',
  society_admin: 'login.roleSocietyAdmin',
  federation_admin: 'login.roleFederationAdmin',
};

const ROLE_BLURB_KEY: Record<string, string> = {
  customer: 'login.findVerifiedWorkers',
  worker: 'login.workerBlurb',
  society_admin: 'login.societyAdminBlurb',
  federation_admin: 'login.federationAdminBlurb',
};

interface LoginViewProps {
  onLogin: (role: UserRole, name: string) => void;
  onOpenRegister: (mode?: 'customer' | 'worker') => void;
  onBackHome: () => void;
}

interface RoleCard {
  role: UserRole;
  label: string;
  name: string;
  icon: string;
  color: string;
  blurb: string;
}

// Public member accounts — anyone can create these by registering.
const MEMBER_ROLES: RoleCard[] = [
  {
    role: 'customer',
    label: 'Customer',
    name: 'Aarav Mehta',
    icon: 'person',
    color: '#FF7448',
    blurb: 'Find verified workers near you, book a job and track it live until it is done.',
  },
  {
    role: 'worker',
    label: 'Worker',
    name: 'Marcus Cole',
    icon: 'engineering',
    color: '#10B981',
    blurb: 'Your jobs, live on-site work, payment breakup and society voting.',
  },
];

// Back-office accounts — opened by the co-op only, never by public registration.
const ADMIN_ROLES: RoleCard[] = [
  {
    role: 'society_admin',
    label: 'Society Admin',
    name: 'Meera Nair',
    icon: 'domain',
    color: '#2B3A4A',
    blurb: 'Verify new workers, review society bookings and keep your local co-op healthy.',
  },
  {
    role: 'federation_admin',
    label: 'Federation Admin',
    name: 'Arjun Rao',
    icon: 'admin_panel_settings',
    color: '#2B3A4A',
    blurb: 'Oversight across societies, approvals and federation-level decisions.',
  },
];

function RoleCardButton({
  r,
  idx,
  onLogin,
}: {
  r: RoleCard;
  idx: number;
  onLogin: (role: UserRole, name: string) => void;
}) {
  const { t } = useLanguage();
  const label = t(ROLE_LABEL_KEY[r.role]);
  return (
    <motion.button
      key={r.role}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 * idx, ease: 'easeOut' }}
      onClick={() => onLogin(r.role, r.name)}
      whileHover={{ y: -3 }}
      className="text-left bg-white dark:bg-[#1B232E] border border-[#F0E5DC] dark:border-[#2A3441] rounded-2xl p-5 shadow-xs dark:shadow-md hover:shadow-md hover:border-[#D3E1FF] dark:hover:border-[#3F3F46] transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3.5">
        <img
          src={initialsAvatar(r.name, 96)}
          alt={`${r.label} account for ${r.name}`}
          className="w-12 h-12 rounded-full border-2 border-[#F0E5DC] dark:border-[#2E3946]"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: r.color }}>
            {label}
          </p>
          <h3 className="font-['Outfit'] font-bold text-base text-[#0F151D] dark:text-[#FBFBFB] truncate">
            {r.name}
          </h3>
        </div>
        <span
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white opacity-90 group-hover:opacity-100 shrink-0"
          style={{ background: r.color }}
        >
          <span className="material-symbols-outlined text-[18px]">{r.icon}</span>
        </span>
      </div>
      <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed mt-3">{t(ROLE_BLURB_KEY[r.role])}</p>
      <span
        className="mt-3 inline-flex items-center gap-1 text-xs font-bold"
        style={{ color: r.color }}
      >
        {t('login.logInAs', { n: label })}
        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
      </span>
    </motion.button>
  );
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onOpenRegister, onBackHome }) => {
  const { t } = useLanguage();
  return (
    <div className="pt-24 pb-16 min-h-screen bg-[#FFF9F6] dark:bg-[#0F151D] text-[#0F151D] dark:text-[#FBFBFB] transition-colors">
      <div className="max-w-3xl mx-auto px-4 md:px-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="text-center space-y-3"
        >
          <button
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 text-xs font-['Outfit'] font-bold text-[#71717A] dark:text-[#A1A1AA] hover:text-[#FF7448] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            {t('login.backHome')}
          </button>
          <div className="w-14 h-14 rounded-2xl bg-[#FF7448]/10 dark:bg-[#FF7448]/20 text-[#FF7448] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[28px]">how_to_reg</span>
          </div>
          <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-bold">{t('login.logInTo')}</h1>
          <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] max-w-lg mx-auto leading-relaxed">
            {t('login.signInDesc')}
          </p>
        </motion.div>

        {/* Public member accounts */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF7448]">
              {t('login.memberAccounts')}
            </span>
            <div className="h-px flex-1 bg-[#F0E5DC] dark:bg-[#2A3441]"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MEMBER_ROLES.map((r, idx) => (
              <RoleCardButton key={r.role} r={r} idx={idx} onLogin={onLogin} />
            ))}
          </div>
          <button
            onClick={() => onOpenRegister()}
            className="w-full py-3 bg-white dark:bg-[#1B232E] border border-dashed border-[#E4DED4] dark:border-[#2E3946] rounded-2xl text-xs font-['Outfit'] font-bold text-[#0F151D] dark:text-[#FBFBFB] hover:border-[#FF7448]/60 hover:text-[#FF7448] transition-colors cursor-pointer"
          >
            {t('login.newCustomerOrWorker')}
          </button>
        </div>

        {/* Back-office access — no public registration */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#2B3A4A] dark:text-[#9FB3C8]">
              {t('login.backOffice')}
            </span>
            <div className="h-px flex-1 bg-[#F0E5DC] dark:bg-[#2A3441]"></div>
            <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
              {t('login.issuedByCoop')}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ADMIN_ROLES.map((r, idx) => (
              <RoleCardButton key={r.role} r={r} idx={idx} onLogin={onLogin} />
            ))}
          </div>
          <p className="text-[11px] text-center text-[#71717A] dark:text-[#A1A1AA]">
            {t('login.adminCannotRegister')}
          </p>
        </div>
      </div>
    </div>
  );
};
