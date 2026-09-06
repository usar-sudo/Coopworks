import React from 'react';
import { motion } from 'motion/react';
import { BulkOrder } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface BulkOrdersPanelProps {
  orders: BulkOrder[];
  onAdvanceOrder: (id: string) => void;
}

const STATUS_STYLE: Record<BulkOrder['status'], string> = {
  open: 'bg-[#F59E0B]/10 dark:bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#D97706] dark:text-[#F59E0B]',
  allocating: 'bg-[#D3E1FF]/60 dark:bg-[#2E3946] border border-[#D3E1FF] text-[#2B3A4A] dark:text-[#D3E1FF]',
  fulfilled: 'bg-[#10B981]/10 dark:bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]',
  cancelled: 'bg-[#EF4444]/10 dark:bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]',
};

const NEXT_LABEL_KEY: Record<BulkOrder['status'], string> = {
  open: 'bulk.allocateWorkers',
  allocating: 'bulk.markFulfilled',
  fulfilled: 'bulk.fulfilled',
  cancelled: 'bulk.closed',
};

/** Institution bulk-order queue — organisations request many workers at once
 *  and the co-op staffs it from the verified pool (open → allocating → fulfilled). */
export const BulkOrdersPanel: React.FC<BulkOrdersPanelProps> = ({ orders, onAdvanceOrder }) => {
  const { t } = useLanguage();
  const active = orders.filter((o) => o.status !== 'cancelled');

  return (
    <div className="bg-white dark:bg-[#1B232E] p-6 rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xs dark:shadow-md transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-['Outfit'] text-base font-bold text-[#0F151D] dark:text-[#FBFBFB] flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#FF7448]">business_center</span>
          <span>{t('bulk.institutionOrders')}</span>
        </h3>
        <span className="text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA] bg-[#FFF9F6] dark:bg-[#141D28] px-2.5 py-1 rounded-full border border-[#F0E5DC] dark:border-[#2A3441]">
          {t('bulk.awaitingStaff', { n: active.length })}
        </span>
      </div>

      {active.length === 0 ? (
        <div className="p-6 text-center bg-[#FFF9F6] dark:bg-[#141D28] rounded-xl border border-dashed border-[#E4DED4] dark:border-[#2E3946] space-y-1">
          <span className="material-symbols-outlined text-[28px] text-[#71717A]">task_alt</span>
          <p className="text-xs font-bold text-[#0F151D] dark:text-[#FBFBFB]">
            {t('bulk.noOpenOrders')}
          </p>
          <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
            {t('bulk.willAppearHere')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((order) => (
            <motion.div
              key={order.id}
              whileHover={{ y: -1 }}
              className="p-4 bg-[#FFF9F6] dark:bg-[#141D28] rounded-xl border border-[#F0E5DC] dark:border-[#2A3441] space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] font-bold text-[#FF7448] bg-[#FF7448]/10 px-1.5 py-0.5 rounded">
                      {order.orderNo}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLE[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <h4 className="font-['Outfit'] font-bold text-sm text-[#0F151D] dark:text-[#FBFBFB] mt-1.5 truncate">
                    {order.orgName}
                  </h4>
                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                    {order.serviceType} • {order.workersNeeded} workers • {order.locationArea}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-[#10B981]">{order.estimatedCost}</span>
                  <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">{order.scheduledDate}</p>
                </div>
              </div>

              {order.notes && (
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                  {order.notes}
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[#F0E5DC] dark:border-[#2A3441]">
                <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">call</span>
                  {order.contactName} • {order.contactPhone}
                </span>
                {order.status !== 'fulfilled' && (
                  <button
                    onClick={() => onAdvanceOrder(order.id)}
                    className="px-3 py-1.5 bg-[#FF7448] hover:bg-[#FF8D69] text-white text-[11px] font-bold rounded-lg transition-colors shadow-md shadow-[#FF7448]/20 flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {order.status === 'open' ? 'group_add' : 'check_circle'}
                    </span>
                    {t(NEXT_LABEL_KEY[order.status])}
                  </button>
                )}
                {order.status === 'fulfilled' && (
                  <button
                    onClick={() => onAdvanceOrder(order.id)}
                    className="px-3 py-1.5 bg-[#10B981]/10 text-[#10B981] text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                    {t('bulk.fulfilled')}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};