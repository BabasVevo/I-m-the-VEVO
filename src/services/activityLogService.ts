import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { ActivityLog } from '@/types/database';

export const DEMO_ACTIVITY_LOGS_KEY = 'babas_demo_activity_logs_v1';

export const INITIAL_DEMO_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'act-101',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    branch_name: 'Bujumbura Flagship (Rohero)',
    employee_id: 'demo-user-1',
    employee_name: 'Alex Rivera',
    employee_role: 'Super Administrator',
    action_type: 'auth_login',
    action_category: 'auth',
    description: 'Logged in to BABAS POS & Inventory portal',
    details: { device: 'MacBook Pro', browser: 'Chrome 128', ip: '197.234.12.8' },
    entity_type: 'session',
    entity_id: 'sess-today',
    entity_label: 'Web Console Session',
    ip_address: '197.234.12.8',
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'act-102',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    branch_name: 'Bujumbura Flagship (Rohero)',
    employee_id: 'emp-cashier-1',
    employee_name: 'Nadia Kaneza',
    employee_role: 'Cashier',
    action_type: 'sale_created',
    action_category: 'sales',
    description: 'Completed POS sale #REC-2026-081 via Lumicash',
    details: {
      receipt_number: 'REC-2026-081',
      total_amount: 145000,
      payment_method: 'mobile_money',
      item_count: 3,
    },
    entity_type: 'sale',
    entity_id: 'sale-081',
    entity_label: 'Receipt #REC-2026-081 (BIF 145,000)',
    ip_address: '197.234.12.14',
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 'act-103',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    branch_name: 'Bujumbura Flagship (Rohero)',
    employee_id: 'emp-inv-1',
    employee_name: 'Thierry Habimana',
    employee_role: 'Inventory Manager',
    action_type: 'inventory_adjusted',
    action_category: 'inventory',
    description: 'Adjusted stock quantity for "Savon Brarudi 200g" (+40 units received count)',
    details: {
      product: 'Savon Brarudi 200g',
      previous_qty: 60,
      new_qty: 100,
      reason: 'Physical count discrepancy correction',
    },
    entity_type: 'product',
    entity_id: 'prod-004',
    entity_label: 'Savon Brarudi 200g (SKU-BR-004)',
    ip_address: '197.234.12.22',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'act-104',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    branch_name: 'Bujumbura Flagship (Rohero)',
    employee_id: 'demo-user-1',
    employee_name: 'Alex Rivera',
    employee_role: 'Super Administrator',
    action_type: 'expense_approved',
    action_category: 'expenses',
    description: 'Approved store electricity token recharge expense (BIF 850,000)',
    details: {
      expense_number: 'EXP-2026-004',
      category: 'Electricity & Water (REGIDESO)',
      amount: 850000,
      approved_by: 'Alex Rivera',
    },
    entity_type: 'expense',
    entity_id: 'exp-004',
    entity_label: 'Expense #EXP-2026-004',
    ip_address: '197.234.12.8',
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'act-105',
    business_id: 'demo-biz-1',
    branch_id: 'branch-gitega',
    branch_name: 'Gitega Central Branch',
    employee_id: 'emp-mgr-1',
    employee_name: 'Eric Ndayisaba',
    employee_role: 'Branch Manager',
    action_type: 'po_created',
    action_category: 'purchases',
    description: 'Generated purchase order #PO-2026-019 for Brarudi S.A.',
    details: {
      po_number: 'PO-2026-019',
      supplier: 'Brarudi Brewery S.A.',
      expected_delivery: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      total_estimated: 4200000,
    },
    entity_type: 'purchase_order',
    entity_id: 'po-019',
    entity_label: 'PO #PO-2026-019 (Brarudi S.A.)',
    ip_address: '197.234.18.5',
    created_at: new Date(Date.now() - 7 * 3600000).toISOString(),
  },
  {
    id: 'act-106',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    branch_name: 'Bujumbura Flagship (Rohero)',
    employee_id: 'emp-sales-1',
    employee_name: 'Grace Irakoze',
    employee_role: 'Sales Employee',
    action_type: 'customer_created',
    action_category: 'customers',
    description: 'Registered new VIP customer "Hotel Club du Lac Tanganyika"',
    details: {
      customer_name: 'Hotel Club du Lac Tanganyika',
      phone: '+257 22 25 3000',
      type: 'vip',
      credit_limit: 5000000,
    },
    entity_type: 'customer',
    entity_id: 'cust-vip-009',
    entity_label: 'Hotel Club du Lac Tanganyika',
    ip_address: '197.234.12.30',
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: 'act-107',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    branch_name: 'Bujumbura Flagship (Rohero)',
    employee_id: 'demo-user-1',
    employee_name: 'Alex Rivera',
    employee_role: 'Super Administrator',
    action_type: 'permissions_updated',
    action_category: 'employees',
    description: 'Updated permissions matrix for Cashier role (enabled custom discount authority)',
    details: {
      role: 'cashier',
      permission_added: 'pos.discount',
      updated_by: 'Alex Rivera',
    },
    entity_type: 'role',
    entity_id: 'role-cashier',
    entity_label: 'Role: Cashier',
    ip_address: '197.234.12.8',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'act-108',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    branch_name: 'Bujumbura Flagship (Rohero)',
    employee_id: 'emp-inv-1',
    employee_name: 'Thierry Habimana',
    employee_role: 'Inventory Manager',
    action_type: 'product_created',
    action_category: 'inventory',
    description: 'Created new product "Primus Bière 500ml Caisse (24 bouteilles)"',
    details: {
      sku: 'SKU-BR-011',
      cost_price: 36000,
      selling_price: 44000,
      category: 'Beverages',
    },
    entity_type: 'product',
    entity_id: 'prod-011',
    entity_label: 'Primus Bière 500ml Caisse',
    ip_address: '197.234.12.22',
    created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
  },
  {
    id: 'act-109',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    branch_name: 'Bujumbura Flagship (Rohero)',
    employee_id: 'emp-cashier-1',
    employee_name: 'Nadia Kaneza',
    employee_role: 'Cashier',
    action_type: 'sale_refunded',
    action_category: 'sales',
    description: 'Processed partial refund on Sale #REC-2026-077 (BIF 18,000)',
    details: {
      receipt_number: 'REC-2026-077',
      refund_amount: 18000,
      reason: 'Customer returned damaged packaging item',
    },
    entity_type: 'sale',
    entity_id: 'sale-077',
    entity_label: 'Receipt #REC-2026-077 Refund',
    ip_address: '197.234.12.14',
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
  {
    id: 'act-110',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    branch_name: 'Bujumbura Flagship (Rohero)',
    employee_id: 'demo-user-1',
    employee_name: 'Alex Rivera',
    employee_role: 'Super Administrator',
    action_type: 'settings_updated',
    action_category: 'settings',
    description: 'Updated store receipts header to "BABAS POS & Inventory — Bujumbura"',
    details: {
      section: 'Receipt Settings',
      footer_text: 'Murakoze cane / Merci pour votre visite!',
    },
    entity_type: 'setting',
    entity_id: 'setting-receipt',
    entity_label: 'Business Profile Settings',
    ip_address: '197.234.12.8',
    created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
  },
];

