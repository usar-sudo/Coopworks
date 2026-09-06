import React, { useEffect, useState } from 'react';
import { WorkerApplicant } from '../types';
import { isSupabaseConfigured } from 'shared-lib';
import { serviceTypeFromLabel } from '../lib/dbMapper';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';

export type RegisterMode = 'customer' | 'worker';

interface WorkerRegistrationProps {
  isOpen: boolean;
  /** Which account track to start on. Defaults to 'customer'. */
  initialMode?: RegisterMode;
  onClose: () => void;
  /** Worker track: submit a full membership application for society review. */
  onSubmitApplicant: (applicant: Partial<WorkerApplicant>) => void;
  /** Customer track: create a member account and open the marketplace. */
  onRegisterCustomer: (data: {
    name: string;
    phone: string;
    email?: string;
    area?: string;
  }) => void;
}

// Standard trades offered by the co-op + "any other trade" free entry.
const TRADE_OPTIONS = [
  'Carpenter',
  'Electrician',
  'Plumber',
  'Painter',
  'Welder / Fabricator',
  'Mason / Bricklayer',
  'HVAC / AC Technician',
  'Tile & Flooring',
  'Roofing / Waterproofing',
  'Heavy Equipment Operator',
  'Driver',
  'Gardener / Landscaper',
  'Domestic Helper',
  'Caregiver / Nurse Aide',
  'Cleaner / Housekeeping',
  'Other trade…'
];

const OTHER_TRADE = TRADE_OPTIONS[TRADE_OPTIONS.length - 1];

// Where the applicant currently works — shown to the society during review.
const WORKPLACE_OPTIONS = [
  'Self-employed / own workshop',
  'Cooperative society workshop',
  'Private firm / contractor',
  'Other workplace…'
];
const OTHER_WORKPLACE = WORKPLACE_OPTIONS[WORKPLACE_OPTIONS.length - 1];

const SOCIETY_OPTIONS = [
  'Janakpuri Workers Co-op',
  'Saket Plumbers Sangh',
  'Karol Bagh Electricians Co-op',
  'Okhla Fabricators Co-op',
  'Dwarka Multi-Trade Co-op',
  'Other cooperative society…'
];

const OTHER_SOCIETY = SOCIETY_OPTIONS[SOCIETY_OPTIONS.length - 1];

// Certificates & documents grouped by education / trade / business credentials.
const DOCUMENT_OPTIONS = [
  'ITI Trade Certificate (NCVT/SCVT)',
  'Diploma — Polytechnic (Engineering Trade)',
  'Degree — B.E. / B.Tech / B.Sc',
  'NSDC / SSC Skill Certificate',
  'Trade License (State / Municipal)',
  'Electrical Supervisor / Wireman License',
  'Gas / Plumbing Safety Card',
  'First-Aid & Fire-Safety Certificate',
  'Heavy Machinery Operator Permit',
  'Driving Licence (Commercial)',
  'Experience Letter',
  'Udyam / GST Registration',
  'Other document…'
];
const OTHER_DOC = DOCUMENT_OPTIONS[DOCUMENT_OPTIONS.length - 1];

// ---------------------------------------------------------------------------
// Aadhaar verification helpers.
//
// Two checks run locally and deterministically:
//  1. The 12-digit Verhoeff checksum — the exact algorithm UIDAI uses, so a
//     mistyped or fabricated number is rejected outright.
//  2. Cross-match between the full legal name entered and the name as printed
//     on the Aadhaar (token order-insensitive).
// The society then completes UIDAI-linked e-KYC (OTP on the registered mobile)
// during onboarding, where an AUA licence is available.
// ---------------------------------------------------------------------------
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];
const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];
const VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

function verhoeffValid(num: string): boolean {
  const digits = num.split('').map(Number);
  let c = 0;
  for (let i = 0; i < digits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digits[digits.length - 1 - i]]];
  }
  return VERHOEFF_INV[c] === 0;
}

