import { useState } from 'react';
import type { CustomerReportData } from '@/services/reportService';
import { formatCurrency, formatNumber } from '@/lib/format';
import {
  Users,
  DollarSign,
  UserPlus,
  AlertCircle,
  Search,
} from 'lucide-react';

interface CustomerReportTabProps {
  data: CustomerReportData;
  currency?: string;
  loading?: boolean;
}

export function CustomerReportTab({
  data,
  currency = 'BIF',
  loading,
}: CustomerReportTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'leaderboard' | 'receivables'>('leaderboard');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-navy-900" />
          ))}
        </div>
      </div>
    );
  }

  const filteredCustomers = data.topCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredReceivables = data.receivables.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* 1. Header KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Customers */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
              Total Customer Base
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-navy-900 dark:text-white">
              {formatNumber(data.summary.totalCustomers)}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-navy-400">
              {data.summary.activeCustomersCount} active buyers
            </p>
          </div>
        </div>

        {/* New in Period */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
              New Customer Acquisitions
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <UserPlus className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              +{data.summary.newCustomersInPeriod}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-navy-400">
              Enrolled in selected period
            </p>
          </div>
        </div>

        {/* Average CLV */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
              Avg Lifetime Value (CLV)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-navy-900 dark:text-white">
              {formatCurrency(data.summary.averageCustomerLifetimeValue, currency)}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-navy-400">
              Per registered client
            </p>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
              Customer Receivables Due
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {formatCurrency(data.summary.totalReceivablesDue, currency)}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-navy-400">
              Across {data.summary.debtorsCount} account debtors
            </p>
          </div>
        </div>
      </div>

      {/* 2. Customer Breakdown & Sub-Tabs */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveSubTab('leaderboard')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeSubTab === 'leaderboard'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-navy-800 dark:text-navy-200'
              }`}
            >
              Top Customers Leaderboard
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('receivables')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeSubTab === 'receivables'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-navy-800 dark:text-navy-200'
              }`}
            >
              Receivables / Debtors ({data.receivables.length})
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50/80 py-1.5 pl-8 pr-3 text-xs text-navy-900 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
            />
          </div>
        </div>

        {activeSubTab === 'leaderboard' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 dark:border-navy-800 dark:text-navy-400">
                  <th className="pb-2.5 font-semibold">Rank & Customer</th>
                  <th className="pb-2.5 font-semibold">Type</th>
                  <th className="pb-2.5 font-semibold">Phone / Email</th>
                  <th className="pb-2.5 text-center font-semibold">Orders</th>
                  <th className="pb-2.5 text-right font-semibold">Avg Ticket</th>
                  <th className="pb-2.5 text-right font-semibold">Total Spent</th>
                  <th className="pb-2.5 text-right font-semibold">Credit Balance</th>
                  <th className="pb-2.5 text-right font-semibold">Last Purchase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
                {filteredCustomers.map((c, idx) => (
                  <tr key={c.customerId} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {idx < 3 ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                            #{idx + 1}
                          </div>
                        ) : (
                          <span className="w-5 text-center text-gray-400">#{idx + 1}</span>
                        )}
                        <span className="font-semibold text-navy-900 dark:text-white">
                          {c.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase text-gray-700 dark:bg-navy-800 dark:text-navy-300">
                        {c.customerType}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 font-mono">
                      {c.phone || c.email || '—'}
                    </td>
                    <td className="py-3 text-center font-semibold text-navy-900 dark:text-white">
                      {formatNumber(c.ordersCount)}
                    </td>
                    <td className="py-3 text-right text-gray-600 dark:text-navy-300">
                      {formatCurrency(c.avgOrderValue, currency)}
                    </td>
                    <td className="py-3 text-right font-bold text-navy-900 dark:text-white">
                      {formatCurrency(c.totalSpent, currency)}
                    </td>
                    <td className="py-3 text-right font-semibold text-rose-600 dark:text-rose-400">
                      {c.creditBalance > 0 ? formatCurrency(c.creditBalance, currency) : '—'}
                    </td>
                    <td className="py-3 text-right text-gray-500">
                      {c.lastPurchaseDate ? c.lastPurchaseDate.slice(0, 10) : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 dark:border-navy-800 dark:text-navy-400">
                  <th className="pb-2.5 font-semibold">Customer Name</th>
                  <th className="pb-2.5 font-semibold">Phone Number</th>
                  <th className="pb-2.5 text-right font-semibold">Credit Limit</th>
                  <th className="pb-2.5 text-right font-semibold">Outstanding Due Balance</th>
                  <th className="pb-2.5 text-right font-semibold">Last Purchase Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
                {filteredReceivables.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      No accounts receivable due! All customer credits are settled.
                    </td>
                  </tr>
                ) : (
                  filteredReceivables.map((c) => (
                    <tr key={c.customerId} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/50">
                      <td className="py-3 font-semibold text-navy-900 dark:text-white">
                        {c.name}
                      </td>
                      <td className="py-3 font-mono text-gray-600 dark:text-navy-300">
                        {c.phone || '—'}
                      </td>
                      <td className="py-3 text-right text-gray-500">
                        {formatCurrency(c.creditLimit, currency)}
                      </td>
                      <td className="py-3 text-right font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(c.currentBalance, currency)}
                      </td>
                      <td className="py-3 text-right text-gray-500">
                        {c.lastPurchaseAt ? c.lastPurchaseAt.slice(0, 10) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
