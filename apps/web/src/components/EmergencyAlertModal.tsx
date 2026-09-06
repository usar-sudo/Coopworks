import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

interface EmergencyAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export const EmergencyAlertModal: React.FC<EmergencyAlertModalProps> = ({
  isOpen,
  onClose,
  onAccept
}) => {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState(45);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(45);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const progressPercent = (timeLeft / 45) * 100;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          className="bg-white/85 dark:bg-[#232E3A]/85 backdrop-blur-2xl backdrop-saturate-150 text-[#0F151D] dark:text-[#FBFBFB] w-full max-w-lg rounded-3xl border-2 border-[#FF7448] shadow-2xl overflow-hidden urgent-pulse transition-colors"
        >
          {/* Countdown Header */}
          <div className="bg-[#FF7448] text-white p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-['Outfit'] font-bold text-sm tracking-wider uppercase">
                <span className="material-symbols-outlined text-[20px] animate-bounce">
                  warning
                </span>
                <span>{t('emergency.alertTitle')}</span>
              </div>
              <span className="font-mono font-bold text-sm bg-black/30 px-2 py-0.5 rounded">
                00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-white h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#FF7448]/15 text-[#FF7448] text-xs font-bold rounded border border-[#FF7448]/30">
                    {t('emergency.priorityTag')}
                  </span>
                  <span className="text-xs text-[#71717A]">{t('emergency.distance')}</span>
                </div>
                <h2 className="font-['Outfit'] text-2xl font-bold text-[#0F151D] dark:text-[#FBFBFB] mt-1">
                  {t('emergency.incidentTitle')}
                </h2>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-[#71717A] block">{t('emergency.urgencyPayout')}</span>
                <span className="font-['Outfit'] text-xl font-bold text-[#10B981]">₹1,850 - ₹2,200</span>
              </div>
            </div>

            {/* Mini Map Preview */}
            <div className="h-40 rounded-xl overflow-hidden border border-[#F0E5DC] dark:border-[#2A3441] relative bg-[#FFF9F6] dark:bg-[#0F151D]">
              <div
                aria-hidden="true"
                className="w-full h-full opacity-90 dark:opacity-80"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,116,72,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,116,72,0.35) 1px, transparent 1px), linear-gradient(rgba(15,21,29,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(15,21,29,0.10) 1px, transparent 1px)',
                  backgroundSize: '48px 48px, 48px 48px, 12px 12px, 12px 12px',
                  backgroundColor: '#FFEDE4',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-[#FF7448]/40 animate-ping"></div>
                <div className="w-6 h-6 rounded-full bg-[#FF7448] text-white flex items-center justify-center shadow-lg absolute">
                  <span className="material-symbols-outlined text-[14px]">water_damage</span>
                </div>
              </div>
              <div className="absolute bottom-2 left-2 bg-white/95 dark:bg-[#1B232E]/90 backdrop-blur border border-[#F0E5DC] dark:border-[#2E3946] px-2.5 py-1 rounded text-[11px] font-bold text-[#0F151D] dark:text-[#FBFBFB] shadow-xs">
                Shop 12, Karol Bagh Market, New Delhi
              </div>
            </div>

            {/* Incident Notes */}
            <div className="p-4 bg-[#FFF9F6] dark:bg-[#0F151D] rounded-xl border border-[#F0E5DC] dark:border-[#2E3946] space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#71717A]">{t('emergency.incidentNote')}</span>
              <p className="text-xs text-[#0F151D] dark:text-[#FBFBFB] leading-relaxed">
                {t('emergency.incidentText')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={onClose}
                className="py-3.5 bg-[#FFF9F6] dark:bg-[#0F151D] hover:bg-[#F7EFE8] dark:hover:bg-[#2A3441] border border-[#F0E5DC] dark:border-[#2E3946] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB] font-['Outfit'] font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
              >
                {t('emergency.declineNext')}
              </button>

              <button
                onClick={onAccept}
                className="py-3.5 bg-[#FF7448] hover:bg-[#FF8D69] text-white font-['Outfit'] font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-[#FF7448]/30 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">done_all</span>
                <span>{t('emergency.acceptDispatch')}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
