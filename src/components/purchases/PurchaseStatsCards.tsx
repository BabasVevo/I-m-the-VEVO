import { Truck, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import type { PurchasingStats } from '@/types/database';
import { formatCurrency, formatNumber } from '@/lib/format';

interface PurchaseStatsCardsProps {
  stats: PurchasingStats;
  currency?: string;
}

export function PurchaseStatsCards({ stats, currency = 'BIF' }: PurchaseStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div id="stat-total-po" className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all dark:border-navy-800 dark:bg-navy-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total Purchase Orders
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Truck className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {formatNumber(stats.totalOrders)}
          </span>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            {stats.pendingDeliveriesCount} pending delivery
          </span>
        </div>
      </div>

      <div id="stat-total-purchases-spend" className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all dark:border-navy-800 dark:bg-navy-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total Purchase Value
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {formatCurrency(stats.totalPurchasesAmount, currency)}
          </span>
        </div>
      </div>

      <div id="stat-total-paid-procurement" className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all dark:border-navy-800 dark:bg-navy-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total Paid (Settled)
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatCurrency(stats.totalPaid, currency)}
          </span>
        </div>
      </div>

      <div id="stat-po-payables-due" className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all dark:border-navy-800 dark:bg-navy-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            PO Balance Due
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {formatCurrency(stats.totalPayablesDue, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
