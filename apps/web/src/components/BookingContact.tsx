import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Booking, UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  ChatMessage,
  QUICK_REPLIES,
  appendMessage,
  demoPhoneFor,
  getThread,
  otherSide
} from '../lib/chatStore';

export interface ContactPerson {
  name: string;
  avatar?: string;
  /** Assigned Worker / Client — shown as the card's kicker. */
  tag: 'worker' | 'client';
}

interface ContactModalShellProps {
  onClose: () => void;
  header: React.ReactNode;
  children: React.ReactNode;
}

/** Shared glass shell used by both the chat and the call modal. */
const ContactModalShell: React.FC<ContactModalShellProps> = ({ onClose, header, children }) => {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white/80 dark:bg-[#1B232E]/85 backdrop-blur-2xl backdrop-saturate-150 text-[#0F151D] dark:text-[#FBFBFB] w-full max-w-lg rounded-3xl border border-white/70 dark:border-white/10 shadow-2xl overflow-hidden transition-colors flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-[#FFF9F6]/80 dark:bg-[#0F151D]/80 border-b border-[#F0E5DC] dark:border-[#2A3441] flex items-center justify-between shrink-0">
            {header}
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-white dark:bg-[#2A3441] border border-[#F0E5DC] dark:border-[#2E3946] flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB] cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          {children}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export function avatarFor(person: ContactPerson, size: string): React.ReactNode {
  if (person.avatar) {
    return (
      <img
        src={person.avatar}
        alt={person.name}
        className={`${size} rounded-full object-cover border border-[#F0E5DC] dark:border-[#2E3946]`}
      />
    );
  }
  const initials = person.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div
      className={`${size} rounded-full bg-[#FF7448]/15 dark:bg-[#FF7448]/20 border border-[#FF7448]/30 flex items-center justify-center text-[#FF7448] font-['Outfit'] font-bold`}
      aria-label={person.name}
    >
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChatModal
// ---------------------------------------------------------------------------
interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  viewerRole: UserRole;
  counterpart: ContactPerson;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  booking,
  viewerRole,
  counterpart
}) => {
  const { t } = useLanguage();
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mySide = otherSide(viewerRole);
  const canChat = !!booking && booking.status !== 'completed' && booking.status !== 'cancelled';

  // Load (and lazily seed) the thread whenever the modal opens for a booking.
  useEffect(() => {
    if (isOpen && booking) {
      setMessages(getThread(booking));
      // Focus the composer after the panel animates in.
      const id = window.setTimeout(() => inputRef.current?.focus(), 180);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [isOpen, booking?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the newest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const quickReplies = useMemo(
    () => (viewerRole === 'worker' ? QUICK_REPLIES.worker : QUICK_REPLIES.customer),
    [viewerRole]
  );

  if (!isOpen || !booking) return null;

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const next = appendMessage(booking.id, mySide, trimmed);
    setMessages(next);
    setDraft('');
    inputRef.current?.focus();
  };

  return (
    <ContactModalShell
      onClose={onClose}
      header={
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            {avatarFor(counterpart, 'w-11 h-11')}
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#10B981] border-2 border-white dark:border-[#0F151D]"></span>
          </div>
          <div className="min-w-0">
            <h3 className="font-['Outfit'] text-base font-bold text-[#0F151D] dark:text-[#FBFBFB] truncate">
              {t('chat.with', { name: counterpart.name })}
            </h3>
            <p className="text-[11px] font-semibold text-[#FF7448] uppercase tracking-wider truncate">
              {t('chat.bookingRef', { ref: booking.referenceNumber.replace('#', '') })} •{' '}
              {booking.serviceTitle}
            </p>
          </div>
        </div>
      }
    >
      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 bg-[#FFF9F6]/60 dark:bg-transparent min-h-[260px]">
        {messages.length === 0 && (
          <p className="text-xs text-[#71717A] text-center py-8">{t('chat.empty')}</p>
        )}
        {messages.map((m) => {
          const mine = m.from === mySide;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-snug shadow-xs ${
                  mine
                    ? 'bg-[#FF7448] text-white rounded-br-md'
                    : 'bg-white dark:bg-[#2A3441] border border-[#F0E5DC] dark:border-[#2E3946] text-[#0F151D] dark:text-[#FBFBFB] rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p
                  className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-[#71717A] dark:text-[#A1A1AA]'}`}
                >
                  {m.time}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {canChat ? (
        <>
          {/* Quick replies */}
          <div className="px-5 pt-3 shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] mb-1.5">
              {t('chat.quickReplies')}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {quickReplies.map((qr) => (
                <button
                  key={qr}
                  onClick={() => send(qr)}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-[#FF7448]/10 dark:bg-[#FF7448]/15 border border-[#FF7448]/30 text-[#FF7448] text-xs font-['Outfit'] font-semibold hover:bg-[#FF7448]/20 transition-colors cursor-pointer"
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>

          {/* Composer */}
          <div className="px-5 py-3.5 border-t border-[#F0E5DC] dark:border-[#2A3441] shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send(draft);
                }}
                placeholder={t('chat.placeholder')}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] focus:outline-none focus:ring-2 focus:ring-[#FF7448]/40 text-sm text-[#0F151D] dark:text-[#FBFBFB] placeholder:text-[#A1A1AA]"
              />
              <button
                onClick={() => send(draft)}
                disabled={!draft.trim()}
                aria-label={t('chat.send')}
                className="w-11 h-11 rounded-xl bg-[#FF7448] hover:bg-[#FF8D69] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-xs shadow-[#FF7448]/20 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        <p className="px-5 py-3.5 border-t border-[#F0E5DC] dark:border-[#2A3441] text-xs text-[#71717A] shrink-0">
          {t('chat.readOnly')}
        </p>
      )}
    </ContactModalShell>
  );
};

// ---------------------------------------------------------------------------
// CallModal
// ---------------------------------------------------------------------------
type CallState = 'ringing' | 'connected';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  counterpart: ContactPerson;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  booking,
  counterpart
}) => {
  const { t } = useLanguage();
  const [state, setState] = useState<CallState>('ringing');
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const phone = demoPhoneFor(counterpart.name);

  useEffect(() => {
    if (!isOpen) return;
    setState('ringing');
    setSeconds(0);
    setMuted(false);
    setSpeaker(false);
    const connect = window.setTimeout(() => setState('connected'), 2400);
    return () => window.clearTimeout(connect);
  }, [isOpen, booking?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Call timer once connected.
  useEffect(() => {
    if (!isOpen || state !== 'connected') return;
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isOpen, state]);

  if (!isOpen || !booking) return null;

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <ContactModalShell
      onClose={onClose}
      header={
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            {avatarFor(counterpart, 'w-11 h-11')}
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#0F151D] ${
                state === 'connected' ? 'bg-[#10B981]' : 'bg-[#F59E0B] animate-pulse'
              }`}
            ></span>
          </div>
          <div className="min-w-0">
            <h3 className="font-['Outfit'] text-base font-bold text-[#0F151D] dark:text-[#FBFBFB] truncate">
              {t('call.title', { name: counterpart.name })}
            </h3>
            <p className="text-[11px] font-semibold text-[#FF7448] uppercase tracking-wider truncate">
              {t('call.subtitle', {
                ref: booking.referenceNumber.replace('#', ''),
                service: booking.serviceTitle
              })}
            </p>
          </div>
        </div>
      }
    >
      <div className="px-6 py-8 flex flex-col items-center gap-5">
        {/* Status + timer */}
        <div className="text-center">
          {state === 'ringing' ? (
            <p className="text-sm font-semibold text-[#71717A] dark:text-[#A1A1AA]">
              {t('call.ringing')} <span className="text-[#FF7448] font-bold">{phone}</span>
            </p>
          ) : (
            <p className="text-4xl font-['Outfit'] font-bold tabular-nums text-[#0F151D] dark:text-[#FBFBFB]">
              {mm}:{ss}
            </p>
          )}
        </div>

        {/* Big pulsing avatar while ringing */}
        <motion.div
          animate={
            state === 'ringing'
              ? { scale: [1, 1.08, 1] }
              : { scale: 1 }
          }
          transition={{ repeat: state === 'ringing' ? Infinity : 0, duration: 1.1 }}
          className="relative"
        >
          {avatarFor(counterpart, 'w-24 h-24')}
          {state === 'ringing' && (
            <span className="absolute inset-0 rounded-full border-2 border-[#FF7448]/40 animate-ping"></span>
          )}
        </motion.div>

        <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] text-center leading-relaxed max-w-sm">
          {t('call.secureNote')}
        </p>

        {/* In-call controls */}
        <div className="flex items-center gap-5">
          <button
            onClick={() => setMuted((m) => !m)}
            aria-pressed={muted}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
              muted
                ? 'bg-[#FF7448] text-white'
                : 'bg-white dark:bg-[#2A3441] border border-[#F0E5DC] dark:border-[#2E3946] text-[#0F151D] dark:text-[#FBFBFB]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {muted ? 'mic_off' : 'mic'}
            </span>
            {t('call.mute')}
          </button>
          <button
            onClick={() => setSpeaker((s) => !s)}
            aria-pressed={speaker}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
              speaker
                ? 'bg-[#FF7448] text-white'
                : 'bg-white dark:bg-[#2A3441] border border-[#F0E5DC] dark:border-[#2E3946] text-[#0F151D] dark:text-[#FBFBFB]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {speaker ? 'volume_up' : 'volume_off'}
            </span>
            {t('call.speaker')}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full max-w-xs">
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="flex-1 px-4 py-3 bg-white dark:bg-[#2A3441] border border-[#F0E5DC] dark:border-[#2E3946] hover:border-[#10B981]/50 text-[#0F151D] dark:text-[#FBFBFB] text-xs font-['Outfit'] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-[#10B981]">smartphone</span>
            {t('call.openDialer')}
          </a>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-['Outfit'] font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs shadow-[#EF4444]/20 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">call_end</span>
            {t('call.end')}
          </button>
        </div>
      </div>
    </ContactModalShell>
  );
};
