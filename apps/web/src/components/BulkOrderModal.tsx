import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { BulkOrder } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface BulkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOrder: (data: Omit<BulkOrder, 'id' | 'orderNo' | 'status' | 'createdAt' | 'estimatedCost'>) => void;
}

const SERVICE_TYPES = [
  'Carpentry',
  'Electrical',
  'Plumbing',
  'Painting & Waterproofing',
  'HVAC / AC',
  'Masonry',
  'Welding / Fabrication',
  'Cleaning & Housekeeping',
  'Gardening / Landscaping',
  'Security & Safety Inspection',
];

const AREAS = [
  'Connaught Place, New Delhi',
  'Karol Bagh, New Delhi',
  'Janakpuri, New Delhi',
  'Saket, New Delhi',
  'Dwarka, New Delhi',
  'Rohini, New Delhi',
  'Noida, Uttar Pradesh',
  'Gurugram, Haryana',
  'Faridabad, Haryana',
];

const inputCls =
  'w-full h-auto min-h-9 px-3.5 py-2.5 bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] rounded-xl text-xs text-[#0F151D] dark:text-[#FBFBFB] placeholder-[#71717A] focus:outline-none focus:border-[#FF7448] focus-visible:ring-0 focus-visible:ring-offset-0';

const fieldLabelCls = 'block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1.5';

export const BulkOrderModal: React.FC<BulkOrderModalProps> = ({ isOpen, onClose, onCreateOrder }) => {
  const { t } = useLanguage();
  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
  const [workersNeeded, setWorkersNeeded] = useState(5);
  const [scheduledDate, setScheduledDate] = useState('');
  const [locationArea, setLocationArea] = useState(AREAS[0]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const formatPhone = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 10);
    return d ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return setFormError(t('bulk.errOrg'));
    if (!contactName.trim()) return setFormError(t('bulk.errContact'));
    const digits = contactPhone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(digits.slice(-10))) {
      return setFormError(t('bulk.errPhone'));
    }
    if (workersNeeded < 1 || workersNeeded > 200) {
      return setFormError(t('bulk.errWorkers'));
    }
    if (!scheduledDate) return setFormError(t('bulk.errDate'));

    onCreateOrder({
      orgName,
      contactName,
      contactPhone: `+91 ${digits.slice(-10)}`,
      serviceType,
      workersNeeded,
      scheduledDate,
      locationArea,
      notes: notes || undefined,
    });
    setOrgName('');
    setContactName('');
    setContactPhone('');
    setWorkersNeeded(5);
    setScheduledDate('');
    setNotes('');
    setFormError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="gap-0 p-0 overflow-hidden rounded-3xl border border-[#F0E5DC] dark:border-[#2A3441] bg-white/95 dark:bg-[#232E3A]/95 backdrop-blur-2xl backdrop-saturate-150 shadow-2xl max-h-[92vh] flex flex-col max-w-xl">
        <DialogTitle className="sr-only">{t('resource.placeBulkOrder')}</DialogTitle>

        {/* Header */}
        <div className="p-6 pb-4 bg-[#FFF9F6]/80 dark:bg-[#0F151D]/80 border-b border-[#F0E5DC] dark:border-[#2A3441]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF7448] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">business_center</span>
            {t('bulk.institutionOrders')}
          </span>
          <h2 className="font-['Outfit'] text-2xl font-bold text-[#0F151D] dark:text-[#FBFBFB] mt-1">
            {t('bulk.bookTeam')}
          </h2>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1.5 leading-relaxed">
            Schools, societies, offices and sites can request several verified workers in one order.
            The co-op allocates them from the local pool and confirms within 24 hours.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className={fieldLabelCls}>{t('bulk.orgName')}</Label>
              <Input
                placeholder="e.g. Green Meadows Housing Co-op"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <Label className={fieldLabelCls}>{t('bulk.contactPerson')}</Label>
              <Input
                placeholder="e.g. Ritu Malhotra"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <Label className={fieldLabelCls}>{t('bulk.mobileNumber')}</Label>
              <Input
                type="tel"
                inputMode="tel"
                placeholder="+91 98XXX XXXXX"
                value={contactPhone}
                onChange={(e) => setContactPhone(formatPhone(e.target.value))}
                className={`${inputCls} font-mono tracking-wider`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className={fieldLabelCls}>{t('bulk.serviceNeeded')}</Label>
              <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className={inputCls}>
                {SERVICE_TYPES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className={fieldLabelCls}>{t('bulk.workersNeeded')}</Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWorkersNeeded((n) => Math.max(1, n - 1))}
                  className="w-9 h-9 rounded-xl bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] text-[#FF7448] font-bold cursor-pointer"
                >
                  −
                </button>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={workersNeeded}
                  onChange={(e) => setWorkersNeeded(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
                  className={`${inputCls} text-center font-['Outfit'] font-bold`}
                />
                <button
                  type="button"
                  onClick={() => setWorkersNeeded((n) => Math.min(200, n + 1))}
                  className="w-9 h-9 rounded-xl bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] text-[#FF7448] font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className={fieldLabelCls}>{t('bulk.startDate')}</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <Label className={fieldLabelCls}>{t('bulk.siteArea')}</Label>
              <select value={locationArea} onChange={(e) => setLocationArea(e.target.value)} className={inputCls}>
                {AREAS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className={fieldLabelCls}>{t('bulk.scopeNotes')}</Label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the work, site access, shift timings, number of days…"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Live estimate preview */}
          <div className="p-4 bg-[#FFF9F6] dark:bg-[#141D28] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] flex items-center justify-between gap-3">
            <div className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Indicative labour estimate for{' '}
              <strong className="text-[#0F151D] dark:text-[#FBFBFB]">{workersNeeded} workers</strong> × 1 day
            </div>
            <span className="font-['Outfit'] font-bold text-lg text-[#10B981]">
              ₹{(workersNeeded * 1800).toLocaleString('en-IN')} – ₹{(workersNeeded * 2250).toLocaleString('en-IN')}
            </span>
          </div>

          {formError && (
            <p className="px-4 py-3 rounded-xl bg-[#B23A2E]/10 border border-[#B23A2E]/30 text-[#B23A2E] text-xs font-semibold">
              {formError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full h-auto py-3.5 bg-[#FF7448] hover:bg-[#FF8D69] text-white font-['Outfit'] font-bold text-sm rounded-xl shadow-md shadow-[#FF7448]/20 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            {t('bulk.submitOrder')}
          </Button>
          <p className="text-[11px] text-center text-[#71717A] dark:text-[#A1A1AA] -mt-2">
            The society reviews your request, confirms pricing and allocates verified workers.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};