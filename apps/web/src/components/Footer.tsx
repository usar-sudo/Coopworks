import React, { useState } from 'react';
import { UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { COOP_PROMISES } from '../lib/promise';
import { PromiseModal } from './PromiseModal';

interface FooterProps {
  userRole: UserRole;
  isLoggedIn: boolean;
  onNavigate: (view: string) => void;
  onOpenRegister: (mode?: 'customer' | 'worker') => void;
  onOpenLogin: () => void;
  /** Opens the "Book a Worker" modal (customer action). */
  onOpenNewBooking: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  userRole,
  isLoggedIn,
  onNavigate,
  onOpenRegister,
  onOpenLogin,
  onOpenNewBooking
}) => {
  const { t } = useLanguage();
  const [showPromise, setShowPromise] = useState(false);
  const isAdmin = userRole === 'society_admin' || userRole === 'federation_admin';

  // Role-scoped quick links — a worker never sees client links, a customer
  // never sees council links, and so on. When logged out, only entry actions.
  const roleLinks: { label: string; action: () => void }[] = !isLoggedIn
    ? [
        { label: 'Log in', action: onOpenLogin },
        { label: 'Create an account', action: () => onOpenRegister() },
        { label: t('footer.helpFaqs'), action: () => onNavigate('landing') }
      ]
    : userRole === 'customer'
      ? [
          { label: t('nav.findWorker'), action: () => onNavigate('marketplace') },
          { label: t('nav.bookTrade'), action: onOpenNewBooking },
          { label: t('nav.bookings'), action: () => onNavigate('tracker') }
        ]
      : userRole === 'worker'
        ? [
            { label: t('nav.dispatchDesk'), action: () => onNavigate('worker_roster') },
            { label: t('nav.activeJob'), action: () => onNavigate('tracker') },
            { label: t('nav.publicProfile'), action: () => onNavigate('worker_profile') }
          ]
        : isAdmin
          ? [
              { label: t('nav.federationCouncil'), action: () => onNavigate('federation') },
              { label: t('nav.societyOps'), action: () => onNavigate('society_admin') },
              { label: t('nav.accreditations'), action: () => onNavigate('approvals') }
            ]
          : [];

  return (
    <footer className="bg-[#F7EFE8] dark:bg-[#0F151D] text-[#71717A] dark:text-[#A1A1AA] pt-12 pb-24 md:pb-12 border-t border-[#F0E5DC] dark:border-[#2A3441] transition-colors">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Brand */}
          <div className="space-y-4 md:col-span-4">
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className="w-7 h-7 rounded-lg bg-[#FF7448] text-white flex items-center justify-center font-bold text-xs shadow-md shadow-[#FF7448]/20">
                CW
              </span>
              <span className="font-['Outfit'] text-xl font-bold text-[#0F151D] dark:text-[#FBFBFB] tracking-tight">
                Coopworks
              </span>
            </button>
            <p className="text-xs leading-relaxed text-[#71717A] dark:text-[#A1A1AA]">
              Coopworks is a worker-owned co-operative that connects verified tradespeople with
              homes and businesses in their area — with fair pay, transparent pricing and no
              middlemen taking a cut.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#10B981]/10 dark:bg-[#10B981]/15 text-[#10B981] rounded-full text-[11px] font-semibold border border-[#10B981]/30">
              <span className="material-symbols-outlined text-[14px]">verified_user</span>
              <span>Worker-owned co-operative</span>
            </div>
          </div>

          {/* Role-scoped quick links */}
          <div className="md:col-span-2">
            <h4 className="font-['Outfit'] font-bold text-xs uppercase tracking-wider text-[#0F151D] dark:text-[#FBFBFB] mb-3">
              {t('footer.explore')}
            </h4>
            <ul className="space-y-2.5 text-xs">
              {roleLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={link.action}
                    className="hover:text-[#0F151D] dark:hover:text-[#FBFBFB] transition-colors cursor-pointer"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              {isLoggedIn && !isAdmin && userRole !== 'worker' && (
                <li>
                  <button
                    onClick={() => onOpenRegister('worker')}
                    className="text-[#FF7448] hover:text-[#FF8D69] transition-colors cursor-pointer"
                  >
                    {t('footer.applyWorker')}
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Support / legal */}
          <div className="md:col-span-2">
            <h4 className="font-['Outfit'] font-bold text-xs uppercase tracking-wider text-[#0F151D] dark:text-[#FBFBFB] mb-3">
              {t('footer.support')}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('landing')}
                  className="hover:text-[#0F151D] dark:hover:text-[#FBFBFB] transition-colors cursor-pointer"
                >
                  {t('footer.about')}
                </button>
              </li>
              <li>
                <a href="/faqs" className="hover:text-[#0F151D] dark:hover:text-[#FBFBFB] transition-colors">
                  {t('footer.helpFaqs')}
                </a>
              </li>
              <li>
                <a href="/customer-care" className="hover:text-[#0F151D] dark:hover:text-[#FBFBFB] transition-colors">
                  {t('footer.customerCare')}
                </a>
              </li>
              <li>
                <a href="/privacy-policy" className="hover:text-[#0F151D] dark:hover:text-[#FBFBFB] transition-colors">
                  {t('footer.privacy')}
                </a>
              </li>
            </ul>
          </div>

          {/* Our promise */}
          <div className="md:col-span-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-['Outfit'] font-bold text-xs uppercase tracking-wider text-[#0F151D] dark:text-[#FBFBFB]">
                {t('footer.promise')}
              </h4>
              <button
                onClick={() => setShowPromise(true)}
                className="text-[11px] font-bold text-[#FF7448] hover:text-[#FF8D69] transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                View full promise
                <span className="material-symbols-outlined text-[13px]">open_in_new</span>
              </button>
            </div>
            <ul className="space-y-3">
              {COOP_PROMISES.map((item) => (
                <li key={item.title} className="flex items-start gap-2.5 text-xs leading-relaxed">
                  <span className="material-symbols-outlined text-[16px] text-[#10B981] shrink-0 mt-0.5">
                    {item.icon}
                  </span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#F0E5DC] dark:border-[#2A3441] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
          <p>
            © {new Date().getFullYear()} Coopworks, Delhi. A worker-owned co-operative platform for
            verified trades.
          </p>
          <div className="flex items-center gap-6">
            <a href="/customer-care" className="hover:text-[#0F151D] dark:hover:text-[#FBFBFB] transition-colors">
              {t('footer.customerCare')}
            </a>
            <a href="/privacy-policy" className="hover:text-[#0F151D] dark:hover:text-[#FBFBFB] transition-colors">
              {t('footer.privacy')}
            </a>
            <a href="/faqs" className="hover:text-[#0F151D] dark:hover:text-[#FBFBFB] transition-colors">
              {t('footer.helpFaqs')}
            </a>
            <button
              onClick={() => onNavigate('landing')}
              className="hover:text-[#0F151D] dark:hover:text-[#FBFBFB] transition-colors cursor-pointer"
            >
              {t('footer.aboutShort')}
            </button>
          </div>
        </div>
      </div>

      {/* Our promise popup (shared — copy lives in lib/promise.ts) */}
      <PromiseModal
        open={showPromise}
        onClose={() => setShowPromise(false)}
        primary={{
          label: 'Browse Cooperative Crafts',
          onAction: () => {
            setShowPromise(false);
            onNavigate('marketplace');
          },
        }}
      />
    </footer>
  );
};
