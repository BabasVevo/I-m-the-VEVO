import type { ProfitLossReportData } from '@/services/reportService';
import { formatCurrency } from '@/lib/format';
import {
  TrendingUp,
  Percent,
  CreditCard,
} from 'lucide-react';

interface ProfitLossReportTabProps {
  data: ProfitLossReportData;
  currency?: string;
  loading?: boolean;
}

export function ProfitLossReportTab({
  data,
  currency = 'BIF',
  loading,
}: ProfitLossReportTabProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-navy-900" />
        <div className="h-96 animate-pulse rounded-2xl bg-gray-100 dark:bg-navy-900" />
      </div>
    );
  }

  const isNetProfitPositive = data.netOperatingProfit >= 0;
  const opexRatio =
    data.revenue.netSales > 0
      ? (data.operatingExpenses.totalOperatingExpenses / data.revenue.netSales) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* 1. KPI Margin Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Gross Profit Margin */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
              Gross Profit Margin
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-navy-900 dark:text-white">
              {data.grossMarginPercent.toFixed(1)}%
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-navy-400">
              Gross: {formatCurrency(data.grossProfit, currency)}
            </p>
          </div>
        </div>

        {/* Operating Expense Ratio */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
              Operating Expense Ratio
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-navy-900 dark:text-white">
              {opexRatio.toFixed(1)}%
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-navy-400">
              Overhead: {formatCurrency(data.operatingExpenses.totalOperatingExpenses, currency)}
            </p>
          </div>
        </div>

        {/* Net Profit Margin */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
              Net Profit Margin
            </span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                isNetProfitPositive
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400'
                  : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div
              className={`text-2xl font-black ${
                isNetProfitPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {data.netMarginPercent.toFixed(1)}%
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-navy-400">
              EBIT: {formatCurrency(data.netOperatingProfit, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Formal Income Statement Structure */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
        <div className="border-b border-gray-100 bg-gray-50/70 p-5 dark:border-navy-800 dark:bg-navy-800/40 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              Income Statement (Profit & Loss)
            </h3>
            <p className="text-xs text-gray-500 dark:text-navy-400">
              Official income & expense breakdown for period: <span className="font-semibold text-navy-900 dark:text-white">{data.periodLabel}</span>
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200">
            Currency: {currency}
          </div>
        </div>

        <div className="p-6 space-y-6 text-xs">
          {/* Section 1: REVENUE */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-navy-700">
              <span className="font-bold text-sm uppercase tracking-wider text-navy-900 dark:text-white">
                1. Sales Revenue
              </span>
              <span className="font-bold text-sm text-navy-900 dark:text-white">
                % of Net Sales
              </span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-navy-800/60 pt-1">
              <div className="flex items-center justify-between py-2 pl-4">
                <span className="text-gray-700 dark:text-navy-200">Gross Sales Revenue</span>
                <span className="font-medium text-navy-900 dark:text-white">
                  {formatCurrency(data.revenue.grossSales, currency)}
                </span>
              </div>
              {data.revenue.discounts > 0 && (
                <div className="flex items-center justify-between py-2 pl-4 text-amber-600 dark:text-amber-400">
                  <span>Less: Discounts Granted</span>
                  <span>-{formatCurrency(data.revenue.discounts, currency)}</span>
                </div>
              )}
              {data.revenue.returnsAndRefunds > 0 && (
                <div className="flex items-center justify-between py-2 pl-4 text-rose-600 dark:text-rose-400">
                  <span>Less: Returns & Customer Refunds</span>
                  <span>-{formatCurrency(data.revenue.returnsAndRefunds, currency)}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2.5 font-bold bg-blue-50/40 px-3 rounded-lg dark:bg-blue-950/20 text-navy-900 dark:text-white">
                <span>NET SALES REVENUE</span>
                <div className="flex items-center gap-6">
                  <span>{formatCurrency(data.revenue.netSales, currency)}</span>
                  <span className="text-gray-500 w-12 text-right">100.0%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: COST OF GOODS SOLD */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-navy-700">
              <span className="font-bold text-sm uppercase tracking-wider text-navy-900 dark:text-white">
                2. Cost of Goods Sold (COGS)
              </span>
              <span className="text-gray-500"></span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-navy-800/60 pt-1">
              <div className="flex items-center justify-between py-2 pl-4">
                <span className="text-gray-700 dark:text-navy-200">
                  Direct Inventory & Product Cost (Units Sold × Unit Cost)
                </span>
                <span className="font-medium text-navy-900 dark:text-white">
                  {formatCurrency(data.costOfGoodsSold.directProductCost, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5 font-bold bg-rose-50/40 px-3 rounded-lg dark:bg-rose-950/20 text-navy-900 dark:text-white">
                <span>TOTAL COST OF GOODS SOLD</span>
                <div className="flex items-center gap-6">
                  <span>{formatCurrency(data.costOfGoodsSold.totalCOGS, currency)}</span>
                  <span className="text-gray-500 w-12 text-right">
                    {data.revenue.netSales > 0
                      ? ((data.costOfGoodsSold.totalCOGS / data.revenue.netSales) * 100).toFixed(1)
                      : '0.0'}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: GROSS PROFIT */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200">
            <span className="font-black text-sm uppercase tracking-wider">
              3. GROSS PROFIT (Net Revenue − COGS)
            </span>
            <div className="flex items-center gap-6 font-black text-base">
              <span>{formatCurrency(data.grossProfit, currency)}</span>
              <span className="text-emerald-700 dark:text-emerald-300 w-16 text-right">
                {data.grossMarginPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Section 4: OPERATING EXPENSES */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-navy-700">
              <span className="font-bold text-sm uppercase tracking-wider text-navy-900 dark:text-white">
                4. Operating Expenses
              </span>
              <span className="text-gray-500"></span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-navy-800/60 pt-1">
              {data.operatingExpenses.categoryBreakdown.length === 0 ? (
                <div className="py-2 pl-4 text-gray-400 italic">No operating expenses recorded.</div>
              ) : (
                data.operatingExpenses.categoryBreakdown.map((cat) => (
                  <div key={cat.categoryId} className="flex items-center justify-between py-2 pl-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-gray-700 dark:text-navy-200">
                        {cat.categoryName} <span className="text-gray-400">({cat.code})</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-medium text-navy-900 dark:text-white">
                        {formatCurrency(cat.amount, currency)}
                      </span>
                      <span className="text-gray-400 w-12 text-right">
                        {cat.percentageOfRevenue.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div className="flex items-center justify-between py-2.5 font-bold bg-purple-50/40 px-3 rounded-lg dark:bg-purple-950/20 text-navy-900 dark:text-white">
                <span>TOTAL OPERATING EXPENSES</span>
                <div className="flex items-center gap-6">
                  <span>
                    {formatCurrency(data.operatingExpenses.totalOperatingExpenses, currency)}
                  </span>
                  <span className="text-gray-500 w-12 text-right">
                    {opexRatio.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: NET OPERATING PROFIT (EBIT) */}
          <div
            className={`flex items-center justify-between p-5 rounded-2xl shadow-sm ${
              isNetProfitPositive
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white'
                : 'bg-gradient-to-r from-rose-600 to-red-700 text-white'
            }`}
          >
            <div>
              <span className="font-black text-sm uppercase tracking-wider block">
                5. NET OPERATING PROFIT (Gross Profit − Expenses)
              </span>
              <span className="text-xs opacity-80">
                Operating Net Income for the specified reporting timeframe
              </span>
            </div>
            <div className="flex items-center gap-6 font-black text-xl">
              <span>{formatCurrency(data.netOperatingProfit, currency)}</span>
              <span className="rounded-lg bg-white/20 px-2.5 py-1 text-sm backdrop-blur-xs">
                {data.netMarginPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
