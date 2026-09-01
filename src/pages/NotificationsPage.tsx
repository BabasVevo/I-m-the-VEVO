import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Search,
  CheckCheck,
  Trash2,
  RefreshCw,
  Boxes,
  ClipboardCheck,
  Receipt,
  Truck,
  CreditCard,
  ShieldAlert,
  AlertTriangle,
  Settings,
  Inbox,
  ChevronRight,
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { AdminAlertsBanner } from '@/components/notifications/AdminAlertsBanner';
import type { NotificationCategory, NotificationSeverity } from '@/types/notifications';

export function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    refreshNotifications,
  } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<NotificationSeverity | 'all'>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Stats calculation
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.is_read).length;
    const approvals = notifications.filter((n) => n.category === 'approvals').length;
    const critical = notifications.filter(
      (n) => n.severity === 'error' || n.severity === 'warning'
    ).length;

    return { total, unread, approvals, critical };
  }, [notifications]);

  // Filtering
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((n) => {
        // Search
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matchTitle = n.title.toLowerCase().includes(q);
          const matchMsg = n.message.toLowerCase().includes(q);
          const matchEntity = n.entity_label?.toLowerCase().includes(q);
          if (!matchTitle && !matchMsg && !matchEntity) return false;
        }

        // Category
        if (selectedCategory !== 'all' && n.category !== selectedCategory) {
          return false;
        }

        // Severity
        if (selectedSeverity !== 'all' && n.severity !== selectedSeverity) {
          return false;
        }

        // Read Status
        if (readFilter === 'unread' && n.is_read) return false;
        if (readFilter === 'read' && !n.is_read) return false;

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [notifications, searchTerm, selectedCategory, selectedSeverity, readFilter, sortOrder]);

  const categories: { id: NotificationCategory | 'all'; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Categories', icon: <Bell className="h-3.5 w-3.5" /> },
    { id: 'approvals', label: 'Approvals', icon: <ClipboardCheck className="h-3.5 w-3.5" /> },
    { id: 'inventory', label: 'Inventory', icon: <Boxes className="h-3.5 w-3.5" /> },
    { id: 'sales', label: 'Sales & POS', icon: <Receipt className="h-3.5 w-3.5" /> },
    { id: 'purchases', label: 'Purchases', icon: <Truck className="h-3.5 w-3.5" /> },
    { id: 'expenses', label: 'Expenses', icon: <CreditCard className="h-3.5 w-3.5" /> },
    { id: 'security', label: 'Security & System', icon: <ShieldAlert className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Admin Quick Alerts Banner */}
      <AdminAlertsBanner />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-navy-900 dark:text-white">
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-navy-400 mt-1">
            Real-time operational alerts, manager approval workflows, stock warnings, and transaction logs.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => refreshNotifications()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200 dark:hover:bg-navy-700"
            title="Refresh notifications"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 border border-brand-200 px-3.5 py-2 text-xs font-bold text-brand-700 shadow-2xs hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/60 dark:text-brand-300"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark All as Read</span>
            </button>
          )}

          <Link
            to="/settings?tab=notifications"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-navy-700 shadow-2xs hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200 dark:hover:bg-navy-700"
          >
            <Settings className="h-3.5 w-3.5 text-gray-500" />
            <span>Preferences</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-navy-400">Total Alerts</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400">
              <Bell className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-navy-900 dark:text-white">{stats.total}</p>
          <span className="text-[11px] text-gray-400">All registered system notices</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-navy-400">Unread</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/70 dark:text-brand-400">
              <Inbox className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-brand-600 dark:text-brand-400">{stats.unread}</p>
          <span className="text-[11px] text-gray-400">Requires review</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-navy-400">Approvals Pending</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
              <ClipboardCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.approvals}</p>
          <Link
            to="/approvals"
            className="text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400 inline-flex items-center gap-0.5"
          >
            Open Approvals Hub <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-navy-400">Critical & Warnings</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">{stats.critical}</p>
          <span className="text-[11px] text-gray-400">Inventory & payment alerts</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900 space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notifications, vouchers, products, suppliers..."
              className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-4 py-2 text-xs text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          {/* Quick Dropdown Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as NotificationSeverity | 'all')}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-navy-900 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              <option value="all">All Severities</option>
              <option value="error">Critical (Error)</option>
              <option value="warning">Warning</option>
              <option value="info">Information</option>
              <option value="success">Success</option>
            </select>

            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value as 'all' | 'unread' | 'read')}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-navy-900 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-navy-900 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Category Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 dark:bg-navy-800 dark:text-navy-300 dark:hover:bg-navy-700'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-xs dark:border-navy-800 dark:bg-navy-900">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-navy-800">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-navy-900 dark:text-white">
              Notification Activity ({filteredNotifications.length})
            </h2>
            {filteredNotifications.length !== notifications.length && (
              <span className="text-xs text-gray-400">
                (Filtered from {notifications.length})
              </span>
            )}
          </div>

          {filteredNotifications.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all notifications?')) {
                  clearAll();
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear List</span>
            </button>
          )}
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-navy-800 dark:text-navy-400 mb-3">
              <Inbox className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">No notifications found</h3>
            <p className="text-xs text-gray-400 max-w-sm mt-1">
              {searchTerm || selectedCategory !== 'all' || readFilter !== 'all'
                ? 'Try adjusting your search terms or filter selections.'
                : 'You have zero active alerts. Everything in the system is operating normally.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onRemove={removeNotification}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
