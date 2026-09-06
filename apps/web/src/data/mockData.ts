import { WorkerProfile, Booking, Society, WorkerApplicant, ActivityFeedItem, GovernanceRule, BulkOrder } from '../types';
import { personPhoto } from '../lib/portraits';

export const INITIAL_WORKERS: WorkerProfile[] = [
  {
    id: 'worker-sarah',
    name: 'Marcus Cole',
    avatar: personPhoto('Marcus Cole'),
    roleTitle: 'Master Carpenter',
    societyAffiliation: 'Dwarka Woodworkers Sangh',
    guildNumber: 'Member #402',
    rating: 4.9,
    reviewCount: 94,
    completedJobsCount: 142,
    distanceMiles: 1.1,
    driveTimeMin: 4,
    verified: true,
    insuranceStatus: 'Enrolled & Verified',
    responseTime: '< 2 Hours',
    hourlyRateConsultation: 450,
    hourlyRateLabor: 850,
    skills: [
      { name: 'Cabinetry', icon: 'build' },
      { name: 'Framing', icon: 'architecture' },
      { name: 'Furniture Repair', icon: 'chair' }
    ],
    bio: 'Carpenter from Dwarka with 15 years of experience in structural framing and custom cabinetry. Every project gets a written estimate, honest pricing and a clear finish date.',
    recentProjects: [
      {
        title: 'Custom Kitchen Installation',
        date: 'Completed Oct 2023',
        rating: 5.0,
        icon: 'kitchen'
      },
      {
        title: 'Outdoor Deck Framing',
        date: 'Completed Aug 2023',
        rating: 4.8,
        icon: 'deck'
      }
    ],
    mapCoordinates: { xPercent: 50, yPercent: 50 },
    coordinates: { lat: 28.6330, lng: 77.1700 }
  },
  {
    id: 'worker-marcus-cole',
    name: 'Marcus Cole',
    avatar: personPhoto('Marcus Cole'),
    roleTitle: 'Licensed Electrician',
    societyAffiliation: 'Karol Bagh Electricians Co-op',
    guildNumber: 'Member #219',
    rating: 4.7,
    reviewCount: 68,
    completedJobsCount: 110,
    distanceMiles: 1.4,
    driveTimeMin: 7,
    verified: true,
    insuranceStatus: 'Enrolled & Verified',
    responseTime: '< 1 Hour',
    hourlyRateConsultation: 500,
    hourlyRateLabor: 950,
    skills: [
      { name: 'Circuit Upgrades', icon: 'bolt' },
      { name: 'Panel Replacements', icon: 'power' },
      { name: 'Lighting Retrofit', icon: 'lightbulb' }
    ],
    bio: 'Licensed electrician for home wiring, panel upgrades and safety inspections. Works to Indian Electrical Standards and gives a fixed quote before starting.',
    recentProjects: [
      {
        title: 'Main Panel 200A Upgrade',
        date: 'Completed Nov 2023',
        rating: 4.9,
        icon: 'bolt'
      },
      {
        title: 'Solar Inverter Wiring',
        date: 'Completed Sep 2023',
        rating: 4.7,
        icon: 'solar_power'
      }
    ],
    mapCoordinates: { xPercent: 25, yPercent: 33 },
    coordinates: { lat: 28.6460, lng: 77.2130 }
  },
  {
    id: 'worker-rahul',
    name: 'Rahul Patil',
    avatar: personPhoto('Rahul Patil'),
    roleTitle: 'Plumber & AC Mechanic',
    societyAffiliation: 'Saket Plumbers Sangh',
    guildNumber: 'Member #308',
    rating: 4.9,
    reviewCount: 128,
    completedJobsCount: 215,
    distanceMiles: 1.6,
    driveTimeMin: 9,
    verified: true,
    insuranceStatus: 'Enrolled & Verified',
    responseTime: '< 30 Min',
    hourlyRateConsultation: 400,
    hourlyRateLabor: 900,
    skills: [
      { name: 'Emergency Pipe Repair', icon: 'plumbing' },
      { name: 'Boiler Diagnostics', icon: 'mode_heat' },
      { name: 'Drain Clearing', icon: 'water_damage' }
    ],
    bio: 'Plumber with 14 years of experience in burst pipes, geyser fitting and bathroom leaks. Available for emergencies across Delhi NCR with clear, upfront charges.',
    recentProjects: [
      {
        title: 'Commercial Riser Valve Repair',
        date: 'Completed Dec 2023',
        rating: 5.0,
        icon: 'plumbing'
      }
    ],
    mapCoordinates: { xPercent: 75, yPercent: 65 },
    coordinates: { lat: 28.6400, lng: 77.2010 }
  },
  {
    id: 'worker-elena',
    name: 'Anita Kulkarni',
    avatar: personPhoto('Anita Kulkarni'),
    roleTitle: 'Welder & Fabricator',
    societyAffiliation: 'Okhla Fabricators Co-op',
    guildNumber: 'Member #512',
    rating: 4.8,
    reviewCount: 52,
    completedJobsCount: 88,
    distanceMiles: 2.4,
    driveTimeMin: 12,
    verified: true,
    insuranceStatus: 'Enrolled & Verified',
    responseTime: '< 2 Hours',
    hourlyRateConsultation: 550,
    hourlyRateLabor: 1000,
    skills: [
      { name: 'TIG/MIG Welding', icon: 'construction' },
      { name: 'Structural Steel', icon: 'foundation' },
      { name: 'Custom Fabrication', icon: 'precision_manufacturing' }
    ],
    bio: 'Welder and fabricator for gates, railings, grills and structural steel. Verified by Okhla Fabricators Co-op with 12 years of workshop and on-site experience.',
    recentProjects: [
      {
        title: 'Industrial Fire Escape Retrofit',
        date: 'Completed Jan 2024',
        rating: 4.9,
        icon: 'construction'
      }
    ],
    mapCoordinates: { xPercent: 35, yPercent: 70 },
    coordinates: { lat: 28.6120, lng: 77.2220 }
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'booking-8924',
    referenceNumber: '#TRK-8924',
    serviceTitle: 'Burst Pipe Repair',
    serviceCategory: 'Plumbing',
    serviceMode: 'labor',
    workerId: 'worker-rahul',
    workerName: 'Rahul Patil',
    workerAvatar: personPhoto('Rahul Patil'),
    workerRating: 4.9,
    workerJobsCount: 128,
    status: 'en_route',
    isEmergency: true,
    scheduledTime: 'Today, 2:00 PM',
    address: 'Shop 12, Karol Bagh Market, New Delhi',
    estimatedCostRange: '₹1,500 – ₹2,500',
    clientName: 'Kulkarni Textiles, Karol Bagh',
    durationHours: 6.5,
    baseRatePerHour: 250.0,
    equipmentBonus: 100.0,
    societyDividendPercent: 15,
    platformFeePercent: 2.5,
    finalPayout: 1425.0,
    createdAt: 'Today, 1:30 PM',
    notes: 'Major leak in the basement. Water is rising fast near the electrical panel — needs urgent attention.',
    coordinates: { lat: 28.6519, lng: 77.1909 },
    workerCoordinates: { lat: 28.6440, lng: 77.1950 }
  },
  {
    id: 'booking-8925',
    referenceNumber: '#CWS-9012',
    serviceTitle: 'AC Servicing',
    serviceCategory: 'HVAC',
    serviceMode: 'labor',
    workerId: 'worker-sarah',
    workerName: 'Marcus Cole',
    workerAvatar: personPhoto('Marcus Cole'),
    workerRating: 4.9,
    workerJobsCount: 94,
    status: 'in_progress',
    isEmergency: false,
    scheduledTime: '08:00 - 10:30',
    address: 'Society Office, Green Meadows Society, Janakpuri, New Delhi',
    estimatedCostRange: '₹1,200 – ₹1,800',
    clientName: 'Green Meadows Society Office',
    durationHours: 2.5,
    baseRatePerHour: 450.0,
    societyDividendPercent: 15,
    platformFeePercent: 2.5,
    createdAt: 'Today, 07:45 AM',
    coordinates: { lat: 28.6217, lng: 77.0895 },
    workerCoordinates: { lat: 28.6330, lng: 77.1700 }
  },
  {
    id: 'booking-8926',
    referenceNumber: '#CWS-9013',
    serviceTitle: 'Plumbing Inspection',
    serviceCategory: 'Plumbing',
    serviceMode: 'consultation',
    workerId: 'worker-rahul',
    workerName: 'Rahul Patil',
    workerAvatar: personPhoto('Rahul Patil'),
    workerRating: 4.9,
    workerJobsCount: 128,
    status: 'requested',
    isEmergency: false,
    scheduledTime: '11:30 - 13:00',
    address: 'Flat 12, Janakpuri Society CHS, New Delhi',
    estimatedCostRange: '₹800 – ₹1,200',
    clientName: 'Society Managing Committee',
    durationHours: 1.5,
    baseRatePerHour: 400.0,
    societyDividendPercent: 15,
    platformFeePercent: 2.5,
    createdAt: 'Today, 09:10 AM',
    coordinates: { lat: 28.6480, lng: 77.2090 },
    workerCoordinates: { lat: 28.6400, lng: 77.2010 }
  },
  {
    id: 'booking-8927',
    referenceNumber: '#CWS-9014',
    serviceTitle: 'Water Tank Cleaning & Setup',
    serviceCategory: 'Delivery',
    serviceMode: 'labor',
    workerId: 'worker-rahul',
    workerName: 'Rahul Patil',
    workerAvatar: personPhoto('Rahul Patil'),
    workerRating: 4.9,
    workerJobsCount: 128,
    status: 'requested',
    isEmergency: false,
    scheduledTime: '14:00 - 15:00',
    address: 'Wing B, Saket Society Apartments, New Delhi',
    estimatedCostRange: '₹600 – ₹900',
    clientName: 'Saket Housing Society',
    durationHours: 1.0,
    baseRatePerHour: 400.0,
    societyDividendPercent: 15,
    platformFeePercent: 2.5,
    createdAt: 'Today, 10:00 AM',
    coordinates: { lat: 28.6310, lng: 77.2120 },
    workerCoordinates: { lat: 28.6400, lng: 77.2010 }
  },
  // Persona-scoped demo bookings — each demo login sees ONLY its own data:
  // Marcus Cole (worker) gets his own jobs, Aarav Mehta (customer) gets his
  // own orders. App.tsx filters INITIAL_BOOKINGS by the logged-in persona.
  {
    id: 'booking-8928',
    referenceNumber: '#CWS-9015',
    serviceTitle: 'Wiring & Switchboard Upgrade',
    serviceCategory: 'Electrical',
    serviceMode: 'labor',
    workerId: 'worker-vikram-j',
    workerName: 'Marcus Cole',
    workerAvatar: personPhoto('Marcus Cole'),
    workerRating: 4.8,
    workerJobsCount: 76,
    status: 'en_route',
    isEmergency: false,
    scheduledTime: 'Today, 4:30 PM',
    address: 'Flat 8B, Green Meadows Society, Janakpuri, New Delhi',
    estimatedCostRange: '₹2,000 – ₹3,200',
    clientName: 'Aarav Mehta',
    durationHours: 3.0,
    baseRatePerHour: 320.0,
    societyDividendPercent: 15,
    platformFeePercent: 2.5,
    finalPayout: 860.0,
    createdAt: 'Today, 3:10 PM',
    notes: 'Replace the main switchboard and add two new circuits for the kitchen.',
    coordinates: { lat: 28.6217, lng: 77.0895 },
    workerCoordinates: { lat: 28.6330, lng: 77.0950 }
  },
  {
    id: 'booking-8929',
    referenceNumber: '#CWS-9016',
    serviceTitle: 'Bathroom Fitting Repair',
    serviceCategory: 'Plumbing',
    serviceMode: 'consultation',
    workerId: 'worker-vikram-j',
    workerName: 'Marcus Cole',
    workerAvatar: personPhoto('Marcus Cole'),
    workerRating: 4.8,
    workerJobsCount: 76,
    status: 'requested',
    isEmergency: false,
    scheduledTime: 'Tomorrow, 10:00 AM',
    address: 'Shop 4, Karol Bagh Market, New Delhi',
    estimatedCostRange: '₹700 – ₹1,100',
    clientName: 'Sunita Verma',
    durationHours: 1.5,
    baseRatePerHour: 380.0,
    societyDividendPercent: 15,
    platformFeePercent: 2.5,
    createdAt: 'Today, 2:20 PM',
    coordinates: { lat: 28.6519, lng: 77.1909 },
    workerCoordinates: { lat: 28.6460, lng: 77.1940 }
  },
  {
    id: 'booking-8930',
    referenceNumber: '#CWS-9017',
    serviceTitle: 'AC Deep Servicing',
    serviceCategory: 'HVAC',
    serviceMode: 'labor',
    workerId: 'worker-sarah',
    workerName: 'Marcus Cole',
    workerAvatar: personPhoto('Marcus Cole'),
    workerRating: 4.9,
    workerJobsCount: 94,
    status: 'completed',
    isEmergency: false,
    scheduledTime: 'Yesterday, 09:00 - 11:30',
    address: 'Flat 3A, Green Meadows Society, Janakpuri, New Delhi',
    estimatedCostRange: '₹1,500 – ₹2,100',
    clientName: 'Aarav Mehta',
    durationHours: 2.5,
    baseRatePerHour: 450.0,
    societyDividendPercent: 15,
    platformFeePercent: 2.5,
    finalPayout: 1012.0,
    createdAt: 'Yesterday, 08:40 AM',
    coordinates: { lat: 28.6217, lng: 77.0895 },
    workerCoordinates: { lat: 28.6217, lng: 77.0895 }
  },
  {
    id: 'booking-8931',
    referenceNumber: '#CWS-9018',
    serviceTitle: 'Modular Kitchen Shelving',
    serviceCategory: 'Carpentry',
    serviceMode: 'labor',
    workerId: 'worker-rahul',
    workerName: 'Rahul Patil',
    workerAvatar: personPhoto('Rahul Patil'),
    workerRating: 4.9,
    workerJobsCount: 128,
    status: 'in_progress',
    isEmergency: false,
    scheduledTime: 'Today, 11:00 - 13:00',
    address: 'Flat 8B, Green Meadows Society, Janakpuri, New Delhi',
    estimatedCostRange: '₹1,800 – ₹2,600',
    clientName: 'Aarav Mehta',
    durationHours: 2.0,
    baseRatePerHour: 380.0,
    societyDividendPercent: 15,
    platformFeePercent: 2.5,
    createdAt: 'Today, 10:45 AM',
    coordinates: { lat: 28.6217, lng: 77.0895 },
    workerCoordinates: { lat: 28.6250, lng: 77.0930 }
  }
];

