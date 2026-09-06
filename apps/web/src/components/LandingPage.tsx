import { personPhoto } from '../lib/portraits';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { PromiseModal } from './PromiseModal';

interface LandingPageProps {
  onNavigate: (view: string) => void;
  onOpenRegister: (mode?: 'customer' | 'worker') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenRegister
}) => {
  const { t } = useLanguage();
  const [showPromise, setShowPromise] = useState(false);
  return (
    <div className="w-full bg-[#FFF9F6] dark:bg-[#0F151D] text-[#0F151D] dark:text-[#FBFBFB] transition-colors duration-200">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="max-w-3xl mx-auto text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF7448]/10 dark:bg-[#FF7448]/15 border border-[#FF7448]/25 text-[#FF7448] text-xs font-semibold uppercase tracking-wider shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#FF7448] shadow-[0_0_8px_rgba(255,116,72,0.6)]"></span>
            Worker Cooperative Platform
          </div>

          <h1 className="font-['Outfit'] text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#0F151D] dark:text-[#FBFBFB] leading-[1.1]">
            more jobs. <br className="hidden sm:inline" />
            <span className="text-[#FF7448]">less chasing.</span>
          </h1>

          <p className="text-[#71717A] dark:text-[#A1A1AA] text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Coopworks connects verified local workers with the homes and businesses that need them —
            fair pay, no middlemen, and every society run by the workers themselves.
          </p>
          <p className="text-xs text-[#10B981] font-semibold flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            Workers reply within 1 business day — every quoted job is confirmed in writing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('marketplace')}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#FF7448] text-white font-['Outfit'] font-bold text-base rounded-xl shadow-lg shadow-[#FF7448]/25 hover:bg-[#FF8D69] transition-all flex items-center justify-center gap-2"
            >
              <span>{t('landing.findWorker')}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenRegister('worker')}
              className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-[#1B232E] border border-[#F0E5DC] dark:border-[#2E3946] text-[#0F151D] dark:text-[#FBFBFB] font-['Outfit'] font-bold text-base rounded-xl hover:border-[#D3E1FF] dark:hover:border-[#3F3F46] hover:bg-[#FFF9F6] dark:hover:bg-[#0F151D] shadow-xs transition-all"
            >
              {t('landing.apply')}
            </motion.button>
          </div>

          {/* Quick Metrics */}
          <div className="pt-10 grid grid-cols-3 gap-4 max-w-xl mx-auto border-t border-[#F0E5DC] dark:border-[#2A3441]">
            <div className="p-2">
              <p className="font-['Outfit'] text-2xl md:text-3xl font-bold text-[#0F151D] dark:text-[#FBFBFB]">100%</p>
              <p className="text-xs text-[#71717A] dark:text-[#71717A] font-medium mt-0.5">Worker Owned</p>
            </div>
            <div className="p-2">
              <p className="font-['Outfit'] text-2xl md:text-3xl font-bold text-[#10B981]">12,450+</p>
              <p className="text-xs text-[#71717A] dark:text-[#71717A] font-medium mt-0.5">Verified Trades</p>
            </div>
            <div className="p-2">
              <p className="font-['Outfit'] text-2xl md:text-3xl font-bold text-[#FF7448]">4.9 / 5.0</p>
              <p className="text-xs text-[#71717A] dark:text-[#71717A] font-medium mt-0.5">Trust Score</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Trades Grid */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto border-t border-[#F0E5DC] dark:border-[#2A3441]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF7448]">Skilled Workers</span>
            <h2 className="font-['Outfit'] text-2xl md:text-3xl font-bold text-[#0F151D] dark:text-[#FBFBFB] mt-1">
              Trades You Can Depend On
            </h2>
          </div>
          <button
            onClick={() => onNavigate('marketplace')}
            className="text-xs font-semibold text-[#FF7448] hover:underline flex items-center gap-1 mt-2 md:mt-0"
          >
            <span>View all 10 trades</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div 
            whileHover={{ y: -4 }}
            onClick={() => onNavigate('marketplace')}
            className="bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] hover:border-[#FF7448] dark:hover:border-[#FF7448] transition-all cursor-pointer group shadow-sm hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-[#FF7448]/10 dark:bg-[#0F151D] text-[#FF7448] flex items-center justify-center mb-4 group-hover:bg-[#FF7448] group-hover:text-white transition-colors border border-[#FF7448]/20 dark:border-[#2E3946]">
              <span className="material-symbols-outlined text-[24px]">bolt</span>
            </div>
            <h3 className="font-['Outfit'] text-lg font-bold text-[#0F151D] dark:text-[#FBFBFB] mb-1">Electrical</h3>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed mb-4">
              Panel upgrades, EV charging stations, wiring, diagnostics, code compliance.
            </p>
            <span className="text-xs font-bold text-[#FF7448] flex items-center gap-1">
              Explore 48 electricians <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </span>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4 }}
            onClick={() => onNavigate('marketplace')}
            className="bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] hover:border-[#10B981] dark:hover:border-[#10B981] transition-all cursor-pointer group shadow-sm hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 dark:bg-[#0F151D] text-[#10B981] flex items-center justify-center mb-4 group-hover:bg-[#10B981] group-hover:text-white transition-colors border border-[#10B981]/20 dark:border-[#2E3946]">
              <span className="material-symbols-outlined text-[24px]">plumbing</span>
            </div>
            <h3 className="font-['Outfit'] text-lg font-bold text-[#0F151D] dark:text-[#FBFBFB] mb-1">Plumbing</h3>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed mb-4">
              Pipe repairs, boiler diagnostics, fixture installs, emergency rapid dispatch.
            </p>
            <span className="text-xs font-bold text-[#10B981] flex items-center gap-1">
              Explore 64 plumbers <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </span>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4 }}
            onClick={() => onNavigate('marketplace')}
            className="bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] hover:border-[#FF7448] dark:hover:border-[#FF7448] transition-all cursor-pointer group shadow-sm hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-[#FF7448]/10 dark:bg-[#FF7448]/15 text-[#FF7448] dark:text-[#FF9B70] flex items-center justify-center mb-4 group-hover:bg-[#FF7448] group-hover:text-white transition-colors border border-[#FF7448]/20 dark:border-[#FF7448]/30">
              <span className="material-symbols-outlined text-[24px]">build</span>
            </div>
            <h3 className="font-['Outfit'] text-lg font-bold text-[#0F151D] dark:text-[#FBFBFB] mb-1">Carpentry</h3>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed mb-4">
              Custom cabinetry, framing, finish trim, structural deck installations.
            </p>
            <span className="text-xs font-bold text-[#FF7448] dark:text-[#FF7448] flex items-center gap-1">
              Explore 38 carpenters <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </span>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4 }}
            onClick={() => onNavigate('marketplace')}
            className="bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] hover:border-[#F59E0B] dark:hover:border-[#F59E0B] transition-all cursor-pointer group shadow-sm hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/10 dark:bg-[#0F151D] text-[#D97706] dark:text-[#F59E0B] flex items-center justify-center mb-4 group-hover:bg-[#D97706] group-hover:text-white transition-colors border border-[#F59E0B]/20 dark:border-[#2E3946]">
              <span className="material-symbols-outlined text-[24px]">format_paint</span>
            </div>
            <h3 className="font-['Outfit'] text-lg font-bold text-[#0F151D] dark:text-[#FBFBFB] mb-1">Painting & Finish</h3>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed mb-4">
              Interior & exterior coatings, drywall patching, surface restoration.
            </p>
            <span className="text-xs font-bold text-[#D97706] dark:text-[#F59E0B] flex items-center gap-1">
              Explore 52 specialists <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </span>
          </motion.div>
        </div>
      </section>

      {/* Built for Us, by Us Feature Section */}
      <section className="py-16 px-4 md:px-8 bg-[#F7EFE8] dark:bg-[#141D28] border-y border-[#F0E5DC] dark:border-[#2A3441] transition-colors">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">The Cooperative Difference</span>
            <h2 className="font-['Outfit'] text-3xl sm:text-4xl font-bold text-[#0F151D] dark:text-[#FBFBFB] leading-tight">
              Owned by the workers, <br />
              <span className="text-[#FF7448]">run by the workers.</span>
            </h2>
            <p className="text-[#71717A] dark:text-[#A1A1AA] text-sm sm:text-base leading-relaxed">
              App-based gig companies keep 30–40% of every job. <strong>Coopworks</strong> is different —
              workers own the platform, each society keeps 15% for its welfare fund, and every payment
              is split openly so everyone can see it.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[#10B981] text-[20px] mt-0.5">check_circle</span>
                <div>
                  <h4 className="font-['Outfit'] font-bold text-sm text-[#0F151D] dark:text-[#FBFBFB]">Transparent Financial Splits</h4>
                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Only a 2.5% platform maintenance fee. 15% stays in your local society trust fund.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[#10B981] text-[20px] mt-0.5">check_circle</span>
                <div>
                  <h4 className="font-['Outfit'] font-bold text-sm text-[#0F151D] dark:text-[#FBFBFB]">Verified Workers Only</h4>
                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Every worker is checked by their society — certificates, references and an address visit — before they are sent to your door.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[#10B981] text-[20px] mt-0.5">check_circle</span>
                <div>
                  <h4 className="font-['Outfit'] font-bold text-sm text-[#0F151D] dark:text-[#FBFBFB]">One Member, One Vote</h4>
                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Workers in each society vote on minimum rates and safety rules. What is decided there is what the platform follows.</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setShowPromise(true)}
                className="px-6 py-3 bg-white dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] text-[#0F151D] dark:text-[#FBFBFB] font-['Outfit'] font-bold text-sm rounded-xl hover:bg-[#FFF9F6] dark:hover:bg-[#2A3441] transition-colors inline-flex items-center gap-2 shadow-xs"
              >
                <span>Browse Cooperative Crafts</span>
                <span className="material-symbols-outlined text-[16px] text-[#FF7448]">handshake</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="rounded-2xl overflow-hidden border border-[#F0E5DC] dark:border-[#2A3441] shadow-xl aspect-4/3 bg-white dark:bg-[#1B232E]">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6QIdOAwwjT98Ai8uAbulVwMsdyb0XyAj67cByJ3MJqWs0aavQ2dgt1RdCHdgljxa1Ul47VL25E094B_LGa6Xr_MEqexE0-Pn9saYuZzmV6JHP8SVef_x3087P-Odcyyj1Ih1k_qy6Tl09PRmRE78As60JlfKykNqE8n9Dp_fcv5aq7yI9Kcz8XIIRHMvG0gLk_yYhA0EXzhg_LXiB9qMTQogDTtcR0jXSMv-g19T1jCPwStgItd8jCw"
                alt="Cooperative trade workers collaborating on blueprints"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Overlay badge */}
            <div className="absolute -bottom-4 -left-4 bg-white dark:bg-[#1B232E] border border-[#F0E5DC] dark:border-[#2A3441] p-4 rounded-xl shadow-xl hidden sm:flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[20px]">verified</span>
              </div>
              <div>
                <p className="font-['Outfit'] font-bold text-xs text-[#0F151D] dark:text-[#FBFBFB]">Janakpuri Workers Co-op</p>
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">100% Verified Members</p>
              </div>
            </div>
          </div>
        </div>
      </section>      {/* Member Stories / Testimonials */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF7448]">Voices from the Field</span>
          <h2 className="font-['Outfit'] text-3xl font-bold text-[#0F151D] dark:text-[#FBFBFB] mt-1">
            Member Stories
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] mt-2">
            What workers and customers in Delhi NCR say about working together.
          </p>
        </div>
        <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] text-center mb-6">
          The member stories shown here are illustrative examples from current cooperative members.{' '}
          Verified live reviews from customers will appear here as the platform processes completed jobs.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div whileHover={{ y: -3 }} className="bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-sm hover:shadow-md flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-[#2E3946] dark:text-[#FBFBFB] leading-relaxed italic mb-6">
              "Joining Coopworks changed how I run my workshop. I fix my own rates, the society collects the payment, and my share reaches me on time, every time."
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-[#F0E5DC] dark:border-[#2A3441]">
              <img
                src={personPhoto('Marcus Cole')}
                alt="Marcus Cole"
                className="w-10 h-10 rounded-full object-cover border border-[#F0E5DC] dark:border-[#2E3946]"
              />
              <div>
                <h4 className="font-['Outfit'] font-bold text-xs text-[#0F151D] dark:text-[#FBFBFB]">Marcus Cole</h4>
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Carpenter • Dwarka</p>
              </div>
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -3 }} className="bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-sm hover:shadow-md flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-[#2E3946] dark:text-[#FBFBFB] leading-relaxed italic mb-6">
              "An urgent pipe burst reached me with the full address and my charges fixed in writing. I reached the house in twenty minutes — no middleman taking a cut."
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-[#F0E5DC] dark:border-[#2A3441]">
              <img
                src={personPhoto('Rahul Patil')}
                alt="Rahul Patil"
                className="w-10 h-10 rounded-full object-cover border border-[#F0E5DC] dark:border-[#2E3946]"
              />
              <div>
                <h4 className="font-['Outfit'] font-bold text-xs text-[#0F151D] dark:text-[#FBFBFB]">Rahul Patil</h4>
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Plumber • Saket</p>
              </div>
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -3 }} className="bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-sm hover:shadow-md flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-[#2E3946] dark:text-[#FBFBFB] leading-relaxed italic mb-6">
              "I booked a plumber at six in the evening and he was at my door by seven. Fair price, proper bill, and the society called afterwards to check the work."
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-[#F0E5DC] dark:border-[#2A3441]">
              <img
                src={personPhoto('Rohan Khanna')}
                alt="Rohan Khanna"
                className="w-10 h-10 rounded-full object-cover border border-[#F0E5DC] dark:border-[#2E3946]"
              />
              <div>
                <h4 className="font-['Outfit'] font-bold text-xs text-[#0F151D] dark:text-[#FBFBFB]">Rohan Khanna</h4>
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Homeowner • Karol Bagh</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Response-time promise near the primary CTA zone */}
      <p className="text-center text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-8">
        We reply within 1 business day.{' '}
        <button
          onClick={() => onNavigate('customer-care')}
          className="underline hover:text-[#FF7448] transition-colors font-semibold cursor-pointer"
        >
          Talk to customer care
        </button>
      </p>

      {/* Footer CTA */}
      <section className="py-12 bg-[#F7EFE8] dark:bg-[#141D28] text-[#0F151D] dark:text-[#FBFBFB] px-4 md:px-8 border-t border-[#F0E5DC] dark:border-[#2A3441] transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-['Outfit'] text-2xl font-bold text-[#0F151D] dark:text-[#FBFBFB]">Ready to get to work?</h3>
            <p className="text-[#71717A] dark:text-[#A1A1AA] text-xs sm:text-sm mt-1">Find a verified worker near you in under two minutes.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('marketplace')}
              className="px-6 py-3 bg-[#FF7448] text-white font-['Outfit'] font-bold text-sm rounded-xl hover:bg-[#FF8D69] shadow-md shadow-[#FF7448]/25 transition-colors"
            >
              {t('landing.exploreTrades')}
            </button>
            <button
              onClick={() => onOpenRegister('worker')}
              className="px-6 py-3 bg-white dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] text-[#0F151D] dark:text-[#FBFBFB] font-['Outfit'] font-bold text-sm rounded-xl hover:bg-[#FFF9F6] dark:hover:bg-[#2A3441] transition-colors shadow-xs"
            >
              {t('landing.applyWorker')}
            </button>
          </div>
        </div>
      </section>

      {/* Sticky mobile CTA — pinned to the bottom on small screens so the primary action
          is always reachable without scrolling back up to the hero. */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-[#FF7448] text-white text-center py-3 shadow-2xl shadow-[#FF7448]/30 backdrop-blur-sm border-t border-white/20">
        <button
          onClick={() => onNavigate('marketplace')}
          className="w-full px-4 py-2.5 font-['Outfit'] font-bold text-sm rounded-xl hover:bg-[#FF8D69] transition-colors"
        >
          {t('landing.findWorker')} →
        </button>
      </div>

      {/* Our promise popup — shared component, copy lives in lib/promise.ts */}
      <PromiseModal
        open={showPromise}
        onClose={() => setShowPromise(false)}
        primary={{
          label: 'Browse Cooperative Crafts',
          onAction: () => {
            setShowPromise(false);
            onNavigate('marketplace');
          },
        }}
        secondary={{
          label: 'Join a society as a worker instead',
          onAction: () => {
            setShowPromise(false);
            onOpenRegister('worker');
          },
        }}
      />
    </div>
  );
};
