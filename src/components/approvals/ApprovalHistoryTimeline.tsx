import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Send,
  RotateCcw,
  Clock,
  Loader2,
} from 'lucide-react';
import type { ApprovalHistoryItem } from '@/types/notifications';
import { getApprovalHistory } from '@/services/approvalService';
import { format } from 'date-fns';

interface ApprovalHistoryTimelineProps {
  entityType: 'expense' | 'purchase_order';
  entityId: string;
  refreshTrigger?: number;
}

export function ApprovalHistoryTimeline({
  entityType,
  entityId,
  refreshTrigger,
}: ApprovalHistoryTimelineProps) {
  const [history, setHistory] = useState<ApprovalHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getApprovalHistory(entityType, entityId);
        setHistory(data);
      } catch (err) {
        console.warn('Error loading approval history:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [entityType, entityId, refreshTrigger]);

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'submitted':
        return {
          label: 'Submitted for Approval',
          color: 'text-indigo-600 dark:text-indigo-400',
          bgColor: 'bg-indigo-100 dark:bg-indigo-950/80',
          icon: <Send className="h-3.5 w-3.5" />,
        };
      case 'approved':
        return {
          label: 'Approved by Management',
          color: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-emerald-100 dark:bg-emerald-950/80',
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        };
      case 'rejected':
        return {
          label: 'Rejected with Remarks',
          color: 'text-rose-600 dark:text-rose-400',
          bgColor: 'bg-rose-100 dark:bg-rose-950/80',
          icon: <XCircle className="h-3.5 w-3.5" />,
        };
      case 'reopened':
        return {
          label: 'Re-opened for Editing',
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-100 dark:bg-amber-950/80',
          icon: <RotateCcw className="h-3.5 w-3.5" />,
        };
      default:
        return {
          label: action,
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-navy-800',
          icon: <Clock className="h-3.5 w-3.5" />,
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 text-xs text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin text-brand-600 mr-2" /> Loading workflow audit trail...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400 dark:border-navy-800">
        No formal approval actions logged for this record yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-navy-700">
      {history.map((item) => {
        const config = getActionConfig(item.action);
        let timeStr = '';
        try {
          timeStr = format(new Date(item.created_at), 'dd MMM yyyy, HH:mm');
        } catch {
          timeStr = item.created_at;
        }

        return (
          <div key={item.id} className="relative group">
            {/* Timeline Node Icon */}
            <div
              className={`absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white dark:ring-navy-900 ${config.bgColor} ${config.color}`}
            >
              {config.icon}
            </div>

            {/* Content */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 text-xs dark:border-navy-800 dark:bg-navy-950/40">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <div className="flex items-center gap-1.5 font-bold text-navy-900 dark:text-white">
                  <span className={config.color}>{config.label}</span>
                  <span className="text-gray-400">by</span>
                  <span className="text-navy-900 dark:text-navy-100">{item.performed_by_name}</span>
                  {item.performed_by_role && (
                    <span className="rounded bg-gray-200/70 px-1.5 py-0.2 text-[10px] font-semibold text-gray-700 dark:bg-navy-800 dark:text-navy-300">
                      {item.performed_by_role}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-gray-400 dark:text-navy-400">{timeStr}</span>
              </div>

              {item.comment && (
                <p className="mt-1 rounded-lg bg-white p-2 text-2xs italic text-gray-700 dark:bg-navy-900 dark:text-navy-300 border border-gray-100 dark:border-navy-800">
                  "{item.comment}"
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
