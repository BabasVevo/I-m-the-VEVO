import { format, parseISO } from 'date-fns';
import type { PaymentMethod, PaymentStatus } from '@/types/database';

export function formatCurrency(amount: number, currency: string = 'TZS'): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  
  // Custom clean formatting for common currencies like TZS, USD, EUR, etc.
  if (currency.toUpperCase() === 'TZS') {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(safeAmount);
    return `TZS ${formatted}`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    return `${currency || 'TZS'} ${new Intl.NumberFormat('en-US').format(safeAmount)}`;
  }
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value || 0);
}

export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const date = typeof isoString === 'string' ? parseISO(isoString) : new Date(isoString);
    return format(date, 'MMM dd, yyyy · HH:mm');
  } catch {
    return isoString;
  }
}

export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const date = typeof isoString === 'string' ? parseISO(isoString) : new Date(isoString);
    return format(date, 'MMM dd, yyyy');
  } catch {
    return isoString;
  }
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  mobile_money: 'Mobile Money (M-Pesa)',
  bank_transfer: 'Bank Transfer',
  credit: 'Store Credit',
  split: 'Split Payment',
};

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  partial: {
    label: 'Partial',
    bg: 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  pending: {
    label: 'Pending',
    bg: 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  refunded: {
    label: 'Refunded',
    bg: 'bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60',
    text: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
};
