import { useState } from 'react';
import { CreditCard, X, AlertCircle } from 'lucide-react';
import type { Customer, PaymentMethod } from '@/types/database';
import { updateCustomerBalance, logCustomerActivity } from '@/services/customerService';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/context/ToastContext';

interface CustomerCreditPaymentModalProps {
  isOpen: boolean;
  customer: Customer | null;
  businessId: string;
  currency?: string;
  onPaymentRecorded: () => void;
  onClose: () => void;
}

export function CustomerCreditPaymentModal({
  isOpen,
  customer,
  businessId,
  currency = 'BIF',
  onPaymentRecorded,
  onClose,
}: CustomerCreditPaymentModalProps) {
  const { addToast } = useToast();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !customer) return null;

  const currentDebt = customer.current_balance || 0;

  const handlePayFull = () => {
    setAmount(String(currentDebt));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payAmt = parseFloat(amount);
    if (!payAmt || payAmt <= 0) {
      setError('Please enter a valid payment amount greater than zero.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Decrement the customer balance by payment amount
      await updateCustomerBalance(customer.id, -payAmt);

      // Log activity
      await logCustomerActivity(
        customer.id,
        businessId,
        'credit_adjustment',
        `Received credit payment of ${formatCurrency(payAmt, currency)} via ${paymentMethod.toUpperCase()}${reference ? ` (Ref: ${reference})` : ''}`,
        null,
        { payment_method: paymentMethod, amount: payAmt, reference, notes }
      );

      addToast({
        type: 'success',
        title: 'Payment Received',
        message: `Payment of ${formatCurrency(payAmt, currency)} recorded for ${customer.name}.`,
      });

      onPaymentRecorded();
      onClose();
    } catch (err: unknown) {
      console.error('Error recording debt payment:', err);
      setError((err as Error).message || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl transition-all dark:bg-navy-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Receive Credit Payment
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Collect payment for unpaid credit sales
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:hover:bg-navy-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Customer Balance Highlight */}
        <div className="border-b border-gray-100 bg-gray-50/70 p-4 dark:border-navy-800 dark:bg-navy-950/40">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-navy-900 dark:text-white">{customer.name}</div>
              <div className="text-[11px] text-gray-500">{customer.phone || 'No phone'}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-400 uppercase">Outstanding Balance</div>
              <div className="font-bold text-base text-rose-600 dark:text-rose-400">
                {formatCurrency(currentDebt, currency)}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Payment Amount ({currency}) <span className="text-brand-500">*</span>
              </label>
              {currentDebt > 0 && (
                <button
                  type="button"
                  onClick={handlePayFull}
                  className="text-[11px] font-bold text-brand-600 hover:underline dark:text-brand-400"
                >
                  Pay Full Balance
                </button>
              )}
            </div>
            <input
              type="number"
              min="1"
              step="any"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm font-bold text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              <option value="cash">Cash</option>
              <option value="mobile_money">Mobile Money (M-Pesa, Airtel, Tigo)</option>
              <option value="card">Bank / Credit Card</option>
              <option value="bank_transfer">Bank Wire / Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Transaction / Slip Reference (Optional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. MPESA-QK89021"
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid in full for invoice #REC-20260822..."
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4 dark:border-navy-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Confirm Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
