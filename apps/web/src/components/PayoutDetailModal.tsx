import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Booking } from '../types';
import { personPhoto } from '../lib/portraits';

// Print styles for invoice
const PrintStyles = () => (
  <style>{`
    @media print {
      body * {
        visibility: hidden;
      }
      .payout-modal,
      .payout-modal * {
        visibility: visible;
      }
      .payout-modal {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: white !important;
      }
      .no-print {
        display: none !important;
      }
    }
  `}</style>
);

import { BookingInvoice } from './BookingInvoice';

interface PayoutDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
}

export const PayoutDetailModal: React.FC<PayoutDetailModalProps> = ({
  isOpen,
  onClose,
  booking
}) => {
  const [showInvoice, setShowInvoice] = React.useState(false);
  
  if (!isOpen || !booking) return null;

  const hours = booking.durationHours || 1;
  const rate = booking.baseRatePerHour || 250;
  const basePay = hours * rate;
  const overtime = (booking.overtimeHours || 0) * rate * 1.5;
  const equipmentBonus = booking.equipmentBonus || 0;
  const gross = basePay + overtime + equipmentBonus;
  const societyPercent = booking.societyDividendPercent ?? 15;
  const feePercent = booking.platformFeePercent ?? 2.5;
  const societyDividend = gross * (societyPercent / 100);
  const platformFee = gross * (feePercent / 100);
  const netPayout = gross - societyDividend - platformFee;

  return (
    <AnimatePresence>
      <PrintStyles />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="payout-modal bg-white/80 dark:bg-[#232E3A]/80 backdrop-blur-2xl backdrop-saturate-150 text-[#0F151D] dark:text-[#FBFBFB] w-full max-w-lg rounded-3xl border border-white/70 dark:border-white/10 shadow-2xl overflow-hidden transition-colors"
        >
          {/* Header */}
          <div className="p-6 bg-[#FFF9F6] dark:bg-[#0F151D] border-b border-[#F0E5DC] dark:border-[#2A3441] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-[#FF7448]/10 dark:bg-[#FF7448]/15 border border-[#FF7448]/30 text-[#FF7448] font-['Outfit'] font-bold text-xs uppercase tracking-wider rounded-md flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                <span>Settled Statement</span>
              </span>
              <span className="text-xs font-mono text-[#71717A]">{booking.referenceNumber}</span>
            </div>

            <button
              onClick={onClose}
              className="no-print w-8 h-8 rounded-full bg-white dark:bg-[#2A3441] border border-[#F0E5DC] dark:border-[#2E3946] flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB]"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6">
            
            {/* Main Amount Callout */}
            <div className="text-center py-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#71717A] block">
                Net Member Payout
              </span>
              <div className="font-['Outfit'] text-4xl font-bold text-[#10B981] mt-1">
                ₹{netPayout.toFixed(2)}
              </div>
              <span className="text-xs text-[#71717A] mt-1 inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
                Paid to Worker's Account • Today
              </span>
            </div>

            {/* Recipient & Job Summary */}
            <div className="p-4 bg-[#FFF9F6] dark:bg-[#141D28] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] flex items-center gap-4">
              <img
                src={personPhoto(booking?.workerName || 'Co-op Worker')}
                alt="Worker"
                className="w-12 h-12 rounded-xl object-cover border border-[#F0E5DC] dark:border-[#2E3946]"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-['Outfit'] font-bold text-sm text-[#0F151D] dark:text-[#FBFBFB]">
                  {booking.workerName}
                </h4>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  {booking.clientName} • {hours}h logged @ ₹{rate}/hr
                  {overtime > 0 && ' • + overtime'}
                </p>
              </div>
            </div>

            {/* Transparent Financial Split Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[#71717A] dark:text-[#A1A1AA]">
                <span>Base Labor Pay ({hours} hrs × ₹{rate})</span>
                <span className="font-mono font-semibold text-[#0F151D] dark:text-[#FBFBFB]">₹{basePay.toFixed(2)}</span>
              </div>
              <div
                className={`flex items-center justify-between ${
                  overtime > 0
                    ? 'bg-[#10B981]/10 dark:bg-[#10B981]/15 rounded-lg px-2 py-1.5 border border-[#10B981]/25'
                    : 'text-[#71717A] dark:text-[#A1A1AA]'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {overtime > 0 && (
                    <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded-full">
                      Overtime 1.5×
                    </span>
                  )}
                  <span>{booking.overtimeHours || 0} hrs overtime × ₹{rate} × 1.5</span>
                </span>
                <span className="font-mono font-semibold text-[#10B981]">+₹{overtime.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-[#71717A] dark:text-[#A1A1AA]">
                <span>Equipment & Travel Allowance</span>
                <span className="font-mono font-semibold text-[#10B981]">+₹{equipmentBonus.toFixed(2)}</span>
              </div>

              {/* Stitched divider */}
              <div className="stitched-divider my-2"></div>

              <div className="flex items-center justify-between font-semibold text-[#0F151D] dark:text-[#FBFBFB]">
                <span>Total Job Amount</span>
                <span className="font-mono font-bold">₹{gross.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-[#71717A] dark:text-[#A1A1AA]">
                <span className="flex items-center gap-1">
                  <span>Society Welfare Fund Share ({societyPercent}%)</span>
                  <span className="material-symbols-outlined text-[14px] text-[#10B981]">info</span>
                </span>
                <span className="font-mono font-semibold text-[#EF4444]">-₹{societyDividend.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-[#71717A] dark:text-[#A1A1AA]">
                <span>Platform Maintenance Fee ({feePercent}%)</span>
                <span className="font-mono font-semibold text-[#71717A]">-₹{platformFee.toFixed(2)}</span>
              </div>

              <div className="stitched-divider my-2"></div>

              <div className="flex items-center justify-between text-sm font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                <span>Worker's Take-Home Pay</span>
                <span className="font-mono text-base text-[#10B981]">₹{netPayout.toFixed(2)}</span>
              </div>
            </div>

            {/* Cooperative Impact Note */}
            <div className="p-4 bg-[#10B981]/10 rounded-2xl border border-[#10B981]/20 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#10B981] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">diversity_3</span>
                <span>What Your Society Share Pays For</span>
              </span>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                The <strong className="text-[#0F151D] dark:text-[#FBFBFB]">₹{societyDividend.toFixed(2)}</strong> held back by your society pays for worker accident cover, tool repairs and training for new members.
              </p>
            </div>

            {/* Actions */}
            <div className="no-print flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-[#FFF9F6] dark:bg-[#0F151D] hover:bg-[#F7EFE8] dark:hover:bg-[#2A3441] text-[#0F151D] dark:text-[#FBFBFB] text-xs font-['Outfit'] font-bold rounded-xl border border-[#F0E5DC] dark:border-[#2E3946] transition-colors text-center"
              >
                Export Receipt PDF
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-[#FF7448] hover:bg-[#FF8D69] text-white text-xs font-['Outfit'] font-bold rounded-xl transition-colors text-center shadow-md shadow-[#FF7448]/20"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Invoice wrapper
export const PayoutDetailWithInvoice: React.FC<PayoutDetailModalProps> = (props) => {
  const [showInvoice, setShowInvoice] = React.useState(false);
  
  return (
    <>
      <PayoutDetailModal {...props} />
      {showInvoice && props.booking && (
        <BookingInvoice booking={props.booking} onClose={() => setShowInvoice(false)} />
      )}
    </>
  );
};
