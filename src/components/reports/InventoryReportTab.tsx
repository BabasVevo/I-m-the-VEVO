import { useState } from 'react';
import type { InventoryReportData } from '@/services/reportService';
import { formatCurrency, formatNumber } from '@/lib/format';
import {
  Boxes,
  AlertTriangle,
  TrendingUp,
  Layers,
  Search,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface InventoryReportTabProps {
  data: InventoryReportData;
  currency?: string;
  loading?: boolean;
}

export function InventoryReportTab({
  data,
  currency = 'BIF',
  loading,
}: InventoryReportTabProps) {
  const [alertTab, setAlertTab] = useState<'low' | 'out'>('low');
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-navy-900" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-gray-100 dark:bg-navy-900" />
      </div>
    );
  }

  const alertItems = alertTab === 'low' ? data.lowStockItems : data.outOfStockItems;
  const filteredAlerts = alertItems.filter(
    (item) =>
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.branchName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Inventory Valuation Header Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Cost Value */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
              Total Cost Valuation
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-navy-900 dark:text-white">
              {formatCurrency(data.summary.totalCostValue, currency)}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-navy-400">
              {formatNumber(data.summary.totalUnits)} total units in inventory
            </p>
          </div>
        </div>

        {/* Retail Value */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
              Total Retail Valuation
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-navy-900 dark:text-white">
              {formatCurrency(data.summary.totalRetailValue, currency)}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-navy-400">
              At standard selling prices
            </p>
          </div>
        </div>

        {/* Potential Unrealized Profit */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
              Potential Gross Profit
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(data.summary.potentialProfit, currency)}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-navy-400">
              Unrealized Margin: {data.summary.unrealizedMarginPercent.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Stock Health */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
              Stock Health Status
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {data.summary.lowStockCount}
              </div>
              <p className="text-[11px] text-gray-500">Low Stock</p>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-navy-800" />
            <div>
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
                {data.summary.outOfStockCount}
              </div>
              <p className="text-[11px] text-gray-500">Out of Stock</p>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-navy-800" />
            <div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {data.summary.inStockCount}
              </div>
              <p className="text-[11px] text-gray-500">Healthy</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Category Valuation Breakdown */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              Inventory Valuation by Category
            </h3>
            <p className="text-xs text-gray-500 dark:text-navy-400">
              Comparison of capital tied in inventory versus expected retail returns per category.
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.categoryValuations}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="categoryName" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val, name) => [
                  formatCurrency(Number(val), currency),
                  name === 'costValue' ? 'Cost Value' : 'Retail Value',
                ]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend
                formatter={(val) => (val === 'costValue' ? 'Cost Value' : 'Retail Value')}
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              <Bar dataKey="costValue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="retailValue" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 dark:border-navy-800 dark:text-navy-400">
                <th className="pb-2.5 font-semibold">Category</th>
                <th className="pb-2.5 text-center font-semibold">Products</th>
                <th className="pb-2.5 text-center font-semibold">Total Units</th>
                <th className="pb-2.5 text-right font-semibold">Cost Valuation</th>
                <th className="pb-2.5 text-right font-semibold">Retail Valuation</th>
                <th className="pb-2.5 text-right font-semibold">Potential Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
              {data.categoryValuations.map((c) => (
                <tr key={c.categoryId} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/50">
                  <td className="py-2.5 font-medium text-navy-900 dark:text-white">
                    {c.categoryName}
                  </td>
                  <td className="py-2.5 text-center text-gray-600 dark:text-navy-300">
                    {c.productCount}
                  </td>
                  <td className="py-2.5 text-center font-semibold text-navy-900 dark:text-white">
                    {formatNumber(c.totalUnits)}
                  </td>
                  <td className="py-2.5 text-right font-medium text-navy-900 dark:text-white">
                    {formatCurrency(c.costValue, currency)}
                  </td>
                  <td className="py-2.5 text-right font-bold text-navy-900 dark:text-white">
                    {formatCurrency(c.retailValue, currency)}
                  </td>
                  <td className="py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                    {c.marginPercent.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Low Stock & Out of Stock Alert Center */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              Inventory Alert & Replenishment Center
            </h3>
            <p className="text-xs text-gray-500 dark:text-navy-400">
              Items requiring urgent purchase order restocking with estimated replenishment capital.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tabs */}
            <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-navy-800">
              <button
                type="button"
                onClick={() => setAlertTab('low')}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  alertTab === 'low'
                    ? 'bg-white text-amber-600 shadow-xs dark:bg-navy-900 dark:text-amber-400'
                    : 'text-gray-600 hover:text-navy-900 dark:text-navy-300'
                }`}
              >
                Low Stock ({data.lowStockItems.length})
              </button>
              <button
                type="button"
                onClick={() => setAlertTab('out')}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  alertTab === 'out'
                    ? 'bg-white text-rose-600 shadow-xs dark:bg-navy-900 dark:text-rose-400'
                    : 'text-gray-600 hover:text-navy-900 dark:text-navy-300'
                }`}
              >
                Out of Stock ({data.outOfStockItems.length})
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search alert items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50/80 py-1 pl-8 pr-3 text-xs text-navy-900 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 dark:border-navy-800 dark:text-navy-400">
                <th className="pb-2.5 font-semibold">Product Name</th>
                <th className="pb-2.5 font-semibold">SKU</th>
                <th className="pb-2.5 font-semibold">Branch</th>
                <th className="pb-2.5 text-center font-semibold">Current Qty</th>
                <th className="pb-2.5 text-center font-semibold">Min Stock</th>
                <th className="pb-2.5 text-center font-semibold">Deficit</th>
                <th className="pb-2.5 text-right font-semibold">Unit Cost</th>
                <th className="pb-2.5 text-right font-semibold">Est. Reorder Cost</th>
                <th className="pb-2.5 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-emerald-600 dark:text-emerald-400">
                    No critical stock alerts for this category! All levels are healthy.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/50">
                    <td className="py-2.5 font-semibold text-navy-900 dark:text-white">
                      {item.productName}
                    </td>
                    <td className="py-2.5 font-mono text-gray-500 dark:text-navy-400">
                      {item.sku}
                    </td>
                    <td className="py-2.5 text-gray-600 dark:text-navy-300">
                      {item.branchName}
                    </td>
                    <td className="py-2.5 text-center font-bold text-navy-900 dark:text-white">
                      {item.currentStock}
                    </td>
                    <td className="py-2.5 text-center text-gray-500">
                      {item.minStock}
                    </td>
                    <td className="py-2.5 text-center font-semibold text-rose-600 dark:text-rose-400">
                      +{item.deficitUnits} units
                    </td>
                    <td className="py-2.5 text-right text-gray-600 dark:text-navy-300">
                      {formatCurrency(item.costPrice, currency)}
                    </td>
                    <td className="py-2.5 text-right font-bold text-navy-900 dark:text-white">
                      {formatCurrency(item.estimatedReorderCost, currency)}
                    </td>
                    <td className="py-2.5 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.status === 'out_of_stock'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}
                      >
                        {item.status === 'out_of_stock' ? 'OUT OF STOCK' : 'LOW STOCK'}
                      </span>
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
