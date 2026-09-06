import Link from 'next/link';

export const metadata = {
  title: 'Welcome to Coopworks',
  description: 'Your Coopworks account is ready. Find verified workers near you and book a job in under two minutes.',
};

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#FFF9F6] dark:bg-[#0F151D] text-[#0F151D] dark:text-[#FBFBFB]">
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

      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-md space-y-5">
          <div className="w-20 h-20 rounded-2xl bg-[#10B981]/10 dark:bg-[#10B981]/20 text-[#10B981] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[42px]">how_to_reg</span>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#10B981]">Account created</span>
          <h1 className="font-['Outfit'] text-3xl font-bold">You are in.</h1>
          <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
            Welcome to Coopworks. Your account is active — you can now find and book verified workers in your area, or apply to join a cooperative as a worker.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/customer-home"
              className="px-6 py-3 bg-[#FF7448] hover:bg-[#FF8D69] text-white font-['Outfit'] font-bold text-sm rounded-xl shadow-md shadow-[#FF7448]/25 transition-colors"
            >
              Open my workspace
            </Link>
            <Link
              href="/faqs"
              className="px-6 py-3 bg-white dark:bg-[#1B232E] border border-[#F0E5DC] dark:border-[#2E3946] text-[#0F151D] dark:text-[#FBFBFB] font-['Outfit'] font-bold text-sm rounded-xl hover:bg-[#FFF9F6] dark:hover:bg-[#2A3441] transition-colors"
            >
              Read the FAQs
            </Link>
          </div>
          <p className="text-[11px] text-[#71717A]">
            We will reply to your account email within 1 business day if you asked a question during signup.
          </p>
        </div>
      </main>

      <footer className="border-t border-[#F0E5DC] dark:border-[#2A3441] py-6 text-center">
        <p className="text-xs text-[#71717A]">© 2026 Coopworks Cooperative Federation, Delhi.</p>
        <div className="mt-2 flex justify-center gap-6 text-xs">
          <Link href="/faqs" className="hover:text-[#FF7448] transition-colors">FAQs</Link>
          <Link href="/privacy-policy" className="hover:text-[#FF7448] transition-colors">Privacy</Link>
          <Link href="/" className="hover:text-[#FF7448] transition-colors">Home</Link>
        </div>
      </footer>
    </div>
  );
}
