import { useState, type FormEvent } from 'react';
import { X, Target, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface EditTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTarget: number;
  currentSales: number;
  currency: string;
  scopeName: string;
  onSave: (newTarget: number, notes?: string) => Promise<void>;
}

export function EditTargetModal({
  isOpen,
  onClose,
  currentTarget,
  currentSales,
  currency,
  scopeName,
  onSave,
}: EditTargetModalProps) {
  const [targetAmount, setTargetAmount] = useState<string>(String(currentTarget || 1000000));
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const numericTarget = Number(targetAmount) || 0;
  const progressPreview = numericTarget > 0 ? Math.min(Math.round((currentSales / numericTarget) * 100), 100) : 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (numericTarget <= 0) {
      setError('Target amount must be greater than zero.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave(numericTarget, notes);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update target');
    } finally {
      setSaving(false);
    }
  };

  const presetIncrements = [
    { label: '500K', val: 500000 },
    { label: '1M', val: 1000000 },
    { label: '2.5M', val: 2500000 },
    { label: '5M', val: 5000000 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div
        id="edit-sales-target-modal"
        className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl transition-all dark:border-navy-700 dark:bg-navy-900"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-900 dark:text-white">
                Set Today's Sales Target
              </h3>
              <p className="text-xs text-gray-500 dark:text-navy-400">
                Scope: <span className="font-semibold text-brand-600 dark:text-brand-400">{scopeName}</span>
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="label text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400" htmlFor="target-amount">
              Daily Target Amount ({currency})
            </label>
            <div className="relative mt-1.5">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-semibold text-gray-400">
                {currency}
              </span>
              <input
                id="target-amount"
                type="number"
                min="1000"
                step="1000"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="input pl-16 text-lg font-bold text-navy-900 dark:text-white"
                placeholder="e.g. 1500000"
              />
            </div>

            {/* Presets */}
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-xs text-gray-400">Presets:</span>
              {presetIncrements.map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setTargetAmount(String(p.val))}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-navy-700 hover:bg-gray-100 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-300 dark:hover:bg-navy-700"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current Sales context preview */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 dark:border-navy-800 dark:bg-navy-950/50">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-navy-400">
              <span>Current Sales Today:</span>
              <span className="font-semibold text-navy-900 dark:text-white">
                {formatCurrency(currentSales, currency)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-navy-400">
              <span>Projected Target Completion:</span>
              <span className="font-bold text-brand-600 dark:text-brand-400">
                {progressPreview}%
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-navy-800">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${progressPreview}%` }}
              />
            </div>
          </div>

          <div>
            <label className="label text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-navy-400" htmlFor="target-notes">
              Notes / Strategy (Optional)
            </label>
            <input
              id="target-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input mt-1.5"
              placeholder="e.g., Weekend peak promotion target"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary min-w-[120px]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
