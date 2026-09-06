import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ActivityFeedItem, LatLng, BulkOrder } from '../types';
import { DemandMap, DemandZone } from './DemandMap';
import { BulkOrdersPanel } from './BulkOrdersPanel';
import { useLanguage } from '../context/LanguageContext';

interface SocietyAdminDashboardProps {
  activity: ActivityFeedItem[];
  onNavigateSubView: (view: string) => void;
  pendingApprovalsCount: number;
  bulkOrders: BulkOrder[];
  onAdvanceBulkOrder: (id: string) => void;
}

export const SocietyAdminDashboard: React.FC<SocietyAdminDashboardProps> = ({
  activity,
  onNavigateSubView,
  pendingApprovalsCount,
  bulkOrders,
  onAdvanceBulkOrder
}) => {
  const { t } = useLanguage();
  const [selectedHeatmapFilter, setSelectedHeatmapFilter] = useState('All Trades');

  const filters = ['All Trades', 'Electrical', 'Plumbing', 'HVAC', 'Carpentry'];

  // Demand zones for the society service area — Delhi NCR localities (HQ: Janakpuri).
  const mapCenter: LatLng = { lat: 28.63, lng: 77.09 };
  const demandZones: DemandZone[] = [
    {
      id: 'janakpuri',
      name: 'Janakpuri',
      center: { lat: 28.6217, lng: 77.0895 },
      requests: { Electrical: 42, Plumbing: 28, HVAC: 15, Carpentry: 9 },
      workersAvailable: 22,
    },
    {
      id: 'karol-bagh',
      name: 'Karol Bagh',
      center: { lat: 28.6519, lng: 77.1909 },
      requests: { Electrical: 18, Plumbing: 34, HVAC: 41, Carpentry: 24 },
      workersAvailable: 31,
    },
    {
      id: 'rajouri',
      name: 'Rajouri Garden',
      center: { lat: 28.6534, lng: 77.0954 },
      requests: { Electrical: 12, Plumbing: 52, HVAC: 8, Carpentry: 6 },
      workersAvailable: 14,
    },
    {
      id: 'tilak-nagar',
      name: 'Tilak Nagar',
      center: { lat: 28.6368, lng: 77.0983 },
      requests: { Electrical: 31, Plumbing: 22, HVAC: 19, Carpentry: 47 },
      workersAvailable: 35,
    },
    {
      id: 'uttam-nagar',
      name: 'Uttam Nagar',
      center: { lat: 28.6215, lng: 77.0622 },
      requests: { Electrical: 9, Plumbing: 7, HVAC: 22, Carpentry: 16 },
      workersAvailable: 12,
    },
    {
      id: 'dwarka',
      name: 'Dwarka',
      center: { lat: 28.5921, lng: 77.0460 },
      requests: { Electrical: 26, Plumbing: 11, HVAC: 33, Carpentry: 3 },
      workersAvailable: 8,
    },
  ];

  return (
    <div className="pt-20 pb-20 md:pb-12 min-h-screen bg-[#FFF9F6] dark:bg-[#0F151D] text-[#0F151D] dark:text-[#FBFBFB] transition-colors">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-8">
        {/* Header & Sub-Nav */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-xl transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FF7448] text-white flex items-center justify-center font-['Outfit'] font-bold text-xl shadow-md shadow-[#FF7448]/20">
              <span className="material-symbols-outlined text-[26px]">map</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#FF7448]/10 dark:bg-[#FF7448]/15 border border-[#FF7448]/30 text-[#FF7448] font-bold text-[11px] uppercase tracking-wider">
                  {t('soc.regionalSociety', { n: 'Janakpuri Co-op' })}
                </span>
                <span className="text-xs text-[#10B981] font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
                  {t('soc.liveDispatch')}
                </span>
              </div>
              <h1 className="font-['Outfit'] text-2xl font-bold text-[#0F151D] dark:text-[#FBFBFB] mt-0.5">
                {t('soc.demandTitle')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateSubView('federation')}
              className="px-3.5 py-2 bg-[#FFF9F6] dark:bg-[#0F151D] hover:bg-[#F7EFE8] dark:hover:bg-[#2A3441] text-[#0F151D] dark:text-[#FBFBFB] text-xs font-['Outfit'] font-bold rounded-xl border border-[#F0E5DC] dark:border-[#2E3946] transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">hub</span>
              <span>{t('soc.federationView')}</span>
            </button>

            <button
              onClick={() => onNavigateSubView('approvals')}
              className="px-3.5 py-2 bg-[#FF7448] text-white text-xs font-['Outfit'] font-bold rounded-xl hover:bg-[#FF8D69] transition-colors flex items-center gap-1.5 shadow-md shadow-[#FF7448]/20 relative"
            >
              <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
              <span>{t('soc.reviewApplicants')}</span>
              {pendingApprovalsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-[#FF7448] text-[10px] flex items-center justify-center font-bold shadow-sm">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          </div>
        </motion.div>

        {/* 4 Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-[#1B232E] p-5 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">{t('soc.activeWorkers')}</span>
            <div className="font-['Outfit'] text-2xl md:text-3xl font-bold text-[#0F151D] dark:text-[#FBFBFB] mt-2">1,248</div>
            <p className="text-xs text-[#10B981] font-medium mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +12% vs last month
            </p>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-[#1B232E] p-5 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">{t('soc.pendingRequests')}</span>
            <div className="font-['Outfit'] text-2xl md:text-3xl font-bold text-[#FF7448] mt-2">342</div>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium mt-1">Avg response &lt; 8 min</p>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-[#1B232E] p-5 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">{t('soc.totalBookings')}</span>
            <div className="font-['Outfit'] text-2xl md:text-3xl font-bold text-[#0F151D] dark:text-[#FBFBFB] mt-2">8,902</div>
            <p className="text-xs text-[#10B981] font-medium mt-1">99.2% resolution rate</p>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-[#1B232E] p-5 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">{t('soc.societyRevenue')}</span>
            <div className="font-['Outfit'] text-2xl md:text-3xl font-bold text-[#10B981] mt-2">₹42.5L</div>
            <p className="text-xs text-[#10B981] font-medium mt-1">+8% vs quarterly target</p>
          </motion.div>
        </div>

        {/* Institution bulk orders queue */}
        <BulkOrdersPanel orders={bulkOrders} onAdvanceOrder={onAdvanceBulkOrder} />

        {/* Split Section: Live Feed & Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Live Activity Feed */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md space-y-4 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="font-['Outfit'] text-base font-bold text-[#0F151D] dark:text-[#FBFBFB] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF7448] animate-ping"></span>
                  <span>{t('soc.liveActivity')}</span>
                </h3>
                <span className="text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA]">{t('soc.autoRefreshing')}</span>
              </div>

              <div className="divide-y divide-[#F0E5DC] dark:divide-[#2A3441] space-y-3">
                {activity.map((act) => (
                  <div key={act.id} className="pt-3 first:pt-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-['Outfit'] font-bold text-xs text-[#0F151D] dark:text-[#FBFBFB]">
                        {act.title}
                      </span>
                      <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">{act.timestamp}</span>
                    </div>
                    <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{act.description}</p>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
                      <span className="font-mono text-[#52525B] dark:text-[#D4D4D8]">{act.actor}</span>
                      <span className="uppercase font-bold tracking-wider text-[#FF7448]">
                        {act.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Resolution Notice */}
            <div className="p-4 bg-[#FFF9F6] dark:bg-[#141D28] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] text-xs text-[#71717A] dark:text-[#A1A1AA] space-y-1">
              <strong className="text-[#0F151D] dark:text-[#FBFBFB] block font-['Outfit']">{t('soc.autoBalancing')}</strong>
              Surge algorithm dynamically routes requests to unassigned apprentices during heavy demand periods.
            </div>
          </div>

          {/* Right Column: Interactive Heatmap Visualization */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md space-y-4 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-['Outfit'] text-base font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                  {t('soc.openRequests')}
                </h3>

                {/* Filter chips */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {filters.map((f) => (
                    <button
                      key={f}
                      onClick={() => setSelectedHeatmapFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        selectedHeatmapFilter === f
                          ? 'bg-[#FF7448] text-white shadow-xs'
                          : 'bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB]'
                      }`}
                    >
                      {f === 'All Trades' ? t('soc.allTrades') : f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive demand map (Leaflet/OSM) */}
              <DemandMap
                center={mapCenter}
                zoom={12}
                zones={demandZones}
                filter={selectedHeatmapFilter}
                className="h-80 sm:h-96"
              />

              {/* Heatmap Legend */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#FF7448]"></span>
                  <span className="text-[#0F151D] dark:text-[#FBFBFB] font-medium">{t('soc.highDemand')} (42%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#D3E1FF] dark:bg-[#2E3946] border border-[#71717A]"></span>
                  <span className="text-[#71717A] dark:text-[#A1A1AA]">{t('soc.standardCoverage')} (48%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#2B3A4A] dark:bg-[#9FB3C8]"></span>
                  <span className="text-[#2B3A4A] dark:text-[#9FB3C8] font-medium">{t('soc.deficitArea')} (10%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
