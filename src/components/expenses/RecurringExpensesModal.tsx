import { useState, useEffect, useCallback } from 'react';
import { X, Repeat, Play, Trash2 } from 'lucide-react';
import type { RecurringExpense } from '@/types/database';
import { formatCurrency, formatDate } from '@/lib/format';
import { fetchRecurringExpenses, processRecurringExpenses, deleteRecurringExpense } from '@/services/expenseService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface RecurringExpensesModalProps {
  isOpen: boolean;
  currency?: string;
  onClose: () => void;
  onRefresh: () => void;
}

export function RecurringExpensesModal({
  isOpen,
  currency = 'BIF',
  onClose,
  onRefresh,
}: RecurringExpensesModalProps) {
  const { business } = useAuth();
  const { addToast } = useToast();
  const businessId = business?.id || 'demo-biz-1';

  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const list = await fetchRecurringExpenses(businessId);
      setRecurring(list);
    } catch (err) {
      console.error('Error loading recurring expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  const handleRunNow = async () => {
    try {
      setProcessing(true);
      const count = await processRecurringExpenses(businessId);
      addToast({
        type: 'success',
        title: 'Processing Complete',
        message: `Generated ${count} recurring expense voucher(s).`,
      });
      loadData();
      onRefresh();
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to process recurring expenses.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (rec: RecurringExpense) => {
    if (window.confirm(`Delete recurring schedule for "${rec.title}"?`)) {
      try {
        await deleteRecurringExpense(rec.id);
        setRecurring(recurring.filter((r) => r.id !== rec.id));
        addToast({
          type: 'success',
          title: 'Schedule Deleted',
          message: 'Recurring template removed.',
        });
        onRefresh();
      } catch (err: unknown) {
        addToast({
          type: 'error',
          title: 'Error',
          message: err instanceof Error ? err.message : 'Failed to delete schedule.',
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs">
      <div
        id="recurring-expenses-modal"
        className="relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl transition-all dark:border-navy-800 dark:bg-navy-900 max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <Repeat className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recurring Expenses</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Scheduled overheads (Rent, Internet, Salaries, Retainers)
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

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {recurring.length} automated recurring templates configured
          </span>
          <button
            type="button"
            disabled={processing || recurring.length === 0}
            onClick={handleRunNow}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            <Play className="h-3.5 w-3.5" /> {processing ? 'Generating...' : 'Process Due Vouchers Now'}
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <p className="py-8 text-center text-xs text-gray-400">Loading schedules...</p>
          ) : recurring.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-xs text-gray-500 dark:border-navy-800">
              No recurring expense schedules configured. When adding an expense, toggle "Repeat as Recurring Expense" to automate regular bills.
            </div>
          ) : (
            recurring.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-white text-xs">
                      {rec.title}
                    </span>
                    <span className="rounded-md bg-purple-50 px-2 py-0.5 text-2xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 capitalize">
                      {rec.recurrence_interval}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-2xs text-gray-500 dark:text-gray-400">
                    <span>Vendor: {rec.vendor_name || '—'}</span>
                    <span>Next Due: {formatDate(rec.next_due_date)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-bold text-rose-600 dark:text-rose-400 text-xs">
                    {formatCurrency(rec.amount, currency)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(rec)}
                    className="rounded p-1 text-gray-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex justify-end pt-3 border-t border-gray-200 dark:border-navy-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 dark:bg-navy-800 dark:text-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
