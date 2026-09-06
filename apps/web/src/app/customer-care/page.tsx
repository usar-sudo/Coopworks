import Link from 'next/link';

export const metadata = {
  title: 'Customer Care — Coopworks',
  description:
    'Reach the Coopworks customer care team for booking help, worker support and cooperative queries.',
};

const channels = [
  {
    icon: 'support_agent',
    title: 'Customer helpline',
    lines: ['1800-102-9274 (toll-free)', 'Mon–Sat, 8:00 AM – 8:00 PM'],
    note: 'For booking queries, tracking a job or a complaint about a completed service.',
  },
  {
    icon: 'forum',
    title: 'WhatsApp support',
    lines: ['+91 98765 43210', 'Replies within 2 hours'],
    note: 'Send your booking reference (e.g. #CWS-9012) for the fastest resolution.',
  },
  {
    icon: 'mail',
    title: 'Email the care team',
    lines: ['care@coopworks.in', 'Replies within one working day'],
    note: 'For documents, refunds, invoice issues or anything that needs a written trail.',
  },
  {
    icon: 'apartment',
    title: 'Your society office',
    lines: ['Find it in your profile', 'Office hours on weekdays'],
    note: 'Verification, society membership and payout queries go through your local co-op.',
  },
];

const helpTopics = [
  {
    title: 'Booking or dispatch issue',
    detail:
      'Worker not arriving, timings changed, or the job is taking longer than quoted? Open the booking and use “Cancel”, or call the helpline with your reference number and we will re-dispatch or refund.',
    actions: 'Call 1800-102-9274 · Option 1',
  },
  {
    title: 'Payment or refund question',
    detail:
      'You only pay after the work is done and confirmed. If a payment was deducted in error or a refund is due, email a screenshot of the booking summary to care@coopworks.in.',
    actions: 'Email care@coopworks.in',
  },
  {
    title: 'Worker verification support',
    detail:
      'Workers: if your application has been in review for over 48 hours, contact your society admin from the Approvals page or ask them to check the Pending Members queue.',
    actions: 'WhatsApp +91 98765 43210',
  },
  {
    title: 'Report an unsafe or unfair job',
    detail:
      'Every job booked through Coopworks is covered by the worker protection fund. Report concerns to the helpline and your society committee will review it with the federation.',
    actions: 'Call 1800-102-9274 · Option 3',
  },
];

export default function CustomerCarePage() {
  return (
    <div className="min-h-screen bg-[#FFF9F6] dark:bg-[#0F151D] text-[#0F151D] dark:text-[#FBFBFB]">
      {/* Minimal public header */}
      <header className="border-b border-[#F0E5DC] dark:border-[#2A3441] bg-white/80 dark:bg-[#1B232E]/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-['Outfit'] font-bold text-lg">
            <span className="w-8 h-8 rounded-lg bg-[#FF7448] text-white flex items-center justify-center font-bold text-sm">CW</span>
            Coopworks
          </Link>
          <Link href="/" className="text-xs font-semibold text-[#71717A] hover:text-[#FF7448] transition-colors">
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF7448]">
          Customer care
        </span>
        <h1 className="font-['Outfit'] text-3xl md:text-4xl font-bold mt-1">
          How can we help you today?
        </h1>
        <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mt-2 leading-relaxed">
          Real people from your cooperative — not bots. Call, message or write to us and a support
          member from the federation care team will take it from there.
        </p>

        {/* Contact channels */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {channels.map((c) => (
            <div
              key={c.title}
              className="bg-white dark:bg-[#1B232E] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] p-5 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FF7448]/10 dark:bg-[#FF7448]/15 text-[#FF7448] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">{c.icon}</span>
                </div>
                <h2 className="font-['Outfit'] font-bold text-sm">{c.title}</h2>
              </div>
              {c.lines.map((l) => (
                <p key={l} className="text-sm font-semibold text-[#0F151D] dark:text-[#FBFBFB] mt-3">
                  {l}
                </p>
              ))}
              <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed mt-1.5">{c.note}</p>
            </div>
          ))}
        </div>

        {/* Common help topics */}
        <div className="mt-12">
          <h2 className="font-['Outfit'] text-2xl font-bold">Common requests</h2>
          <div className="mt-4 space-y-3">
            {helpTopics.map((t) => (
              <div
                key={t.title}
                className="bg-white dark:bg-[#1B232E] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] p-5"
              >
                <h3 className="font-['Outfit'] font-bold text-sm">{t.title}</h3>
                <p className="text-sm text-[#52525B] dark:text-[#A1A1AA] leading-relaxed mt-1.5">
                  {t.detail}
                </p>
                <p className="text-xs font-bold text-[#FF7448] mt-3">{t.actions}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Escalation note */}
        <div className="mt-8 p-5 bg-[#FF7448]/5 dark:bg-[#FF7448]/10 rounded-2xl border border-[#FF7448]/25 text-sm leading-relaxed">
          <strong className="font-['Outfit'] font-bold text-[#0F151D] dark:text-[#FBFBFB]">
            Not resolved yet?
          </strong>{' '}
          <span className="text-[#52525B] dark:text-[#A1A1AA]">
            Ask for a ticket number on any channel. Unresolved tickets go to your society committee,
            and if needed, to the federation council — every case is answered.
          </span>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/faqs"
            className="inline-block text-xs font-['Outfit'] font-bold text-[#FF7448] hover:text-[#FF8D69] transition-colors"
          >
            Prefer to browse answers yourself? Visit the FAQs →
          </Link>
        </div>
      </main>

      <footer className="border-t border-[#F0E5DC] dark:border-[#2A3441] py-8 text-center">
        <p className="text-xs text-[#71717A]">© 2026 Coopworks Cooperative Federation, Delhi.</p>
        <div className="mt-2 flex justify-center gap-6 text-xs">
          <Link href="/faqs" className="hover:text-[#FF7448] transition-colors">FAQs</Link>
          <Link href="/privacy-policy" className="hover:text-[#FF7448] transition-colors">Privacy Policy</Link>
          <Link href="/" className="hover:text-[#FF7448] transition-colors">Home</Link>
        </div>
      </footer>
    </div>
  );
}
