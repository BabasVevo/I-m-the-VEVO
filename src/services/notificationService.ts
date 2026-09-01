import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  AppNotification,
  CreateNotificationInput,
  NotificationCategory,
  NotificationSeverity,
} from '@/types/notifications';
import { getStoredProducts, getStoredInventory } from './productService';
import { getStoredExpenses } from './expenseService';
import { getStoredPurchases } from './purchaseService';
import { getStoredSuppliers } from './supplierService';
import { fetchSystemSettings } from './settingsService';

export const NOTIFICATIONS_STORAGE_KEY = 'babas_demo_notifications_v1';
export const NOTIFICATIONS_EVENT_KEY = 'babas_notification_event';

export const INITIAL_DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    user_id: null,
    title: 'Low Stock Alert',
    message: 'Primus Beer 500ml stock is low (8 bottles remaining, minimum threshold is 24). Reordering recommended.',
    category: 'inventory',
    severity: 'warning',
    action_url: '/stock',
    entity_type: 'product',
    entity_id: 'prod-3',
    entity_label: 'Primus Beer 500ml',
    is_read: false,
    dedup_key: 'low-stock-prod-3',
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    metadata: { current_stock: 8, min_stock: 24 },
  },
  {
    id: 'notif-2',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    user_id: null,
    title: 'Expense Approval Required',
    message: 'Store Generator Fuel & Utility Voucher #EXP-2026-000401 (BIF 850,000) has been submitted for management approval.',
    category: 'approvals',
    severity: 'info',
    action_url: '/expenses?status=pending_approval',
    entity_type: 'expense',
    entity_id: 'exp-1',
    entity_label: 'Voucher #EXP-2026-000401',
    is_read: false,
    dedup_key: 'pending-expense-exp-1',
    created_at: new Date(Date.now() - 50 * 60000).toISOString(),
    metadata: { amount: 850000, payee: 'REGIDESO Bujumbura' },
  },
  {
    id: 'notif-3',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    user_id: null,
    title: 'Purchase Order Awaiting Approval',
    message: 'PO-2026-000104 from Burundi Tech Importers (BIF 1,593,000) awaits manager sign-off.',
    category: 'approvals',
    severity: 'info',
    action_url: '/purchases?id=po-4',
    entity_type: 'purchase_order',
    entity_id: 'po-4',
    entity_label: 'PO-2026-000104',
    is_read: false,
    dedup_key: 'pending-po-po-4',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    metadata: { grand_total: 1593000, supplier_name: 'Burundi Tech Importers Ltd' },
  },
  {
    id: 'notif-4',
    business_id: 'demo-biz-1',
    branch_id: 'branch-masaki',
    user_id: null,
    title: 'Out of Stock Warning',
    message: 'Wireless 2D Barcode Scanner Bluetooth is completely out of stock in Gitega branch.',
    category: 'inventory',
    severity: 'error',
    action_url: '/stock',
    entity_type: 'product',
    entity_id: 'prod-4',
    entity_label: 'Wireless 2D Barcode Scanner',
    is_read: true,
    read_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    dedup_key: 'out-of-stock-prod-4',
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    metadata: { current_stock: 0 },
  },
  {
    id: 'notif-5',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    user_id: null,
    title: 'Large Sale Transaction',
    message: 'High-value sale #REC-2026-081 for BIF 145,000 was completed by Nadia Kaneza.',
    category: 'sales',
    severity: 'success',
    action_url: '/sales',
    entity_type: 'sale',
    entity_id: 'sale-081',
    entity_label: 'Receipt #REC-2026-081',
    is_read: true,
    read_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    dedup_key: 'sale-sale-081',
    created_at: new Date(Date.now() - 14 * 3600000).toISOString(),
    metadata: { total_amount: 145000, payment_method: 'mobile_money' },
  },
  {
    id: 'notif-6',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    user_id: null,
    title: 'Supplier Balance Overdue',
    message: 'Outstanding invoice balance of BIF 1,800,000 due to Bujumbura Coffee Roasters has reached 30-day terms.',
    category: 'purchases',
    severity: 'warning',
    action_url: '/suppliers',
    entity_type: 'supplier',
    entity_id: 'supp-1',
    entity_label: 'Bujumbura Coffee Roasters',
    is_read: false,
    dedup_key: 'overdue-supp-1',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    metadata: { due_amount: 1800000 },
  },
  {
    id: 'notif-7',
    business_id: 'demo-biz-1',
    branch_id: null,
    user_id: null,
    title: 'System Security Notice',
    message: 'Audit logging active for all manager approval operations and financial adjustments.',
    category: 'security',
    severity: 'info',
    action_url: '/activity-log',
    entity_type: 'system',
    entity_id: null,
    entity_label: 'System Audit',
    is_read: true,
    read_at: new Date(Date.now() - 28 * 3600000).toISOString(),
    dedup_key: 'security-audit-init',
    created_at: new Date(Date.now() - 30 * 3600000).toISOString(),
    metadata: {},
  },
];

