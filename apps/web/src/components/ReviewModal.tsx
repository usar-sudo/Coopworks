import { personPhoto } from '../lib/portraits';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Booking } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onSubmitReview: (rating: number, feedback: string, overtimeHours: number) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSubmitReview
}) => {
  const { t } = useLanguage();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>(
    'Rahul arrived on time, fixed the burst pipe quickly, and cleaned up before leaving. Fair price and no drama.'
  );
  const [safetyFollowed, setSafetyFollowed] = useState<boolean>(true);
  const [workspaceClean, setWorkspaceClean] = useState<boolean>(true);
  const [overtimeHours, setOvertimeHours] = useState<number>(0);

  if (!isOpen || !booking) return null;

  const baseRate = booking.baseRatePerHour || 250;
  const overtimeAmount = overtimeHours * baseRate * 1.5;

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 1:
        return t('review.rating1');
      case 2:
        return t('review.rating2');
      case 3:
        return t('review.rating3');
      case 4:
        return t('review.rating4');
      case 5:
        return t('review.rating5');
      default:
        return t('review.selectRating');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReview(rating, feedback, overtimeHours);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white/80 dark:bg-[#232E3A]/80 backdrop-blur-2xl backdrop-saturate-150 text-[#0F151D] dark:text-[#FBFBFB] w-full max-w-lg rounded-3xl border border-white/70 dark:border-white/10 shadow-2xl overflow-hidden transition-colors"
        >
          {/* Header with Service Complete badge */}
          <div className="p-6 bg-[#FFF9F6] dark:bg-[#0F151D] border-b border-[#F0E5DC] dark:border-[#2A3441] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-[#10B981]/10 dark:bg-[#10B981]/15 text-[#10B981] font-['Outfit'] font-bold text-xs uppercase tracking-wider rounded-md border border-[#10B981]/30">
                {t('review.serviceComplete')}
              </span>
              <span className="text-xs font-mono text-[#71717A]">{booking.referenceNumber}</span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white dark:bg-[#2A3441] border border-[#F0E5DC] dark:border-[#2E3946] flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB]"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
            {/* Worker Headshot & Info */}
            <div className="flex items-center gap-4">
              <img
                src={personPhoto(booking?.workerName || 'Co-op Worker')}
                alt={booking.workerName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#F0E5DC] dark:border-[#2E3946]"
              />
              <div>
                <h3 className="font-['Outfit'] text-base font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                  {booking.workerName}
                </h3>
                <p className="text-xs text-[#FF7448] font-semibold">{booking.serviceTitle}</p>
                <p className="text-[11px] text-[#71717A]">Saket Plumbers Sangh • Society Verified</p>
              </div>
            </div>

            {/* 5-Star Interactive Rating */}
            <div className="text-center py-2 space-y-2">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 text-3xl transition-transform hover:scale-125 focus:outline-none"
                    >
                      <span
                        className={`material-symbols-outlined text-[34px] ${
                          isFilled ? 'text-[#F59E0B]' : 'text-[#D4D4D8] dark:text-[#2E3946]'
                        }`}
                        style={{ fontVariationSettings: isFilled ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        star
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="font-['Outfit'] font-bold text-sm text-[#0F151D] dark:text-[#FBFBFB]">
                {getRatingLabel(hoverRating || rating)}
              </p>
            </div>

            {/* Feedback Textarea */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1.5">
                {t('review.feedbackLabel')}
              </label>
              <textarea
                rows={3}
                required
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={t('review.feedbackPlaceholder')}
                className="w-full p-3.5 bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] rounded-xl text-xs text-[#0F151D] dark:text-[#FBFBFB] placeholder-[#71717A] focus:outline-none focus:border-[#FF7448]"
              ></textarea>
            </div>

            {/* Cooperative Quality Check Section */}
            <div className="p-4 bg-[#FFF9F6] dark:bg-[#141D28] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] space-y-3">                <span className="text-[11px] font-bold uppercase tracking-wider text-[#10B981] block">
                {t('review.workQualityCheck')}
              </span>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#0F151D] dark:text-[#FBFBFB]">{t('review.followedSafetyRules')}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSafetyFollowed(true)}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-colors ${
                      safetyFollowed ? 'bg-[#10B981] text-white' : 'bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] text-[#71717A]'
                    }`}
                  >
                    {t('review.yes')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSafetyFollowed(false)}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-colors ${
                      !safetyFollowed ? 'bg-[#EF4444] text-white' : 'bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] text-[#71717A]'
                    }`}
                  >
                    {t('review.no')}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#0F151D] dark:text-[#FBFBFB]">{t('review.siteLeftClean')}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setWorkspaceClean(true)}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-colors ${
                      workspaceClean ? 'bg-[#10B981] text-white' : 'bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] text-[#71717A]'
                    }`}
                  >
                    {t('review.yes')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkspaceClean(false)}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-colors ${
                      !workspaceClean ? 'bg-[#EF4444] text-white' : 'bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] text-[#71717A]'
                    }`}
                  >
                    {t('review.no')}
                  </button>
                </div>
              </div>
            </div>

            {/* Overtime — extra hours worked beyond the booked slot */}
            <div className="p-4 bg-[#FFF9F6] dark:bg-[#141D28] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF7448]">
                  {t('review.extraHoursWorked')}
                </span>
                <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-full">
                  {t('review.paidAtRate')}
                </span>
              </div>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                {t('review.overtimeHint', { n: booking.durationHours })}
              </p>
              <div className="flex items-center gap-4 justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOvertimeHours((h) => Math.max(0, +(h - 0.5).toFixed(1)))}
                    className="w-9 h-9 rounded-xl bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] text-[#FF7448] font-bold cursor-pointer"
                  >
                    −
                  </button>
                  <span className="w-16 text-center font-['Outfit'] font-bold text-sm text-[#0F151D] dark:text-[#FBFBFB]">
                    {overtimeHours}h
                  </span>
                  <button
                    type="button"
                    onClick={() => setOvertimeHours((h) => Math.min(12, +(h + 0.5).toFixed(1)))}
                    className="w-9 h-9 rounded-xl bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] text-[#FF7448] font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block">
                    {overtimeHours}h × ₹{baseRate} × 1.5
                  </span>
                  <span
                    className={`font-['Outfit'] font-bold text-lg ${
                      overtimeHours > 0 ? 'text-[#10B981]' : 'text-[#71717A] dark:text-[#A1A1AA]'
                    }`}
                  >
                    {overtimeHours > 0 ? `+₹${overtimeAmount.toFixed(0)}` : t('review.noOvertime')}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full py-3.5 bg-[#FF7448] hover:bg-[#FF8D69] text-white font-['Outfit'] font-bold text-sm rounded-xl shadow-md shadow-[#FF7448]/25 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>{t('review.submitReviewComplete')}</span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