function getStoredLogs(): ActivityLog[] {
  try {
    const raw = localStorage.getItem(DEMO_ACTIVITY_LOGS_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_ACTIVITY_LOGS_KEY, JSON.stringify(INITIAL_DEMO_ACTIVITY_LOGS));
      return INITIAL_DEMO_ACTIVITY_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_ACTIVITY_LOGS;
  }
}

function saveStoredLogs(logs: ActivityLog[]): void {
  try {
    localStorage.setItem(DEMO_ACTIVITY_LOGS_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to persist activity logs to localStorage', err);
  }
}

export interface GetActivityLogsParams {
  businessId?: string;
  employeeId?: string;
  actionCategory?: string;
  actionType?: string;
  branchId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export async function getActivityLogs(params: GetActivityLogsParams = {}): Promise<{
  data: ActivityLog[];
  total: number;
}> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('activity_logs').select('*', { count: 'exact' });

      if (params.employeeId) query = query.eq('employee_id', params.employeeId);
      if (params.actionCategory && params.actionCategory !== 'all') {
        query = query.eq('action_category', params.actionCategory);
      }
      if (params.branchId && params.branchId !== 'all') {
        query = query.eq('branch_id', params.branchId);
      }
      if (params.startDate) {
        query = query.gte('created_at', params.startDate);
      }
      if (params.endDate) {
        query = query.lte('created_at', params.endDate);
      }
      if (params.search) {
        query = query.or(
          `description.ilike.%${params.search}%,employee_name.ilike.%${params.search}%,entity_label.ilike.%${params.search}%`
        );
      }

      query = query.order('created_at', { ascending: false });

      if (params.limit) {
        const offset = params.offset || 0;
        query = query.range(offset, offset + params.limit - 1);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      if (data && data.length > 0) {
        return { data: data as ActivityLog[], total: count || data.length };
      }
    } catch (err) {
      console.warn('Supabase activity_logs fetch failed, fallback to local storage:', err);
    }
  }

  // Fallback demo storage
  let logs = getStoredLogs();

  if (params.employeeId && params.employeeId !== 'all') {
    logs = logs.filter((l) => l.employee_id === params.employeeId);
  }
  if (params.actionCategory && params.actionCategory !== 'all') {
    logs = logs.filter((l) => l.action_category === params.actionCategory);
  }
  if (params.actionType && params.actionType !== 'all') {
    logs = logs.filter((l) => l.action_type === params.actionType);
  }
  if (params.branchId && params.branchId !== 'all') {
    logs = logs.filter((l) => l.branch_id === params.branchId);
  }
  if (params.startDate) {
    const s = new Date(params.startDate).getTime();
    logs = logs.filter((l) => new Date(l.created_at).getTime() >= s);
  }
  if (params.endDate) {
    const e = new Date(params.endDate).getTime();
    logs = logs.filter((l) => new Date(l.created_at).getTime() <= e);
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    logs = logs.filter(
      (l) =>
        l.description.toLowerCase().includes(q) ||
        l.employee_name.toLowerCase().includes(q) ||
        (l.entity_label && l.entity_label.toLowerCase().includes(q)) ||
        (l.branch_name && l.branch_name.toLowerCase().includes(q))
    );
  }

  // Sort descending
  logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const total = logs.length;
  if (params.limit) {
    const offset = params.offset || 0;
    logs = logs.slice(offset, offset + params.limit);
  }

  return { data: logs, total };
}

