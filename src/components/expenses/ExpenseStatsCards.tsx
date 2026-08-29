import { Receipt, DollarSign, Clock, PieChart } from 'lucide-react';
import type { ExpenseStats } from '@/types/database';
import { formatCurrency, formatNumber } from '@/lib/format';

interface ExpenseStatsCardsProps {
  stats: ExpenseStats;
  currency?: string;
}

export function ExpenseStatsCards({ stats, currency = 'TZS' }: ExpenseStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div id="stat-total-expenses-month" className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all dark:border-navy-800 dark:bg-navy-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Expenses This Month
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <Receipt className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            {formatCurrency(stats.thisMonthExpenses, currency)}
          </span>
        </div>
      </div>

      <div id="stat-total-expenses-all-time" className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all dark:border-navy-800 dark:bg-navy-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total All-Time Spend
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {formatCurrency(stats.totalExpenses, currency)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({formatNumber(stats.expensesCount)} vouchers)
          </span>
        </div>
      </div>

      <div id="stat-pending-approval-expenses" className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all dark:border-navy-800 dark:bg-navy-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Pending Approval
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {formatNumber(stats.pendingApprovalCount)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            vouchers requiring review
          </span>
        </div>
      </div>

      <div id="stat-recurring-templates" className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all dark:border-navy-800 dark:bg-navy-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Recurring Profiles
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            <PieChart className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
            {formatNumber(stats.activeRecurringCount)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            scheduled automations
          </span>
        </div>
      </div>
    </div>
  );
}
