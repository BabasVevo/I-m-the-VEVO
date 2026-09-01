import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import type { PurchaseOrder, PaymentMethod } from '@/types/database';
import { formatCurrency } from '@/lib/format';

interface RecordPoPaymentModalProps {
  isOpen: boolean;
  purchaseOrder: PurchaseOrder | null;
  currency?: string;
  onClose: () => void;
  onSubmit: (data: {
    purchase_id: string;
    amount: number;
    payment_method: PaymentMethod;
    reference_number?: string;
    notes?: string;
  }) => Promise<void>;
}

export function RecordPoPaymentModal({
  isOpen,
  purchaseOrder,
  currency = 'BIF',
  onClose,
  onSubmit,
}: RecordPoPaymentModalProps) {
  const [amount, setAmount] = useState<number | string>(purchaseOrder?.due_amount || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !purchaseOrder) return null;

  const dueAmount = purchaseOrder.due_amount || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payNum = Number(amount);
    if (!payNum || payNum <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        purchase_id: purchaseOrder.id,
        amount: payNum,
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record PO payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs">
      <div
        id="record-po-payment-modal"
        className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl transition-all dark:border-navy-800 dark:bg-navy-900"
      >
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Record PO Payment</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PO #{purchaseOrder.po_number} · {purchaseOrder.supplier?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-navy-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 dark:border-navy-800 dark:bg-navy-950/60 space-y-1 text-xs">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Grand Total:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(purchaseOrder.grand_total, currency)}
              </span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Already Paid:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(purchaseOrder.paid_amount, currency)}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold text-gray-900 dark:border-navy-800 dark:text-white">
              <span>Current Due Balance:</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                {formatCurrency(dueAmount, currency)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Payment Amount ({currency}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="1"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 font-semibold focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setAmount(dueAmount)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-gray-100 px-2 py-0.5 text-2xs font-semibold text-gray-600 hover:bg-gray-200 dark:bg-navy-800 dark:text-gray-300"
              >
                Pay Full Due
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              <option value="bank_transfer">Bank Transfer (BCB / SOGEB / CRDB)</option>
              <option value="mobile_money">Mobile Money (M-Pesa / TigoPesa / Airtel)</option>
              <option value="cash">Cash Outflow</option>
              <option value="card">Corporate Debit / Credit Card</option>
              <option value="other">Cheque / Direct Draft</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Transaction / Reference Number
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. BCB-TRX-882199 or Cheque #1029"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Payment Remarks & Allocation Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 50% advance settlement on delivery."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-navy-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
