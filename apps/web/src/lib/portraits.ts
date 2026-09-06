/**
 * portraits.ts — deterministic "person photo" picker for demo/mock people.
 *
 * Uses the stable randomuser.me portrait set (free to use). A name always maps
 * to the same photo, so a worker keeps one face everywhere (cards, maps,
 * modals). Gender is guessed from a small common-first-name list with a
 * default to male; results are best-effort demo assets — production users
 * upload their own verified member photos.
 */
const MEN = [
  5, 11, 12, 22, 32, 41, 45, 52, 59, 65, 68, 71, 75, 83, 86, 90, 91, 96,
];
const WOMEN = [
  12, 26, 28, 32, 35, 44, 47, 52, 57, 60, 65, 68, 75, 79, 85, 90, 93, 96,
];
const FEMALE_FIRST_NAMES = [
  'aisha', 'aarti', 'amrita', 'anjali', 'ananya', 'deepa', 'divya', 'farah',
  'geeta', 'isha', 'jyoti', 'kavita', 'kiran', 'lakshmi', 'meena', 'meera',
  'neha', 'nisha', 'pallavi', 'pooja', 'priya', 'priyanka', 'rachna', 'radha',
  'rekha', 'ritu', 'roshni', 'sandhya', 'sarita', 'shalini', 'shanti',
  'shobha', 'sneha', 'sunita', 'swati', 'usha', 'vandana', 'vidya',
];

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

export function isFemaleName(name: string): boolean {
  const first = (name || '').trim().split(/\s+/)[0] || '';
  return FEMALE_FIRST_NAMES.includes(first.toLowerCase());
}

/** Stable photo URL for a person name ("" still yields a valid portrait). */
export function personPhoto(name: string): string {
  const base = (name || '').trim() || 'Worker';
  const set = isFemaleName(base) ? WOMEN : MEN;
  const index = set[hashString(base) % set.length];
  const gender = isFemaleName(base) ? 'women' : 'men';
  return `https://randomuser.me/api/portraits/${gender}/${index}.jpg`;
}
