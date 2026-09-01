import { useState } from 'react';
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  Building2,
  DollarSign,
  Edit,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Supplier, SupplierStatus, Branch } from '@/types/database';
import { formatCurrency, SUPPLIER_TYPE_LABELS, PAYMENT_TERMS_LABELS } from '@/lib/format';

interface SupplierListProps {
  suppliers: Supplier[];
  totalCount: number;
  branches: Branch[];
  currentPage: number;
  pageSize: number;
  search: string;
  selectedStatus: SupplierStatus | 'all';
  selectedType: string;
  selectedBranch: string;
  hasBalanceOnly: boolean;
  currency?: string;
  loading: boolean;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: SupplierStatus | 'all') => void;
  onTypeChange: (type: string) => void;
  onBranchChange: (branchId: string) => void;
  onHasBalanceToggle: (hasBalance: boolean) => void;
  onPageChange: (page: number) => void;
  onAddSupplier: () => void;
  onViewSupplier: (supplier: Supplier) => void;
  onEditSupplier: (supplier: Supplier) => void;
  onRecordPayment: (supplier: Supplier) => void;
  onCreatePurchaseOrder: (supplier: Supplier) => void;
  onDeleteSupplier: (supplier: Supplier) => void;
  onExportCSV: () => void;
}

export function SupplierList({
  suppliers,
  totalCount,
  branches,
  currentPage,
  pageSize,
  search,
  selectedStatus,
  selectedType,
  selectedBranch,
  hasBalanceOnly,
  currency = 'BIF',
  loading,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  onBranchChange,
  onHasBalanceToggle,
  onPageChange,
  onAddSupplier,
  onViewSupplier,
  onEditSupplier,
  onRecordPayment,
  onCreatePurchaseOrder,
  onDeleteSupplier,
  onExportCSV,
}: SupplierListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by vendor, contact, phone, city..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-xs text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-900 dark:text-white"
            />
          </div>

          {/* Supplier Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-700 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300"
          >
            <option value="all">All Vendor Types</option>
            {Object.entries(SUPPLIER_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as SupplierStatus | 'all')}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-700 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>

          {/* Branch Filter */}
          {branches.length > 0 && (
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

          {/* Due Balance Checkbox */}
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-navy-800/80 px-2.5 py-2 rounded-lg border border-gray-200 dark:border-navy-700">
            <input
              type="checkbox"
              checked={hasBalanceOnly}
              onChange={(e) => onHasBalanceToggle(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
            />
            <span>With Due Balance</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300 dark:hover:bg-navy-800"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            type="button"
            onClick={onAddSupplier}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" /> Add Supplier
          </button>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-navy-800 dark:bg-navy-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-500 dark:border-navy-800 dark:bg-navy-950/60 dark:text-gray-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Supplier Name & Contact</th>
                <th className="px-4 py-3.5">Category & Terms</th>
                <th className="px-4 py-3.5">Phone & Email</th>
                <th className="px-4 py-3.5">Location</th>
                <th className="px-4 py-3.5 text-right">Total Purchased</th>
                <th className="px-4 py-3.5 text-right">Due Balance</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-navy-800 text-gray-900 dark:text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    Loading suppliers...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <Building2 className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      No suppliers found
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {search ? 'Try clearing your search query or filters' : 'Add your first supplier to start managing orders and payables.'}
                    </p>
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-navy-800/50 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-navy-800 dark:text-gray-300 font-bold">
                          {supplier.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => onViewSupplier(supplier)}
                            className="font-bold text-gray-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400 text-left"
                          >
                            {supplier.name}
                          </button>
                          <p className="text-2xs text-gray-500 dark:text-gray-400">
                            {supplier.contact_person || 'No contact person'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="text-2xs font-medium text-gray-700 dark:text-gray-300">
                        {SUPPLIER_TYPE_LABELS[supplier.supplier_type] || supplier.supplier_type}
                      </div>
                      <div className="text-2xs text-gray-500 dark:text-gray-400">
                        {PAYMENT_TERMS_LABELS[supplier.payment_terms] || supplier.payment_terms}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="text-2xs text-gray-800 dark:text-gray-200">
                        {supplier.phone || '—'}
                      </div>
                      <div className="text-2xs text-gray-500 dark:text-gray-400">
                        {supplier.email || '—'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-2xs text-gray-600 dark:text-gray-400">
                      {supplier.city || 'Tanzania'}
                    </td>

                    <td className="px-4 py-3.5 text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(supplier.total_purchases_amount || 0, currency)}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <span
                        className={`font-bold ${
                          supplier.current_balance > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {formatCurrency(supplier.current_balance || 0, currency)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-2xs font-semibold ${
                          supplier.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-navy-800 dark:text-gray-400'
                        }`}
                      >
                        {supplier.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === supplier.id ? null : supplier.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-navy-800 dark:hover:text-gray-300"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {openMenuId === supplier.id && (
                          <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg dark:border-navy-800 dark:bg-navy-900 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onViewSupplier(supplier);
                              }}
                              className="flex w-full items-center gap-2 px-3.5 py-1.5 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-navy-800"
                            >
                              <Eye className="h-3.5 w-3.5 text-gray-400" /> View Profile & History
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onCreatePurchaseOrder(supplier);
                              }}
                              className="flex w-full items-center gap-2 px-3.5 py-1.5 text-brand-600 hover:bg-gray-50 dark:text-brand-400 dark:hover:bg-navy-800"
                            >
                              <Plus className="h-3.5 w-3.5" /> New Purchase Order
                            </button>
                            {supplier.current_balance > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onRecordPayment(supplier);
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-1.5 text-emerald-600 hover:bg-gray-50 dark:text-emerald-400 dark:hover:bg-navy-800"
                              >
                                <DollarSign className="h-3.5 w-3.5" /> Record Payment
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onEditSupplier(supplier);
                              }}
                              className="flex w-full items-center gap-2 px-3.5 py-1.5 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-navy-800"
                            >
                              <Edit className="h-3.5 w-3.5 text-gray-400" /> Edit Details
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onDeleteSupplier(supplier);
                              }}
                              className="flex w-full items-center gap-2 px-3.5 py-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete / Archive
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-navy-800 text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} suppliers
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
