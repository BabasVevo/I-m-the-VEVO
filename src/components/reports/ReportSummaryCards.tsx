import type { ReportsSummary } from '@/services/reportService';
import { formatCurrency, formatNumber } from '@/lib/format';
import {
  TrendingUp,
  DollarSign,
  Boxes,
  CreditCard,
  ArrowDownRight,
} from 'lucide-react';

interface ReportSummaryCardsProps {
  summary: ReportsSummary;
  currency?: string;
  loading?: boolean;
}

export function ReportSummaryCards({
  summary,
  currency = 'BIF',
  loading,
}: ReportSummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-navy-900"
          />
        ))}
      </div>
    );
  }

  const isNetProfitPositive = summary.netProfit >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Net Sales */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
            Total Net Sales
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-black tracking-tight text-navy-900 dark:text-white">
            {formatCurrency(summary.totalSalesNet, currency)}
          </p>
          <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-navy-400">
            <span>{formatNumber(summary.totalTransactions)} sales transactions</span>
            <span className="font-medium text-navy-700 dark:text-navy-300">
              ATV: {formatCurrency(summary.averageOrderValue, currency)}
            </span>
          </div>
        </div>
        {summary.totalDiscounts > 0 && (
          <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
            Discounts: -{formatCurrency(summary.totalDiscounts, currency)}
          </div>
        )}
      </div>

      {/* 2. Total Net Profit */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
            Net Profit (EBIT)
          </span>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              isNetProfitPositive
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
            }`}
          >
            {isNetProfitPositive ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <ArrowDownRight className="h-5 w-5" />
            )}
          </div>
        </div>
        <div className="mt-3">
          <p
            className={`text-2xl font-black tracking-tight ${
              isNetProfitPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(summary.netProfit, currency)}
          </p>
          <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-navy-400">
            <span>Margin: {summary.netProfitMargin.toFixed(1)}%</span>
            <span className="font-medium text-navy-700 dark:text-navy-300">
              Gross: {formatCurrency(summary.grossProfit, currency)}
            </span>
          </div>
        </div>
        <div className="mt-2 text-[11px] text-gray-500 dark:text-navy-400">
          COGS: {formatCurrency(summary.cogs, currency)}
        </div>
      </div>

      {/* 3. Total Expenses */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
            Operating Expenses
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-black tracking-tight text-navy-900 dark:text-white">
            {formatCurrency(summary.totalExpenses, currency)}
          </p>
          <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-navy-400">
            <span>Operating Overhead</span>
            <span className="font-medium text-purple-600 dark:text-purple-400">
              {summary.totalSalesNet > 0
                ? ((summary.totalExpenses / summary.totalSalesNet) * 100).toFixed(1)
                : '0.0'}
              % of Sales
            </span>
          </div>
        </div>
        <div className="mt-2 text-[11px] text-gray-500 dark:text-navy-400">
          Purchases: {formatCurrency(summary.totalPurchases, currency)}
        </div>
      </div>

      {/* 4. Current Inventory Valuation */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
            Stock Valuation (Cost)
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <Boxes className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-black tracking-tight text-navy-900 dark:text-white">
            {formatCurrency(summary.totalInventoryCostValue, currency)}
          </p>
          <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-navy-400">
            <span>{formatNumber(summary.totalInventoryUnits)} units in stock</span>
            <span className="font-medium text-navy-700 dark:text-navy-300">
              Retail: {formatCurrency(summary.totalInventoryRetailValue, currency)}
            </span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className="text-amber-600 dark:text-amber-400">
            {summary.lowStockCount} low stock
          </span>
          {summary.outOfStockCount > 0 && (
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {summary.outOfStockCount} out of stock
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