export function getStoredNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_NOTIFICATIONS));
      return INITIAL_DEMO_NOTIFICATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_DEMO_NOTIFICATIONS;
  } catch (err) {
    console.error('Error reading stored notifications:', err);
    return INITIAL_DEMO_NOTIFICATIONS;
  }
}

export function saveStoredNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    // Broadcast cross-tab and in-tab update event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT_KEY, { detail: { count: notifications.length } }));
    }
  } catch (err) {
    console.error('Error saving stored notifications:', err);
  }
}

export interface FetchNotificationsFilter {
  category?: NotificationCategory | 'all';
  severity?: NotificationSeverity | 'all';
  isRead?: boolean | 'all';
  search?: string;
  branchId?: string | null;
  userId?: string | null;
  userRole?: string | null;
  limit?: number;
}

export async function fetchNotifications(
  businessId: string,
  filter: FetchNotificationsFilter = {}
): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
  const {
    category = 'all',
    severity = 'all',
    isRead = 'all',
    search,
    branchId,
    userId,
    userRole,
    limit = 100,
  } = filter;

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('business_id', businessId);

      if (category !== 'all') query = query.eq('category', category);
      if (severity !== 'all') query = query.eq('severity', severity);
      if (isRead !== 'all') query = query.eq('is_read', isRead);
      if (branchId) query = query.or(`branch_id.eq.${branchId},branch_id.is.null`);
      if (userId) query = query.or(`user_id.eq.${userId},user_id.is.null`);

      const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);

      if (!error && data) {
        let list = data as AppNotification[];
        if (search && search.trim()) {
          const q = search.toLowerCase().trim();
          list = list.filter(
            (n) =>
              n.title.toLowerCase().includes(q) ||
              n.message.toLowerCase().includes(q) ||
              (n.entity_label && n.entity_label.toLowerCase().includes(q))
          );
        }
        const unreadCount = list.filter((n) => !n.is_read).length;
        return { notifications: list, unreadCount };
      }
    } catch (err) {
      console.warn('Supabase fetchNotifications fallback to local:', err);
    }
  }

  // Fallback to localStorage
  let list = getStoredNotifications().filter(
    (n) => n.business_id === businessId || businessId === 'demo-biz-1'
  );

  // Role based filtering for sensitive notifications
  const isSuperAdminOrAdmin =
    userRole === 'super_admin' || userRole === 'admin' || userRole === 'business_owner';
  const isManager = isSuperAdminOrAdmin || userRole === 'branch_manager';

  if (!isManager) {
    // Non-managers only see non-sensitive categories (e.g. inventory alerts, assigned tasks)
    list = list.filter(
      (n) => n.category === 'inventory' || n.category === 'system' || n.user_id === userId
    );
  }

  if (branchId) {
    list = list.filter((n) => !n.branch_id || n.branch_id === branchId);
  }

  if (userId) {
    list = list.filter((n) => !n.user_id || n.user_id === userId);
  }

  if (category !== 'all') {
    list = list.filter((n) => n.category === category);
  }

  if (severity !== 'all') {
    list = list.filter((n) => n.severity === severity);
  }

  if (isRead !== 'all') {
    list = list.filter((n) => n.is_read === isRead);
  }

  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.entity_label && n.entity_label.toLowerCase().includes(q))
    );
  }

  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const unreadCount = list.filter((n) => !n.is_read).length;

  return {
    notifications: list.slice(0, limit),
    unreadCount,
  };
}

