import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import type { Supplier, PaymentMethod } from '@/types/database';
import { formatCurrency } from '@/lib/format';

interface RecordSupplierPaymentModalProps {
  isOpen: boolean;
  supplier: Supplier | null;
  currency?: string;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    paymentMethod: PaymentMethod;
    referenceNumber: string;
    notes: string;
  }) => Promise<void>;
}

export function RecordSupplierPaymentModal({
  isOpen,
  supplier,
  currency = 'BIF',
  onClose,
  onSubmit,
}: RecordSupplierPaymentModalProps) {
  const [amount, setAmount] = useState<number | string>(supplier?.current_balance || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !supplier) return null;

  const currentBalance = supplier.current_balance || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payNum = Number(amount);
    if (!payNum || payNum <= 0) {
      setError('Please enter a valid payment amount greater than 0.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        amount: payNum,
        paymentMethod,
        referenceNumber: referenceNumber.trim(),
        notes: notes.trim(),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record supplier payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs">
      <div
        id="supplier-payment-modal"
        className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl transition-all dark:border-navy-800 dark:bg-navy-900"
      >
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Record Supplier Payment</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pay towards outstanding account balance for {supplier.name}
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

          {/* Current Outstanding Balance Card */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/30">
            <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-medium">
              <span>Current Outstanding Payable:</span>
              <span className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {formatCurrency(currentBalance, currency)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Payment Amount (TZS) <span className="text-rose-500">*</span>
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
                onClick={() => setAmount(currentBalance)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-gray-100 px-2 py-0.5 text-2xs font-semibold text-gray-600 hover:bg-gray-200 dark:bg-navy-800 dark:text-gray-300"
              >
                Pay Full
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
              <option value="bank_transfer">Bank Transfer (NMB / CRDB / NBC)</option>
              <option value="mobile_money">Mobile Money (M-Pesa / TigoPesa / Airtel)</option>
              <option value="cash">Cash Outflow</option>
              <option value="card">Corporate Card</option>
              <option value="other">Cheque / Other</option>
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
              placeholder="e.g. NMB-TRX-982341 or M-Pesa Ref"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Payment Voucher Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Account clearance payment for January invoices."
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
