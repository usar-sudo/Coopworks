import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Coopworks',
  description: 'How Coopworks Cooperative Federation handles member and customer data.',
};

const sections = [
  {
    title: '1. Who we are',
    body: 'Coopworks is a cooperative digital marketplace operated by the Coopworks Cooperative Federation. Our members are workers organised in local societies under a shared democratic charter.',
  },
  {
    title: '2. What we collect',
    body: 'Account data (name, email/phone, role), profile data you add as a worker (skill tags, society, service area and home pin), booking data (service type, scheduled time, job location), and ratings. Aadhaar or other identity data is only kept as a masked marker (e.g. last four digits) for verification — never full numbers.',
  },
  {
    title: '3. How we use it',
    body: 'To authenticate you and route you to your role workspace, match customers to verified workers within a service radius, run bookings and invoicing, and keep society/federation dashboards accurate. Location data is used only for matching and dispatch.',
  },
  {
    title: '4. What we share',
    body: 'Customers see a worker’s name, skills, society affiliation, rating and an approximate location — never exact home coordinates, phone numbers or documents. Within the cooperative, society admins see only workers and bookings in their own society; federation admins see aggregate oversight data.',
  },
  {
    title: '5. How we protect it',
    body: 'Row Level Security enforces that every read and write is scoped to your own identity and role at the database layer. State-changing actions run through server-side functions that re-derive your role from your session — never from values the browser sends.',
  },
  {
    title: '6. Retention & deletion',
    body: 'You can delete your account from the profile page at any time; this permanently removes your profile and cascades to your data, in line with our cooperative charter. Ratings left by customers are retained for community trust after account deletion where permitted.',
  },
  {
    title: '7. Payments & insurance',
    body: 'Booking costs are shown as transparent estimates and settlements are processed through each worker’s society on job completion. Payment-gateway and insurance integrations are being rolled out with partner societies; until they are live in your region, no real money or policies are exchanged through the platform.',
  },
  {
    title: '8. AI & automated processing',
    body: 'Some parts of the platform use automated text assistance (large language models) to help draft responses or summarise information. No account secrets or full Aadhaar numbers are passed to these systems; when automated help is used, it is on data you have already shared in the session and the output is reviewed by a person before any sensitive decision. AI-assisted features are optional and you can ask for a human-only response at any time.',
  },
  {
    title: '9. Contact',
    body: 'Questions about this policy or your data can be sent to the federation council through the cooperative admin of your society.',
  },
];

export default function PrivacyPolicyPage() {
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
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF7448]">Legal</span>
        <h1 className="font-['Outfit'] text-3xl md:text-4xl font-bold mt-1">Privacy Policy</h1>
        {/* Static date — a locale-formatted live Date would render differently
            on the server vs the client and trigger a hydration mismatch. */}
        <p className="text-xs text-[#71717A] mt-2">Last updated: 6 September 2026</p>

        <div className="mt-8 space-y-8">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-['Outfit'] text-lg font-bold">{s.title}</h2>
              <p className="text-sm text-[#52525B] dark:text-[#A1A1AA] leading-relaxed mt-1.5">{s.body}</p>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-[#F0E5DC] dark:border-[#2A3441] py-8 text-center">
        <p className="text-xs text-[#71717A]">© 2026 Coopworks Cooperative Federation.</p>
        <div className="mt-2 flex justify-center gap-6 text-xs">
          <Link href="/faqs" className="hover:text-[#FF7448] transition-colors">FAQs</Link>
          <Link href="/" className="hover:text-[#FF7448] transition-colors">Home</Link>
        </div>
      </footer>
    </div>
  );
}