export const INITIAL_SOCIETIES: Society[] = [
  {
    id: 'soc-1',
    name: 'Janakpuri Workers Co-op',
    region: 'Delhi (West)',
    membersCount: 1240,
    status: 'verified',
    verifiedWorkers: 1180,
    activeBookings: 84,
    monthlyRevenue: '₹82L',
    coordinates: { lat: 28.6217, lng: 77.0895 }
  },
  {
    id: 'soc-2',
    name: 'Mumbai Metro Services Co-op',
    region: 'Mumbai',
    membersCount: 850,
    status: 'audit_pending',
    verifiedWorkers: 790,
    activeBookings: 62,
    monthlyRevenue: '₹4.9Cr',
    coordinates: { lat: 19.076, lng: 72.8777 }
  },
  {
    id: 'soc-3',
    name: 'Najafgarh Agro & Logistics Sangh',
    region: 'Delhi (South-West)',
    membersCount: 3420,
    status: 'review_required',
    verifiedWorkers: 3100,
    activeBookings: 195,
    monthlyRevenue: '₹2.1Cr',
    coordinates: { lat: 28.6129, lng: 76.9893 }
  },
  {
    id: 'soc-4',
    name: 'Nagpur Fabricators Society',
    region: 'Nagpur',
    membersCount: 415,
    status: 'verified',
    verifiedWorkers: 395,
    activeBookings: 41,
    monthlyRevenue: '₹31L',
    coordinates: { lat: 21.1466, lng: 79.0882 }
  }
];

