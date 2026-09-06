import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Society, ActivityFeedItem, GovernanceRule, BulkOrder } from '../types';
import { BulkOrdersPanel } from './BulkOrdersPanel';
import { useLanguage } from '../context/LanguageContext';

interface FederationDashboardProps {
  societies: Society[];
  activity: ActivityFeedItem[];
  rules: GovernanceRule[];
  onNavigateSubView: (subView: string) => void;
  onOpenNewProposal: () => void;
  pendingApprovalsCount: number;
  bulkOrders: BulkOrder[];
  onAdvanceBulkOrder: (id: string) => void;
}

export const FederationDashboard: React.FC<FederationDashboardProps> = ({
  societies,
  activity,
  rules,
  onNavigateSubView,
  onOpenNewProposal,
  pendingApprovalsCount,
  bulkOrders,
  onAdvanceBulkOrder
}) => {
  const { t } = useLanguage();
  const [societySearch, setSocietySearch] = useState('');
  const [votedRuleId, setVotedRuleId] = useState<string | null>(null);

  const filteredSocieties = societies.filter(
    (s) =>
      s.name.toLowerCase().includes(societySearch.toLowerCase()) ||
      s.region.toLowerCase().includes(societySearch.toLowerCase())
  );

  return (
    <div className="pt-20 pb-20 md:pb-12 min-h-screen bg-[#FFF9F6] dark:bg-[#0F151D] text-[#0F151D] dark:text-[#FBFBFB] transition-colors">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-8">
        {/* Governance Top Navigation & Breadcrumbs */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-xl transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FF7448] text-white flex items-center justify-center font-['Outfit'] font-bold text-xl shadow-md shadow-[#FF7448]/20">
              <span className="material-symbols-outlined text-[26px]">hub</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#FF7448]/10 dark:bg-[#FF7448]/15 border border-[#FF7448]/30 text-[#FF7448] font-bold text-[11px] uppercase tracking-wider">
                  {t('fed.oversight')}
                </span>
                <span className="text-xs text-[#10B981] font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
                  {t('fed.synced')}
                </span>
              </div>
              <h1 className="font-['Outfit'] text-2xl font-bold text-[#0F151D] dark:text-[#FBFBFB] mt-0.5">
                {t('fed.overview')}
              </h1>
            </div>
          </div>

          {/* Quick Sub-Navigation Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateSubView('society_admin')}
              className="px-3.5 py-2 bg-[#FFF9F6] dark:bg-[#0F151D] hover:bg-[#F7EFE8] dark:hover:bg-[#2A3441] text-[#0F151D] dark:text-[#FBFBFB] text-xs font-['Outfit'] font-bold rounded-xl border border-[#F0E5DC] dark:border-[#2E3946] transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">map</span>
              <span>{t('fed.demandHeatmap')}</span>
            </button>

            <button
              onClick={() => onNavigateSubView('approvals')}
              className="px-3.5 py-2 bg-[#FFF9F6] dark:bg-[#0F151D] hover:bg-[#F7EFE8] dark:hover:bg-[#2A3441] text-[#0F151D] dark:text-[#FBFBFB] text-xs font-['Outfit'] font-bold rounded-xl border border-[#F0E5DC] dark:border-[#2E3946] transition-colors flex items-center gap-1.5 relative"
            >
              <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
              <span>{t('fed.pendingApprovals')}</span>
              {pendingApprovalsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#FF7448] text-white text-[10px] flex items-center justify-center font-bold shadow-xs">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenNewProposal}
              className="px-4 py-2 bg-[#FF7448] text-white text-xs font-['Outfit'] font-bold rounded-xl hover:bg-[#FF8D69] transition-colors flex items-center gap-1.5 shadow-md shadow-[#FF7448]/20"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>{t('fed.newProposal')}</span>
            </button>
          </div>
        </motion.div>

        {/* Global Federation KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
                {t('fed.kpiWorkers')}
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 dark:bg-[#10B981]/15 text-[#10B981] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">badge</span>
              </div>
            </div>
            <div className="font-['Outfit'] text-3xl font-bold text-[#0F151D] dark:text-[#FBFBFB] mt-3">
              12,450
            </div>
            <p className="text-xs text-[#10B981] font-semibold mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +4.2% new members this month
            </p>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
                {t('fed.kpiSocieties')}
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#2B3A4A]/10 dark:bg-[#9FB3C8]/15 text-[#2B3A4A] dark:text-[#9FB3C8] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">domain</span>
              </div>
            </div>
            <div className="font-['Outfit'] text-3xl font-bold text-[#0F151D] dark:text-[#FBFBFB] mt-3">
              48 Societies
            </div>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium mt-1">
              Across Maharashtra, Karnataka and Gujarat
            </p>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
                {t('fed.kpiJobs')}
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#FF7448]/10 dark:bg-[#FF7448]/15 text-[#FF7448] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </div>
            </div>
            <div className="font-['Outfit'] text-3xl font-bold text-[#0F151D] dark:text-[#FBFBFB] mt-3">
              ₹8.2Cr
            </div>
            <p className="text-xs text-[#10B981] font-semibold mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +12.5% dividend payout distribution
            </p>
          </motion.div>
        </div>

        {/* Institution bulk orders — routed to whichever society can staff them */}
        <BulkOrdersPanel orders={bulkOrders} onAdvanceOrder={onAdvanceBulkOrder} />

        {/* Main Content Grid: Society Table & Governance Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Societies Health Table */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#1B232E] p-4 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] transition-colors">
              <h2 className="font-['Outfit'] text-lg font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                {t('fed.societiesHealth')}
              </h2>

              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder={t('fed.filterSocieties')}
                  value={societySearch}
                  onChange={(e) => setSocietySearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] rounded-lg text-xs text-[#0F151D] dark:text-[#FBFBFB] placeholder-[#71717A] focus:outline-none focus:border-[#FF7448]"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-[#1B232E] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] overflow-hidden shadow-xs dark:shadow-md transition-colors">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF9F6] dark:bg-[#0F151D] border-b border-[#F0E5DC] dark:border-[#2A3441] text-[#71717A] dark:text-[#A1A1AA] font-['Outfit'] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">{t('fed.thSociety')}</th>
                      <th className="p-4">{t('fed.thRegion')}</th>
                      <th className="p-4">{t('fed.thMembers')}</th>
                      <th className="p-4">{t('fed.thStatus')}</th>
                      <th className="p-4 text-right">{t('fed.thActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E5DC] dark:divide-[#2A3441]">
                    {filteredSocieties.map((soc) => (
                      <tr key={soc.id} className="hover:bg-[#FFF9F6] dark:hover:bg-[#0F151D]/50 transition-colors">
                        <td className="p-4 font-bold text-[#0F151D] dark:text-[#FBFBFB] font-['Outfit']">
                          {soc.name}
                        </td>
                        <td className="p-4 text-[#71717A] dark:text-[#A1A1AA]">{soc.region}</td>
                        <td className="p-4 font-mono font-medium text-[#0F151D] dark:text-[#FBFBFB]">
                          {soc.membersCount.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                              soc.status === 'verified'
                                ? 'bg-[#10B981]/10 dark:bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]'
                                : soc.status === 'audit_pending'
                                ? 'bg-[#F59E0B]/10 dark:bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#D97706] dark:text-[#F59E0B]'
                                : 'bg-[#EF4444]/10 dark:bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]'
                            }`}
                          >
                            {t(`socStatus.${soc.status}`)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => onNavigateSubView('society_admin')}
                            className="text-xs font-bold text-[#FF7448] hover:underline"
                          >
                            {t('fed.viewMetrics')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Global Governance Rules & Live Feed */}
          <div className="lg:col-span-4 space-y-6">
            {/* Global Governance Rules */}
            <div className="bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md space-y-4 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="font-['Outfit'] text-base font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                  {t('fed.governanceRules')}
                </h3>
                <span className="text-xs text-[#10B981] font-semibold">{t('fed.federationLaw')}</span>
              </div>

              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 bg-[#FFF9F6] dark:bg-[#141D28] rounded-xl border border-[#F0E5DC] dark:border-[#2A3441] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-['Outfit'] font-bold text-xs text-[#0F151D] dark:text-[#FBFBFB]">
                        {rule.title}
                      </h4>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          rule.status === 'active'
                            ? 'bg-[#10B981]/10 text-[#10B981]'
                            : 'bg-[#FF7448]/10 text-[#FF7448]'
                        }`}
                      >
                        {t(`ruleStatus.${rule.status}`)}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                      {rule.description}
                    </p>

                    {rule.status === 'voting_open' && (
                      <div className="pt-2 border-t border-[#F0E5DC] dark:border-[#2A3441] space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#71717A] dark:text-[#A1A1AA]">{t('fed.support', { n: rule.supportPercent })}</span>
                          <span className="text-[#71717A] dark:text-[#A1A1AA]">{t('fed.quorum', { n: rule.quorumPercent })}</span>
                        </div>
                        <div className="w-full bg-[#F0E5DC] dark:bg-[#0F151D] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#FF7448] h-full shadow-[0_0_6px_rgba(255,116,72,0.6)]"
                            style={{ width: `${rule.supportPercent}%` }}
                          ></div>
                        </div>

                        <button
                          onClick={() => {
                            setVotedRuleId(rule.id);
                          }}
                          className={`w-full py-1.5 text-xs font-['Outfit'] font-bold rounded-lg transition-colors ${
                            votedRuleId === rule.id
                              ? 'bg-[#10B981] text-white font-bold'
                              : 'bg-[#FF7448] hover:bg-[#FF8D69] text-white shadow-xs'
                          }`}
                        >
                          {votedRuleId === rule.id ? t('fed.ballotCast') : t('fed.castVote')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Live Federation Activity Stream */}
            <div className="bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md space-y-4 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="font-['Outfit'] text-base font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                  {t('fed.activity')}
                </h3>
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
              </div>

              <div className="space-y-3">
                {activity.map((act) => (
                  <div key={act.id} className="text-xs space-y-1 pb-2 border-b border-[#F0E5DC] dark:border-[#2A3441] last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-['Outfit'] font-bold text-[#0F151D] dark:text-[#FBFBFB]">{act.title}</span>
                      <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">{act.timestamp}</span>
                    </div>
                    <p className="text-[#71717A] dark:text-[#A1A1AA] text-[11px]">{act.description}</p>
                    <span className="text-[10px] font-mono text-[#FF7448]">{act.actor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
