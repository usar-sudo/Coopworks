import React from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { COOP_PROMISES } from '../lib/promise';
import { useLanguage } from '../context/LanguageContext';

interface PromiseModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional primary call-to-action inside the popup. */
  primary?: { label: string; onAction: () => void };
  /** Optional secondary call-to-action inside the popup. */
  secondary?: { label: string; onAction: () => void };
}

/** Shared “Our promise to you” popup — content lives in lib/promise.ts so the
 *  landing page, footer and worker profile all show the same copy. Built on the
 *  shadcn Dialog primitive for consistent behaviour across the app. */
export const PromiseModal: React.FC<PromiseModalProps> = ({
  open,
  onClose,
  primary,
  secondary,
}) => {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg gap-0 p-0 overflow-hidden rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] bg-white/95 dark:bg-[#1B232E]/95 backdrop-blur-2xl backdrop-saturate-150 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#F0E5DC] dark:border-[#2A3441] flex items-start justify-between gap-3 bg-[#FFF9F6] dark:bg-[#0F151D]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#FF7448]/10 dark:bg-[#FF7448]/20 text-[#FF7448] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">handshake</span>
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/10 dark:bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] font-bold text-[10px] uppercase tracking-wider">
                {t('promise.workerOwnedCoop')}
              </span>
              <h3 className="font-['Outfit'] text-xl font-bold mt-1">{t('promise.ourPromiseToYou')}</h3>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {COOP_PROMISES.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF7448]/10 dark:bg-[#FF7448]/15 text-[#FF7448] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              </div>
              <div className="pt-0.5">
                <h4 className="font-['Outfit'] font-bold text-sm text-[#0F151D] dark:text-[#FBFBFB]">
                  {item.title}
                </h4>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed mt-0.5">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        {(primary || secondary) && (
          <div className="p-5 border-t border-[#F0E5DC] dark:border-[#2A3441] space-y-2 bg-[#FFF9F6] dark:bg-[#0F151D]">
            {primary && (
              <button
                onClick={primary.onAction}
                className="w-full py-3 bg-[#FF7448] hover:bg-[#FF8D69] text-white font-['Outfit'] font-bold text-sm rounded-xl shadow-md shadow-[#FF7448]/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{primary.label}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            )}
            {secondary && (
              <button
                onClick={secondary.onAction}
                className="w-full py-2.5 text-xs font-['Outfit'] font-bold text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB] transition-colors cursor-pointer"
              >
                {secondary.label}
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
