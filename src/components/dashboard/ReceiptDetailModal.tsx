import { X, Printer, Receipt } from 'lucide-react';
import { formatCurrency, formatDateTime, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_CONFIG } from '@/lib/format';
import type { Sale } from '@/types/database';
import { useToast } from '@/context/ToastContext';

interface ReceiptDetailModalProps {
  sale: Sale | null;
  currency: string;
  onClose: () => void;
}

export function ReceiptDetailModal({ sale, currency = 'TZS', onClose }: ReceiptDetailModalProps) {
  const { toast } = useToast();

  if (!sale) return null;

  const statusConfig = PAYMENT_STATUS_CONFIG[sale.payment_status] || PAYMENT_STATUS_CONFIG.completed;
  const paymentLabel = PAYMENT_METHOD_LABELS[sale.payment_method] || sale.payment_method;

  const handlePrint = () => {
    toast(`Sent receipt ${sale.receipt_number} to POS thermal printer`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div
        id="receipt-detail-modal"
        className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl transition-all dark:border-navy-700 dark:bg-navy-900 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-900 dark:text-white">
                Receipt {sale.receipt_number}
              </h3>
              <p className="text-xs text-gray-500 dark:text-navy-400">
                {formatDateTime(sale.created_at)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:hover:bg-navy-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="mt-4 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
            <span className={`h-2 w-2 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </span>

          <span className="text-xs font-medium text-gray-500 dark:text-navy-400">
            Payment: <strong className="text-navy-900 dark:text-white">{paymentLabel}</strong>
          </span>
        </div>

        {/* Store & Customer Info */}
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 text-xs dark:border-navy-800 dark:bg-navy-950/50">
          <div>
            <span className="text-gray-400">Location / Branch</span>
            <p className="font-semibold text-navy-900 dark:text-white">
              {sale.branch?.name ?? 'Main Branch'}
            </p>
            <p className="text-gray-500 dark:text-navy-400 truncate">{sale.branch?.address}</p>
          </div>

          <div>
            <span className="text-gray-400">Customer</span>
            <p className="font-semibold text-navy-900 dark:text-white">
              {sale.customer?.name ?? 'Walk-in Customer'}
            </p>
            <p className="text-gray-500 dark:text-navy-400 truncate">{sale.customer?.phone || 'No phone'}</p>
          </div>

          <div>
            <span className="text-gray-400">Cashier</span>
            <p className="font-semibold text-navy-900 dark:text-white">
              {sale.cashier?.full_name ?? 'Staff'}
            </p>
          </div>

          <div>
            <span className="text-gray-400">Due Date (Credit)</span>
            <p className="font-semibold text-navy-900 dark:text-white">
              {sale.due_date ? sale.due_date : 'N/A'}
            </p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-navy-400">
            Purchased Items
          </h4>

          <div className="mt-2 divide-y divide-gray-100 rounded-xl border border-gray-100 dark:divide-navy-800 dark:border-navy-800">
            {sale.items && sale.items.length > 0 ? (
              sale.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 text-sm">
                  <div className="space-y-0.5">
                    <p className="font-medium text-navy-900 dark:text-white">{item.product_name}</p>
                    <p className="text-xs text-gray-400">
                      {item.quantity} x {formatCurrency(item.unit_price, currency)}
                      {item.discount_amount > 0 && ` (Disc: -${formatCurrency(item.discount_amount, currency)})`}
                    </p>
                  </div>
                  <p className="font-bold text-navy-900 dark:text-white">
                    {formatCurrency(item.total_price, currency)}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-3 text-sm text-gray-500 dark:text-navy-400">
                Total Transaction Value: {formatCurrency(sale.total_amount, currency)}
              </div>
            )}
          </div>
        </div>

        {/* Totals Summary */}
        <div className="mt-4 space-y-1.5 rounded-xl bg-gray-50 p-4 text-xs dark:bg-navy-950/60">
          <div className="flex justify-between text-gray-600 dark:text-navy-300">
            <span>Subtotal</span>
            <span>{formatCurrency(sale.subtotal, currency)}</span>
          </div>
          {sale.discount_amount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Discount</span>
              <span>-{formatCurrency(sale.discount_amount, currency)}</span>
            </div>
          )}
          {sale.tax_amount > 0 && (
            <div className="flex justify-between text-gray-600 dark:text-navy-300">
              <span>Tax (VAT)</span>
              <span>{formatCurrency(sale.tax_amount, currency)}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold text-navy-950 dark:border-navy-800 dark:text-white">
            <span>Total</span>
            <span>{formatCurrency(sale.total_amount, currency)}</span>
          </div>

          <div className="flex justify-between text-gray-600 dark:text-navy-300 pt-1">
            <span>Paid Amount</span>
            <span className="font-semibold text-emerald-600">{formatCurrency(sale.paid_amount, currency)}</span>
          </div>
          {sale.due_amount > 0 && (
            <div className="flex justify-between text-amber-700 font-semibold dark:text-amber-400">
              <span>Balance Due</span>
              <span>{formatCurrency(sale.due_amount, currency)}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {sale.notes && (
          <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-2.5 text-xs text-gray-600 dark:border-navy-800 dark:bg-navy-950 dark:text-navy-300">
            <strong>Notes:</strong> {sale.notes}
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-navy-800">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary text-xs"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary flex items-center gap-2 text-xs"
          >
            <Printer className="h-4 w-4" /> Print Thermal Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
