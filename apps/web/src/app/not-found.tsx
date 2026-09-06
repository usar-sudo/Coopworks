import Link from 'next/link';

export const metadata = {
  title: 'Page not found — Coopworks',
  description: 'This page does not exist on Coopworks.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FFF9F6] dark:bg-[#0F151D] text-[#0F151D] dark:text-[#FBFBFB] flex flex-col">
      {/* Minimal public header */}
      <header className="border-b border-[#F0E5DC] dark:border-[#2A3441] bg-white/80 dark:bg-[#1B232E]/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-['Outfit'] font-bold text-lg">
            <span className="w-8 h-8 rounded-lg bg-[#FF7448] text-white flex items-center justify-center font-bold text-sm">
              CW
            </span>
            Coopworks
          </Link>
          <Link href="/" className="text-xs font-semibold text-[#71717A] hover:text-[#FF7448] transition-colors">
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-md space-y-5">
          <div className="w-20 h-20 rounded-2xl bg-[#FF7448]/10 dark:bg-[#FF7448]/20 text-[#FF7448] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[42px]">construction</span>
          </div>
          <span className="font-['Outfit'] text-6xl font-bold text-[#FF7448] tracking-tight">404</span>
          <h1 className="font-['Outfit'] text-2xl font-bold">This page is not on the job list</h1>
          <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
            The page you are looking for may have been moved, or the address is wrong. Head back to
            the Coopworks site to find a worker, track a booking or manage your cooperative.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/"
              className="px-6 py-3 bg-[#FF7448] hover:bg-[#FF8D69] text-white font-['Outfit'] font-bold text-sm rounded-xl shadow-md shadow-[#FF7448]/25 transition-colors"
            >
              Go to Coopworks home
            </Link>
            <Link
              href="/faqs"
              className="px-6 py-3 bg-white dark:bg-[#1B232E] border border-[#F0E5DC] dark:border-[#2E3946] text-[#0F151D] dark:text-[#FBFBFB] font-['Outfit'] font-bold text-sm rounded-xl hover:bg-[#FFF9F6] dark:hover:bg-[#2A3441] transition-colors"
            >
              Read the FAQs
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#F0E5DC] dark:border-[#2A3441] py-6 text-center">
        <p className="text-xs text-[#71717A]">© 2026 Coopworks Cooperative Federation, Delhi.</p>
      </footer>
    </div>
  );
}
