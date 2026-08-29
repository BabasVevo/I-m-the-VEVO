import { useState } from 'react';
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  Receipt,
  Tag,
  Repeat,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type {
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  Branch,
} from '@/types/database';
import {
  formatCurrency,
  formatDate,
  EXPENSE_STATUS_CONFIG,
  PAYMENT_METHOD_LABELS,
} from '@/lib/format';

interface ExpenseListProps {
  expenses: Expense[];
  totalCount: number;
  categories: ExpenseCategory[];
  branches: Branch[];
  currentPage: number;
  pageSize: number;
  search: string;
  selectedCategory: string;
  selectedStatus: ExpenseStatus | 'all';
  selectedBranch: string;
  startDate: string;
  endDate: string;
  currency?: string;
  loading: boolean;
  onSearchChange: (search: string) => void;
  onCategoryChange: (catId: string) => void;
  onStatusChange: (status: ExpenseStatus | 'all') => void;
  onBranchChange: (branchId: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onPageChange: (page: number) => void;
  onAddExpense: () => void;
  onOpenCategories: () => void;
  onOpenRecurring: () => void;
  onEditExpense: (expense: Expense) => void;
  onApproveExpense: (expense: Expense) => void;
  onRejectExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  onExportCSV: () => void;
}

export function ExpenseList({
  expenses,
  totalCount,
  categories,
  branches,
  currentPage,
  pageSize,
  search,
  selectedCategory,
  selectedStatus,
  selectedBranch,
  startDate,
  endDate,
  currency = 'TZS',
  loading,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onBranchChange,
  onStartDateChange,
  onEndDateChange,
  onPageChange,
  onAddExpense,
  onOpenCategories,
  onOpenRecurring,
  onEditExpense,
  onApproveExpense,
  onRejectExpense,
  onDeleteExpense,
  onExportCSV,
}: ExpenseListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-4">
      {/* Search & Filters Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search expenses, payee, invoice #..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-xs text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-900 dark:text-white"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-700 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {branches.length > 1 && (
            <select
              value={selectedBranch}
              onChange={(e) => onBranchChange(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-700 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as ExpenseStatus | 'all')}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-700 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300"
          >
            <option value="all">All Approval Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="draft">Draft</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Date range */}
          <div className="flex items-center gap-1 bg-white dark:bg-navy-900 border border-gray-300 dark:border-navy-700 rounded-lg px-2 py-1 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="bg-transparent text-gray-700 dark:text-gray-300 focus:outline-hidden"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="bg-transparent text-gray-700 dark:text-gray-300 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenCategories}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300 dark:hover:bg-navy-800"
          >
            <Tag className="h-4 w-4" /> Categories
          </button>
          <button
            type="button"
            onClick={onOpenRecurring}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300 dark:hover:bg-navy-800"
          >
            <Repeat className="h-4 w-4" /> Recurring
          </button>
          <button
            type="button"
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300 dark:hover:bg-navy-800"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            type="button"
            onClick={onAddExpense}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600"
          >
            <Plus className="h-4 w-4" /> Record Expense
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-navy-800 dark:bg-navy-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-500 dark:border-navy-800 dark:bg-navy-950/60 dark:text-gray-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Expense Title & Purpose</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Payee / Beneficiary</th>
                <th className="px-4 py-3.5">Method & Ref</th>
                <th className="px-4 py-3.5 text-right">Amount</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-navy-800 text-gray-900 dark:text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <Receipt className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      No expense vouchers found
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {search ? 'Try clearing search or adjusting date filters' : 'Record store expenses, bills, and operational overheads.'}
                    </p>
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => {
                  const st = EXPENSE_STATUS_CONFIG[expense.status] || EXPENSE_STATUS_CONFIG.paid;

                  return (
                    <tr
                      key={expense.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-navy-800/50 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {expense.title}
                        </div>
                        {expense.notes && (
                          <p className="text-2xs text-gray-500 dark:text-gray-400 line-clamp-1">
                            {expense.notes}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-2xs font-semibold text-gray-700 dark:bg-navy-800 dark:text-gray-300">
                          {expense.category?.name || 'General Expense'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-2xs text-gray-700 dark:text-gray-300">
                        {formatDate(expense.expense_date)}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {expense.vendor_name || '—'}
                        </div>
                        {expense.supplier && (
                          <span className="text-2xs text-brand-600 dark:text-brand-400">
                            Vendor Account: {expense.supplier.name}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="text-2xs font-medium text-gray-800 dark:text-gray-200">
                          {PAYMENT_METHOD_LABELS[expense.payment_method] || expense.payment_method}
                        </div>
                        <div className="text-2xs text-gray-500 dark:text-gray-400">
                          {expense.reference_number || 'No Ref'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(expense.amount, currency)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-semibold ${st.bg} ${st.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() => setOpenMenuId(openMenuId === expense.id ? null : expense.id)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-navy-800 dark:hover:text-gray-300"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {openMenuId === expense.id && (
                            <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg dark:border-navy-800 dark:bg-navy-900 text-xs">
                              {expense.status === 'pending_approval' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onApproveExpense(expense);
                                    }}
                                    className="flex w-full items-center gap-2 px-3.5 py-1.5 text-emerald-600 hover:bg-gray-50 dark:text-emerald-400 dark:hover:bg-navy-800"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve Voucher
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onRejectExpense(expense);
                                    }}
                                    className="flex w-full items-center gap-2 px-3.5 py-1.5 text-rose-600 hover:bg-gray-50 dark:text-rose-400 dark:hover:bg-navy-800"
                                  >
                                    <XCircle className="h-3.5 w-3.5" /> Reject Voucher
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onEditExpense(expense);
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-1.5 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-navy-800"
                              >
                                <Edit className="h-3.5 w-3.5 text-gray-400" /> Edit Voucher
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onDeleteExpense(expense);
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-navy-800 text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} vouchers
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-medium text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
