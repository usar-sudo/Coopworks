import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkerProfile, Booking, LatLng } from '../types';
import { Avatar } from './Avatar';
import { useLanguage } from '../context/LanguageContext';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: WorkerProfile[];
  preSelectedWorker?: WorkerProfile | null;
  initialMode?: 'consultation' | 'labor';
  onCreateBooking: (newBooking: Partial<Booking>) => void;
  userLocation?: LatLng;
  userAddress?: string;
  onDetectLocation?: () => void;
}

export const NewBookingModal: React.FC<NewBookingModalProps> = ({
  isOpen,
  onClose,
  workers,
  preSelectedWorker,
  initialMode = 'labor',
  onCreateBooking,
  userLocation,
  userAddress,
  onDetectLocation
}) => {
  const { t } = useLanguage();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(
    preSelectedWorker ? preSelectedWorker.id : workers[0]?.id || 'worker-sarah'
  );
  const [serviceMode, setServiceMode] = useState<'consultation' | 'labor'>(initialMode);
  const [selectedDate, setSelectedDate] = useState<string>('Thu 17');
  const [selectedTime, setSelectedTime] = useState<string>('10:30 AM');
  const [address, setAddress] = useState<string>(userAddress || 'Flat 402, Green Meadows Society, Janakpuri, New Delhi');
  const [notes, setNotes] = useState<string>('');
  const [isEmergency, setIsEmergency] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentWorker = workers.find((w) => w.id === selectedWorkerId) || workers[0];

  const dates = [
    { day: 'Mon', num: '14' },
    { day: 'Tue', num: '15' },
    { day: 'Wed', num: '16' },
    { day: 'Thu', num: '17' },
    { day: 'Fri', num: '18' },
    { day: 'Sat', num: '19' },
    { day: 'Sun', num: '20' }
  ];

  const timeSlots = ['09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'];

  const handleUseCurrentLocation = () => {
    if (userAddress) {
      setAddress(userAddress);
    } else if (userLocation) {
      setAddress(`GPS: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`);
    }
    if (onDetectLocation) {
      onDetectLocation();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const bookingCoords: LatLng = userLocation || {
      lat: 28.6139,
      lng: 77.209
    };

    const workerCoords: LatLng = currentWorker?.coordinates || {
      lat: bookingCoords.lat + 0.008,
      lng: bookingCoords.lng + 0.006
    };

    const newBooking: Partial<Booking> = {
      referenceNumber: `#CWS-${Math.floor(1000 + Math.random() * 9000)}`,
      serviceTitle: `${currentWorker.roleTitle} (${serviceMode === 'labor' ? 'Full Job' : 'Visit & Estimate'})`,
      serviceCategory: currentWorker.roleTitle.includes('lectric') ? 'Electrical' : currentWorker.roleTitle.includes('umb') ? 'Plumbing' : currentWorker.roleTitle.includes('arpenter') ? 'Carpentry' : currentWorker.roleTitle.includes('aint') ? 'Painting' : 'Carpentry',
      serviceMode: serviceMode,
      workerId: currentWorker.id,
      workerName: currentWorker.name,
      workerAvatar: currentWorker.avatar,
      workerRating: currentWorker.rating,
      workerJobsCount: currentWorker.completedJobsCount,
      status: isEmergency ? 'en_route' : 'requested',
      isEmergency: isEmergency,
      scheduledTime: `${selectedDate}, ${selectedTime}`,
      address: address,
      estimatedCostRange: isEmergency
        ? '₹1,850 – ₹2,500'
        : `₹${
            serviceMode === 'labor'
              ? currentWorker.hourlyRateLabor * 2
              : currentWorker.hourlyRateConsultation
          } - ₹${
            serviceMode === 'labor'
              ? currentWorker.hourlyRateLabor * 3
              : currentWorker.hourlyRateConsultation * 1.5
          }`,
      clientName: 'You (Homeowner)',
      durationHours: 2.0,
      baseRatePerHour:
        serviceMode === 'labor'
          ? currentWorker.hourlyRateLabor
          : currentWorker.hourlyRateConsultation,
      societyDividendPercent: 15,
      platformFeePercent: 2.5,
      createdAt: 'Just now',
      notes: notes,
      coordinates: bookingCoords,
      workerCoordinates: workerCoords
    };

    onCreateBooking(newBooking);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white/80 dark:bg-[#232E3A]/80 backdrop-blur-2xl backdrop-saturate-150 text-[#0F151D] dark:text-[#FBFBFB] w-full max-w-xl rounded-3xl border border-white/70 dark:border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors"
        >
          {/* Header */}
          <div className="p-5 border-b border-[#F0E5DC] dark:border-[#2A3441] flex items-center justify-between bg-[#FFF9F6] dark:bg-[#0F151D]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF7448]">
                {t('booking.coopScheduling')}
              </span>
              <h2 className="font-['Outfit'] text-xl font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                {t('booking.bookTradeService')}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white dark:bg-[#2A3441] border border-[#F0E5DC] dark:border-[#2E3946] flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Scrollable Form Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Worker Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-2">
                {t('booking.selectProfessional')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {workers.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWorkerId(w.id)}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      selectedWorkerId === w.id
                        ? 'border-[#FF7448] bg-[#FF7448]/10 ring-1 ring-[#FF7448]'
                        : 'border-[#F0E5DC] dark:border-[#2E3946] bg-[#FFF9F6] dark:bg-[#0F151D] hover:border-[#D3E1FF] dark:hover:border-[#3F3F46]'
                    }`}
                  >
                    <Avatar
                      src={w.avatar}
                      name={w.name}
                      alt={w.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#F0E5DC] dark:border-[#2E3946]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-['Outfit'] font-bold text-xs text-[#0F151D] dark:text-[#FBFBFB] truncate">
                        {w.name}
                      </p>
                      <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] truncate">
                        {w.roleTitle} ({w.distanceMiles} mi)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Mode Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-2">
                {t('booking.serviceType')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setServiceMode('consultation')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    serviceMode === 'consultation'
                      ? 'border-[#FF7448] bg-[#FF7448]/10 ring-1 ring-[#FF7448]'
                      : 'border-[#F0E5DC] dark:border-[#2E3946] bg-[#FFF9F6] dark:bg-[#0F151D] hover:border-[#D3E1FF] dark:hover:border-[#3F3F46]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-['Outfit'] font-bold text-xs text-[#0F151D] dark:text-[#FBFBFB]">
                      {t('booking.consultation')}
                    </span>
                    <span className="font-bold text-xs text-[#FF7448]">
                      ₹{currentWorker?.hourlyRateConsultation}/hr
                    </span>
                  </div>
                  <p className="text-[11px] text-[#71717A] mt-1">{t('booking.inspectionEstimates')}</p>
                </div>

                <div
                  onClick={() => setServiceMode('labor')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    serviceMode === 'labor'
                      ? 'border-[#FF7448] bg-[#FF7448]/10 ring-1 ring-[#FF7448]'
                      : 'border-[#F0E5DC] dark:border-[#2E3946] bg-[#FFF9F6] dark:bg-[#0F151D] hover:border-[#D3E1FF] dark:hover:border-[#3F3F46]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-['Outfit'] font-bold text-xs text-[#0F151D] dark:text-[#FBFBFB]">
                      {t('booking.onSiteLabor')}
                    </span>
                    <span className="font-bold text-xs text-[#FF7448]">
                      ₹{currentWorker?.hourlyRateLabor}/hr
                    </span>
                  </div>
                  <p className="text-[11px] text-[#71717A] mt-1">{t('booking.fullTradeWork')}</p>
                </div>
              </div>
            </div>

            {/* Date Picker Horizontal Bar */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-2">
                {t('booking.selectDate')}
              </label>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {dates.map((d) => (
                  <button
                    key={d.num}
                    type="button"
                    onClick={() => setSelectedDate(`${d.day} ${d.num}`)}
                    className={`flex-1 min-w-[54px] py-2.5 rounded-xl border text-center transition-all ${
                      selectedDate === `${d.day} ${d.num}`
                        ? 'border-[#FF7448] bg-[#FF7448] text-white shadow-xs'
                        : 'border-[#F0E5DC] dark:border-[#2E3946] bg-[#FFF9F6] dark:bg-[#0F151D] text-[#71717A] dark:text-[#A1A1AA] hover:border-[#D3E1FF] dark:hover:border-[#3F3F46]'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold">{d.day}</div>
                    <div className="font-['Outfit'] text-sm font-bold mt-0.5">{d.num}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Chips */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-2">
                {t('booking.arrivalWindow')}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {timeSlots.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTime(t)}
                    className={`py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      selectedTime === t
                        ? 'border-[#FF7448] bg-[#FF7448]/10 text-[#FF7448] ring-1 ring-[#FF7448]'
                        : 'border-[#F0E5DC] dark:border-[#2E3946] bg-[#FFF9F6] dark:bg-[#0F151D] text-[#71717A] dark:text-[#A1A1AA] hover:border-[#D3E1FF] dark:hover:border-[#3F3F46]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Address with Geolocation Detect Button */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A]">
                  {t('booking.serviceAddress')}
                </label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="text-xs text-[#FF7448] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">my_location</span>
                  <span>{t('booking.useCurrentLocation')}</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] rounded-xl text-xs text-[#0F151D] dark:text-[#FBFBFB] focus:outline-none focus:border-[#FF7448]"
              />
            </div>

            {/* Job Description / Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1.5">
                {t('booking.projectNotes')}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('booking.projectNotesPlaceholder')}
                className="w-full p-3 bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] rounded-xl text-xs text-[#0F151D] dark:text-[#FBFBFB] placeholder-[#71717A] focus:outline-none focus:border-[#FF7448]"
              ></textarea>
            </div>

            {/* Emergency Toggle */}
            <div className="p-3.5 bg-[#FF7448]/10 rounded-2xl border border-[#FF7448]/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">                  <span className="material-symbols-outlined text-[#FF7448] text-[20px]">
                  emergency
                </span>
                <div>
                  <div className="font-['Outfit'] font-bold text-xs text-[#0F151D] dark:text-[#FBFBFB]">
                    {t('booking.immediateDispatch')}
                  </div>
                  <div className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
                    {t('booking.emergencyHint')}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isEmergency}
                onChange={(e) => setIsEmergency(e.target.checked)}
                className="w-4 h-4 text-[#FF7448] rounded focus:ring-[#FF7448]"
              />
            </div>

            {/* Submit Button */}
            <div className="space-y-4 pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-[#FF7448] hover:bg-[#FF8D69] text-white font-['Outfit'] font-bold text-sm rounded-xl shadow-md shadow-[#FF7448]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('booking.confirmBooking')}</span>
                <span className="material-symbols-outlined text-[18px]">lock</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
