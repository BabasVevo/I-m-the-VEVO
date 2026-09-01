import { useState } from 'react';
import {
  X,
  Printer,
  PackageCheck,
  DollarSign,
  RotateCcw,
  Ban,
  Truck,
} from 'lucide-react';
import type { PurchaseOrder } from '@/types/database';
import { ApprovalHistoryTimeline } from '@/components/approvals/ApprovalHistoryTimeline';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  PO_STATUS_CONFIG,
  PO_PAYMENT_STATUS_CONFIG,
  PAYMENT_TERMS_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/lib/format';

interface PurchaseOrderDetailModalProps {
  isOpen: boolean;
  purchaseOrder: PurchaseOrder | null;
  currency?: string;
  onClose: () => void;
  onReceiveStock: (po: PurchaseOrder) => void;
  onRecordPayment: (po: PurchaseOrder) => void;
  onReturnGoods: (po: PurchaseOrder) => void;
  onCancelPO: (po: PurchaseOrder) => void;
}

export function PurchaseOrderDetailModal({
  isOpen,
  purchaseOrder,
  currency = 'BIF',
  onClose,
  onReceiveStock,
  onRecordPayment,
  onReturnGoods,
  onCancelPO,
}: PurchaseOrderDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'items' | 'payments' | 'returns' | 'history'>('items');

  if (!isOpen || !purchaseOrder) return null;

  const poStatus = PO_STATUS_CONFIG[purchaseOrder.status] || PO_STATUS_CONFIG.draft;
  const payStatus = PO_PAYMENT_STATUS_CONFIG[purchaseOrder.payment_status] || PO_PAYMENT_STATUS_CONFIG.unpaid;

  const canReceive =
    purchaseOrder.status !== 'cancelled' &&
    purchaseOrder.status !== 'received' &&
    (purchaseOrder.items?.some((i) => (i.quantity_received || 0) < i.quantity_ordered) ?? true);

  const canPay = purchaseOrder.due_amount > 0 && purchaseOrder.status !== 'cancelled';
  const canReturn = (purchaseOrder.items?.some((i) => (i.quantity_received || 0) > 0) ?? false) && purchaseOrder.status !== 'cancelled';
  const canCancel = purchaseOrder.status === 'draft' || (purchaseOrder.status === 'ordered' && (purchaseOrder.paid_amount === 0));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs">
      <div
        id="po-detail-modal"
        className="relative w-full max-w-4xl rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all dark:border-navy-800 dark:bg-navy-900 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Purchase Order {purchaseOrder.po_number}
                </h2>
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-semibold ${poStatus.bg} ${poStatus.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${poStatus.dot}`} />
                  {poStatus.label}
                </span>
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-2xs font-semibold ${payStatus.bg} ${payStatus.text}`}>
                  {payStatus.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Ordered on {formatDate(purchaseOrder.order_date)} · Expected: {formatDate(purchaseOrder.expected_delivery_date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-300 dark:hover:bg-navy-700"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-navy-800 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50/70 px-6 py-2.5 dark:border-navy-800 dark:bg-navy-950/60">
          {canReceive && (
            <button
              type="button"
              onClick={() => onReceiveStock(purchaseOrder)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              <PackageCheck className="h-3.5 w-3.5" /> Receive Stock
            </button>
          )}

          {canPay && (
            <button
              type="button"
              onClick={() => onRecordPayment(purchaseOrder)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
            >
              <DollarSign className="h-3.5 w-3.5" /> Record Payment
            </button>
          )}

          {canReturn && (
            <button
              type="button"
              onClick={() => onReturnGoods(purchaseOrder)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Return / Debit Note
            </button>
          )}

          {canCancel && (
            <button
              type="button"
              onClick={() => onCancelPO(purchaseOrder)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
            >
              <Ban className="h-3.5 w-3.5" /> Cancel Order
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Supplier and Logistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900 text-xs">
              <h3 className="font-bold text-gray-500 uppercase tracking-wider text-2xs mb-2">
                Supplier & Vendor Information
              </h3>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {purchaseOrder.supplier?.name}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                Contact: {purchaseOrder.supplier?.contact_person || '—'}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Phone: {purchaseOrder.supplier?.phone || '—'} · Email: {purchaseOrder.supplier?.email || '—'}
              </p>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Payment Terms: {PAYMENT_TERMS_LABELS[purchaseOrder.payment_terms] || purchaseOrder.payment_terms}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900 text-xs">
              <h3 className="font-bold text-gray-500 uppercase tracking-wider text-2xs mb-2">
                Logistics & Receiving Destination
              </h3>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {purchaseOrder.branch?.name || 'Downtown Flagship'}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                Address: {purchaseOrder.branch?.address || 'Boulevard du 1er Novembre, Rohero, Bujumbura, Burundi'}
              </p>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Order Date: {formatDate(purchaseOrder.order_date)}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                Expected By: {formatDate(purchaseOrder.expected_delivery_date)}
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex border-b border-gray-200 dark:border-navy-800 gap-6 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('items')}
              className={`pb-2.5 transition-colors border-b-2 ${
                activeTab === 'items'
                  ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Ordered Items & Delivery Status ({purchaseOrder.items?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`pb-2.5 transition-colors border-b-2 ${
                activeTab === 'payments'
                  ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Payment Records ({purchaseOrder.payments?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('returns')}
              className={`pb-2.5 transition-colors border-b-2 ${
                activeTab === 'returns'
                  ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Returns & Debit Notes ({purchaseOrder.returns?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 transition-colors border-b-2 ${
                activeTab === 'history'
                  ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Approval Audit Trail
            </button>
          </div>

          {/* Items Tab */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-navy-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 dark:bg-navy-950 dark:text-gray-400 border-b border-gray-200 dark:border-navy-800 font-semibold">
                    <tr>
                      <th className="px-3 py-2.5">Product & SKU</th>
                      <th className="px-3 py-2.5 text-center">Unit</th>
                      <th className="px-3 py-2.5 text-center">Ordered</th>
                      <th className="px-3 py-2.5 text-center">Received</th>
                      <th className="px-3 py-2.5 text-right">Unit Cost</th>
                      <th className="px-3 py-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-navy-800 bg-white dark:bg-navy-900">
                    {purchaseOrder.items?.map((item) => {
                      const isComplete = (item.quantity_received || 0) >= item.quantity_ordered;
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/50">
                          <td className="p-3 font-semibold text-gray-900 dark:text-white">
                            {item.product_name}
                            {item.sku && (
                              <span className="text-2xs font-normal text-gray-500 block">
                                SKU: {item.sku}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center text-gray-600 dark:text-gray-300">
                            {item.unit}
                          </td>
                          <td className="p-3 text-center font-bold text-gray-900 dark:text-white">
                            {item.quantity_ordered}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 font-semibold ${
                                isComplete
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {item.quantity_received} / {item.quantity_ordered}
                            </span>
                          </td>
                          <td className="p-3 text-right text-gray-700 dark:text-gray-300">
                            {formatCurrency(item.unit_cost, currency)}
                          </td>
                          <td className="p-3 text-right font-bold text-gray-900 dark:text-white">
                            {formatCurrency(item.line_total, currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2">
                <div className="flex-1 text-xs text-gray-600 dark:text-gray-400">
                  {purchaseOrder.notes && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 dark:border-navy-800 dark:bg-navy-950/40">
                      <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        Order Notes:
                      </span>
                      <p className="whitespace-pre-wrap">{purchaseOrder.notes}</p>
                    </div>
                  )}
                </div>

                <div className="w-full sm:w-80 rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-navy-800 dark:bg-navy-950/60 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(purchaseOrder.subtotal, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>VAT / Tax (18%):</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(purchaseOrder.tax_amount, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-sm text-gray-900 dark:border-navy-800 dark:text-white">
                    <span>Grand Total:</span>
                    <span className="text-base text-brand-600 dark:text-brand-400">
                      {formatCurrency(purchaseOrder.grand_total, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 pt-1">
                    <span>Amount Paid:</span>
                    <span className="font-bold">
                      {formatCurrency(purchaseOrder.paid_amount, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold border-t border-gray-200 pt-1 dark:border-navy-800">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(purchaseOrder.due_amount, currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-3">
              {(!purchaseOrder.payments || purchaseOrder.payments.length === 0) ? (
                <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 rounded-xl dark:border-navy-800">
                  No payment transactions recorded on this PO yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-navy-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 dark:bg-navy-950 dark:text-gray-400 border-b border-gray-200 dark:border-navy-800">
                      <tr>
                        <th className="px-3 py-2.5">Date & Time</th>
                        <th className="px-3 py-2.5">Method</th>
                        <th className="px-3 py-2.5">Reference #</th>
                        <th className="px-3 py-2.5 text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-navy-800 bg-white dark:bg-navy-900">
                      {purchaseOrder.payments.map((pay) => (
                        <tr key={pay.id}>
                          <td className="p-3 text-gray-900 dark:text-white">
                            {formatDateTime(pay.payment_date)}
                          </td>
                          <td className="p-3 font-medium text-gray-700 dark:text-gray-300">
                            {PAYMENT_METHOD_LABELS[pay.payment_method] || pay.payment_method}
                          </td>
                          <td className="p-3 text-gray-500 dark:text-gray-400">
                            {pay.reference_number || '—'}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(pay.amount, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Returns Tab */}
          {activeTab === 'returns' && (
            <div className="space-y-3">
              {(!purchaseOrder.returns || purchaseOrder.returns.length === 0) ? (
                <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 rounded-xl dark:border-navy-800">
                  No return vouchers or debit notes issued for this purchase order.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-navy-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 dark:bg-navy-950 dark:text-gray-400 border-b border-gray-200 dark:border-navy-800">
                      <tr>
                        <th className="px-3 py-2.5">Return #</th>
                        <th className="px-3 py-2.5">Date</th>
                        <th className="px-3 py-2.5">Reason</th>
                        <th className="px-3 py-2.5 text-right">Debit Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-navy-800 bg-white dark:bg-navy-900">
                      {purchaseOrder.returns.map((ret) => (
                        <tr key={ret.id}>
                          <td className="p-3 font-bold text-amber-600 dark:text-amber-400">
                            {ret.return_number}
                          </td>
                          <td className="p-3 text-gray-900 dark:text-white">
                            {formatDateTime(ret.created_at)}
                          </td>
                          <td className="p-3 text-gray-700 dark:text-gray-300">
                            {ret.reason}
                          </td>
                          <td className="p-3 text-right font-bold text-rose-600 dark:text-rose-400">
                            {formatCurrency(ret.total_refund_amount, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs dark:border-navy-800 dark:bg-navy-900 space-y-3">
              <h4 className="text-xs font-bold text-navy-900 dark:text-white">
                Purchase Order Lifecycle & Approvals Timeline
              </h4>
              <ApprovalHistoryTimeline
                entityType="purchase_order"
                entityId={purchaseOrder.id}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
