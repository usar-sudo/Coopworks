import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LatLng, MapsGroundingResult } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface LocalResourceLocatorProps {
  userLocation: LatLng;
  userAddress?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const LocalResourceLocator: React.FC<LocalResourceLocatorProps> = ({
  userLocation,
  userAddress,
  isOpen,
  onClose
}) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MapsGroundingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const presetQueries = [
    'Trade hardware suppliers and lumber yards open now',
    'Certified electrical wholesale distributors and subpanel suppliers',
    'Emergency plumbing supply and boiler valve parts',
    'Local municipal building permit and inspection offices',
    'Community tool lending libraries and maker workshops'
  ];

  const handleSearch = async (searchPrompt: string) => {
    if (!searchPrompt.trim()) return;
    setLoading(true);
    setError(null);
    setQuery(searchPrompt);

    // Mock implementation - in production, this would call a real API
    // For now, show a helpful message about the feature
    setTimeout(() => {
      setResult({
        text: `Found local resources for: ${searchPrompt}`,
        places: [
          {
            title: 'Local Hardware Store',
            uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('hardware store near ' + (userAddress || 'New Delhi'))}`
          },
          {
            title: 'Cooperative Society Office',
            uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('cooperative society office New Delhi')}`
          }
        ],
        groundingChunks: []
      });
      setLoading(false);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white/80 dark:bg-[#232E3A]/80 backdrop-blur-2xl backdrop-saturate-150 text-[#0F151D] dark:text-[#FBFBFB] w-full max-w-2xl rounded-3xl border border-white/70 dark:border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors"
        >
          {/* Header */}
          <div className="p-5 border-b border-[#F0E5DC] dark:border-[#2A3441] flex items-center justify-between bg-[#FFF9F6] dark:bg-[#0F151D]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF7448]/10 text-[#FF7448] flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">pin_drop</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF7448]">
                    Local Trade Resource Locator
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] text-[10px] font-bold">
                    Live GPS Geolocation
                  </span>
                </div>
                <h2 className="font-['Outfit'] text-xl font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                  Local Trade Resource & Permit Locator
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white dark:bg-[#2A3441] border border-[#F0E5DC] dark:border-[#2E3946] flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB]"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Geolocation status chip */}
            <div className="p-3 bg-[#FFF9F6] dark:bg-[#0F151D] rounded-2xl border border-[#F0E5DC] dark:border-[#2E3946] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF7448] text-[18px]">my_location</span>
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Current Search Origin:</span>
                <strong className="text-[#0F151D] dark:text-[#FBFBFB]">
                  {userAddress || `Lat ${userLocation.lat.toFixed(4)}, Lng ${userLocation.lng.toFixed(4)}`}
                </strong>
              </div>
              <span className="text-[10px] font-mono text-[#71717A]">
                {userLocation.lat.toFixed(3)}, {userLocation.lng.toFixed(3)}
              </span>
            </div>

            {/* Search Input Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A] text-[20px]">
                  travel_explore
                </span>
                <input
                  type="text"
                  placeholder={t('resource.searchPlaceholder')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                  className="w-full pl-10 pr-4 py-3 bg-[#FFF9F6] dark:bg-[#141D28] border border-[#F0E5DC] dark:border-[#2A3441] rounded-xl text-xs text-[#0F151D] dark:text-[#FBFBFB] placeholder-[#71717A] focus:outline-none focus:border-[#FF7448]"
                />
              </div>
              <button
                onClick={() => handleSearch(query)}
                disabled={loading || !query.trim()}
                className="px-5 py-3 bg-[#FF7448] hover:bg-[#FF8D69] disabled:opacity-50 text-white font-['Outfit'] font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    <span>{t('resource.groundingShort')}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">search</span>
                    <span>{t('resource.groundSearch')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Suggestion Chips */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] mb-2">
                {t('resource.suggestedInquiries')}
              </p>
              <div className="flex flex-wrap gap-2">
                {presetQueries.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleSearch(preset)}
                    className="px-3 py-1.5 bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] hover:border-[#FF7448] dark:hover:border-[#FF7448] rounded-xl text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB] transition-colors text-left"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Grounding Results Display */}
            {result && (
              <div className="space-y-4 pt-2 border-t border-[#F0E5DC] dark:border-[#2A3441]">
                <div className="flex items-center justify-between">
                  <h3 className="font-['Outfit'] font-bold text-sm text-[#0F151D] dark:text-[#FBFBFB] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#10B981] text-[18px]">verified</span>
                    <span>{t('resource.groundedLocations')}</span>
                  </h3>
                  {result.places.length > 0 && (
                    <span className="text-xs text-[#10B981] font-semibold">
                      {t('resource.placesFound', { n: result.places.length })}
                    </span>
                  )}
                </div>

                {/* Grounded Places Cards */}
                {result.places.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.places.map((place, idx) => (
                      <a
                        key={idx}
                        href={place.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] hover:border-[#FF7448] rounded-2xl flex items-start gap-3 group transition-all shadow-xs"
                      >
                        <div className="w-8 h-8 rounded-xl bg-[#FF7448]/10 text-[#FF7448] flex items-center justify-center shrink-0 group-hover:bg-[#FF7448] group-hover:text-white transition-colors">
                          <span className="material-symbols-outlined text-[18px]">location_on</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-['Outfit'] font-bold text-xs text-[#0F151D] dark:text-[#FBFBFB] truncate group-hover:text-[#FF7448]">
                            {place.title}
                          </p>
                          <p className="text-[11px] text-[#71717A] mt-0.5 flex items-center gap-1">
                            <span>{t('resource.openInMaps')}</span>
                            <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {/* Grounded Summary Text */}
                <div className="p-4 bg-[#FFF9F6] dark:bg-[#141D28] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] text-xs text-[#0F151D] dark:text-[#D4D4D8] leading-relaxed whitespace-pre-wrap">
                  {result.text}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
