export type UserRole = 'customer' | 'worker' | 'society_admin' | 'federation_admin';

export type ServiceTypeCategory = 'Carpentry' | 'Electrical' | 'Plumbing' | 'Painting' | 'HVAC' | 'Masonry' | 'Welding' | 'Heavy Equipment' | 'Inspection' | 'Delivery';

export type BookingStatus = 'requested' | 'accepted' | 'en_route' | 'in_progress' | 'completed' | 'cancelled';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface WorkerProfile {
  id: string;
  name: string;
  avatar: string;
  roleTitle: string;
  societyAffiliation: string;
  guildNumber: string;
  rating: number;
  reviewCount: number;
  completedJobsCount: number;
  distanceMiles: number;
  driveTimeMin: number;
  verified: boolean;
  insuranceStatus: string;
  responseTime: string;
  hourlyRateConsultation: number;
  hourlyRateLabor: number;
  skills: { name: string; icon: string }[];
  bio: string;
  recentProjects: {
    title: string;
    date: string;
    rating: number;
    icon: string;
  }[];
  mapCoordinates: { xPercent: number; yPercent: number };
  coordinates: LatLng;
}

export interface Booking {
  id: string;
  referenceNumber: string;
  serviceTitle: string;
  serviceCategory: ServiceTypeCategory;
  serviceMode: 'consultation' | 'labor';
  workerId: string;
  workerName: string;
  workerAvatar: string;
  workerRating: number;
  workerJobsCount: number;
  status: BookingStatus;
  isEmergency: boolean;
  scheduledTime: string;
  address: string;
  estimatedCostRange: string;
  clientName: string;
  durationHours: number;
  baseRatePerHour: number;
  overtimeHours?: number;
  equipmentBonus?: number;
  societyDividendPercent: number;
  platformFeePercent: number;
  finalPayout?: number;
  createdAt: string;
  notes?: string;
  coordinates?: LatLng;
  workerCoordinates?: LatLng;
  cancelled_by?: 'customer' | 'worker';
}

export interface Society {
  id: string;
  name: string;
  region: string;
  membersCount: number;
  status: 'verified' | 'audit_pending' | 'review_required';
  verifiedWorkers: number;
  activeBookings: number;
  monthlyRevenue: string;
  coordinates: LatLng;
}

export interface GroundedPlace {
  title: string;
  uri: string;
  placeAnswerSources?: any;
}

export interface MapsGroundingResult {
  text: string;
  places: GroundedPlace[];
  groundingChunks: any[];
}


export interface WorkerApplicant {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  primarySkill: string;
  appliedDate: string;
  society: string;
  status: 'review' | 'approved' | 'rejected';
  experienceYears: number;
  /** Where the applicant currently works (self-employed / society / firm / other). */
  currentWorkplace?: string;
  email: string;
  /** Verified 10-digit Indian mobile of the applicant. */
  phone?: string;
  /** Aadhaar KYC verification fields. */
  aadhaarLast4?: string;
  aadhaarVerified?: boolean;
  /** Uploaded certificates / documents (names). */
  documents?: string[];
  /** Whether the applicant's live GPS location was captured for the record. */
  geoVerified?: boolean;
  /** Live-mode persistence fields (written via submit_worker_onboarding RPC). */
  services?: string[];
  homeCoordinates?: LatLng | null;
  radiusM?: number;
}

export type BulkOrderStatus = 'open' | 'allocating' | 'fulfilled' | 'cancelled';

export interface BulkOrder {
  id: string;
  orderNo: string;
  orgName: string;
  contactName: string;
  contactPhone: string;
  serviceType: string;
  workersNeeded: number;
  scheduledDate: string;
  locationArea: string;
  notes?: string;
  status: BulkOrderStatus;
  createdAt: string;
  estimatedCost: string;
}

export interface ActivityFeedItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'verification' | 'flagged' | 'dividend' | 'new_member' | 'system';
  actor: string;
}

export interface GovernanceRule {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'voting_open' | 'under_review';
  supportPercent?: number;
  quorumPercent?: number;
  category: string;
}