export async function createNotification(
  input: CreateNotificationInput
): Promise<AppNotification> {
  const now = new Date().toISOString();
  const newNotif: AppNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    business_id: input.business_id,
    branch_id: input.branch_id || null,
    user_id: input.user_id || null,
    title: input.title.trim(),
    message: input.message.trim(),
    category: input.category,
    severity: input.severity || 'info',
    action_url: input.action_url || null,
    entity_type: input.entity_type || null,
    entity_id: input.entity_id || null,
    entity_label: input.entity_label || null,
    is_read: false,
    read_at: null,
    dedup_key: input.dedup_key || null,
    created_at: now,
    metadata: input.metadata || null,
  };

  // Prevent duplicate if dedup_key exists within last 24h
  const list = getStoredNotifications();
  if (newNotif.dedup_key) {
    const existing = list.find((n) => n.dedup_key === newNotif.dedup_key);
    if (existing) {
      const existingTime = new Date(existing.created_at).getTime();
      const hoursAgo = (Date.now() - existingTime) / (1000 * 60 * 60);
      if (hoursAgo < 24) {
        // Already alerted recently
        return existing;
      }
    }
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          business_id: newNotif.business_id,
          branch_id: newNotif.branch_id,
          user_id: newNotif.user_id,
          title: newNotif.title,
          message: newNotif.message,
          category: newNotif.category,
          severity: newNotif.severity,
          action_url: newNotif.action_url,
          entity_type: newNotif.entity_type,
          entity_id: newNotif.entity_id,
          entity_label: newNotif.entity_label,
          is_read: false,
          dedup_key: newNotif.dedup_key,
          metadata: newNotif.metadata,
        })
        .select()
        .single();

      if (!error && data) {
        list.unshift(data as AppNotification);
        saveStoredNotifications(list);
        return data as AppNotification;
      }
    } catch (err) {
      console.warn('Supabase createNotification fallback:', err);
    }
  }

  list.unshift(newNotif);
  saveStoredNotifications(list);
  return newNotif;
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<boolean> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: now })
        .eq('id', notificationId);
    } catch (err) {
      console.warn('Supabase markNotificationAsRead fallback:', err);
    }
  }

  const list = getStoredNotifications();
  const idx = list.findIndex((n) => n.id === notificationId);
  if (idx !== -1) {
    list[idx] = { ...list[idx], is_read: true, read_at: now };
    saveStoredNotifications(list);
    return true;
  }
  return false;
}

export async function markAllNotificationsAsRead(
  businessId: string,
  userId?: string | null
): Promise<boolean> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('notifications')
        .update({ is_read: true, read_at: now })
        .eq('business_id', businessId)
        .eq('is_read', false);

      if (userId) query = query.or(`user_id.eq.${userId},user_id.is.null`);
      await query;
    } catch (err) {
      console.warn('Supabase markAllNotificationsAsRead fallback:', err);
    }
  }

  const list = getStoredNotifications();
  const updated = list.map((n) => {
    if ((n.business_id === businessId || businessId === 'demo-biz-1') && !n.is_read) {
      if (!userId || !n.user_id || n.user_id === userId) {
        return { ...n, is_read: true, read_at: now };
      }
    }
    return n;
  });

  saveStoredNotifications(updated);
  return true;
}

export async function deleteNotification(
  notificationId: string
): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('notifications').delete().eq('id', notificationId);
    } catch (err) {
      console.warn('Supabase deleteNotification fallback:', err);
    }
  }

  const list = getStoredNotifications();
  const filtered = list.filter((n) => n.id !== notificationId);
  saveStoredNotifications(filtered);
  return true;
}

export async function clearAllNotifications(
  businessId: string
): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('notifications').delete().eq('business_id', businessId);
    } catch (err) {
      console.warn('Supabase clearAllNotifications fallback:', err);
    }
  }

  const list = getStoredNotifications();
  const filtered = list.filter(
    (n) => n.business_id !== businessId && businessId !== 'demo-biz-1'
  );
  saveStoredNotifications(filtered);
  return true;
}

/**
 * Automatically inspects the current inventory, pending approvals, and supplier payables
 * and generates appropriate high-priority notifications without creating duplicates.
 */
