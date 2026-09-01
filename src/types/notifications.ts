export type NotificationCategory =
  | 'inventory'
  | 'approvals'
  | 'sales'
  | 'purchases'
  | 'expenses'
  | 'system'
  | 'security';

export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';

export type NotificationEntityType =
  | 'product'
  | 'inventory'
  | 'sale'
  | 'purchase_order'
  | 'expense'
  | 'supplier'
  | 'customer'
  | 'employee'
  | 'system';

export interface AppNotification {
  id: string;
  business_id: string;
  branch_id?: string | null;
  user_id?: string | null; // target specific user or null for all authorized
  title: string;
  message: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  action_url?: string | null;
  entity_type?: NotificationEntityType | null;
  entity_id?: string | null;
  entity_label?: string | null;
  is_read: boolean;
  read_at?: string | null;
  dedup_key?: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

export interface CreateNotificationInput {
  business_id: string;
  branch_id?: string | null;
  user_id?: string | null;
  title: string;
  message: string;
  category: NotificationCategory;
  severity?: NotificationSeverity;
  action_url?: string | null;
  entity_type?: NotificationEntityType | null;
  entity_id?: string | null;
  entity_label?: string | null;
  dedup_key?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface NotificationPreferencesConfig {
  inventory_low_stock: boolean;
  inventory_out_of_stock: boolean;
  inventory_adjustments: boolean;
  inventory_negative_stock_prevention: boolean;
  approvals_expense_requests: boolean;
  approvals_purchase_requests: boolean;
  approvals_decisions: boolean;
  sales_large_transactions: boolean;
  sales_large_transaction_threshold: number; // in BIF
  sales_void_and_refunds: boolean;
  sales_unusual_activity: boolean;
  purchases_po_updates: boolean;
  purchases_supplier_overdue: boolean;
  expenses_large_threshold: number; // in BIF
  security_alerts_enabled: boolean; // locked to true for security compliance
  sound_enabled: boolean;
  email_digest: 'instant' | 'daily' | 'weekly' | 'none';
}

export type ApprovalActionType =
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'reopened'
  | 'cancelled'
  | 'paid'
  | 'ordered'
  | 'received';

export interface ApprovalHistoryItem {
  id: string;
  business_id: string;
  entity_type: 'expense' | 'purchase_order';
  entity_id: string;
  action: ApprovalActionType;
  performed_by_id: string;
  performed_by_name: string;
  performed_by_role: string;
  comment: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface PendingApprovalSummary {
  total_pending_count: number;
  pending_expenses_count: number;
  pending_expenses_amount: number;
  pending_purchases_count: number;
  pending_purchases_amount: number;
}
