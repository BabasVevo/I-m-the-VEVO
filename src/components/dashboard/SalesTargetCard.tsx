import { useState } from 'react';
import { Target, CheckCircle2, Edit3, Flame, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { EditTargetModal } from './EditTargetModal';
import type { SalesTarget } from '@/types/database';

interface SalesTargetCardProps {
  target: SalesTarget | null;
  currentSales: number;
  currency: string;
  scopeName: string;
  canEditTarget: boolean;
  onUpdateTarget: (amount: number, notes?: string) => Promise<void>;
  loading?: boolean;
}

export function SalesTargetCard({
  target,
  currentSales,
  currency = 'TZS',
  scopeName,
  canEditTarget,
  onUpdateTarget,
  loading = false,
}: SalesTargetCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const targetAmount = target?.target_amount || 1500000;
  const percentage = targetAmount > 0 ? (currentSales / targetAmount) * 100 : 0;
  const clampedPercentage = Math.min(Math.round(percentage), 100);
  const isGoalAchieved = currentSales >= targetAmount;
  const difference = currentSales - targetAmount;

  const getProgressColor = () => {
    if (isGoalAchieved) return 'bg-emerald-500';
    if (percentage >= 75) return 'bg-brand-500';
    if (percentage >= 40) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  if (loading) {
    return (
      <div className="card animate-pulse p-6">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 rounded bg-gray-200 dark:bg-navy-800" />
          <div className="h-8 w-24 rounded-lg bg-gray-200 dark:bg-navy-800" />
        </div>
        <div className="mt-6 h-10 w-32 rounded bg-gray-300 dark:bg-navy-700" />
        <div className="mt-4 h-3 w-full rounded bg-gray-200 dark:bg-navy-800" />
      </div>
    );
  }

  return (
    <>
      <div
        id="sales-target-card"
        className="card relative flex flex-col justify-between overflow-hidden p-6 shadow-sm"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-900 dark:text-white">
                  Today's Sales Target
                </h3>
                <p className="text-xs text-gray-500 dark:text-navy-400">
                  Target for <span className="font-medium text-navy-700 dark:text-navy-200">{scopeName}</span>
                </p>
              </div>
            </div>

            {canEditTarget && (
              <button
                type="button"
                id="btn-edit-target"
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200 dark:hover:bg-navy-700"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Set Target</span>
              </button>
            )}
          </div>

          {/* Numbers comparison */}
          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-navy-400">
                Current Sales
              </span>
              <p className="text-2xl font-extrabold tracking-tight text-navy-950 dark:text-white sm:text-3xl">
                {formatCurrency(currentSales, currency)}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-navy-400">
                Goal / Target
              </span>
              <p className="text-lg font-bold text-gray-600 dark:text-navy-300 sm:text-xl">
                {formatCurrency(targetAmount, currency)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1 text-navy-700 dark:text-navy-200">
                {isGoalAchieved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">Goal Exceeded!</span>
                  </>
                ) : (
                  <>
                    <Flame className="h-4 w-4 text-amber-500" />
                    <span>Progress to Goal</span>
                  </>
                )}
              </span>
              <span className={`font-bold ${isGoalAchieved ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-600 dark:text-brand-400'}`}>
                {Math.round(percentage)}%
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-navy-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor()}`}
                style={{ width: `${clampedPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer Note / Callout */}
        <div className="mt-5 border-t border-gray-100 pt-3 dark:border-navy-800 flex items-center justify-between text-xs text-gray-500 dark:text-navy-400">
          {isGoalAchieved ? (
            <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
              Surplus of {formatCurrency(difference, currency)} achieved today!
            </span>
          ) : (
            <span>
              <span className="font-semibold text-navy-800 dark:text-white">
                {formatCurrency(Math.abs(difference), currency)}
              </span>{' '}
              remaining to reach target.
            </span>
          )}

          {target?.notes && (
            <span className="italic text-gray-400 truncate max-w-[160px]" title={target.notes}>
              "{target.notes}"
            </span>
          )}
        </div>
      </div>

      <EditTargetModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentTarget={targetAmount}
        currentSales={currentSales}
        currency={currency}
        scopeName={scopeName}
        onSave={onUpdateTarget}
      />
    </>
  );
}
