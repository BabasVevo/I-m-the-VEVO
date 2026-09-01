import { useState } from 'react';
import type { ExpenseReportData } from '@/services/reportService';
import { formatCurrency } from '@/lib/format';
import {
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  PieChart as PieIcon,
  Tag,
  Search,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ExpenseReportTabProps {
  data: ExpenseReportData;
  currency?: string;
  loading?: boolean;
}

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6', '#10b981', '#06b6d4', '#f97316', '#64748b'];

export function ExpenseReportTab({
  data,
  currency = 'BIF',
  loading,
}: ExpenseReportTabProps) {
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredExpenses = data.expensesList.filter(
    (e) =>
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.expense_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Header KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Expenses */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
              Total Expenses
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-navy-900 dark:text-white">
              {formatCurrency(data.summary.totalExpenses, currency)}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-navy-400">
              {data.summary.expenseCount} total expense transactions
            </p>
          </div>
        </div>

        {/* Paid Expenses */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
              Paid Out
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(data.summary.paidExpenses, currency)}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-navy-400">
              Disbursed from accounts
            </p>
          </div>
        </div>

        {/* Pending Approval */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
              Pending Approval
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Tag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {formatCurrency(data.summary.pendingExpenses, currency)}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-navy-400">
              Awaiting manager sign-off
            </p>
          </div>
        </div>

        {/* Daily Average Expense */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
              Daily Average Burn
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-navy-900 dark:text-white">
              {formatCurrency(data.summary.dailyAverage, currency)}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-navy-400">
              Average operating rate / day
            </p>
          </div>
        </div>
      </div>

      {/* 2. Charts Row: Category Breakdown & Branch Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Expenses by Category
              </h3>
              <p className="text-xs text-gray-500 dark:text-navy-400">
                Overhead distribution across expense codes.
              </p>
            </div>
            <PieIcon className="h-5 w-5 text-gray-400" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-center">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byCategory}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {data.byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [formatCurrency(Number(val), currency), 'Amount']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {data.byCategory.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color || COLORS[idx % COLORS.length] }}
                    />
                    <span className="truncate font-medium text-navy-900 dark:text-white">
                      {cat.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-navy-900 dark:text-white">
                      {formatCurrency(cat.amount, currency)}
                    </span>
                    <span className="ml-1 text-[11px] text-gray-500">
                      ({cat.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expenses by Branch */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Expenses by Branch
              </h3>
              <p className="text-xs text-gray-500 dark:text-navy-400">
                Operating expenditures distributed by location.
              </p>
            </div>
            <Building2 className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-3">
            {data.byBranch.map((b, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-navy-900 dark:text-white">{b.branchName}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">{b.count} expenses</span>
                    <span className="font-bold text-navy-900 dark:text-white">
                      {formatCurrency(b.amount, currency)}
                    </span>
                    <span className="text-purple-600 dark:text-purple-400 font-semibold w-12 text-right">
                      {b.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-navy-800">
                  <div
                    className="h-full rounded-full bg-purple-600 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(2, b.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Detailed Expense Table */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              Itemized Expense Records
            </h3>
            <p className="text-xs text-gray-500 dark:text-navy-400">
              Audit log of all registered operational expenditures.
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50/80 py-1.5 pl-8 pr-3 text-xs text-navy-900 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 dark:border-navy-800 dark:text-navy-400">
                <th className="pb-2.5 font-semibold">Expense #</th>
                <th className="pb-2.5 font-semibold">Date</th>
                <th className="pb-2.5 font-semibold">Category</th>
                <th className="pb-2.5 font-semibold">Description</th>
                <th className="pb-2.5 font-semibold">Branch</th>
                <th className="pb-2.5 font-semibold">Payment</th>
                <th className="pb-2.5 text-right font-semibold">Amount</th>
                <th className="pb-2.5 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
              {filteredExpenses.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/50">
                  <td className="py-3 font-mono font-semibold text-brand-600 dark:text-brand-400">
                    {e.expense_number}
                  </td>
                  <td className="py-3 text-gray-500">
                    {(e.expense_date || e.created_at).slice(0, 10)}
                  </td>
                  <td className="py-3 text-gray-700 dark:text-navy-200 font-medium">
                    {e.category?.name || 'General'}
                  </td>
                  <td className="py-3 text-gray-600 dark:text-navy-300 max-w-xs truncate">
                    {e.description}
                  </td>
                  <td className="py-3 text-gray-500">
                    {e.branch?.name || 'Main Branch'}
                  </td>
                  <td className="py-3 text-gray-600 dark:text-navy-300 capitalize">
                    {e.payment_method.replace('_', ' ')}
                  </td>
                  <td className="py-3 text-right font-bold text-navy-900 dark:text-white">
                    {formatCurrency(e.amount, currency)}
                  </td>
                  <td className="py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                        e.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : e.status === 'approved'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}
                    >
                      {e.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
