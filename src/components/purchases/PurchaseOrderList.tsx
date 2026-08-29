import { useState } from 'react';
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  Truck,
  Eye,
  DollarSign,
  PackageCheck,
  RotateCcw,
  Ban,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { PurchaseOrder, PurchaseOrderStatus, PaymentStatus, Supplier, Branch } from '@/types/database';
import {
  formatCurrency,
  formatDate,
  PO_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from '@/lib/format';

interface PurchaseOrderListProps {
  purchases: PurchaseOrder[];
  totalCount: number;
  suppliers: Supplier[];
  branches: Branch[];
  currentPage: number;
  pageSize: number;
  search: string;
  selectedStatus: PurchaseOrderStatus | 'all';
  selectedPaymentStatus: PaymentStatus | 'all';
  selectedSupplier: string;
  selectedBranch: string;
  currency?: string;
  loading: boolean;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: PurchaseOrderStatus | 'all') => void;
  onPaymentStatusChange: (status: PaymentStatus | 'all') => void;
  onSupplierChange: (supplierId: string) => void;
  onBranchChange: (branchId: string) => void;
  onPageChange: (page: number) => void;
  onCreatePO: () => void;
  onViewPO: (po: PurchaseOrder) => void;
  onReceiveStock: (po: PurchaseOrder) => void;
  onRecordPayment: (po: PurchaseOrder) => void;
  onReturnGoods: (po: PurchaseOrder) => void;
  onCancelPO: (po: PurchaseOrder) => void;
  onExportCSV: () => void;
}

export function PurchaseOrderList({
  purchases,
  totalCount,
  suppliers,
  branches,
  currentPage,
  pageSize,
  search,
  selectedStatus,
  selectedPaymentStatus,
  selectedSupplier,
  selectedBranch,
  currency = 'TZS',
  loading,
  onSearchChange,
  onStatusChange,
  onPaymentStatusChange,
  onSupplierChange,
  onBranchChange,
  onPageChange,
  onCreatePO,
  onViewPO,
  onReceiveStock,
  onRecordPayment,
  onReturnGoods,
  onCancelPO,
  onExportCSV,
}: PurchaseOrderListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search PO #, supplier, notes..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-xs text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-900 dark:text-white"
            />
          </div>

          <select
            value={selectedSupplier}
            onChange={(e) => onSupplierChange(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-700 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
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
            onChange={(e) => onStatusChange(e.target.value as PurchaseOrderStatus | 'all')}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-700 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300"
          >
            <option value="all">All Delivery Statuses</option>
            <option value="draft">Draft</option>
            <option value="ordered">Ordered</option>
            <option value="partially_received">Partially Received</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={selectedPaymentStatus}
            onChange={(e) => onPaymentStatusChange(e.target.value as PaymentStatus | 'all')}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-700 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300"
          >
            <option value="all">All Payment Statuses</option>
            <option value="pending">Pending Payment</option>
            <option value="partial">Partially Paid</option>
            <option value="completed">Fully Paid</option>
          </select>
        </div>

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
            onClick={onCreatePO}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" /> Create Purchase Order
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-navy-800 dark:bg-navy-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-500 dark:border-navy-800 dark:bg-navy-950/60 dark:text-gray-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">PO Number</th>
                <th className="px-4 py-3.5">Supplier / Vendor</th>
                <th className="px-4 py-3.5">Order Date</th>
                <th className="px-4 py-3.5">Delivery Status</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5 text-right">Grand Total</th>
                <th className="px-4 py-3.5 text-right">Paid</th>
                <th className="px-4 py-3.5 text-right">Due Balance</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-navy-800 text-gray-900 dark:text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    Loading purchase orders...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <Truck className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      No purchase orders found
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {search ? 'Try adjusting search or filter criteria' : 'Create your first purchase order to restock store inventory.'}
                    </p>
                  </td>
                </tr>
              ) : (
                purchases.map((po) => {
                  const st = PO_STATUS_CONFIG[po.status] || PO_STATUS_CONFIG.draft;
                  const paySt = PAYMENT_STATUS_CONFIG[po.payment_status] || PAYMENT_STATUS_CONFIG.pending;
                  const canReceive = po.status !== 'cancelled' && po.status !== 'received';
                  const canPay = po.due_amount > 0 && po.status !== 'cancelled';

                  return (
                    <tr
                      key={po.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-navy-800/50 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => onViewPO(po)}
                          className="font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                        >
                          {po.po_number}
                        </button>
                        <span className="text-2xs text-gray-500 dark:text-gray-400 block">
                          {po.items?.length || 0} item types
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {po.supplier?.name || 'Unknown Supplier'}
                        </div>
                        <div className="text-2xs text-gray-500 dark:text-gray-400">
                          {po.supplier?.city || 'Tanzania'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-2xs text-gray-700 dark:text-gray-300">
                        {formatDate(po.order_date)}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-semibold ${st.bg} ${st.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-2xs font-semibold ${paySt.bg} ${paySt.text}`}>
                          {paySt.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right font-bold text-gray-900 dark:text-white">
                        {formatCurrency(po.grand_total, currency)}
                      </td>

                      <td className="px-4 py-3.5 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                        {formatCurrency(po.paid_amount, currency)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-bold">
                        <span className={po.due_amount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}>
                          {formatCurrency(po.due_amount, currency)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() => setOpenMenuId(openMenuId === po.id ? null : po.id)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-navy-800 dark:hover:text-gray-300"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {openMenuId === po.id && (
                            <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg dark:border-navy-800 dark:bg-navy-900 text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onViewPO(po);
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-1.5 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-navy-800"
                              >
                                <Eye className="h-3.5 w-3.5 text-gray-400" /> View Order Details
                              </button>

                              {canReceive && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onReceiveStock(po);
                                  }}
                                  className="flex w-full items-center gap-2 px-3.5 py-1.5 text-emerald-600 hover:bg-gray-50 dark:text-emerald-400 dark:hover:bg-navy-800"
                                >
                                  <PackageCheck className="h-3.5 w-3.5" /> Receive Stock
                                </button>
                              )}

                              {canPay && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onRecordPayment(po);
                                  }}
                                  className="flex w-full items-center gap-2 px-3.5 py-1.5 text-brand-600 hover:bg-gray-50 dark:text-brand-400 dark:hover:bg-navy-800"
                                >
                                  <DollarSign className="h-3.5 w-3.5" /> Record Payment
                                </button>
                              )}

                              {po.status !== 'cancelled' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onReturnGoods(po);
                                  }}
                                  className="flex w-full items-center gap-2 px-3.5 py-1.5 text-amber-700 hover:bg-gray-50 dark:text-amber-400 dark:hover:bg-navy-800"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" /> Debit Note / Return
                                </button>
                              )}

                              {po.status !== 'cancelled' && po.paid_amount === 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onCancelPO(po);
                                  }}
                                  className="flex w-full items-center gap-2 px-3.5 py-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                >
                                  <Ban className="h-3.5 w-3.5" /> Cancel PO
                                </button>
                              )}
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
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} orders
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
