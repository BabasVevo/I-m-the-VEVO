import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { ApprovalHistoryItem } from '@/types/notifications';
import type { Expense, PurchaseOrder } from '@/types/database';
import { getStoredExpenses, updateExpense } from './expenseService';
import { getStoredPurchases, updatePurchaseOrder } from './purchaseService';
import { logActivity } from './activityLogService';
import { createNotification } from './notificationService';

export const APPROVAL_HISTORY_STORAGE_KEY = 'babas_demo_approval_history_v1';

export const INITIAL_APPROVAL_HISTORY: ApprovalHistoryItem[] = [
  {
    id: 'appr-hist-1',
    business_id: 'demo-biz-1',
    entity_type: 'expense',
    entity_id: 'exp-1',
    action: 'submitted',
    performed_by_id: 'emp-cashier-1',
    performed_by_name: 'Nadia Kaneza',
    performed_by_role: 'Cashier',
    comment: 'Electricity token recharge & generator emergency fuel for weekend peak hours.',
    created_at: new Date(Date.now() - 50 * 60000).toISOString(),
  },
  {
    id: 'appr-hist-2',
    business_id: 'demo-biz-1',
    entity_type: 'purchase_order',
    entity_id: 'po-4',
    action: 'submitted',
    performed_by_id: 'emp-inv-1',
    performed_by_name: 'Thierry Habimana',
    performed_by_role: 'Inventory Manager',
    comment: 'Urgent restocking of 10 wireless Bluetooth barcode scanners for new POS counters.',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
];

export function getStoredApprovalHistory(): ApprovalHistoryItem[] {
  try {
    const raw = localStorage.getItem(APPROVAL_HISTORY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(APPROVAL_HISTORY_STORAGE_KEY, JSON.stringify(INITIAL_APPROVAL_HISTORY));
      return INITIAL_APPROVAL_HISTORY;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_APPROVAL_HISTORY;
  } catch (err) {
    console.error('Error reading stored approval history:', err);
    return INITIAL_APPROVAL_HISTORY;
  }
}

export function saveStoredApprovalHistory(history: ApprovalHistoryItem[]): void {
  try {
    localStorage.setItem(APPROVAL_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (err) {
    console.error('Error saving approval history:', err);
  }
}

export async function getApprovalHistory(
  entityType: 'expense' | 'purchase_order',
  entityId: string
): Promise<ApprovalHistoryItem[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('approval_history')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        return data as ApprovalHistoryItem[];
      }
    } catch (err) {
      console.warn('Supabase getApprovalHistory fallback:', err);
    }
  }

  const all = getStoredApprovalHistory();
  return all
    .filter((h) => h.entity_type === entityType && h.entity_id === entityId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function recordApprovalHistory(
  item: Omit<ApprovalHistoryItem, 'id' | 'created_at'>
): Promise<ApprovalHistoryItem> {
  const newItem: ApprovalHistoryItem = {
    ...item,
    id: `appr-h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('approval_history')
        .insert(newItem)
        .select()
        .single();
      if (!error && data) {
        const local = getStoredApprovalHistory();
        local.push(data as ApprovalHistoryItem);
        saveStoredApprovalHistory(local);
        return data as ApprovalHistoryItem;
      }
    } catch (err) {
      console.warn('Supabase recordApprovalHistory fallback:', err);
    }
  }

  const local = getStoredApprovalHistory();
  local.push(newItem);
  saveStoredApprovalHistory(local);
  return newItem;
}

export interface UnifiedPendingApproval {
  id: string;
  business_id: string;
  branch_id?: string | null;
  branch_name?: string | null;
  entity_type: 'expense' | 'purchase_order';
  code: string; // e.g. EXP-2026-000401 or PO-2026-000104
  title: string;
  description: string;
  amount: number;
  currency: string;
  requester_id?: string | null;
  requester_name: string;
  requester_role?: string | null;
  date: string;
  category_or_supplier: string;
  status: string;
  attachment_count: number;
  original_record: Expense | PurchaseOrder;
}

export async function fetchAllPendingApprovals(
  businessId: string,
  branchId?: string | null
): Promise<{ items: UnifiedPendingApproval[]; totalCount: number; totalAmount: number }> {
  const expenses = getStoredExpenses().filter(
    (e) => (e.business_id === businessId || businessId === 'demo-biz-1') && e.status === 'pending_approval'
  );

  const purchases = getStoredPurchases().filter(
    (p) => (p.business_id === businessId || businessId === 'demo-biz-1') && p.status === 'pending_approval'
  );

  const unified: UnifiedPendingApproval[] = [];

  for (const exp of expenses) {
    if (branchId && exp.branch_id && exp.branch_id !== branchId) continue;
    unified.push({
      id: exp.id,
      business_id: exp.business_id,
      branch_id: exp.branch_id,
      branch_name: exp.branch?.name || (exp.branch_id === 'branch-masaki' ? 'Rumonge Market Branch' : 'Bujumbura Flagship (Rohero)'),
      entity_type: 'expense',
      code: exp.expense_number,
      title: exp.description || 'Expense Voucher',
      description: exp.notes || exp.description,
      amount: exp.amount,
      currency: 'BIF',
      requester_id: exp.created_by,
      requester_name: exp.creator?.full_name || 'Nadia Kaneza',
      requester_role: exp.creator?.job_title || 'Cashier',
      date: exp.expense_date,
      category_or_supplier: exp.category?.name || 'Store Operations',
      status: exp.status,
      attachment_count: exp.attachments?.length || 0,
      original_record: exp,
    });
  }

  for (const po of purchases) {
    if (branchId && po.branch_id && po.branch_id !== branchId) continue;
    unified.push({
      id: po.id,
      business_id: po.business_id,
      branch_id: po.branch_id,
      branch_name: po.branch?.name || (po.branch_id === 'branch-masaki' ? 'Rumonge Market Branch' : 'Bujumbura Flagship (Rohero)'),
      entity_type: 'purchase_order',
      code: po.po_number,
      title: `PO for ${po.supplier?.name || 'Supplier Goods'}`,
      description: po.notes || `Purchase Order containing ${po.items?.length || 1} line item(s)`,
      amount: po.grand_total,
      currency: 'BIF',
      requester_id: po.created_by,
      requester_name: po.creator?.full_name || 'Thierry Habimana',
      requester_role: po.creator?.job_title || 'Inventory Manager',
      date: po.order_date,
      category_or_supplier: po.supplier?.name || 'Burundi Tech Importers Ltd',
      status: po.status,
      attachment_count: 0,
      original_record: po,
    });
  }

  // Sort newest first
  unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalAmount = unified.reduce((sum, item) => sum + item.amount, 0);

  return {
    items: unified,
    totalCount: unified.length,
    totalAmount,
  };
}

// ----------------------------------------------------
// Expense Workflow Actions
// ----------------------------------------------------

export async function submitExpenseForApproval(
  expenseId: string,
  user: { id: string; full_name?: string; role_name?: string },
  comments?: string
): Promise<Expense> {
  const updated = await updateExpense(expenseId, {
    status: 'pending_approval',
  });

  await recordApprovalHistory({
    business_id: updated.business_id,
    entity_type: 'expense',
    entity_id: expenseId,
    action: 'submitted',
    performed_by_id: user.id,
    performed_by_name: user.full_name || 'Staff Member',
    performed_by_role: user.role_name || 'Staff',
    comment: comments || 'Submitted for management review and approval.',
  });

  await logActivity({
    business_id: updated.business_id,
    branch_id: updated.branch_id,
    employee_id: user.id,
    employee_name: user.full_name || 'Staff Member',
    employee_role: user.role_name || 'Staff',
    action_type: 'expense_created',
    action_category: 'expenses',
    description: `Submitted expense ${updated.expense_number} (BIF ${updated.amount.toLocaleString()}) for approval`,
    entity_type: 'expense',
    entity_id: expenseId,
    entity_label: updated.expense_number,
    details: { amount: updated.amount, description: updated.description, comments },
  });

  await createNotification({
    business_id: updated.business_id,
    branch_id: updated.branch_id,
    title: 'Expense Awaiting Approval',
    message: `Voucher ${updated.expense_number} (BIF ${updated.amount.toLocaleString()}) submitted by ${user.full_name || 'Staff'}.`,
    category: 'approvals',
    severity: 'info',
    action_url: `/expenses?status=pending_approval`,
    entity_type: 'expense',
    entity_id: expenseId,
    entity_label: updated.expense_number,
    dedup_key: `pending-expense-${expenseId}`,
  });

  return updated;
}

export async function approveExpenseWorkflow(
  expenseId: string,
  user: { id: string; full_name?: string; role_name?: string },
  comments?: string
): Promise<Expense> {
  const now = new Date().toISOString();
  const updated = await updateExpense(expenseId, {
    status: 'approved',
    approved_by: user.id,
    approved_at: now,
    approval_notes: comments || 'Approved by management.',
  });

  await recordApprovalHistory({
    business_id: updated.business_id,
    entity_type: 'expense',
    entity_id: expenseId,
    action: 'approved',
    performed_by_id: user.id,
    performed_by_name: user.full_name || 'Approver',
    performed_by_role: user.role_name || 'Manager',
    comment: comments || 'Approved for disbursement.',
  });

  await logActivity({
    business_id: updated.business_id,
    branch_id: updated.branch_id,
    employee_id: user.id,
    employee_name: user.full_name || 'Approver',
    employee_role: user.role_name || 'Manager',
    action_type: 'expense_approved',
    action_category: 'expenses',
    description: `Approved expense ${updated.expense_number} (BIF ${updated.amount.toLocaleString()})`,
    entity_type: 'expense',
    entity_id: expenseId,
    entity_label: updated.expense_number,
    details: { amount: updated.amount, comments },
  });

  await createNotification({
    business_id: updated.business_id,
    branch_id: updated.branch_id,
    user_id: updated.created_by,
    title: 'Expense Approved',
    message: `Your expense voucher ${updated.expense_number} (BIF ${updated.amount.toLocaleString()}) has been approved.`,
    category: 'approvals',
    severity: 'success',
    action_url: `/expenses`,
    entity_type: 'expense',
    entity_id: expenseId,
    entity_label: updated.expense_number,
  });

  return updated;
}

export async function rejectExpenseWorkflow(
  expenseId: string,
  user: { id: string; full_name?: string; role_name?: string },
  reason: string
): Promise<Expense> {
  const now = new Date().toISOString();
  const updated = await updateExpense(expenseId, {
    status: 'rejected',
    approved_by: user.id,
    approved_at: now,
    approval_notes: reason,
  });

  await recordApprovalHistory({
    business_id: updated.business_id,
    entity_type: 'expense',
    entity_id: expenseId,
    action: 'rejected',
    performed_by_id: user.id,
    performed_by_name: user.full_name || 'Approver',
    performed_by_role: user.role_name || 'Manager',
    comment: reason,
  });

  await logActivity({
    business_id: updated.business_id,
    branch_id: updated.branch_id,
    employee_id: user.id,
    employee_name: user.full_name || 'Approver',
    employee_role: user.role_name || 'Manager',
    action_type: 'expense_deleted',
    action_category: 'expenses',
    description: `Rejected expense ${updated.expense_number}: "${reason}"`,
    entity_type: 'expense',
    entity_id: expenseId,
    entity_label: updated.expense_number,
    details: { reason },
  });

  await createNotification({
    business_id: updated.business_id,
    branch_id: updated.branch_id,
    user_id: updated.created_by,
    title: 'Expense Rejected',
    message: `Expense voucher ${updated.expense_number} was rejected. Reason: ${reason}`,
    category: 'approvals',
    severity: 'error',
    action_url: `/expenses`,
    entity_type: 'expense',
    entity_id: expenseId,
    entity_label: updated.expense_number,
  });

  return updated;
}

// ----------------------------------------------------
// Purchase Order Workflow Actions
// ----------------------------------------------------

export async function submitPurchaseOrderForApproval(
  poId: string,
  user: { id: string; full_name?: string; role_name?: string },
  comments?: string
): Promise<PurchaseOrder> {
  const purchases = getStoredPurchases();
  const po = purchases.find((p) => p.id === poId);
  if (!po) throw new Error('Purchase order not found');

  const updated = await updatePurchaseOrder(poId, {
    status: 'pending_approval',
  });

  await recordApprovalHistory({
    business_id: updated.business_id,
    entity_type: 'purchase_order',
    entity_id: poId,
    action: 'submitted',
    performed_by_id: user.id,
    performed_by_name: user.full_name || 'Staff Member',
    performed_by_role: user.role_name || 'Staff',
    comment: comments || 'Submitted purchase order for manager sign-off.',
  });

  await logActivity({
    business_id: updated.business_id,
    branch_id: updated.branch_id,
    employee_id: user.id,
    employee_name: user.full_name || 'Staff Member',
    employee_role: user.role_name || 'Staff',
    action_type: 'po_created',
    action_category: 'purchases',
    description: `Submitted Purchase Order ${updated.po_number} (BIF ${updated.grand_total.toLocaleString()}) for approval`,
    entity_type: 'purchase_order',
    entity_id: poId,
    entity_label: updated.po_number,
    details: { grand_total: updated.grand_total, comments },
  });

  await createNotification({
    business_id: updated.business_id,
    branch_id: updated.branch_id,
    title: 'PO Awaiting Approval',
    message: `Purchase Order ${updated.po_number} for BIF ${updated.grand_total.toLocaleString()} requires authorization.`,
    category: 'approvals',
    severity: 'info',
    action_url: `/purchases?id=${poId}`,
    entity_type: 'purchase_order',
    entity_id: poId,
    entity_label: updated.po_number,
    dedup_key: `pending-po-${poId}`,
  });

  return updated;
}

export async function approvePurchaseOrderWorkflow(
  poId: string,
  user: { id: string; full_name?: string; role_name?: string },
  comments?: string
): Promise<PurchaseOrder> {
  const updated = await updatePurchaseOrder(poId, {
    status: 'approved',
  });

  await recordApprovalHistory({
    business_id: updated.business_id,
    entity_type: 'purchase_order',
    entity_id: poId,
    action: 'approved',
    performed_by_id: user.id,
    performed_by_name: user.full_name || 'Approver',
    performed_by_role: user.role_name || 'Manager',
    comment: comments || 'Approved for ordering and supplier dispatch.',
  });

  await logActivity({
    business_id: updated.business_id,
    branch_id: updated.branch_id,
    employee_id: user.id,
    employee_name: user.full_name || 'Approver',
    employee_role: user.role_name || 'Manager',
    action_type: 'po_created',
    action_category: 'purchases',
    description: `Approved Purchase Order ${updated.po_number} (BIF ${updated.grand_total.toLocaleString()})`,
    entity_type: 'purchase_order',
    entity_id: poId,
    entity_label: updated.po_number,
    details: { grand_total: updated.grand_total, comments },
  });

  await createNotification({
    business_id: updated.business_id,
    branch_id: updated.branch_id,
    user_id: updated.created_by,
    title: 'Purchase Order Approved',
    message: `Purchase Order ${updated.po_number} has been approved. You can now issue the order to the supplier.`,
    category: 'approvals',
    severity: 'success',
    action_url: `/purchases?id=${poId}`,
    entity_type: 'purchase_order',
    entity_id: poId,
    entity_label: updated.po_number,
  });

  return updated;
}

export async function rejectPurchaseOrderWorkflow(
  poId: string,
  user: { id: string; full_name?: string; role_name?: string },
  reason: string
): Promise<PurchaseOrder> {
  const updated = await updatePurchaseOrder(poId, {
    status: 'rejected',
    notes: `${updatedPO_notes(poId)} [Rejection Reason: ${reason}]`,
  });

  await recordApprovalHistory({
    business_id: updated.business_id,
    entity_type: 'purchase_order',
    entity_id: poId,
    action: 'rejected',
    performed_by_id: user.id,
    performed_by_name: user.full_name || 'Approver',
    performed_by_role: user.role_name || 'Manager',
    comment: reason,
  });

  await logActivity({
    business_id: updated.business_id,
    branch_id: updated.branch_id,
    employee_id: user.id,
    employee_name: user.full_name || 'Approver',
    employee_role: user.role_name || 'Manager',
    action_type: 'po_created',
    action_category: 'purchases',
    description: `Rejected Purchase Order ${updated.po_number}: "${reason}"`,
    entity_type: 'purchase_order',
    entity_id: poId,
    entity_label: updated.po_number,
    details: { reason },
  });

  await createNotification({
    business_id: updated.business_id,
    branch_id: updated.branch_id,
    user_id: updated.created_by,
    title: 'Purchase Order Rejected',
    message: `PO ${updated.po_number} was rejected by management. Reason: ${reason}`,
    category: 'approvals',
    severity: 'error',
    action_url: `/purchases?id=${poId}`,
    entity_type: 'purchase_order',
    entity_id: poId,
    entity_label: updated.po_number,
  });

  return updated;
}

function updatedPO_notes(poId: string): string {
  const purchases = getStoredPurchases();
  const po = purchases.find((p) => p.id === poId);
  return po?.notes || '';
}
