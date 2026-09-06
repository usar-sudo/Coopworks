import React from 'react';
import { Booking } from '../types';
import { personPhoto } from '../lib/portraits';

interface BookingInvoiceProps {
  booking: Booking;
  onClose: () => void;
}

export const BookingInvoice: React.FC<BookingInvoiceProps> = ({ booking, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  // Calculate breakdown amounts (demo values)
  const baseRate = 2500;
  const societyFund = Math.round(baseRate * 0.15); // 15% society welfare fund
  const platformFee = Math.round(baseRate * 0.05); // 5% platform fee
  const workerPayout = baseRate - societyFund - platformFee;

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-printable,
          .invoice-printable * {
            visibility: visible;
          }
          .invoice-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Screen overlay */}
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 no-print">
        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-[#F0E5DC]">
            <div className="flex items-center justify-between">
              <h2 className="font-['Outfit'] text-xl font-bold text-[#0F151D]">
                Booking Invoice
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#FFF9F6] rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          {/* Printable Content */}
          <div className="invoice-printable p-6 space-y-6">
            {/* Company Header */}
            <div className="text-center border-b border-[#F0E5DC] pb-4">
              <h1 className="font-['Outfit'] text-2xl font-bold text-[#FF7448]">
                COOPWORKS
              </h1>
              <p className="text-xs text-[#71717A] mt-1">
                Worker Cooperative Platform
              </p>
              <p className="text-xs text-[#71717A]">
                Invoice #{booking.referenceNumber}
              </p>
            </div>

            {/* Booking Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-[#71717A] uppercase tracking-wider">Service</p>
                <p className="font-semibold text-[#0F151D]">{booking.serviceTitle}</p>
              </div>
              <div>
                <p className="text-xs text-[#71717A] uppercase tracking-wider">Category</p>
                <p className="font-semibold text-[#0F151D]">{booking.serviceCategory}</p>
              </div>
              <div>
                <p className="text-xs text-[#71717A] uppercase tracking-wider">Date</p>
                <p className="font-semibold text-[#0F151D]">{booking.scheduledTime}</p>
              </div>
              <div>
                <p className="text-xs text-[#71717A] uppercase tracking-wider">Status</p>
                <p className="font-semibold text-[#0F151D] capitalize">{booking.status.replace('_', ' ')}</p>
              </div>
            </div>

            {/* Worker Info */}
            <div className="p-4 bg-[#FFF9F6] rounded-xl border border-[#F0E5DC]">
              <p className="text-xs text-[#71717A] uppercase tracking-wider mb-2">Assigned Worker</p>
              <div className="flex items-center gap-3">
                <img
                  src={booking.workerAvatar || personPhoto(booking.workerName)}
                  alt={booking.workerName}
                  className="w-12 h-12 rounded-xl object-cover border border-[#F0E5DC]"
                />
                <div>
                  <p className="font-semibold text-[#0F151D]">{booking.workerName}</p>
                  <p className="text-xs text-[#71717A]">Rating: {booking.workerRating} ⭐</p>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-3">
              <h3 className="font-['Outfit'] font-bold text-[#0F151D] border-b border-[#F0E5DC] pb-2">
                Payment Breakdown
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#71717A]">Service Charge</span>
                  <span className="font-semibold text-[#0F151D]">₹{baseRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717A]">Worker Payout (80%)</span>
                  <span className="font-semibold text-[#10B981]">₹{workerPayout}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717A]">Society Welfare Fund (15%)</span>
                  <span className="font-semibold text-[#FF7448]">₹{societyFund}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717A]">Platform Fee (5%)</span>
                  <span className="font-semibold text-[#71717A]">₹{platformFee}</span>
                </div>
              </div>

              <div className="border-t border-[#F0E5DC] pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="font-bold text-[#0F151D]">Total Amount</span>
                  <span className="font-bold text-xl text-[#0F151D]">₹{baseRate}</span>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="p-4 bg-[#FFF9F6] rounded-xl border border-[#F0E5DC]">
              <p className="text-xs text-[#71717A] uppercase tracking-wider mb-1">Service Address</p>
              <p className="text-sm text-[#0F151D]">{booking.address}</p>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-[#71717A] pt-4 border-t border-[#F0E5DC]">
              <p>Thank you for supporting worker-owned cooperatives!</p>
              <p className="mt-1">Coopworks - Fair wages, no middlemen</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-[#F0E5DC] flex gap-3 no-print">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 bg-[#FF7448] hover:bg-[#FF8D69] text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print Invoice
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-[#FFF9F6] border border-[#F0E5DC] text-[#0F151D] font-bold rounded-xl hover:bg-[#F0E5DC] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
