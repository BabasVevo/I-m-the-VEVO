import { useState } from 'react';
import {
  Search,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Eye,
  Building2,
  X,
} from 'lucide-react';
import {
  formatCurrency,
  formatDateTime,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_CONFIG,
} from '@/lib/format';
import { ReceiptDetailModal } from './ReceiptDetailModal';
import type { Sale } from '@/types/database';

interface RecentSalesTableProps {
  sales: Sale[];
  totalCount: number;
  currency: string;
  currentPage: number;
  pageSize: number;
  searchQuery: string;
  paymentStatusFilter: string;
  paymentMethodFilter: string;
  loading: boolean;
  onPageChange: (page: number) => void;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
  onMethodFilterChange: (method: string) => void;
  onPageSizeChange: (size: number) => void;
}

export function RecentSalesTable({
  sales,
  totalCount,
  currency = 'BIF',
  currentPage,
  pageSize,
  searchQuery,
  paymentStatusFilter,
  paymentMethodFilter,
  loading,
  onPageChange,
  onSearchChange,
  onStatusFilterChange,
  onMethodFilterChange,
  onPageSizeChange,
}: RecentSalesTableProps) {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <>
      <div
        id="recent-sales-section"
        className="card overflow-hidden shadow-sm"
      >
        {/* Header & Controls */}
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 dark:border-navy-800 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Recent Sales Transactions
              </h3>
              <p className="text-xs text-gray-500 dark:text-navy-400">
                {totalCount} total receipts recorded
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1 sm:w-64 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="search-recent-sales"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search receipt, customer..."
                className="input py-1.5 pl-9 pr-8 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-900 dark:hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Payment Status Filter */}
            <select
              id="filter-payment-status"
              value={paymentStatusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              aria-label="Filter by payment status"
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Payment Method Filter */}
            <select
              id="filter-payment-method"
              value={paymentMethodFilter}
              onChange={(e) => onMethodFilterChange(e.target.value)}
              aria-label="Filter by payment method"
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200"
            >
              <option value="all">All Payment Methods</option>
              <option value="cash">Cash</option>
              <option value="mobile_money">Mobile Money (M-Pesa)</option>
              <option value="card">Card (POS)</option>
              <option value="credit">Store Credit</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>

            {/* View All toggle */}
            <button
              type="button"
              onClick={() => onPageSizeChange(pageSize === 8 ? 25 : 8)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                pageSize > 8
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'border-gray-200 bg-white text-navy-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200'
              }`}
            >
              {pageSize > 8 ? 'Show Compact' : 'View All (25)'}
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/60 uppercase tracking-wider text-gray-400 dark:border-navy-800 dark:bg-navy-950/40 dark:text-navy-400">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Receipt #</th>
                <th className="px-4 py-3.5 font-semibold">Date & Time</th>
                <th className="px-4 py-3.5 font-semibold">Branch</th>
                <th className="px-4 py-3.5 font-semibold">Customer</th>
                <th className="px-4 py-3.5 font-semibold">Cashier</th>
                <th className="px-4 py-3.5 font-semibold">Payment Method</th>
                <th className="px-4 py-3.5 font-semibold text-right">Total</th>
                <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-navy-800/80">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-24 rounded bg-gray-200 dark:bg-navy-800" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-28 rounded bg-gray-200 dark:bg-navy-800" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 rounded bg-gray-200 dark:bg-navy-800" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 rounded bg-gray-200 dark:bg-navy-800" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-20 rounded bg-gray-200 dark:bg-navy-800" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 rounded bg-gray-200 dark:bg-navy-800" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-20 rounded bg-gray-200 dark:bg-navy-800 ml-auto" /></td>
                    <td className="px-4 py-4"><div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-navy-800 mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-12 rounded bg-gray-200 dark:bg-navy-800 ml-auto" /></td>
                  </tr>
                ))
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 dark:text-navy-500">
                    <Receipt className="mx-auto h-8 w-8 text-gray-300 dark:text-navy-700" />
                    <p className="mt-2 font-medium text-navy-800 dark:text-navy-300">
                      No sales matching current criteria
                    </p>
                    <p className="text-xs">
                      {searchQuery || paymentStatusFilter !== 'all' || paymentMethodFilter !== 'all'
                        ? 'Try clearing your filters or search terms.'
                        : 'New sales recorded at the POS terminal will appear here in real-time.'}
                    </p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const statusCfg = PAYMENT_STATUS_CONFIG[sale.payment_status] || PAYMENT_STATUS_CONFIG.completed;
                  const methodLabel = PAYMENT_METHOD_LABELS[sale.payment_method] || sale.payment_method;

                  return (
                    <tr
                      key={sale.id}
                      onClick={() => setSelectedSale(sale)}
                      className="cursor-pointer transition hover:bg-gray-50/80 dark:hover:bg-navy-800/40"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 font-bold font-mono text-navy-950 dark:text-white">
                        {sale.receipt_number}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-gray-600 dark:text-navy-300">
                        {formatDateTime(sale.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-navy-800 dark:text-navy-200">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-gray-400" />
                          {sale.branch?.name ?? 'Main Branch'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-medium text-navy-900 dark:text-white">
                        {sale.customer?.name ?? (
                          <span className="text-gray-400 dark:text-navy-400">Walk-in</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-gray-600 dark:text-navy-300">
                        {sale.cashier?.full_name ?? 'Staff'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-navy-700 dark:text-navy-300">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-700 dark:bg-navy-800 dark:text-navy-300">
                          {methodLabel}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-bold text-navy-950 dark:text-white">
                        {formatCurrency(sale.total_amount, currency)}
                        {sale.due_amount > 0 && (
                          <span className="block text-[10px] font-normal text-amber-600 dark:text-amber-400">
                            Due: {formatCurrency(sale.due_amount, currency)}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSale(sale);
                          }}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-navy-800 dark:hover:text-brand-400"
                          title="View receipt breakdown"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-3.5 text-xs text-gray-500 dark:border-navy-800 dark:text-navy-400 sm:flex-row">
          <div>
            Showing <strong className="text-navy-900 dark:text-white">{startItem}</strong> to{' '}
            <strong className="text-navy-900 dark:text-white">{endItem}</strong> of{' '}
            <strong className="text-navy-900 dark:text-white">{totalCount}</strong> transactions
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => onPageChange(currentPage - 1)}
              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-navy-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-40 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200 dark:hover:bg-navy-700"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>

            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => onPageChange(currentPage + 1)}
              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-navy-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-40 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200 dark:hover:bg-navy-700"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <ReceiptDetailModal
        sale={selectedSale}
        currency={currency}
        onClose={() => setSelectedSale(null)}
      />
    </>
  );
}
