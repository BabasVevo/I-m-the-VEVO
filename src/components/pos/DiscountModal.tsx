import { useState } from 'react';
import { Percent, DollarSign, X, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface DiscountModalProps {
  isOpen: boolean;
  title: string;
  originalAmount: number;
  initialType?: 'percentage' | 'fixed';
  initialValue?: number;
  currency?: string;
  maxPercentageAllowed?: number; // e.g. 20% limit for cashier unless manager
  isManagerOrOwner?: boolean;
  onApply: (discount: { type: 'percentage' | 'fixed'; value: number; amount: number; reason?: string }) => void;
  onClose: () => void;
}

export function DiscountModal({
  isOpen,
  title,
  originalAmount,
  initialType = 'percentage',
  initialValue = 0,
  currency = 'TZS',
  maxPercentageAllowed = 20,
  isManagerOrOwner = false,
  onApply,
  onClose,
}: DiscountModalProps) {
  const [type, setType] = useState<'percentage' | 'fixed'>(initialType);
  const [value, setValue] = useState(initialValue > 0 ? initialValue.toString() : '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const numVal = parseFloat(value) || 0;
  let calculatedDiscountAmount = 0;
  if (type === 'percentage') {
    calculatedDiscountAmount = Math.min(originalAmount, (originalAmount * numVal) / 100);
  } else {
    calculatedDiscountAmount = Math.min(originalAmount, numVal);
  }
  const finalPrice = Math.max(0, originalAmount - calculatedDiscountAmount);

  // Check limits
  const effectivePct = originalAmount > 0 ? (calculatedDiscountAmount / originalAmount) * 100 : 0;
  const isOverLimit = !isManagerOrOwner && effectivePct > maxPercentageAllowed;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (numVal < 0) {
      setError('Discount value cannot be negative.');
      return;
    }
    if (isOverLimit) {
      setError(
        `Your cashier permission allows up to ${maxPercentageAllowed}% discount. Request a manager override.`
      );
      return;
    }

    onApply({
      type,
      value: numVal,
      amount: calculatedDiscountAmount,
      reason: reason.trim() || undefined,
    });
    onClose();
  };

  const handleRemoveDiscount = () => {
    onApply({
      type: 'percentage',
      value: 0,
      amount: 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl transition-all dark:bg-navy-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-navy-800">
          <div>
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">{title}</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Original: {formatCurrency(originalAmount, currency)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:hover:bg-navy-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleApply} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Toggle: Percentage vs Fixed */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-navy-950">
            <button
              type="button"
              onClick={() => {
                setType('percentage');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                type === 'percentage'
                  ? 'bg-white text-navy-900 shadow-xs dark:bg-navy-800 dark:text-white'
                  : 'text-gray-500 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <Percent className="h-3.5 w-3.5" />
              <span>Percentage (%)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('fixed');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                type === 'fixed'
                  ? 'bg-white text-navy-900 shadow-xs dark:bg-navy-800 dark:text-white'
                  : 'text-gray-500 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <DollarSign className="h-3.5 w-3.5" />
              <span>Fixed ({currency})</span>
            </button>
          </div>

          {/* Quick % chips if in percentage mode */}
          {type === 'percentage' && (
            <div className="flex items-center gap-1.5">
              {[5, 10, 15, 20, 25].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    setValue(pct.toString());
                    setError(null);
                  }}
                  className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                    value === pct.toString()
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-300'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-navy-700 dark:bg-navy-950 dark:text-gray-300'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          )}

          {/* Input field */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Discount {type === 'percentage' ? 'Rate (%)' : `Amount (${currency})`}
            </label>
            <input
              type="number"
              min="0"
              step={type === 'percentage' ? '1' : '100'}
              max={type === 'percentage' ? '100' : originalAmount}
              autoFocus
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder={type === 'percentage' ? 'e.g. 10' : 'e.g. 5000'}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-base font-extrabold text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          {/* Optional reason / promo tag */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              Reason / Promo Note (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. VIP Customer, Clearance promo"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          {/* Summary Box */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-xs space-y-1.5 dark:border-navy-800 dark:bg-navy-950">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Discount applied:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                - {formatCurrency(calculatedDiscountAmount, currency)} ({effectivePct.toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200/60 pt-1 font-extrabold text-navy-900 dark:border-navy-800 dark:text-white">
              <span>New Total:</span>
              <span className="text-brand-600 dark:text-brand-400">
                {formatCurrency(finalPrice, currency)}
              </span>
            </div>
          </div>

          {/* Over-limit warning */}
          {isOverLimit && (
            <div className="flex items-start gap-1.5 rounded-xl bg-amber-50 p-2 text-[11px] text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Discount exceeds standard cashier limit ({maxPercentageAllowed}%).</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={handleRemoveDiscount}
              className="text-xs font-bold text-gray-500 hover:text-rose-600 dark:text-gray-400"
            >
              Clear Discount
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-navy-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isOverLimit}
                className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-600 disabled:opacity-50"
              >
                Apply Discount
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
