/** Single source of truth for the cooperative promise — shown in the footer,
 *  the "Browse Cooperative Crafts" popup, and the worker-profile guarantee. */
export interface CoopPromise {
  icon: string;
  title: string;
  text: string;
}

export const COOP_PROMISES: CoopPromise[] = [
  {
    icon: 'verified_user',
    title: 'Workers verified by their society',
    text: 'Every worker is checked and approved by their own society — certificates, references and an address visit — before they are ever dispatched to a job.',
  },
  {
    icon: 'currency_rupee',
    title: 'Open pricing, no hidden cuts',
    text: 'The full rate, the society share and the platform fee are shown openly on every booking — nothing hidden.',
  },
  {
    icon: 'groups',
    title: 'Worker-owned and worker-run',
    text: 'Members vote on rates and rules, one member one vote. The workers own the platform, not investors.',
  },
  {
    icon: 'support_agent',
    title: 'A real person behind every job',
    text: 'Your local society helpline answers when you need help — a person, not a bot.',
  },
];
