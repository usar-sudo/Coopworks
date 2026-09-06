import type { ServiceType } from 'shared-types';

/** Display labels for the 10 service categories (DB enum values). */
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  electrician: 'Electrician',
  plumber: 'Plumber',
  carpenter: 'Carpenter',
  painter: 'Painter',
  domestic_helper: 'Domestic Helper',
  caregiver: 'Caregiver',
  driver: 'Driver',
  gardener: 'Gardener',
  cleaner: 'Cleaner',
  technician: 'Technician'
};

export const SERVICE_TYPES_LIST = Object.entries(SERVICE_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as ServiceType, label })
);
