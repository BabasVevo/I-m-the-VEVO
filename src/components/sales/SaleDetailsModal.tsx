import { useState } from 'react';
import {
  X,
  Printer,
  RotateCcw,
  Ban,
  User,
  Building2,
  Receipt,
  Banknote,
  AlertCircle,
  Copy,
} from 'lucide-react';
import type { Sale } from '@/types/database';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { useToast } from '@/context/ToastContext';

interface SaleDetailsModalProps {
  isOpen: boolean;
  sale: Sale | null;
  currency?: string;
  onClose: () => void;
  onPrint: (sale: Sale) => void;
  onOpenReturn: (sale: Sale) => void;
  onCancelSale: (sale: Sale) => void;
}

export function SaleDetailsModal({
  isOpen,
  sale,
  currency = 'TZS',
  onClose,
  onPrint,
  onOpenReturn,
  onCancelSale,
}: SaleDetailsModalProps) {
  const { addToast } = useToast();
  const [showVoidConfirm, setShowVoidConfirm] = useState<boolean>(false);

  if (!isOpen || !sale) return null;

  const isCompleted = sale.payment_status === 'completed';
  const isPartiallyRefunded = sale.payment_status === 'partially_refunded';
  const isRefunded = sale.payment_status === 'refunded';
  const isCancelled = sale.payment_status === 'cancelled';

  const canReturn = (isCompleted || isPartiallyRefunded) && !isCancelled;
  const canVoid = isCompleted && (!sale.returns || sale.returns.length === 0);

  const handleCopyReceiptNumber = () => {
    navigator.clipboard.writeText(sale.receipt_number);
    addToast({
      type: 'success',
      title: 'Copied',
      message: `Receipt number ${sale.receipt_number} copied.`,
    });
  };

  const handleConfirmVoid = () => {
    onCancelSale(sale);
    setShowVoidConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-xs">
      <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all dark:bg-navy-900">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-navy-900 dark:text-white">
                  Sale #{sale.receipt_number}
                </h3>
                <button
                  type="button"
                  onClick={handleCopyReceiptNumber}
                  title="Copy Receipt #"
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-navy-800"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Recorded on {formatDateTime(sale.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-xl px-3 py-1 text-xs font-bold ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : isPartiallyRefunded
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  : isRefunded
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
              }`}
            >
              {sale.payment_status.replace('_', ' ').toUpperCase()}
            </span>

            <button
              type="button"
              id="btn-close-sale-details"
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-navy-800 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-navy-800/50">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="btn-details-print-receipt"
                onClick={() => onPrint(sale)}
                className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-navy-900 shadow-xs hover:bg-gray-100 dark:bg-navy-800 dark:text-white dark:hover:bg-navy-700"
              >
                <Printer className="h-3.5 w-3.5 text-brand-600" />
                <span>Print / Export Receipt</span>
              </button>

              {canReturn && (
                <button
                  type="button"
                  id="btn-details-return-refund"
                  onClick={() => onOpenReturn(sale)}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-600 active:scale-95"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Process Return & Refund</span>
                </button>
              )}
            </div>

            {canVoid && !showVoidConfirm && (
              <button
                type="button"
                id="btn-details-void-sale"
                onClick={() => setShowVoidConfirm(true)}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>Void / Cancel Sale</span>
              </button>
            )}
          </div>

          {/* Void Confirmation Drawer */}
          {showVoidConfirm && (
            <div className="rounded-2xl border border-rose-300 bg-rose-50/50 p-4 text-xs dark:border-rose-900 dark:bg-rose-950/20">
              <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300">
                <AlertCircle className="h-4 w-4" />
                <span>Confirm Sale Cancellation & Restock</span>
              </div>
              <p className="mt-1 text-rose-700 dark:text-rose-400">
                Cancelling this transaction will return all items back into the branch inventory and
                revert any customer balance due.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmVoid}
                  className="rounded-xl bg-rose-600 px-4 py-1.5 font-bold text-white shadow-sm hover:bg-rose-700"
                >
                  Yes, Void Transaction
                </button>
                <button
                  type="button"
                  onClick={() => setShowVoidConfirm(false)}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Customer Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-navy-800 dark:bg-navy-900">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                <User className="h-4 w-4 text-brand-600" />
                <span>Customer</span>
              </div>
              {sale.customer ? (
                <div className="mt-2 text-xs">
                  <p className="font-bold text-navy-900 dark:text-white">{sale.customer.name}</p>
                  {sale.customer.phone && (
                    <p className="text-gray-600 dark:text-gray-300">{sale.customer.phone}</p>
                  )}
                  {sale.customer.email && (
                    <p className="text-gray-500 dark:text-gray-400">{sale.customer.email}</p>
                  )}
                  {sale.customer.address && (
                    <p className="text-gray-500 dark:text-gray-400">{sale.customer.address}</p>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Walk-in Customer
                </p>
              )}
            </div>

            {/* Branch & Register Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-navy-800 dark:bg-navy-900">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                <Building2 className="h-4 w-4 text-brand-600" />
                <span>Branch & Staff</span>
              </div>
              <div className="mt-2 text-xs space-y-1">
                <p className="font-bold text-navy-900 dark:text-white">
                  {sale.branch?.name || 'Main Flagship Branch'}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Cashier: <span className="font-semibold">{sale.cashier?.full_name || 'Staff'}</span>
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  Method:{' '}
                  <span className="font-semibold uppercase">{sale.payment_method.replace('_', ' ')}</span>
                </p>
              </div>
            </div>

            {/* Financial Overview Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-navy-800 dark:bg-navy-900">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                <Banknote className="h-4 w-4 text-emerald-600" />
                <span>Financial Totals</span>
              </div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Gross Total:</span>
                  <span className="font-mono font-bold text-navy-900 dark:text-white">
                    {formatCurrency(sale.total_amount, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid:</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(sale.paid_amount, currency)}
                  </span>
                </div>
                {(sale.refunded_amount || 0) > 0 && (
                  <div className="flex justify-between font-semibold text-purple-600 dark:text-purple-400">
                    <span>Refunded:</span>
                    <span className="font-mono">
                      -{formatCurrency(sale.refunded_amount || 0, currency)}
                    </span>
                  </div>
                )}
                {sale.due_amount > 0 && (
                  <div className="flex justify-between font-bold text-amber-600 dark:text-amber-400">
                    <span>Balance Due:</span>
                    <span className="font-mono">{formatCurrency(sale.due_amount, currency)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-navy-800 dark:bg-navy-900">
            <div className="border-b border-gray-100 bg-gray-50 px-5 py-3 dark:border-navy-800 dark:bg-navy-800/60">
              <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider dark:text-white">
                Itemized Sales Breakdown
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-[11px] font-semibold text-gray-500 dark:border-navy-800 dark:text-gray-400">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-center">Qty Purchased</th>
                    <th className="py-3 px-4 text-center">Returned</th>
                    <th className="py-3 px-4 text-right">Discount</th>
                    <th className="py-3 px-4 text-right">Tax (18%)</th>
                    <th className="py-3 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
                  {sale.items?.map((it) => (
                    <tr key={it.id} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/30">
                      <td className="py-3 px-4 font-semibold text-navy-900 dark:text-white">
                        {it.product_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-500 dark:text-gray-400">
                        {it.sku || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-700 dark:text-gray-300">
                        {formatCurrency(it.unit_price, currency)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-navy-900 dark:text-white">
                        {it.quantity}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {it.returned_quantity && it.returned_quantity > 0 ? (
                          <span className="inline-flex items-center rounded-lg bg-amber-50 px-2 py-0.5 font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                            {it.returned_quantity}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                        {it.discount_amount > 0 ? `-${formatCurrency(it.discount_amount, currency)}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-500 dark:text-gray-400">
                        {formatCurrency(it.tax_amount, currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-navy-900 dark:text-white">
                        {formatCurrency(it.total_price, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Subtotal & Financial Breakdown */}
            <div className="flex justify-end border-t border-gray-100 bg-gray-50/50 p-4 dark:border-navy-800 dark:bg-navy-800/30">
              <div className="w-72 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(sale.subtotal, currency)}</span>
                </div>
                {sale.discount_amount > 0 && (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400">
                    <span>Discount:</span>
                    <span className="font-mono">-{formatCurrency(sale.discount_amount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax / VAT (18%):</span>
                  <span className="font-mono">{formatCurrency(sale.tax_amount, currency)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-bold text-navy-900 dark:border-navy-700 dark:text-white">
                  <span>Grand Total:</span>
                  <span className="font-mono text-base text-brand-600 dark:text-brand-400">
                    {formatCurrency(sale.total_amount, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Paid ({sale.payment_method.toUpperCase()}):</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(sale.paid_amount, currency)}
                  </span>
                </div>
                {(sale.refunded_amount || 0) > 0 && (
                  <div className="flex justify-between font-bold text-purple-600 dark:text-purple-400">
                    <span>Refunded Amount:</span>
                    <span className="font-mono">
                      -{formatCurrency(sale.refunded_amount || 0, currency)}
                    </span>
                  </div>
                )}
                {sale.due_amount > 0 && (
                  <div className="flex justify-between font-bold text-amber-600 dark:text-amber-400">
                    <span>Balance Due:</span>
                    <span className="font-mono">{formatCurrency(sale.due_amount, currency)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Returns & Refunds History Section */}
          {sale.returns && sale.returns.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-300">
                <RotateCcw className="h-4 w-4" />
                <span>Return & Refund Activity Log ({sale.returns.length})</span>
              </div>

              <div className="mt-3 space-y-3">
                {sale.returns.map((ret) => (
                  <div
                    key={ret.id}
                    className="rounded-xl border border-amber-200/80 bg-white p-4 shadow-2xs dark:border-amber-900/60 dark:bg-navy-900"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2 text-xs dark:border-navy-800">
                      <div>
                        <span className="font-bold text-navy-900 dark:text-white">
                          Return #{ret.return_number}
                        </span>
                        <span className="ml-2 text-gray-500">&bull; {formatDateTime(ret.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 font-bold uppercase text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                          {ret.refund_method.replace('_', ' ')}
                        </span>
                        <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                          Refunded: {formatCurrency(ret.refund_amount, currency)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                      <p>
                        <span className="font-semibold">Reason:</span> {ret.reason}
                      </p>
                      {ret.notes && (
                        <p className="mt-0.5 text-gray-500">
                          <span className="font-semibold">Notes:</span> {ret.notes}
                        </p>
                      )}
                    </div>

                    {/* Returned items mini list */}
                    {ret.items && ret.items.length > 0 && (
                      <div className="mt-2 space-y-1 border-t border-gray-100 pt-2 text-[11px] text-gray-500 dark:border-navy-800 dark:text-gray-400">
                        {ret.items.map((rIt) => (
                          <div key={rIt.id} className="flex justify-between">
                            <span>
                              {rIt.quantity}x {rIt.product_name} ({rIt.reason})
                              {rIt.restock ? ' &bull; Restocked' : ' &bull; Damaged/Written-off'}
                            </span>
                            <span className="font-mono font-semibold text-navy-900 dark:text-white">
                              {formatCurrency(rIt.refund_amount, currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes Section if present */}
          {sale.notes && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-navy-800 dark:bg-navy-900">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Transaction Notes
              </p>
              <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">{sale.notes}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-navy-800 dark:bg-navy-900/50">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Internal ID: <span className="font-mono">{sale.id}</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:bg-navy-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