export async function checkAndGenerateAutomatedAlerts(
  businessId: string,
  branchId?: string | null
): Promise<void> {
  try {
    const settings = await fetchSystemSettings();
    const prefs = settings.notifications;

    // 1. Check Inventory Low Stock & Out of Stock
    if (prefs.inventory_low_stock || prefs.inventory_out_of_stock) {
      const products = getStoredProducts();
      const inventory = getStoredInventory();

      for (const prod of products) {
        const branchInv = inventory.filter((inv) => inv.product_id === prod.id);
        const totalQty = branchInv.reduce((sum, i) => sum + i.quantity, 0);
        const minThreshold = prod.min_stock_level || settings.inventory.default_low_stock_threshold || 10;

        if (prefs.inventory_out_of_stock && totalQty <= 0) {
          await createNotification({
            business_id: businessId,
            branch_id: branchId || null,
            title: 'Out of Stock Alert',
            message: `Product "${prod.name}" is completely out of stock (${totalQty} ${prod.unit}). Immediate replenishment required.`,
            category: 'inventory',
            severity: 'error',
            action_url: '/stock',
            entity_type: 'product',
            entity_id: prod.id,
            entity_label: prod.name,
            dedup_key: `out-of-stock-${prod.id}`,
            metadata: { current_stock: totalQty, unit: prod.unit },
          });
        } else if (prefs.inventory_low_stock && totalQty <= minThreshold) {
          await createNotification({
            business_id: businessId,
            branch_id: branchId || null,
            title: 'Low Stock Warning',
            message: `Product "${prod.name}" has reached low stock level (${totalQty} ${prod.unit} remaining, threshold: ${minThreshold}).`,
            category: 'inventory',
            severity: 'warning',
            action_url: '/stock',
            entity_type: 'product',
            entity_id: prod.id,
            entity_label: prod.name,
            dedup_key: `low-stock-${prod.id}`,
            metadata: { current_stock: totalQty, min_stock: minThreshold },
          });
        }
      }
    }

    // 2. Check Pending Expense Approvals
    if (prefs.approvals_expense_requests) {
      const expenses = getStoredExpenses();
      const pendingExpenses = expenses.filter((e) => e.status === 'pending_approval');

      for (const exp of pendingExpenses) {
        await createNotification({
          business_id: businessId,
          branch_id: exp.branch_id || null,
          title: 'Pending Expense Approval',
          message: `Expense voucher ${exp.expense_number} for BIF ${exp.amount.toLocaleString()} ("${exp.description}") is awaiting manager approval.`,
          category: 'approvals',
          severity: 'info',
          action_url: '/expenses?status=pending_approval',
          entity_type: 'expense',
          entity_id: exp.id,
          entity_label: exp.expense_number,
          dedup_key: `pending-expense-${exp.id}`,
          metadata: { amount: exp.amount, payee: exp.payee },
        });
      }
    }

    // 3. Check Pending Purchase Order Approvals
    if (prefs.approvals_purchase_requests) {
      const purchases = getStoredPurchases();
      const pendingPOs = purchases.filter((po) => po.status === 'pending_approval' || (po.status === 'draft' && po.grand_total > 1000000));

      for (const po of pendingPOs) {
        if (po.status === 'pending_approval') {
          await createNotification({
            business_id: businessId,
            branch_id: po.branch_id || null,
            title: 'Purchase Order Approval Required',
            message: `Purchase Order ${po.po_number} for BIF ${po.grand_total.toLocaleString()} requires authorization.`,
            category: 'approvals',
            severity: 'info',
            action_url: `/purchases?id=${po.id}`,
            entity_type: 'purchase_order',
            entity_id: po.id,
            entity_label: po.po_number,
            dedup_key: `pending-po-${po.id}`,
            metadata: { grand_total: po.grand_total },
          });
        }
      }
    }

    // 4. Check Overdue Supplier Payables
    if (prefs.purchases_supplier_overdue) {
      const suppliers = getStoredSuppliers();
      const overdueSuppliers = suppliers.filter((s) => s.current_balance > 0 && s.status === 'active');

      for (const sup of overdueSuppliers) {
        if (sup.current_balance >= 1000000) {
          await createNotification({
            business_id: businessId,
            branch_id: sup.assigned_branch_id || null,
            title: 'Supplier Payable Reminder',
            message: `Supplier "${sup.name}" has an outstanding payable balance of BIF ${sup.current_balance.toLocaleString()}.`,
            category: 'purchases',
            severity: 'warning',
            action_url: '/suppliers',
            entity_type: 'supplier',
            entity_id: sup.id,
            entity_label: sup.name,
            dedup_key: `supplier-due-${sup.id}`,
            metadata: { current_balance: sup.current_balance },
          });
        }
      }
    }
  } catch (err) {
    console.error('Error running automated alert checks:', err);
  }
}

/**
 * Play a crisp, subtle notification chime using Web Audio API
 */
export function playNotificationSound(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.28); // D6

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.15);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);
  } catch {
    // Audio playback prevented or unavailable; safely ignore
  }
}

/**
 * Real-time subscription hook handler for Supabase and local storage
 */
export function subscribeToNotifications(
  businessId: string,
  onUpdate: () => void
): () => void {
  // 1. In-tab custom event listener
  const handleCustomEvent = () => {
    onUpdate();
  };

  // 2. Cross-tab storage listener
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === NOTIFICATIONS_STORAGE_KEY) {
      onUpdate();
    }
  };

  window.addEventListener(NOTIFICATIONS_EVENT_KEY, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  let supabaseChannel: ReturnType<typeof supabase.channel> | null = null;

  if (isSupabaseConfigured) {
    try {
      supabaseChannel = supabase
        .channel(`public:notifications:${businessId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `business_id=eq.${businessId}` },
          () => {
            onUpdate();
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Could not establish Supabase realtime channel:', err);
    }
  }

  // Cleanup handler
  return () => {
    window.removeEventListener(NOTIFICATIONS_EVENT_KEY, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
    if (supabaseChannel) {
      supabase.removeChannel(supabaseChannel);
    }
  };
}
