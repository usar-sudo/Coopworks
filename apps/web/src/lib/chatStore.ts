import { Booking, UserRole } from '../types';

/**
 * chatStore — lightweight in-app messaging for a booking's two parties
 * (customer <-> assigned worker). Because Coopworks is a cooperative, all
 * messages for a booking are visible to both sides — no private threads.
 *
 * The store is per-booking and persisted to localStorage under
 * `cw_chat_v1_<bookingId>` so a conversation survives page reloads and role
 * switches (both sides read the same thread).
 */

export interface ChatMessage {
  id: string;
  /** The side that wrote the message. Rendered left/right per viewer role. */
  from: 'customer' | 'worker';
  text: string;
  time: string;
}

/** What the *current viewer* may send to the other party on a booking. */
export const QUICK_REPLIES: Record<UserRole, string[]> = {
  customer: [
    'Hi, are you available at the scheduled time?',
    'Please confirm the final quote before starting.',
    'I am at the site — call me when you reach.',
    'Please carry the invoice copy along.'
  ],
  worker: [
    'On my way — ETA about 15 minutes.',
    'Please share the gate / floor details.',
    'Quote confirmed. Starting once I reach.',
    'Job done — settlement after inspection.'
  ],
  society_admin: [],
  federation_admin: []
};

// ---------------------------------------------------------------------------
// Deterministic demo phone numbers (+91 9XXXXXXXXX, Indian format). Derived
// from the party's name so the number never changes between calls/screens.
// ---------------------------------------------------------------------------
function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

export function demoPhoneFor(name: string): string {
  const h = hashName(name.trim().toLowerCase());
  // Indian mobile numbers are 10 digits and start with 6-9. The remaining nine
  // digits come from the hash so a person keeps one stable, dialable number.
  const rest = (h % 1000000000).toString().padStart(9, '0');
  const n = (6 + (h % 4)).toString() + rest; // 10 digits
  return `+91 ${n.slice(0, 5)} ${n.slice(5)}`;
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------
function storageKey(bookingId: string): string {
  return `cw_chat_v1_${bookingId}`;
}

function readThread(bookingId: string): ChatMessage[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(bookingId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeThread(bookingId: string, messages: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(bookingId), JSON.stringify(messages));
  } catch {
    // storage full/unavailable — chat still works for the session
  }
}

function nowTime(): string {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * First time a thread is opened we seed a short realistic exchange so the
 * conversation doesn't open empty. The seed is generated once per booking and
 * never rewritten, so later reopens keep user messages intact.
 */
export function getThread(booking: Booking): ChatMessage[] {
  const existing = readThread(booking.id);
  if (existing) return existing;

  const fromWorker: string =
    booking.status === 'requested'
      ? 'Thanks for the request. I can take this up — confirming the quote shortly.'
      : booking.status === 'en_route' || booking.status === 'accepted'
        ? 'On my way to the site. I will update you once I reach.'
        : booking.status === 'in_progress'
          ? 'I have reached the site and started the work.'
          : 'The work is complete — please do the inspection and confirm.';

  const fromCustomer =
    booking.status === 'requested'
      ? `Hi, I have sent the ${booking.serviceTitle} request for ${booking.scheduledTime}.`
      : booking.status === 'en_route' || booking.status === 'accepted'
        ? 'Okay, please message me if you need any directions.'
        : booking.status === 'in_progress'
          ? 'Great — let me know if you need anything from my side.'
          : 'Thanks for the great work. Will confirm after the inspection.';

  const seeded: ChatMessage[] = [
    {
      id: `${booking.id}-seed-1`,
      from: 'customer',
      text: fromCustomer,
      time: booking.createdAt === 'Just now' ? nowTime() : '09:02 AM'
    },
    {
      id: `${booking.id}-seed-2`,
      from: 'worker',
      text: fromWorker,
      time: booking.createdAt === 'Just now' ? nowTime() : '09:04 AM'
    }
  ];
  writeThread(booking.id, seeded);
  return seeded;
}

export function appendMessage(bookingId: string, from: 'customer' | 'worker', text: string): ChatMessage[] {
  const current = readThread(bookingId) ?? [];
  const next = [
    ...current,
    { id: `${bookingId}-${Date.now()}`, from, text, time: nowTime() }
  ];
  writeThread(bookingId, next);
  return next;
}

export function otherSide(role: UserRole): 'customer' | 'worker' {
  return role === 'worker' ? 'customer' : 'worker';
}