export const INITIAL_APPLICANTS: WorkerApplicant[] = [
  {
    id: 'app-1',
    name: 'Sandeep More',
    avatar: personPhoto('Sandeep More'),
    primarySkill: 'Electrician',
    appliedDate: '24 Oct 2025',
    society: 'Dwarka Woodworkers Sangh',
    status: 'review',
    experienceYears: 12,
    email: 'sandeep.more@coopworks.in'
  },
  {
    id: 'app-2',
    name: 'Meera Nair',
    initials: 'MN',
    primarySkill: 'Painting & Waterproofing',
    appliedDate: '25 Oct 2025',
    society: 'Janakpuri Workers Co-op',
    status: 'review',
    experienceYears: 8,
    email: 'meera.nair@coopworks.in'
  },
  {
    id: 'app-3',
    name: 'Kiran Jadhav',
    avatar: personPhoto('Kiran Jadhav'),
    primarySkill: 'Welder',
    appliedDate: '26 Oct 2025',
    society: 'Saket Plumbers Sangh',
    status: 'review',
    experienceYears: 7,
    email: 'kiran.jadhav@coopworks.in'
  }
];

export const INITIAL_ACTIVITY: ActivityFeedItem[] = [
  {
    id: 'act-1',
    title: 'Verification Approved',
    description: 'Worker ID #4920 completed advanced safety training.',
    timestamp: '2 mins ago',
    type: 'verification',
    actor: 'SysAdmin_01'
  },
  {
    id: 'act-2',
    title: 'Booking Flagged',
    description: 'Unusual hour request for standard maintenance job #882.',
    timestamp: '14 mins ago',
    type: 'flagged',
    actor: 'Auto-System'
  },
  {
    id: 'act-3',
    title: 'Dividend Distribution',
    description: 'Q3 cooperative dividends successfully routed to 842 members.',
    timestamp: '1 hr ago',
    type: 'dividend',
    actor: 'Finance_Node'
  },
  {
    id: 'act-4',
    title: 'New Member',
    description: 'Application received for "Heavy Machinery Operator" tier.',
    timestamp: '3 hrs ago',
    type: 'new_member',
    actor: 'Portal_Web'
  }
];

