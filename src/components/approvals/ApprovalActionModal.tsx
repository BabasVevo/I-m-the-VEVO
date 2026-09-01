import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Send,
  AlertTriangle,
  Loader2,
  CreditCard,
  Truck,
} from 'lucide-react';
import type { UnifiedPendingApproval } from '@/services/approvalService';
import type { Expense, PurchaseOrder } from '@/types/database';
import { formatCurrency } from '@/lib/format';

interface ApprovalActionModalProps {
  isOpen: boolean;
  actionType: 'approve' | 'reject' | 'submit';
  item: UnifiedPendingApproval | Expense | PurchaseOrder | null;
  currency?: string;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
}

const REJECTION_PRESETS = [
  'Missing supporting tax invoice or receipt documentation.',
  'Amount exceeds allocated branch budget for the period.',
  'Price quote is higher than approved standard supplier rate.',
  'Discrepancy in item quantities or specifications.',
  'Duplicate request already submitted and paid.',
];

const APPROVAL_PRESETS = [
  'Approved according to operational budget allocation.',
  'Verified supporting receipts and compliance documentation.',
  'Approved for urgent branch operational requirement.',
  'Authorized by branch management for payment processing.',
];

export function ApprovalActionModal({
  isOpen,
  actionType,
  item,
  currency = 'BIF',
  onClose,
  onConfirm,
}: ApprovalActionModalProps) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  // Extract common fields polymorphic
  const isUnified = 'entity_type' in item;
  const entityType: 'expense' | 'purchase_order' = isUnified
    ? (item as UnifiedPendingApproval).entity_type
    : 'expense_number' in item
    ? 'expense'
    : 'purchase_order';

  const code = isUnified
    ? (item as UnifiedPendingApproval).code
    : 'expense_number' in item
    ? (item as Expense).expense_number
    : (item as PurchaseOrder).po_number;

  const title = isUnified
    ? (item as UnifiedPendingApproval).title
    : 'description' in item
    ? (item as Expense).description
    : `Purchase Order ${(item as PurchaseOrder).po_number}`;

  const amount = isUnified
    ? (item as UnifiedPendingApproval).amount
    : 'amount' in item
    ? (item as Expense).amount
    : (item as PurchaseOrder).grand_total;

  const handlePresetClick = (preset: string) => {
    setComment(preset);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actionType === 'reject' && !comment.trim()) {
      setError('Please enter or select a specific reason for rejection.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onConfirm(comment.trim());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during operation.');
    } finally {
      setSubmitting(false);
    }
  };

  const getHeaderDetails = () => {
    if (actionType === 'approve') {
      return {
        title: 'Approve Request',
        badge: 'Approval',
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        icon: <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
        submitBtnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        submitLabel: 'Confirm & Approve',
      };
    }
    if (actionType === 'reject') {
      return {
        title: 'Reject Request',
        badge: 'Rejection',
        badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300',
        icon: <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />,
        submitBtnColor: 'bg-rose-600 hover:bg-rose-700 text-white',
        submitLabel: 'Confirm Rejection',
      };
    }
    return {
      title: 'Submit for Management Approval',
      badge: 'Submission',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300',
      icon: <Send className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
      submitBtnColor: 'bg-brand-600 hover:bg-brand-700 text-white',
      submitLabel: 'Submit for Review',
    };
  };

  const header = getHeaderDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs">
      <div
        id="approval-action-modal"
        className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl transition-all dark:border-navy-800 dark:bg-navy-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-navy-800">
              {header.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-navy-900 dark:text-white">
                  {header.title}
                </h3>
                <span className={`rounded-md px-2 py-0.5 text-2xs font-bold ${header.badgeColor}`}>
                  {header.badge}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-navy-400 mt-0.5">
                {entityType === 'expense' ? 'Expense Voucher' : 'Purchase Order'} · {code}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:text-navy-400 dark:hover:bg-navy-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Item Summary Card */}
        <div className="my-4 rounded-xl border border-gray-100 bg-gray-50/80 p-3.5 dark:border-navy-800 dark:bg-navy-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {entityType === 'expense' ? (
                <CreditCard className="h-4 w-4 text-rose-500" />
              ) : (
                <Truck className="h-4 w-4 text-blue-500" />
              )}
              <span className="text-xs font-semibold text-navy-900 dark:text-white truncate max-w-[220px]">
                {title}
              </span>
            </div>
            <span className="text-sm font-extrabold text-navy-900 dark:text-white">
              {formatCurrency(amount, currency)}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-navy-300">
              {actionType === 'reject' ? 'Select Quick Rejection Reason:' : 'Quick Note Preset:'}
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {(actionType === 'reject' ? REJECTION_PRESETS : APPROVAL_PRESETS).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`rounded-lg border px-2.5 py-1 text-left text-2xs transition-colors ${
                    comment === preset
                      ? 'border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-600 dark:bg-brand-950/80 dark:text-brand-300 font-semibold'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-300 dark:hover:bg-navy-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Comment / Reason Textarea */}
          <div>
            <label
              htmlFor="approval-comment"
              className="mb-1 block text-xs font-semibold text-gray-700 dark:text-navy-300"
            >
              {actionType === 'reject' ? (
                <span>
                  Rejection Reason <span className="text-rose-500">*</span>
                </span>
              ) : (
                'Review Notes & Remarks (Optional)'
              )}
            </label>
            <textarea
              id="approval-comment"
              rows={3}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (error) setError(null);
              }}
              placeholder={
                actionType === 'reject'
                  ? 'State why this request cannot be approved...'
                  : 'Add any specific authorization notes or account code...'
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-navy-900 focus:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200 dark:hover:bg-navy-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold shadow-xs transition ${header.submitBtnColor} disabled:opacity-50`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  {header.icon}
                  {header.submitLabel}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
