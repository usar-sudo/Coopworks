import React, { useState } from 'react';
import { motion } from 'motion/react';
import { WorkerProfile, LatLng, BulkOrder } from '../types';
import { MapView } from './MapView';
import { Avatar } from './Avatar';
import { useLanguage } from '../context/LanguageContext';

interface MarketplaceSearchProps {
  workers: WorkerProfile[];
  userLocation: LatLng;
  userAddress?: string;
  /** Compact "area, city" label for the map badge (actual GPS region). */
  userRegion?: string;
  isLocating?: boolean;
  onLocateUser: () => void;
  onSelectWorker: (worker: WorkerProfile) => void;
  onOpenBookingForWorker: (worker: WorkerProfile) => void;
  onOpenResourceLocator: () => void;
  /** Institution bulk orders placed by this account (demonstrates the bulk channel). */
  bulkOrders?: BulkOrder[];
  onOpenBulkOrder?: () => void;
}

export const MarketplaceSearch: React.FC<MarketplaceSearchProps> = ({
  workers,
  userLocation,
  userAddress,
  userRegion,
  isLocating = false,
  onLocateUser,
  onSelectWorker,
  onOpenBookingForWorker,
  onOpenResourceLocator,
  bulkOrders = [],
  onOpenBulkOrder
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [maxRadiusMiles, setMaxRadiusMiles] = useState<number>(10);
  const [activeWorkerId, setActiveWorkerId] = useState<string | null>(null);

  const categories = ['All', 'Carpentry', 'Electrical', 'Plumbing', 'HVAC', 'Welding', 'Painting'];
  const radiusOptions = [
    { label: 'Within 2 km', value: 2 },
    { label: 'Within 5 km', value: 5 },
    { label: 'Within 10 km', value: 10 },
    { label: 'All Areas', value: 999 }
  ];

  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch =
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.skills.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' ||
      worker.roleTitle.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      worker.skills.some((s) => s.name.toLowerCase().includes(selectedCategory.toLowerCase()));

    const matchesRadius = worker.distanceMiles <= maxRadiusMiles;

    return matchesSearch && matchesCategory && matchesRadius;
  });

  return (
    <div className="pt-16 pb-20 md:pb-8 min-h-screen bg-[#FFF9F6] dark:bg-[#0F151D] text-[#0F151D] dark:text-[#FBFBFB] flex flex-col transition-colors">
      {/* Search Header Bar */}
      <div className="bg-white dark:bg-[#1B232E] border-b border-[#F0E5DC] dark:border-[#2A3441] p-4 shadow-xs dark:shadow-md transition-colors">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Main Search Input Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A] text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder={t('mkt.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FFF9F6] dark:bg-[#141D28] border border-[#F0E5DC] dark:border-[#2A3441] rounded-xl text-sm text-[#0F151D] dark:text-[#FBFBFB] placeholder-[#71717A] focus:outline-none focus:border-[#FF7448] focus:bg-white dark:focus:bg-[#1B232E] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#0F151D] dark:hover:text-[#FBFBFB]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {/* Geolocation Button */}
            <button
              onClick={onLocateUser}
              disabled={isLocating}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] rounded-xl text-xs font-semibold text-[#FF7448] hover:border-[#FF7448] transition-all shadow-xs cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[18px] ${isLocating ? 'animate-spin' : ''}`}>
                {isLocating ? 'progress_activity' : 'my_location'}
              </span>
              <span className="whitespace-nowrap">
                {isLocating ? t('mkt.acquiringGps') : t('mkt.useGps')}
              </span>
            </button>

            {/* Maps Grounding Resource Finder Button */}
            <button
              onClick={onOpenResourceLocator}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#0F151D] dark:bg-[#FBFBFB] text-white dark:text-[#0F151D] rounded-xl text-xs font-bold hover:bg-[#FF7448] dark:hover:bg-[#FF7448] dark:hover:text-white transition-all shadow-xs cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">travel_explore</span>
              <span>{t('mkt.supplies')}</span>
            </button>
          </div>

          {/* Filters Row (Categories & Radius Chips) */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-1">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 w-full md:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#0F151D] text-white dark:bg-[#FBFBFB] dark:text-[#0F151D] font-bold shadow-sm'
                      : 'bg-[#F7EFE8] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] text-[#71717A] dark:text-[#A1A1AA] hover:border-[#D3E1FF] dark:hover:border-[#3F3F46] hover:text-[#0F151D] dark:hover:text-[#FBFBFB]'
                  }`}
                >
                  {cat === 'All' ? t('mkt.all') : cat}
                </button>
              ))}
            </div>

            {/* Radius Filter Chips */}
            <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] mr-1 hidden sm:inline">
                {t('mkt.distance')}
              </span>
              {radiusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMaxRadiusMiles(opt.value)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    maxRadiusMiles === opt.value
                      ? 'bg-[#FF7448] text-white shadow-xs'
                      : 'bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB]'
                  }`}
                >
                  {opt.value === 999
                    ? t('mkt.allAreas')
                    : t('mkt.withinKm', { n: opt.value })}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Map & Split View */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Google Map View */}
        <div className="lg:col-span-7 h-[420px] lg:h-[600px]">
          <MapView
            center={userLocation}
            zoom={13}
            workers={filteredWorkers}
            selectedWorkerId={activeWorkerId}
            onSelectWorker={(w) => {
              setActiveWorkerId(w.id);
            }}
            onCloseSelection={() => setActiveWorkerId(null)}
            userLocation={userLocation}
            userAddress={userAddress}
            regionLabel={userRegion}
            onLocateUser={onLocateUser}
            isLocating={isLocating}
            onOpenBookingForWorker={onOpenBookingForWorker}
          />
        </div>

        {/* Worker Cards / Directory Drawer */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-['Outfit'] text-xl font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                {t('mkt.verifiedNearYou')}
              </h2>
              {userAddress && (
                <p className="text-[11px] text-[#71717A] truncate max-w-xs">
                  {t('mkt.near', { n: userAddress })}
                </p>
              )}
            </div>
            <span className="text-xs text-[#71717A] bg-[#F7EFE8] dark:bg-[#0F151D] px-2.5 py-1 rounded-full border border-[#F0E5DC] dark:border-[#2E3946]">
              {t('mkt.available', { n: filteredWorkers.length })}
            </span>
          </div>

          {/* Institution / bulk order entry */}
          <div className="p-4 bg-gradient-to-br from-[#FF7448]/10 to-[#D3E1FF]/40 dark:from-[#FF7448]/15 dark:to-[#1B232E] rounded-2xl border border-[#FF7448]/30 dark:border-[#2E3946] shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF7448] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#FF7448]/30">
                <span className="material-symbols-outlined text-[20px]">business_center</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-['Outfit'] font-bold text-sm text-[#0F151D] dark:text-[#FBFBFB]">
                  Need a team of workers?
                </h4>
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                  Schools, societies and offices can place one bulk order for several verified workers.
                </p>
              </div>
              <button
                onClick={onOpenBulkOrder}
                className="px-3 py-2 bg-[#FF7448] hover:bg-[#FF8D69] text-white text-[11px] font-bold rounded-xl transition-colors shadow-md shadow-[#FF7448]/20 whitespace-nowrap cursor-pointer"
              >
                Place bulk order
              </button>
            </div>
            {bulkOrders.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#FF7448]/20 dark:border-[#2E3946]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] mb-1.5">
                  Your bulk orders
                </p>
                <div className="space-y-2">
                  {bulkOrders.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between gap-2 bg-white/70 dark:bg-[#141D28]/70 rounded-lg px-3 py-2 border border-[#F0E5DC] dark:border-[#2E3946]"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-[#0F151D] dark:text-[#FBFBFB] truncate">
                          {o.orgName}
                        </p>
                        <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
                          {o.serviceType} • {o.workersNeeded} workers
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                          o.status === 'fulfilled'
                            ? 'bg-[#10B981]/10 text-[#10B981]'
                            : o.status === 'allocating'
                              ? 'bg-[#D3E1FF]/60 text-[#2B3A4A] dark:text-[#D3E1FF]'
                              : 'bg-[#F59E0B]/10 text-[#D97706] dark:text-[#F59E0B]'
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 max-h-[530px] overflow-y-auto pr-1">
            {filteredWorkers.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#1B232E] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] space-y-3">
                <span className="material-symbols-outlined text-[36px] text-[#71717A]">location_off</span>
                <h4 className="font-['Outfit'] font-bold text-sm text-[#0F151D] dark:text-[#FBFBFB]">
                  {t('mkt.noWorkers', { n: maxRadiusMiles })}
                </h4>
                <p className="text-xs text-[#71717A]">
                  {t('mkt.noWorkersHint')}
                </p>
                <button
                  onClick={() => setMaxRadiusMiles(999)}
                  className="px-4 py-2 bg-[#FF7448] text-white text-xs font-bold rounded-xl"
                >
                  {t('mkt.searchAllAreas')}
                </button>
              </div>
            ) : (
              filteredWorkers.map((worker) => {
                const isSelected = worker.id === activeWorkerId;
                return (
                  <motion.div
                    key={worker.id}
                    whileHover={{ y: -2 }}
                    onClick={() => setActiveWorkerId(worker.id)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                      isSelected
                        ? 'border-[#FF7448] ring-2 ring-[#FF7448]/30 bg-white dark:bg-[#232E3A]'
                        : 'bg-white dark:bg-[#1B232E] border-[#F0E5DC] dark:border-[#2A3441] hover:border-[#D3E1FF] dark:hover:border-[#3F3F46]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar
                        src={worker.avatar}
                        name={worker.name}
                        alt={worker.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-[#F0E5DC] dark:border-[#2E3946]"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-['Outfit'] text-base font-bold text-[#0F151D] dark:text-[#FBFBFB] truncate">
                            {worker.name}
                          </h3>
                          <span className="font-['Outfit'] font-bold text-sm text-[#0F151D] dark:text-[#FBFBFB] shrink-0">
                            ₹{worker.hourlyRateLabor}{' '}
                            <span className="text-[11px] text-[#71717A] font-normal">{t('mkt.perHour')}</span>
                          </span>
                        </div>

                        <p className="text-xs text-[#FF7448] font-semibold">{worker.roleTitle}</p>

                        <div className="flex items-center gap-3 text-xs text-[#71717A] mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1 font-semibold text-[#0F151D] dark:text-[#FBFBFB]">
                            <span
                              className="material-symbols-outlined text-[14px] text-[#F59E0B]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              star
                            </span>
                            {worker.rating}{' '}
                            <span className="text-[#71717A] font-normal">({worker.reviewCount})</span>
                          </span>
                          <span>•</span>
                          <span className="font-medium text-[#0F151D] dark:text-[#FBFBFB]">
                            📍 {worker.distanceMiles} km ({t('mkt.minDrive', { n: worker.driveTimeMin })})
                          </span>
                          <span>•</span>
                          <span className="text-[#10B981] font-medium">{worker.guildNumber}</span>
                        </div>

                        {/* Skills Badges */}
                        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                          {worker.skills.slice(0, 2).map((skill) => (
                            <span
                              key={skill.name}
                              className="px-2 py-0.5 bg-[#F7EFE8] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] rounded-md text-[11px] text-[#71717A] dark:text-[#A1A1AA]"
                            >
                              {skill.name}
                            </span>
                          ))}
                          {worker.skills.length > 2 && (
                            <span className="text-[11px] text-[#71717A]">
                              {t('mkt.moreSkills', { n: worker.skills.length - 2 })}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#F0E5DC] dark:border-[#2A3441]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectWorker(worker);
                            }}
                            className="flex-1 py-2 bg-[#FFF9F6] dark:bg-[#0F151D] hover:bg-[#F7EFE8] dark:hover:bg-[#2A3441] border border-[#F0E5DC] dark:border-[#2E3946] text-[#0F151D] dark:text-[#FBFBFB] text-xs font-['Outfit'] font-bold rounded-lg transition-colors text-center"
                          >
                            {t('common.viewProfile')}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenBookingForWorker(worker);
                            }}
                            className="flex-1 py-2 bg-[#FF7448] hover:bg-[#FF8D69] text-white text-xs font-['Outfit'] font-bold rounded-lg transition-colors text-center shadow-md shadow-[#FF7448]/20"
                          >
                            {t('common.bookService')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
