import type { UserRole } from 'shared-types';

/**
 * Demo personas — one-click identities used when no Supabase project is
 * configured (demo-first mode). Each persona maps to a real role so the
 * same session shape is used whether the session is simulated or live.
 */
export interface DemoPersona {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  /** societyId / federationId used by seeded demo data (optional until Phase 2+ seeds exist) */
  societyId?: string;
  federationId?: string;
  tagline: string;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'demo-customer',
    role: 'customer',
    name: 'Aisha Verma (Demo)',
    phone: '+91 90000 00001',
    tagline: 'Book & track verified tradespeople'
  },
  {
    id: 'demo-worker',
    role: 'worker',
    name: 'Marcus Cole (Demo)',
    phone: '+91 90000 00002',
    societyId: 'soc-1',
    tagline: 'Accept jobs, manage availability'
  },
  {
    id: 'demo-society-admin',
    role: 'society_admin',
    name: 'Ritu Sharma (Demo)',
    phone: '+91 90000 00003',
    societyId: 'soc-1',
    tagline: 'Verify workers & oversee society'
  },
  {
    id: 'demo-federation-admin',
    role: 'federation_admin',
    name: 'Arjun Mehta (Demo)',
    phone: '+91 90000 00004',
    federationId: 'fed-1',
    tagline: 'Cross-society analytics & policy'
  }
];

export function getDemoPersona(role: UserRole): DemoPersona | undefined {
  return DEMO_PERSONAS.find((p) => p.role === role);
}

export function getDemoPersonaById(id: string): DemoPersona | undefined {
  return DEMO_PERSONAS.find((p) => p.id === id);
}