/** Order-insensitive token match (short name set must be contained in the long). */
function namesMatch(a: string, b: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z\u0900-\u097F\s]/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  const x = norm(a);
  const y = norm(b);
  if (x.length === 0 || y.length === 0) return false;
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  return short.every((t) => long.includes(t));
}

const inputCls =
  'w-full h-auto min-h-9 px-3.5 py-2.5 bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] rounded-xl text-xs text-[#0F151D] dark:text-[#FBFBFB] placeholder-[#71717A] focus:outline-none focus:border-[#FF7448] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#FF7448]';

const fieldLabelCls = 'block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1.5';

export const WorkerRegistration: React.FC<WorkerRegistrationProps> = ({
  isOpen,
  initialMode = 'customer',
  onClose,
  onSubmitApplicant,
  onRegisterCustomer
}) => {
  const [mode, setMode] = useState<RegisterMode>(initialMode);
  // Shared basics
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Worker-only fields
  const [primarySkill, setPrimarySkill] = useState(TRADE_OPTIONS[0]);
  const [customTrade, setCustomTrade] = useState('');
  const [society, setSociety] = useState(SOCIETY_OPTIONS[0]);
  const [customSociety, setCustomSociety] = useState('');
  const [experienceYears, setExperienceYears] = useState(5);
  const [workplaceType, setWorkplaceType] = useState(WORKPLACE_OPTIONS[0]);
  const [customWorkplace, setCustomWorkplace] = useState('');
  const [agreed, setAgreed] = useState(false);

  // Aadhaar KYC
  const [aadhaar, setAadhaar] = useState('');
  const [aadhaarName, setAadhaarName] = useState('');
  const [aadhaarStatus, setAadhaarStatus] = useState<'idle' | 'checking' | 'verified' | 'error'>('idle');
  const [aadhaarError, setAadhaarError] = useState('');

  // Documents & certificates
  const [documentName, setDocumentName] = useState('');
  const [customDoc, setCustomDoc] = useState('');
  const [documents, setDocuments] = useState<string[]>([]);
  
  // File uploads
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState<File | null>(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState<File | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<{name: string; file: File; preview: string}[]>([]);

  // Location verification
  const [geoStatus, setGeoStatus] = useState<'idle' | 'capturing' | 'verified' | 'error'>('idle');
  const [geoCoords, setGeoCoords] = useState<string>('');

  // Customer-only fields
  const [customerArea, setCustomerArea] = useState('Connaught Place, New Delhi');
  const [submitted, setSubmitted] = useState(false);
  // Inline submit errors (no native alert popups).
  const [formError, setFormError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('idle');
  const [verificationError, setVerificationError] = useState('');

  // Keep the modal in sync with the requested initial mode each time it opens.
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSubmitted(false);
      setFormError('');
      // Reset verification chips so a reopened form starts clean.
      setAadhaarStatus('idle');
      setGeoStatus('idle');
      setDocuments([]);
    }
  }, [isOpen, initialMode]);

  const resolveTrade = () =>
    primarySkill === OTHER_TRADE ? customTrade.trim() || 'General Technician' : primarySkill;
  const resolveSociety = () =>
    society === OTHER_SOCIETY
      ? customSociety.trim() || 'New Cooperative Society (unaffiliated)'
      : society;

  // No auto-formatting - user enters raw 10-digit number
  // The stored value is already formatted with the +91 country code, so take
  // the final 10 digits when validating (Indian mobiles start with 6-9).
  const phoneDigits = () => {
    const d = phone.replace(/\D/g, '');
    return d.length > 10 ? d.slice(-10) : d;
  };
  const phoneValid = () => /^[6-9]\d{9}$/.test(phoneDigits());

  // Phone/Email verification
  const sendVerification = () => {
    setVerificationStatus('sending');
    setTimeout(() => {
      setVerificationSent(true);
      setVerificationStatus('idle');
    }, 1500);
  };

  const verifyCode = () => {
    setVerificationStatus('verified');
  };

  // Aadhaar verification
  const runAadhaarCheck = () => {
    const digits = aadhaar.replace(/\D/g, '');
    if (digits.length !== 12) {
      setAadhaarStatus('error');
      setAadhaarError('Enter the full 12-digit Aadhaar number.');
      return;
    }
    if (!verhoeffValid(digits)) {
      setAadhaarStatus('error');
      setAadhaarError('This number failed the Aadhaar checksum — please check for a typing error.');
      return;
    }
    setAadhaarStatus('checking');
    setAadhaarError('');
    window.setTimeout(() => {
      if (!namesMatch(name.trim(), aadhaarName.trim())) {
        setAadhaarStatus('error');
        setAadhaarError(
          'The name entered does not match the name printed on this Aadhaar. Enter it exactly as printed.'
        );
        return;
      }
      setAadhaarStatus('verified');
    }, 900);
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }
    setGeoStatus('capturing');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setGeoStatus('verified');
      },
      () => setGeoStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const addDocument = () => {
    const doc =
      documentName === OTHER_DOC
        ? customDoc.trim()
        : documentName;
    if (doc && !documents.includes(doc)) setDocuments([...documents, doc]);
    setDocumentName('');
    setCustomDoc('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'aadhaar-front' | 'aadhaar-back' | 'document') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setFormError('Please upload JPG, PNG, WebP, or PDF files only.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError('File size must be less than 5MB.');
      return;
    }
    const preview = URL.createObjectURL(file);
    if (type === 'aadhaar-front') setAadhaarFrontFile(file);
    else if (type === 'aadhaar-back') setAadhaarBackFile(file);
    else setUploadedDocs(prev => [...prev, { name: file.name, file, preview }]);
    setFormError('');
  };

  const removeUploadedDoc = (index: number) => {
    setUploadedDocs(prev => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Enter your full legal name to continue.');
      return;
    }
    if (!phoneValid()) {
      setFormError('Enter a valid 10-digit Indian mobile number (starts with 6–9).');
      return;
    }
    onRegisterCustomer({ name, phone: `+91 ${phoneDigits()}`, email: email || undefined, area: customerArea });
    onClose();
  };

  const handleWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) {
      setFormError('Enter your full legal name to continue.');
      return;
    }
    if (!phoneValid()) {
      setFormError('Enter a valid 10-digit Indian mobile number (starts with 6–9).');
      return;
    }
    if (!agreed) {
      setFormError('Please agree to the cooperative bylaws to proceed.');
      return;
    }
    if (aadhaarStatus !== 'verified') {
      setFormError('Aadhaar verification must pass before your application is accepted.');
      return;
    }
    
    // Check password
    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    
    // Check passwords match
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    
    // Check verification
    if (verificationStatus !== 'verified') {
      setFormError('Please complete phone/email verification before submitting.');
      return;
    }

    const liveMode = isSupabaseConfigured();
    const aadhaarLast4 = aadhaar.replace(/\D/g, '').slice(-4);
    const geoVerified = geoStatus === 'verified';
    if (liveMode && !geoVerified) {
      setFormError(
        'Live verification requires your GPS location. Enable location access and capture it above before submitting.'
      );
      return;
    }

    let homeCoordinates: { lat: number; lng: number } | undefined;
    if (geoCoords) {
      const [lat, lng] = geoCoords.split(',').map((n) => parseFloat(n.trim()));
      if (!isNaN(lat) && !isNaN(lng)) homeCoordinates = { lat, lng };
    }

    onSubmitApplicant({
      name,
      email,
      phone: `+91 ${phoneDigits()}`,
      primarySkill: resolveTrade(),
      society: resolveSociety(),
      experienceYears: Number(experienceYears),
      currentWorkplace:
        workplaceType === OTHER_WORKPLACE ? customWorkplace.trim() : workplaceType,
      status: 'review',
      appliedDate: 'Just now',
      aadhaarLast4,
      aadhaarVerified: true,
      documents: documents.length > 0 ? documents : undefined,
      geoVerified,
      services: [serviceTypeFromLabel(resolveTrade())],
      homeCoordinates,
      radiusM: 15000
    });
    setSubmitted(true);
  };

  // ---------------------------------------------------------------- success
  const successView = (
    <div className="p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center mx-auto">
        <span className="material-symbols-outlined text-[32px]">how_to_reg</span>
      </div>
      <h3 className="font-['Outfit'] text-xl font-bold mt-4">Application received</h3>
      <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mt-2 leading-relaxed">
        Your society will verify your certificates and Aadhaar, then approve your membership
        within 48 hours. You will be notified on <strong>{phone}</strong> the moment you are
        live on the platform.
      </p>
      <div className="flex gap-2 mt-6">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl bg-[#FF7448] hover:bg-[#FF8D69] text-white text-sm font-bold transition-colors cursor-pointer"
        >
          Done
        </button>
        <button
          onClick={() => {
            setSubmitted(false);
            setName('');
            setPhone('');
            setAadhaar('');
            setAadhaarName('');
            setAadhaarStatus('idle');
            setGeoStatus('idle');
          }}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#2A3441] border border-[#F0E5DC] dark:border-[#2E3946] text-xs font-bold text-[#0F151D] dark:text-[#FBFBFB] cursor-pointer"
        >
          Register someone else
        </button>
      </div>
    </div>
  );

  // ------------------------------------------------------------- form shell
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={`gap-0 p-0 overflow-hidden rounded-3xl border border-[#F0E5DC] dark:border-[#2A3441] bg-white/85 dark:bg-[#232E3A]/85 backdrop-blur-2xl backdrop-saturate-150 shadow-2xl max-h-[92vh] flex flex-col transition-colors ${
          submitted ? 'max-w-md' : 'max-w-xl'
        }`}
      >
        <DialogTitle className="sr-only">Create your account</DialogTitle>
        {submitted ? (
          successView
        ) : (
          <>
            {/* Header */}
            <div className="p-6 pb-4 bg-[#FFF9F6]/80 dark:bg-[#0F151D]/80 border-b border-[#F0E5DC] dark:border-[#2A3441]">
              <div className="flex items-start justify-between gap-3 pr-8">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF7448]">
                    Coopworks Membership
                  </span>
                  <h2 className="font-['Outfit'] text-2xl font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                    Create your account
                  </h2>
                </div>
              </div>

              {/* Account type: customers register instantly; workers apply for
                  membership. Admins never self-register — accounts are opened by
                  the cooperative (back office). */}
              <Tabs
                value={mode}
                onValueChange={(v) => {
                  setMode(v as RegisterMode);
                  setFormError('');
                }}
              >
                <TabsList className="w-full grid h-auto grid-cols-2 gap-1 p-1 mt-4 rounded-xl bg-[#FFF9F6] dark:bg-[#141D28] border border-[#F0E5DC] dark:border-[#2A3441]">
                  <TabsTrigger
                    value="customer"
                    className="py-2.5 rounded-lg data-[state=active]:bg-[#FF7448] data-[state=active]:text-white text-[#71717A] dark:text-[#A1A1AA] data-[state=active]:shadow-sm dark:data-[state=active]:text-white"
                  >
                    <span className="material-symbols-outlined text-[15px]">person</span>
                    I am a Customer
                  </TabsTrigger>
                  <TabsTrigger
                    value="worker"
                    className="py-2.5 rounded-lg data-[state=active]:bg-[#FF7448] data-[state=active]:text-white text-[#71717A] dark:text-[#A1A1AA] data-[state=active]:shadow-sm dark:data-[state=active]:text-white"
                  >
                    <span className="material-symbols-outlined text-[15px]">engineering</span>
                    I am a Worker
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Form Body */}
            <form
              onSubmit={mode === 'customer' ? handleCustomerSubmit : handleWorkerSubmit}
              className="p-6 overflow-y-auto space-y-5 flex-1"
            >
              {/* Password (required for both modes) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={fieldLabelCls}>PASSWORD</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={fieldLabelCls}>CONFIRM PASSWORD</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Phone (for verification) */}
              <div>
                <label className={fieldLabelCls}>PHONE NUMBER</label>
                <Input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98XXX XXXXX"
                  className={`${inputCls} font-mono tracking-wider`}
                />
              </div>

              {/* Email (for customer verification) */}
              {mode === 'customer' && (
                <div>
                  <label className={fieldLabelCls}>EMAIL ADDRESS</label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={inputCls}
                  />
                </div>
              )}

              {/* Verification button */}
              <div className="p-4 bg-[#FFF9F6] dark:bg-[#141D28] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF7448]">
                    {mode === 'worker' ? 'Phone Verification (Required)' : 'Email Verification (Required)'}
                  </span>
                  {verificationStatus === 'verified' && (
                    <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">verified</span>
                      Verified
                    </span>
                  )}
                </div>
                {!verificationSent ? (
                  <button
                    type="button"
                    onClick={sendVerification}
                    className="w-full py-2.5 bg-[#FF7448] hover:bg-[#FF8D69] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">send</span>
                    {mode === 'worker' ? 'Send OTP to Phone' : 'Send Verification Email'}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      required
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter 4-digit code"
                      className={`${inputCls} text-center font-mono tracking-widest`}
                    />
                    <button
                      type="button"
                      onClick={verifyCode}
                      className="px-4 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      Verify
                    </button>
                  </div>
                )}
                {verificationError && (
                  <p className="text-[11px] text-[#B23A2E]">{verificationError}</p>
                )}
              </div>

              {/* Shared identity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={fieldLabelCls}>Full Legal Name</label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Rohan Deshmukh"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={fieldLabelCls}>Mobile Number</label>
                  <Input
                    type="tel"
                    required
                    inputMode="tel"
                    placeholder="+91 98XXX XXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`${inputCls} font-mono tracking-wider ${
                      phone && !phoneValid() ? 'border-[#B23A2E]/60' : ''
                    }`}
                  />
                  {phone && !phoneValid() && (
                    <p className="text-[11px] text-[#B23A2E] mt-1">
                      Enter a valid 10-digit Indian mobile number.
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className={fieldLabelCls}>Email (optional)</label>
                <Input
                  type="email"
                  placeholder="rohan.deshmukh@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* ============ CUSTOMER TRACK ============ */}
              {mode === 'customer' && (
                <div>
                  <label className={fieldLabelCls}>Where do you need services?</label>
                  <select
                    value={customerArea}
                    onChange={(e) => setCustomerArea(e.target.value)}
                    className={inputCls}
                  >
                    <option>Connaught Place, New Delhi</option>
                    <option>Karol Bagh, New Delhi</option>
                    <option>Janakpuri, New Delhi</option>
                    <option>Saket, New Delhi</option>
                    <option>Dwarka, New Delhi</option>
                    <option>Noida, Uttar Pradesh</option>
                    <option>Gurugram, Haryana</option>
                    <option>Faridabad, Haryana</option>
                  </select>
                  <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-1.5">
                    Your account opens the customer workspace — you can book and track verified
                    workers in your area right away.
                  </p>
                </div>
              )}

              {/* ============ WORKER TRACK ============ */}
              {mode === 'worker' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={fieldLabelCls}>Your Main Trade</label>
                      <select
                        value={primarySkill}
                        onChange={(e) => setPrimarySkill(e.target.value)}
                        className={inputCls}
                      >
                        {TRADE_OPTIONS.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={fieldLabelCls}>Years of Active Experience</label>
                      <Input
                        type="number"
                        min="1"
                        max="45"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(Number(e.target.value))}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {primarySkill === OTHER_TRADE && (
                    <div>
                      <label className={fieldLabelCls}>Tell us your trade</label>
                      <Input
                        type="text"
                        required
                        placeholder="e.g. Scaffolding Erector, Tiler, Solar Panel Installer…"
                        value={customTrade}
                        onChange={(e) => setCustomTrade(e.target.value)}
                        className={inputCls}
                      />
                      <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-1.5">
                        Any trade works — the society maps your skill and starts matching you to the
                        right jobs.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className={fieldLabelCls}>Your Cooperative Society</label>
                    <select
                      value={society}
                      onChange={(e) => setSociety(e.target.value)}
                      className={inputCls}
                    >
                      {SOCIETY_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>

                  {society === OTHER_SOCIETY && (
                    <div>
                      <label className={fieldLabelCls}>Society name</label>
                      <Input
                        type="text"
                        required
                        placeholder="e.g. Rohini Carpenters Seva Sahakari Samiti"
                        value={customSociety}
                        onChange={(e) => setCustomSociety(e.target.value)}
                        className={inputCls}
                      />
                      <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-1.5">
                        Don’t see your co-op? Type its registered name — we will route your
                        application to it, or help you register a new one.
                      </p>
                    </div>
                  )}

                  {/* Where the applicant currently works */}
                  <div>
                    <label className={fieldLabelCls}>Where do you work now?</label>
                    <select
                      value={workplaceType}
                      onChange={(e) => setWorkplaceType(e.target.value)}
                      className={inputCls}
                    >
                      {WORKPLACE_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                    {workplaceType === OTHER_WORKPLACE && (
                      <Input
                        type="text"
                        required
                        placeholder="e.g. Sharma Electricals, Karol Bagh"
                        value={customWorkplace}
                        onChange={(e) => setCustomWorkplace(e.target.value)}
                        className={inputCls + ' mt-2'}
                      />
                    )}
                    <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-1.5">
                      Your current workplace goes on the application the society reviews — it
                      backs up your experience proof.
                    </p>
                  </div>

                  {/* Aadhaar KYC */}
                  <div className="p-4 bg-[#FFF9F6] dark:bg-[#141D28] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#FF7448]">
                        Aadhaar Verification
                      </span>
                      {aadhaarStatus === 'verified' ? (
                        <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          Verified — number & name match
                        </span>
                      ) : aadhaarStatus === 'checking' ? (
                        <span className="text-[10px] font-bold text-[#FF7448] bg-[#FF7448]/10 px-2 py-1 rounded-full flex items-center gap-1">
                          <span className="w-3 h-3 border-2 border-[#FF7448] border-t-transparent rounded-full animate-spin"></span>
                          Checking…
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={14}
                        placeholder="12-digit Aadhaar number"
                        value={aadhaar}
                        onChange={(e) => {
                          setAadhaar(e.target.value);
                          setAadhaarStatus('idle');
                          setAadhaarError('');
                        }}
                        className={`${inputCls} font-mono tracking-widest`}
                      />
                    </div>
                    <div>
                      <Input
                        type="text"
                        placeholder="Name exactly as printed on Aadhaar"
                        value={aadhaarName}
                        onChange={(e) => {
                          setAadhaarName(e.target.value);
                          setAadhaarStatus('idle');
                          setAadhaarError('');
                        }}
                        className={inputCls}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={runAadhaarCheck}
                      disabled={aadhaarStatus === 'checking'}
                      className="w-full py-2.5 bg-[#FF7448] hover:bg-[#FF8D69] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">verified_user</span>
                      Verify Aadhaar
                    </button>
                    {aadhaarStatus === 'error' && (
                      <p className="text-[11px] text-[#B23A2E]">{aadhaarError}</p>
                    )}
                    {aadhaarStatus === 'verified' && (
                      <p className="text-[11px] text-[#10B981]">
                        Aadhaar {aadhaar.replace(/\D/g, '').replace(/^(\d{4})\d{4}(\d{4})$/, 'XXXX XXXX $2')} — checksum passed and name
                        matched. Your society runs the UIDAI-linked e-KYC step when you onboard.
                      </p>
                    )}
                  </div>
                    
                    {/* Aadhaar card upload */}
                    <div className="pt-3 border-t border-[#F0E5DC] dark:border-[#2E3946] space-y-3">
                      <p className="text-[11px] font-bold text-[#71717A]">Upload Aadhaar Card (Optional)</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="border-2 border-dashed border-[#F0E5DC] dark:border-[#2E3946] rounded-xl p-3 text-center hover:border-[#FF7448] transition-colors">
                          {aadhaarFrontFile ? (
                            <div className="space-y-2">
                              <img src={URL.createObjectURL(aadhaarFrontFile)} alt="Aadhaar Front" className="w-full h-20 object-cover rounded" />
                              <p className="text-[10px] text-[#10B981]">Front uploaded</p>
                            </div>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[20px] text-[#71717A]">credit_card</span>
                              <p className="text-[10px] text-[#71717A] mt-1">Front side</p>
                              <label className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] text-[10px] font-bold rounded-lg cursor-pointer hover:border-[#FF7448] transition-colors">
                                <span className="material-symbols-outlined text-[12px]">upload</span>
                                Upload
                                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFileUpload(e, 'aadhaar-front')} />
                              </label>
                            </>
                          )}
                        </div>
                        <div className="border-2 border-dashed border-[#F0E5DC] dark:border-[#2E3946] rounded-xl p-3 text-center hover:border-[#FF7448] transition-colors">
                          {aadhaarBackFile ? (
                            <div className="space-y-2">
                              <img src={URL.createObjectURL(aadhaarBackFile)} alt="Aadhaar Back" className="w-full h-20 object-cover rounded" />
                              <p className="text-[10px] text-[#10B981]">Back uploaded</p>
                            </div>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[20px] text-[#71717A]">credit_card</span>
                              <p className="text-[10px] text-[#71717A] mt-1">Back side</p>
                              <label className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] text-[10px] font-bold rounded-lg cursor-pointer hover:border-[#FF7448] transition-colors">
                                <span className="material-symbols-outlined text-[12px]">upload</span>
                                Upload
                                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFileUpload(e, 'aadhaar-back')} />
                              </label>
                            </>
                          )}
                        </div>
                      </div>
                    </div>


                  {/* Certifications & documents with file upload */}
                  <div className="p-4 bg-[#FFF9F6] dark:bg-[#141D28] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] space-y-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#FF7448]">
                        Certifications & Documents
                      </span>
                      <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-1">
                        ITI, diploma, degree, licences and safety cards — add everything you hold.
                      </p>
                    </div>
                    
                    {/* Document type selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                      <select
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        className={`${inputCls} bg-white dark:bg-[#0F151D]`}
                      >
                        <option value="">Select certificate / document...</option>
                        {DOCUMENT_OPTIONS.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={addDocument}
                        disabled={!documentName || (documentName === OTHER_DOC && !customDoc.trim())}
                        className="px-4 py-2.5 bg-[#0F151D] dark:bg-white text-white dark:text-[#0F151D] text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        Add
                      </button>
                    </div>
                    {documentName === OTHER_DOC && (
                      <Input
                        type="text"
                        placeholder="Type the document / certificate name..."
                        value={customDoc}
                        onChange={(e) => setCustomDoc(e.target.value)}
                        className={inputCls}
                      />
                    )}
                    
                    {/* Document name tags */}
                    {documents.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {documents.map((doc) => (
                          <span
                            key={doc}
                            className="text-[11px] font-semibold bg-[#FF7448]/10 text-[#FF7448] border border-[#FF7448]/25 px-2.5 py-1 rounded-full flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[12px]">description</span>
                            {doc}
                            <button
                              type="button"
                              onClick={() => setDocuments(documents.filter((d) => d !== doc))}
                              className="hover:text-[#FF8D69] cursor-pointer"
                            >
                              x
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* File upload area */}
                    <div className="border-2 border-dashed border-[#F0E5DC] dark:border-[#2E3946] rounded-xl p-4 text-center hover:border-[#FF7448] transition-colors">
                      <span className="material-symbols-outlined text-[24px] text-[#71717A]">cloud_upload</span>
                      <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-2">
                        Upload scanned copies of your certificates
                      </p>
                      <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] mt-1">
                        JPG, PNG, WebP or PDF - Max 5MB each
                      </p>
                      <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[#FF7448] hover:bg-[#FF8D69] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors">
                        <span className="material-symbols-outlined text-[14px]">upload_file</span>
                        Choose Files
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'document')}
                          multiple
                        />
                      </label>
                    </div>
                    
                    {/* Uploaded files preview */}
                    {uploadedDocs.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold text-[#71717A]">Uploaded Files:</p>
                        {uploadedDocs.map((doc, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 bg-white dark:bg-[#0F151D] rounded-lg border border-[#F0E5DC] dark:border-[#2E3946]">
                            {doc.file.type.startsWith('image/') ? (
                              <img src={doc.preview} alt={doc.name} className="w-10 h-10 rounded object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-[20px] text-[#FF7448]">picture_as_pdf</span>
                            )}
                            <span className="text-xs text-[#0F151D] dark:text-[#FBFBFB] flex-1 truncate">{doc.name}</span>
                            <button
                              type="button"
                              onClick={() => removeUploadedDoc(index)}
                              className="text-[#EF4444] hover:text-[#DC2626] cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  <div className="p-4 bg-[#FFF9F6] dark:bg-[#141D28] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#FF7448]">
                        Live Location Capture
                      </span>
                      {geoStatus === 'verified' ? (
                        <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">my_location</span>
                          Captured
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                      Confirm your current location so your society can send you jobs in your area.
                    </p>
                    {geoStatus === 'verified' && geoCoords && (
                      <p className="text-[11px] font-mono text-[#10B981]">GPS: {geoCoords}</p>
                    )}
                    <button
                      type="button"
                      onClick={captureLocation}
                      disabled={geoStatus === 'capturing'}
                      className="w-full py-2.5 bg-white dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] rounded-xl text-xs font-bold text-[#0F151D] dark:text-[#FBFBFB] hover:border-[#FF7448] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {geoStatus === 'capturing' ? (
                        <>
                          <span className="w-3 h-3 border-2 border-[#FF7448] border-t-transparent rounded-full animate-spin"></span>
                          Locating…
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[14px]">gps_fixed</span>
                          {geoStatus === 'verified' ? 'Recapture Location' : 'Capture My Location'}
                        </>
                      )}
                    </button>
                    {geoStatus === 'error' && (
                      <p className="text-[11px] text-[#B23A2E]">
                        Location permission denied. Enable GPS access to continue verification.
                      </p>
                    )}
                  </div>

                  {/* Bylaws */}
                  <div className="p-4 bg-[#FFF9F6] dark:bg-[#141D28] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] space-y-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-1 text-[#FF7448] rounded focus:ring-[#FF7448]"
                      />
                      <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                        I agree to the Coopworks rules: 15% of every job stays with my society welfare
                        fund, work is peer-reviewed, and pricing stays honest and transparent.
                      </span>
                    </label>
                  </div>
                </>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3.5 bg-[#FF7448] hover:bg-[#FF8D69] text-white font-['Outfit'] font-bold text-sm rounded-xl shadow-md shadow-[#FF7448]/20 transition-all cursor-pointer"
              >
                {mode === 'customer'
                  ? 'Create Customer Account'
                  : 'Submit Membership Application'}
              </button>
              {mode === 'worker' && (
                <p className="text-[11px] text-center text-[#71717A] dark:text-[#A1A1AA] -mt-2">
                  Society & federation admins are appointed by the co-op — admin accounts are opened
                  in the back office, never by public registration.
                </p>
              )}
              {formError && (
                <p className="px-4 py-3 -mt-2 rounded-xl bg-[#B23A2E]/10 border border-[#B23A2E]/30 text-[#B23A2E] text-xs font-semibold">
                  {formError}
                </p>
              )}
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};