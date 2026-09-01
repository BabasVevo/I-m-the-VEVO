import { Users, Truck, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { SupplierStats } from '@/types/database';
import { formatCurrency, formatNumber } from '@/lib/format';

interface SupplierStatsCardsProps {
  stats: SupplierStats;
  currency?: string;
}

export function SupplierStatsCards({ stats, currency = 'BIF' }: SupplierStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div id="stat-total-suppliers" className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all dark:border-navy-800 dark:bg-navy-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total Suppliers
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Users className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {formatNumber(stats.totalSuppliers)}
          </span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {stats.activeSuppliers} active
          </span>
        </div>
      </div>

      <div id="stat-total-purchased" className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all dark:border-navy-800 dark:bg-navy-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total Purchased (All Time)
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Truck className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {formatCurrency(stats.totalPurchased, currency)}
          </span>
        </div>
      </div>

      <div id="stat-outstanding-payables" className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all dark:border-navy-800 dark:bg-navy-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Outstanding Payables
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {formatCurrency(stats.totalOutstandingPayables, currency)}
          </span>
        </div>
      </div>

      <div id="stat-suppliers-with-balance" className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all dark:border-navy-800 dark:bg-navy-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Accounts with Due Balance
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {formatNumber(stats.overduePayablesCount)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            of {stats.totalSuppliers} vendors
          </span>
        </div>
      </div>
    </div>
  );
}
