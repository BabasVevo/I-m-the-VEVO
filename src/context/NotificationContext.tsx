import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppNotification, NotificationPreferencesConfig } from '@/types/notifications';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  checkAndGenerateAutomatedAlerts,
  subscribeToNotifications,
  playNotificationSound,
} from '@/services/notificationService';
import { fetchSystemSettings, saveSystemSectionSettings } from '@/services/settingsService';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  preferences: NotificationPreferencesConfig;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  updatePreferences: (newPrefs: Partial<NotificationPreferencesConfig>) => Promise<void>;
  triggerChime: () => void;
}

const DEFAULT_PREFERENCES: NotificationPreferencesConfig = {
  inventory_low_stock: true,
  inventory_out_of_stock: true,
  inventory_adjustments: true,
  inventory_negative_stock_prevention: true,
  approvals_expense_requests: true,
  approvals_purchase_requests: true,
  approvals_decisions: true,
  sales_large_transactions: true,
  sales_large_transaction_threshold: 500000,
  sales_void_and_refunds: true,
  sales_unusual_activity: true,
  purchases_po_updates: true,
  purchases_supplier_overdue: true,
  expenses_large_threshold: 1000000,
  security_alerts_enabled: true,
  sound_enabled: true,
  email_digest: 'daily',
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, role, business, branch } = useAuth();
  const businessId = business?.id || 'demo-biz-1';
  const branchId = branch?.id || null;
  const userId = profile?.id || user?.id || null;
  const userRole = role?.name || 'admin';

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [preferences, setPreferences] = useState<NotificationPreferencesConfig>(DEFAULT_PREFERENCES);

  const loadPreferences = useCallback(async () => {
    try {
      const settings = await fetchSystemSettings();
      if (settings.notifications) {
        setPreferences(settings.notifications);
      }
    } catch (err) {
      console.warn('Error loading notification preferences:', err);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchNotifications(businessId, {
        branchId,
        userId,
        userRole,
        limit: 100,
      });
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId, branchId, userId, userRole]);

  // Initial load and automated alert generation
  useEffect(() => {
    loadPreferences();
    checkAndGenerateAutomatedAlerts(businessId, branchId).then(() => {
      loadNotifications();
    });

    const unsubscribe = subscribeToNotifications(businessId, () => {
      loadNotifications();
    });

    return () => {
      unsubscribe();
    };
  }, [businessId, branchId, loadPreferences, loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(businessId, userId);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  const handleRemoveNotification = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleClearAll = async () => {
    await clearAllNotifications(businessId);
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleUpdatePreferences = async (newPrefs: Partial<NotificationPreferencesConfig>) => {
    const merged = { ...preferences, ...newPrefs };
    setPreferences(merged);
    await saveSystemSectionSettings('notifications', merged);
  };

  const triggerChime = () => {
    if (preferences.sound_enabled) {
      playNotificationSound();
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        preferences,
        markAsRead: handleMarkAsRead,
        markAllAsRead: handleMarkAllAsRead,
        removeNotification: handleRemoveNotification,
        clearAll: handleClearAll,
        refreshNotifications: loadNotifications,
        updatePreferences: handleUpdatePreferences,
        triggerChime,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
