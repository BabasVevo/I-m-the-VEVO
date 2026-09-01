import { useState } from 'react';
import type { SalesReportData } from '@/services/reportService';
import { formatCurrency, formatNumber } from '@/lib/format';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  CreditCard,
  Building2,
  Users,
  Package,
  Search,
} from 'lucide-react';

interface SalesReportTabProps {
  data: SalesReportData;
  currency?: string;
  loading?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'];

export function SalesReportTab({
  data,
  currency = 'BIF',
  loading,
}: SalesReportTabProps) {
  const [productSearch, setProductSearch] = useState('');
  const [productSortBy, setProductSortBy] = useState<'revenue' | 'units' | 'profit'>('revenue');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-80 animate-pulse rounded-2xl bg-gray-100 dark:bg-navy-900" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-navy-900" />
          <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-navy-900" />
        </div>
      </div>
    );
  }

  const filteredProducts = data.salesByProduct
    .filter(
      (p) =>
        p.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(productSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (productSortBy === 'revenue') return b.revenue - a.revenue;
      if (productSortBy === 'units') return b.unitsSold - a.unitsSold;
      return b.grossProfit - a.grossProfit;
    });

  return (
    <div className="space-y-6">
      {/* 1. Revenue & Sales Velocity Trend Chart */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              Revenue & Profit Timeline
            </h3>
            <p className="text-xs text-gray-500 dark:text-navy-400">
              Daily trajectory of gross sales, net revenue, cost of goods, and gross profit.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
              <span className="font-medium text-gray-700 dark:text-navy-300">Net Sales</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-gray-700 dark:text-navy-300">Gross Profit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="font-medium text-gray-700 dark:text-navy-300">COGS</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          {data.timeline.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">
              No sales transactions in the selected date range.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val, name) => [
                    formatCurrency(Number(val), currency),
                    name === 'netSales'
                      ? 'Net Sales'
                      : name === 'grossProfit'
                      ? 'Gross Profit'
                      : name === 'cogs'
                      ? 'COGS'
                      : name,
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="netSales"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                  name="netSales"
                />
                <Area
                  type="monotone"
                  dataKey="grossProfit"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#profitGrad)"
                  name="grossProfit"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Middle Row: Category Breakdown & Payment Methods */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales by Category */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Sales by Category
              </h3>
              <p className="text-xs text-gray-500 dark:text-navy-400">
                Revenue contribution and units sold per product category.
              </p>
            </div>
            <Package className="h-5 w-5 text-gray-400" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-center">
            <div className="h-52 w-full">
              {data.salesByCategory.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                  No category data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.salesByCategory}
                      dataKey="salesAmount"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {data.salesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value), currency), 'Revenue']}
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
              )}
            </div>

            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {data.salesByCategory.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color || COLORS[idx % COLORS.length] }}
                    />
                    <span className="truncate font-medium text-navy-900 dark:text-white">
                      {cat.categoryName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-navy-900 dark:text-white">
                      {formatCurrency(cat.salesAmount, currency)}
                    </span>
                    <span className="ml-1 text-[11px] text-gray-500">
                      ({cat.sharePercentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Payment Methods Distribution
              </h3>
              <p className="text-xs text-gray-500 dark:text-navy-400">
                Breakdown of cash, mobile money, cards, and store credits.
              </p>
            </div>
            <CreditCard className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-3">
            {data.paymentMethods.map((pm, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-navy-900 dark:text-white">{pm.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-navy-400">{pm.count} orders</span>
                    <span className="font-bold text-navy-900 dark:text-white">
                      {formatCurrency(pm.amount, currency)}
                    </span>
                    <span className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold w-10 text-right">
                      {pm.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-navy-800">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(2, pm.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Branch & Employee Performance Leaderboards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales by Branch */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Branch Sales Performance
              </h3>
              <p className="text-xs text-gray-500 dark:text-navy-400">
                Revenue contribution and transaction volume by branch.
              </p>
            </div>
            <Building2 className="h-5 w-5 text-gray-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 dark:border-navy-800 dark:text-navy-400">
                  <th className="pb-2.5 font-semibold">Branch Name</th>
                  <th className="pb-2.5 text-center font-semibold">Orders</th>
                  <th className="pb-2.5 text-right font-semibold">Avg Ticket</th>
                  <th className="pb-2.5 text-right font-semibold">Net Revenue</th>
                  <th className="pb-2.5 text-right font-semibold">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
                {data.salesByBranch.map((b) => (
                  <tr key={b.branchId} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/50">
                    <td className="py-2.5 font-medium text-navy-900 dark:text-white">
                      {b.branchName}
                    </td>
                    <td className="py-2.5 text-center text-gray-600 dark:text-navy-300">
                      {formatNumber(b.ordersCount)}
                    </td>
                    <td className="py-2.5 text-right text-gray-600 dark:text-navy-300">
                      {formatCurrency(b.avgOrderValue, currency)}
                    </td>
                    <td className="py-2.5 text-right font-bold text-navy-900 dark:text-white">
                      {formatCurrency(b.salesAmount, currency)}
                    </td>
                    <td className="py-2.5 text-right text-brand-600 dark:text-brand-400 font-semibold">
                      {b.sharePercentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales by Cashier / Staff */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Cashier & Staff Leaderboard
              </h3>
              <p className="text-xs text-gray-500 dark:text-navy-400">
                Individual team member processed sales volume.
              </p>
            </div>
            <Users className="h-5 w-5 text-gray-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 dark:border-navy-800 dark:text-navy-400">
                  <th className="pb-2.5 font-semibold">Employee</th>
                  <th className="pb-2.5 text-center font-semibold">Role</th>
                  <th className="pb-2.5 text-center font-semibold">Orders</th>
                  <th className="pb-2.5 text-right font-semibold">Total Processed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
                {data.salesByEmployee.map((emp) => (
                  <tr key={emp.employeeId} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/50">
                    <td className="py-2.5">
                      <div className="font-semibold text-navy-900 dark:text-white">
                        {emp.employeeName}
                      </div>
                    </td>
                    <td className="py-2.5 text-center text-gray-500 dark:text-navy-400">
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700 dark:bg-navy-800 dark:text-navy-300">
                        {emp.role}
                      </span>
                    </td>
                    <td className="py-2.5 text-center text-gray-600 dark:text-navy-300">
                      {formatNumber(emp.ordersCount)}
                    </td>
                    <td className="py-2.5 text-right font-bold text-navy-900 dark:text-white">
                      {formatCurrency(emp.salesAmount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Product Sales Performance Table */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              Product Sales & Profit Contribution
            </h3>
            <p className="text-xs text-gray-500 dark:text-navy-400">
              Detailed itemized product sales volume, direct cost, profit, and margins.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50/80 py-1.5 pl-8 pr-3 text-xs text-navy-900 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-500">Sort by:</span>
              <button
                type="button"
                onClick={() => setProductSortBy('revenue')}
                className={`rounded-lg px-2.5 py-1 font-medium transition ${
                  productSortBy === 'revenue'
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 font-semibold'
                    : 'text-gray-600 hover:text-navy-900 dark:text-navy-300'
                }`}
              >
                Revenue
              </button>
              <button
                type="button"
                onClick={() => setProductSortBy('units')}
                className={`rounded-lg px-2.5 py-1 font-medium transition ${
                  productSortBy === 'units'
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 font-semibold'
                    : 'text-gray-600 hover:text-navy-900 dark:text-navy-300'
                }`}
              >
                Units
              </button>
              <button
                type="button"
                onClick={() => setProductSortBy('profit')}
                className={`rounded-lg px-2.5 py-1 font-medium transition ${
                  productSortBy === 'profit'
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 font-semibold'
                    : 'text-gray-600 hover:text-navy-900 dark:text-navy-300'
                }`}
              >
                Gross Profit
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 dark:border-navy-800 dark:text-navy-400">
                <th className="pb-2.5 font-semibold">Product Name</th>
                <th className="pb-2.5 font-semibold">SKU / Code</th>
                <th className="pb-2.5 font-semibold">Category</th>
                <th className="pb-2.5 text-center font-semibold">Units Sold</th>
                <th className="pb-2.5 text-right font-semibold">Revenue</th>
                <th className="pb-2.5 text-right font-semibold">COGS</th>
                <th className="pb-2.5 text-right font-semibold">Gross Profit</th>
                <th className="pb-2.5 text-right font-semibold">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-gray-400">
                    No products matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.productId} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/50">
                    <td className="py-3 font-semibold text-navy-900 dark:text-white">
                      {p.productName}
                    </td>
                    <td className="py-3 font-mono text-gray-500 dark:text-navy-400">
                      {p.sku}
                    </td>
                    <td className="py-3 text-gray-600 dark:text-navy-300">
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] dark:bg-navy-800">
                        {p.categoryName}
                      </span>
                    </td>
                    <td className="py-3 text-center font-bold text-navy-900 dark:text-white">
                      {formatNumber(p.unitsSold)}
                    </td>
                    <td className="py-3 text-right font-bold text-navy-900 dark:text-white">
                      {formatCurrency(p.revenue, currency)}
                    </td>
                    <td className="py-3 text-right text-gray-500 dark:text-navy-400">
                      {formatCurrency(p.cogs, currency)}
                    </td>
                    <td
                      className={`py-3 text-right font-bold ${
                        p.grossProfit >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatCurrency(p.grossProfit, currency)}
                    </td>
                    <td className="py-3 text-right font-semibold text-brand-600 dark:text-brand-400">
                      {p.marginPercentage.toFixed(1)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
