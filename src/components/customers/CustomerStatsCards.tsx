import { Users, Star, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import type { CustomerStats } from '@/types/database';
import { formatCurrency } from '@/lib/format';

interface CustomerStatsCardsProps {
  stats: CustomerStats;
  currency?: string;
  onFilterPreset?: (preset: string) => void;
}

export function CustomerStatsCards({ stats, currency = 'TZS', onFilterPreset }: CustomerStatsCardsProps) {
  const cards = [
    {
      id: 'total-customers-stat',
      title: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      subtext: `${stats.activeCustomers} active · ${stats.newThisMonth} new this month`,
      icon: Users,
      iconBg: 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400',
      borderHover: 'hover:border-brand-300 dark:hover:border-brand-800',
      onClick: () => onFilterPreset?.('all'),
    },
    {
      id: 'vip-customers-stat',
      title: 'VIP & High Value',
      value: stats.vipCustomers.toLocaleString(),
      subtext: `${stats.wholesaleCustomers} wholesale buyers`,
      icon: Star,
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
      borderHover: 'hover:border-amber-300 dark:hover:border-amber-800',
      onClick: () => onFilterPreset?.('vip'),
    },
    {
      id: 'lifetime-value-stat',
      title: 'Customer Lifetime Revenue',
      value: formatCurrency(stats.totalRevenue, currency),
      subtext: `Avg ${formatCurrency(stats.averageCustomerSpend, currency)} / customer`,
      icon: TrendingUp,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
      borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-800',
      onClick: () => onFilterPreset?.('high_spenders'),
    },
    {
      id: 'outstanding-balance-stat',
      title: 'Outstanding Receivables (Debt)',
      value: formatCurrency(stats.totalOutstandingBalance, currency),
      subtext: `${stats.debtorsCount} customers with unpaid balances`,
      icon: stats.totalOutstandingBalance > 0 ? AlertTriangle : CreditCard,
      iconBg: stats.totalOutstandingBalance > 0 
        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' 
        : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
      borderHover: stats.totalOutstandingBalance > 0 
        ? 'hover:border-rose-300 dark:hover:border-rose-800' 
        : 'hover:border-indigo-300 dark:hover:border-indigo-800',
      onClick: () => onFilterPreset?.('debtors'),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.id}
            id={card.id}
            type="button"
            onClick={card.onClick}
            className={`group flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-xs transition-all duration-200 hover:shadow-md dark:border-navy-800 dark:bg-navy-900 ${card.borderHover}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                {card.title}
              </span>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition group-hover:scale-105 ${card.iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
                {card.value}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {card.subtext}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