export async function logActivity(
  input: Omit<ActivityLog, 'id' | 'created_at'> & { created_at?: string }
): Promise<ActivityLog> {
  const newLog: ActivityLog = {
    ...input,
    id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    created_at: input.created_at || new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert([newLog])
        .select()
        .single();
      if (!error && data) return data as ActivityLog;
    } catch (err) {
      console.warn('Supabase log activity insertion failed:', err);
    }
  }

  // Persist locally
  const current = getStoredLogs();
  current.unshift(newLog);
  // Keep last 500 logs locally
  if (current.length > 500) current.length = 500;
  saveStoredLogs(current);

  return newLog;
}

export function exportActivityLogsAsCSV(logs: ActivityLog[]): void {
  const headers = [
    'Date & Time',
    'Employee ID',
    'Employee Name',
    'Role',
    'Branch',
    'Category',
    'Action Type',
    'Description',
    'Related Record',
    'IP Address',
  ];

  const rows = logs.map((l) => [
    `"${new Date(l.created_at).toLocaleString()}"`,
    `"${l.employee_id}"`,
    `"${l.employee_name}"`,
    `"${l.employee_role}"`,
    `"${l.branch_name || ''}"`,
    `"${l.action_category}"`,
    `"${l.action_type}"`,
    `"${l.description.replace(/"/g, '""')}"`,
    `"${l.entity_label ? l.entity_label.replace(/"/g, '""') : ''}"`,
    `"${l.ip_address || ''}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `babas_activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
