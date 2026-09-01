import { useState } from 'react';
import type { PurchaseReportData } from '@/services/reportService';
import { formatCurrency, formatNumber } from '@/lib/format';
import {
  Truck,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Search,
} from 'lucide-react';

interface PurchaseReportTabProps {
  data: PurchaseReportData;
  currency?: string;
  loading?: boolean;
}

export function PurchaseReportTab({
  data,
  currency = 'BIF',
  loading,
}: PurchaseReportTabProps) {
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

  const filteredOrders = data.purchaseOrders.filter(
    (po) =>
      po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Purchases */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
              Total Purchases
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-navy-900 dark:text-white">
              {formatCurrency(data.summary.totalPurchasesAmount, currency)}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-navy-400">
              {data.summary.totalOrders} total purchase orders
            </p>
          </div>
        </div>

        {/* Paid to Suppliers */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
              Paid to Suppliers
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(data.summary.totalPaidAmount, currency)}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-navy-400">
              Settled procurement invoices
            </p>
          </div>
        </div>

        {/* Outstanding Payables */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
              Accounts Payable (Due)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {formatCurrency(data.summary.totalDueAmount, currency)}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-navy-400">
              Supplier credit balances due
            </p>
          </div>
        </div>

        {/* Receiving Status */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400">
              Deliveries Fulfilled
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div>
              <div className="text-xl font-bold text-teal-600 dark:text-teal-400">
                {data.summary.receivedOrdersCount}
              </div>
              <p className="text-[11px] text-gray-500">Received</p>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-navy-800" />
            <div>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {data.summary.pendingDeliveriesCount}
              </div>
              <p className="text-[11px] text-gray-500">Pending / In Transit</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Supplier Procurement Breakdown */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              Procurement Volume by Supplier
            </h3>
            <p className="text-xs text-gray-500 dark:text-navy-400">
              Purchasing allocation, settlements, and outstanding payables.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 dark:border-navy-800 dark:text-navy-400">
                <th className="pb-2.5 font-semibold">Supplier Name</th>
                <th className="pb-2.5 font-semibold">Contact Person</th>
                <th className="pb-2.5 text-center font-semibold">Orders Count</th>
                <th className="pb-2.5 text-right font-semibold">Total Orders Value</th>
                <th className="pb-2.5 text-right font-semibold">Paid Amount</th>
                <th className="pb-2.5 text-right font-semibold">Outstanding Due</th>
                <th className="pb-2.5 text-right font-semibold">Procurement Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
              {data.bySupplier.map((s) => (
                <tr key={s.supplierId} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/50">
                  <td className="py-3 font-semibold text-navy-900 dark:text-white">
                    {s.supplierName}
                  </td>
                  <td className="py-3 text-gray-500">
                    {s.contactPerson || '—'}
                  </td>
                  <td className="py-3 text-center text-gray-600 dark:text-navy-300">
                    {formatNumber(s.ordersCount)}
                  </td>
                  <td className="py-3 text-right font-bold text-navy-900 dark:text-white">
                    {formatCurrency(s.totalAmount, currency)}
                  </td>
                  <td className="py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                    {formatCurrency(s.paidAmount, currency)}
                  </td>
                  <td className="py-3 text-right text-rose-600 dark:text-rose-400 font-bold">
                    {formatCurrency(s.dueAmount, currency)}
                  </td>
                  <td className="py-3 text-right text-brand-600 dark:text-brand-400 font-semibold">
                    {s.sharePercentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Detailed Purchase Orders Table */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              Purchase Orders Audit Register
            </h3>
            <p className="text-xs text-gray-500 dark:text-navy-400">
              Complete historical log of purchase orders.
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search PO number, supplier..."
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
                <th className="pb-2.5 font-semibold">PO Number</th>
                <th className="pb-2.5 font-semibold">Order Date</th>
                <th className="pb-2.5 font-semibold">Supplier</th>
                <th className="pb-2.5 font-semibold">Branch</th>
                <th className="pb-2.5 text-center font-semibold">Status</th>
                <th className="pb-2.5 text-center font-semibold">Payment Status</th>
                <th className="pb-2.5 text-right font-semibold">Grand Total</th>
                <th className="pb-2.5 text-right font-semibold">Paid</th>
                <th className="pb-2.5 text-right font-semibold">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
              {filteredOrders.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/50">
                  <td className="py-3 font-mono font-semibold text-brand-600 dark:text-brand-400">
                    {po.po_number}
                  </td>
                  <td className="py-3 text-gray-500">
                    {po.order_date}
                  </td>
                  <td className="py-3 font-medium text-navy-900 dark:text-white">
                    {po.supplier?.name || 'Direct Supplier'}
                  </td>
                  <td className="py-3 text-gray-500">
                    {po.branch?.name || 'Main Branch'}
                  </td>
                  <td className="py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                        po.status === 'received'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : po.status === 'ordered'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                        po.payment_status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : po.payment_status === 'partial'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}
                    >
                      {po.payment_status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold text-navy-900 dark:text-white">
                    {formatCurrency(po.grand_total, currency)}
                  </td>
                  <td className="py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                    {formatCurrency(po.paid_amount, currency)}
                  </td>
                  <td className="py-3 text-right text-rose-600 dark:text-rose-400 font-bold">
                    {formatCurrency(po.due_amount, currency)}
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