// Institutional bulk orders — organisations place one request for many
// workers; societies staff it from their verified pool.
export const INITIAL_BULK_ORDERS: BulkOrder[] = [
  {
    id: 'bulk-1',
    orderNo: '#BLK-4821',
    orgName: 'Green Meadows Housing Co-op',
    contactName: 'Ritu Malhotra',
    contactPhone: '+91 98123 45678',
    serviceType: 'Painting & Waterproofing',
    workersNeeded: 8,
    scheduledDate: '18 Sep 2026',
    locationArea: 'Janakpuri, New Delhi',
    notes: 'Annual exterior repaint across 4 towers. Need 8 painters for 3 weeks.',
    status: 'open',
    createdAt: 'Today, 9:40 AM',
    estimatedCost: '₹4.8L – ₹5.6L'
  },
  {
    id: 'bulk-2',
    orderNo: '#BLK-4817',
    orgName: 'Delhi Public School, Saket',
    contactName: 'Dr. Anil Verma',
    contactPhone: '+91 98765 43210',
    serviceType: 'Electrical',
    workersNeeded: 6,
    scheduledDate: '13 Sep 2026',
    locationArea: 'Saket, New Delhi',
    notes: 'Pre-monsoon safety check + LED retrofit on 3 buildings. 6 electricians, 5 days.',
    status: 'allocating',
    createdAt: 'Yesterday, 4:15 PM',
    estimatedCost: '₹2.1L – ₹2.6L'
  },
  {
    id: 'bulk-3',
    orderNo: '#BLK-4809',
    orgName: 'Metro Plaza Mall',
    contactName: 'Farah Khan',
    contactPhone: '+91 98989 10101',
    serviceType: 'Cleaning & Housekeeping',
    workersNeeded: 12,
    scheduledDate: '30 Sep 2026',
    locationArea: 'Karol Bagh, New Delhi',
    notes: 'Deep-clean contract for common areas. 12 cleaners, nightly shift.',
    status: 'open',
    createdAt: '2 days ago',
    estimatedCost: '₹3.2L – ₹3.8L'
  }
];

export const GOVERNANCE_RULES: GovernanceRule[] = [
  {
    id: 'rule-1',
    title: 'Minimum Base Rate parity',
    description: 'Ensures all societies maintain a minimum hourly rate tied to regional cost of living indices.',
    status: 'active',
    category: 'Compensation'
  },
  {
    id: 'rule-2',
    title: 'Data Portability Standard v2',
    description: 'Proposed update to how member work history is transferred between different society platforms.',
    status: 'voting_open',
    supportPercent: 68,
    quorumPercent: 75,
    category: 'Infrastructure'
  }
];
