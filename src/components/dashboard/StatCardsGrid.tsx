import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Boxes,
  AlertTriangle,
  PackageX,
  CreditCard,
  ClockAlert,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { DashboardStatsResult } from '@/services/dashboardService';

interface StatCardsGridProps {
  stats: DashboardStatsResult;
  currency: string;
  loading: boolean;
}

export function StatCardsGrid({ stats, currency = 'TZS', loading }: StatCardsGridProps) {
  const cards = [
    {
      id: 'stat-sales-today',
      title: 'Sales Today',
      value: formatCurrency(stats.salesToday, currency),
      rawValue: stats.salesToday,
      subtitle: "Today's completed revenue",
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      border: 'border-emerald-100 dark:border-emerald-900/30',
      accent: 'text-emerald-700 dark:text-emerald-300',
    },
    {
      id: 'stat-tx-today',
      title: 'Transactions Today',
      value: `${formatNumber(stats.transactionsToday)} sales`,
      rawValue: stats.transactionsToday,
      subtitle: 'Completed checkouts today',
      icon: ShoppingBag,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      border: 'border-blue-100 dark:border-blue-900/30',
      accent: 'text-blue-700 dark:text-blue-300',
    },
    {
      id: 'stat-sales-month',
      title: 'Sales This Month',
      value: formatCurrency(stats.salesThisMonth, currency),
      rawValue: stats.salesThisMonth,
      subtitle: 'Month-to-date total volume',
      icon: TrendingUp,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/50',
      border: 'border-indigo-100 dark:border-indigo-900/30',
      accent: 'text-indigo-700 dark:text-indigo-300',
    },
    {
      id: 'stat-stock-value',
      title: 'Stock Value',
      value: formatCurrency(stats.stockValue, currency),
      rawValue: stats.stockValue,
      subtitle: 'Total valuation at cost price',
      icon: Boxes,
      color: 'text-brand-600 dark:text-brand-400',
      bg: 'bg-brand-50 dark:bg-brand-950/50',
      border: 'border-brand-100 dark:border-brand-900/30',
      accent: 'text-brand-700 dark:text-brand-300',
    },
    {
      id: 'stat-low-stock',
      title: 'Low Stock Items',
      value: `${formatNumber(stats.lowStockCount)} products`,
      rawValue: stats.lowStockCount,
      subtitle: 'At or below min stock level',
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      border: 'border-amber-100 dark:border-amber-900/30',
      accent: stats.lowStockCount > 0 ? 'text-amber-700 dark:text-amber-300 font-semibold' : 'text-gray-500',
      badge: stats.lowStockCount > 0 ? 'Action Needed' : 'Normal',
      badgeClass: stats.lowStockCount > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' : 'bg-gray-100 text-gray-600 dark:bg-navy-800 dark:text-navy-300',
    },
    {
      id: 'stat-out-of-stock',
      title: 'Out of Stock Items',
      value: `${formatNumber(stats.outOfStockCount)} products`,
      rawValue: stats.outOfStockCount,
      subtitle: 'Zero units remaining in store',
      icon: PackageX,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      border: 'border-rose-100 dark:border-rose-900/30',
      accent: stats.outOfStockCount > 0 ? 'text-rose-700 dark:text-rose-300 font-semibold' : 'text-gray-500',
      badge: stats.outOfStockCount > 0 ? 'Critical' : 'Healthy',
      badgeClass: stats.outOfStockCount > 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    },
    {
      id: 'stat-amount-due',
      title: 'Amount Due',
      value: formatCurrency(stats.amountDue, currency),
      rawValue: stats.amountDue,
      subtitle: 'Pending customer receivables',
      icon: CreditCard,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/50',
      border: 'border-sky-100 dark:border-sky-900/30',
      accent: 'text-sky-700 dark:text-sky-300',
    },
    {
      id: 'stat-overdue-amount',
      title: 'Overdue Amount',
      value: formatCurrency(stats.overdueAmount, currency),
      rawValue: stats.overdueAmount,
      subtitle: 'Customer balances past due date',
      icon: ClockAlert,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/50',
      border: 'border-orange-100 dark:border-orange-900/30',
      accent: stats.overdueAmount > 0 ? 'text-orange-700 dark:text-orange-300 font-semibold' : 'text-gray-500',
      badge: stats.overdueAmount > 0 ? 'Past Due' : 'All Clear',
      badgeClass: stats.overdueAmount > 0 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' : 'bg-gray-100 text-gray-600 dark:bg-navy-800 dark:text-navy-300',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="card animate-pulse p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 rounded bg-gray-200 dark:bg-navy-800" />
              <div className="h-9 w-9 rounded-xl bg-gray-200 dark:bg-navy-800" />
            </div>
            <div className="h-7 w-36 rounded bg-gray-300 dark:bg-navy-700" />
            <div className="h-3 w-44 rounded bg-gray-200 dark:bg-navy-800" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            id={card.id}
            className="card card-hover relative flex flex-col justify-between overflow-hidden p-5 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
                    {card.title}
                  </span>
                  {card.badge && (
                    <span className={`badge text-[10px] py-0 px-2 font-medium ${card.badgeClass}`}>
                      {card.badge}
                    </span>
                  )}
                </div>
                <p className="text-xl font-bold tracking-tight text-navy-950 dark:text-white sm:text-2xl">
                  {card.value}
                </p>
              </div>

              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${card.border} ${card.bg} ${card.color} shadow-sm`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-navy-800/80 dark:text-navy-400">
              <span className="truncate">{card.subtitle}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
