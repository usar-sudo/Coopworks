import React, { useState } from 'react';
import { motion } from 'motion/react';
import { WorkerApplicant } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface PendingApprovalsProps {
  applicants: WorkerApplicant[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onBackToFederation: () => void;
}

export const PendingApprovals: React.FC<PendingApprovalsProps> = ({
  applicants,
  onApprove,
  onReject,
  onBackToFederation
}) => {
  const { t } = useLanguage();
  const [selectedApplicant, setSelectedApplicant] = useState<WorkerApplicant | null>(null);

  const pendingList = applicants.filter((a) => a.status === 'review');
  const approvedCount = applicants.filter((a) => a.status === 'approved').length + 7;

  return (
    <div className="pt-20 pb-20 md:pb-12 min-h-screen bg-[#FFF9F6] dark:bg-[#0F151D] text-[#0F151D] dark:text-[#FBFBFB] transition-colors">
      <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToFederation}
            className="inline-flex items-center gap-1.5 text-xs font-['Outfit'] font-bold text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>{t('appr.back')}</span>
          </button>
        </div>

        {/* Header Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF7448]">
              {t('appr.accreditation')}
            </span>
            <h1 className="font-['Outfit'] text-2xl font-bold text-[#0F151D] dark:text-[#FBFBFB] mt-1">
              {t('appr.title')}
            </h1>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              Peer verification required before applicants receive on-demand dispatch credentials.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">{t('appr.totalPending')}</span>
              <p className="font-['Outfit'] text-2xl font-bold text-[#FF7448]">
                {pendingList.length}
              </p>
            </div>
            <div className="h-8 w-px bg-[#F0E5DC] dark:bg-[#2A3441]"></div>
            <div className="text-right">
              <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">{t('appr.approvedToday')}</span>
              <p className="font-['Outfit'] text-2xl font-bold text-[#10B981]">
                {approvedCount}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Table of Applicants */}
        <div className="bg-white dark:bg-[#1B232E] rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF9F6] dark:bg-[#0F151D] border-b border-[#F0E5DC] dark:border-[#2A3441] text-[#71717A] dark:text-[#A1A1AA] font-['Outfit'] font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">{t('appr.thApplicant')}</th>
                  <th className="p-4">{t('appr.thSkill')}</th>
                  <th className="p-4">{t('appr.thSociety')}</th>
                  <th className="p-4">{t('appr.thApplied')}</th>
                  <th className="p-4 text-right">{t('fed.thActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E5DC] dark:divide-[#2A3441]">
                {pendingList.map((app) => (
                  <tr key={app.id} className="hover:bg-[#FFF9F6] dark:hover:bg-[#0F151D]/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {app.avatar ? (
                          <img
                            src={app.avatar}
                            alt={app.name}
                            className="w-10 h-10 rounded-full object-cover border border-[#F0E5DC] dark:border-[#2E3946]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] text-[#0F151D] dark:text-white flex items-center justify-center font-bold text-xs">
                            {app.initials || app.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="font-['Outfit'] font-bold text-sm text-[#0F151D] dark:text-[#FBFBFB]">
                            {app.name}
                          </h4>
                          <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">{app.email}</p>
                          {app.phone && (
                            <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                              {app.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-[#0F151D] dark:text-[#FBFBFB]">{app.primarySkill}</span>
                      <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">{t('appr.yearsExp', { n: app.experienceYears })}</p>
                    </td>
                    <td className="p-4 text-[#71717A] dark:text-[#A1A1AA] font-medium">{app.society}</td>
                    <td className="p-4 text-[#71717A] dark:text-[#A1A1AA]">{app.appliedDate}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedApplicant(app)}
                          className="px-2.5 py-1.5 bg-[#FFF9F6] dark:bg-[#0F151D] hover:bg-[#F7EFE8] dark:hover:bg-[#2A3441] text-[#0F151D] dark:text-[#FBFBFB] text-xs font-['Outfit'] font-bold rounded-lg border border-[#F0E5DC] dark:border-[#2E3946] transition-colors"
                        >
                          {t('common.review')}
                        </button>
                        <button
                          onClick={() => onReject(app.id)}
                          className="px-2.5 py-1.5 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] text-xs font-['Outfit'] font-bold rounded-lg border border-[#EF4444]/30 transition-colors"
                        >
                          {t('common.reject')}
                        </button>
                        <button
                          onClick={() => onApprove(app.id)}
                          className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white font-['Outfit'] font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          <span>{t('common.approve')}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {pendingList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm text-[#71717A]">
                      {t('appr.allReviewed')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Applicant Detail Modal */}
        {selectedApplicant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white/85 dark:bg-[#232E3A]/85 backdrop-blur-2xl backdrop-saturate-150 text-[#0F151D] dark:text-[#FBFBFB] w-full max-w-lg rounded-3xl border border-white/70 dark:border-white/10 shadow-2xl p-6 space-y-6 transition-colors">
              <div className="flex items-center justify-between border-b border-[#F0E5DC] dark:border-[#2A3441] pb-4">
                <h3 className="font-['Outfit'] text-lg font-bold text-[#0F151D] dark:text-[#FBFBFB]">
                  {t('appr.dossier')}
                </h3>
                <button
                  onClick={() => setSelectedApplicant(null)}
                  className="w-8 h-8 rounded-full bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F151D] dark:hover:text-[#FBFBFB]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="flex items-center gap-4">
                {selectedApplicant.avatar ? (
                  <img
                    src={selectedApplicant.avatar}
                    alt={selectedApplicant.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-[#F0E5DC] dark:border-[#2E3946]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] text-[#FF7448] flex items-center justify-center font-bold text-xl">
                    {selectedApplicant.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-['Outfit'] font-bold text-base text-[#0F151D] dark:text-[#FBFBFB]">
                    {selectedApplicant.name}
                  </h4>
                  <p className="text-xs text-[#FF7448] font-semibold">
                    {selectedApplicant.primarySkill}
                  </p>
                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{selectedApplicant.society}</p>
                  {selectedApplicant.phone && (
                    <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                      📱 {selectedApplicant.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-[#FFF9F6] dark:bg-[#141D28] rounded-xl border border-[#F0E5DC] dark:border-[#2A3441] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#71717A] dark:text-[#A1A1AA]">{t('appr.bgChecks')}</span>
                  <span className="font-bold text-[#10B981]">{t('appr.verifiedClear')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717A] dark:text-[#A1A1AA]">{t('appr.tradeCert')}</span>
                  <span className="font-bold text-[#0F151D] dark:text-[#FBFBFB]">ASME #88921-B</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717A] dark:text-[#A1A1AA]">{t('appr.peerSponsor')}</span>
                  <span className="font-bold text-[#0F151D] dark:text-[#FBFBFB]">Janakpuri Co-op Committee</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    onReject(selectedApplicant.id);
                    setSelectedApplicant(null);
                  }}
                  className="flex-1 py-3 bg-[#FFF9F6] dark:bg-[#0F151D] hover:bg-[#EF4444]/15 text-[#EF4444] font-['Outfit'] font-bold text-xs rounded-xl border border-[#F0E5DC] dark:border-[#2E3946] transition-colors"
                >
                  {t('appr.rejectApplication')}
                </button>
                <button
                  onClick={() => {
                    onApprove(selectedApplicant.id);
                    setSelectedApplicant(null);
                  }}
                  className="flex-1 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-['Outfit'] font-bold text-xs rounded-xl transition-colors shadow-xs"
                >
                  {t('appr.approveMember')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
