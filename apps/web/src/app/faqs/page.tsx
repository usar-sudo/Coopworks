import Link from 'next/link';

export const metadata = {
  title: 'FAQs — Coopworks',
  description: 'Frequently asked questions about Coopworks, the cooperative gig platform.',
};

const faqs = [
  {
    q: 'What is Coopworks?',
    a: 'Coopworks is a cooperative-owned marketplace that connects verified workers from labour cooperative societies with households and businesses that need their skills — electricians, plumbers, carpenters, painters and more.',
  },
  {
    q: 'How is this different from other gig platforms?',
    a: 'Workers are cooperative members, not gig contractors. The federation keeps a 2.5% platform maintenance fee, 15% stays in the local society trust fund, and workers hold democratic voting rights over rates and standards through their society delegates.',
  },
  {
    q: 'How do I hire someone?',
    a: 'Create a customer account, search your trade (or let the platform match you), review the verified professionals near you on the map, and book a time slot. You can track the job live once a worker accepts.',
  },
  {
    q: 'How do I join as a worker?',
    a: 'Register with the “Worker” role, complete your profile with your trade, documents and location, and submit it. Your cooperative society admin reviews and verifies your application before you appear in matching results.',
  },
  {
    q: 'What does “verified” mean?',
    a: 'A verified worker has been reviewed and approved by their society admin. Only verified and available workers are returned by the geo-matching engine — this is enforced in the database query itself, not just hidden in the UI.',
  },
  {
    q: 'How does matching work?',
    a: 'When you search, the platform runs a real PostGIS distance query (ST_DWithin) against workers’ service areas around your location, filters to verified + available workers with your requested skill, and returns the nearest ones first.',
  },
  {
    q: 'Can a worker be double-booked?',
    a: 'No. The database has an exclusion constraint that makes overlapping accepted/in-progress bookings for the same worker physically impossible to insert, so double-booking is prevented even under race conditions.',
  },
  {
    q: 'How are prices and payouts split?',
    a: 'You see an estimated hourly or consultation rate per professional. On a job, the split is: worker payout, 15% society dividend fund, 2.5% platform maintenance fee. The payout breakdown is shown transparently on each booking.',
  },
  {
    q: 'How do payments and insurance work?',
    a: 'Each booking shows a transparent breakup — worker payout, 15% society dividend fund and a 2.5% platform maintenance fee. Payment settlement happens through the worker’s society on completion, and a payment gateway and insurance products are being activated with partner societies.',
  },
  {
    q: 'Who can see my data?',
    a: 'Row-level security scopes every query: customers and workers see only their own bookings; society admins see only their society; federation admins see oversight aggregates. See the Privacy Policy for details.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Open your profile (tap your avatar) and choose “Delete Account”. This permanently removes your account and cascades to your associated data.',
  },
];

export default function FaqPage() {
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
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF7448]">Help centre</span>
        <h1 className="font-['Outfit'] text-3xl md:text-4xl font-bold mt-1">Frequently Asked Questions</h1>
        <p className="text-sm text-[#71717A] mt-2">Everything about hiring, joining, verification, pricing and the cooperative model.</p>

        <div className="mt-8 space-y-3">
          {faqs.map((f, i) => (
            <details
              key={i}
              className="group bg-white dark:bg-[#1B232E] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] open:shadow-md transition-shadow"
            >
              <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none font-['Outfit'] font-bold text-sm">
                <span>{f.q}</span>
                <span className="material-symbols-outlined text-[18px] text-[#FF7448] transition-transform group-open:rotate-180">expand_more</span>
              </summary>
              <p className="px-5 pb-5 text-sm text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </main>

      <footer className="border-t border-[#F0E5DC] dark:border-[#2A3441] py-8 text-center">
        <p className="text-xs text-[#71717A]">© 2026 Coopworks Cooperative Federation.</p>
        <div className="mt-2 flex justify-center gap-6 text-xs">
          <Link href="/privacy-policy" className="hover:text-[#FF7448] transition-colors">Privacy Policy</Link>
          <Link href="/" className="hover:text-[#FF7448] transition-colors">Home</Link>
        </div>
      </footer>
    </div>
  );
}
