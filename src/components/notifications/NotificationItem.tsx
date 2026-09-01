import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  ClipboardCheck,
  Receipt,
  Truck,
  CreditCard,
  ShieldAlert,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Check,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import type { AppNotification } from '@/types/notifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: AppNotification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
  onCloseDropdown?: () => void;
  compact?: boolean;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onRemove,
  onCloseDropdown,
  compact = false,
}: NotificationItemProps) {
  const navigate = useNavigate();

  const getCategoryIcon = () => {
    switch (notification.category) {
      case 'inventory':
        return <Boxes className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case 'approvals':
        return <ClipboardCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
      case 'sales':
        return <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'purchases':
        return <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'expenses':
        return <CreditCard className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
      case 'security':
      case 'system':
        return <ShieldAlert className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadge = () => {
    switch (notification.severity) {
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertCircle className="h-3 w-3" /> Critical
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <AlertTriangle className="h-3 w-3" /> Warning
          </span>
        );
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> Success
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            <Info className="h-3 w-3" /> Info
          </span>
        );
    }
  };

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    if (notification.action_url) {
      if (onCloseDropdown) onCloseDropdown();
      navigate(notification.action_url);
    }
  };

  const timeAgo = () => {
    try {
      return formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div
      className={`group relative flex items-start gap-3 rounded-xl p-3.5 transition-all ${
        notification.is_read
          ? 'bg-transparent hover:bg-gray-50/80 dark:hover:bg-navy-800/60'
          : 'bg-brand-50/40 hover:bg-brand-50/70 dark:bg-brand-950/30 dark:hover:bg-brand-950/50 border-l-3 border-l-brand-600 dark:border-l-brand-500'
      } ${compact ? 'py-2.5' : 'border border-gray-100 dark:border-navy-800'}`}
    >
      {/* Icon Circle */}
      <div
        onClick={handleClick}
        className="cursor-pointer mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-navy-800"
      >
        {getCategoryIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={handleClick}>
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p
            className={`text-xs font-semibold truncate ${
              notification.is_read
                ? 'text-navy-900 dark:text-white'
                : 'text-brand-900 dark:text-brand-200 font-bold'
            }`}
          >
            {notification.title}
          </p>
          {getSeverityBadge()}
          {!notification.is_read && (
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
          )}
        </div>

        <p className="text-xs text-gray-600 dark:text-navy-300 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>

        <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400 dark:text-navy-400">
          <span>{timeAgo()}</span>
          {notification.entity_label && (
            <span className="truncate max-w-[140px] font-medium text-gray-500 dark:text-navy-300">
              · {notification.entity_label}
            </span>
          )}
          {notification.action_url && (
            <span className="inline-flex items-center gap-0.5 font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View record <ExternalLink className="h-2.5 w-2.5" />
            </span>
          )}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex shrink-0 items-center gap-1 opacity-80 group-hover:opacity-100">
        {!notification.is_read && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60 hover:text-navy-900 dark:text-navy-400 dark:hover:bg-navy-700 dark:hover:text-white"
            title="Mark as read"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(notification.id);
          }}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-100/60 hover:text-rose-600 dark:text-navy-400 dark:hover:bg-rose-950/60 dark:hover:text-rose-400"
          title="Delete notification"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
