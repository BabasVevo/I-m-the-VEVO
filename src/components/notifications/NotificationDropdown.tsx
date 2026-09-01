import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Volume2,
  VolumeX,
  ExternalLink,
  Loader2,
  Inbox,
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { NotificationItem } from './NotificationItem';

export function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    loading,
    preferences,
    markAsRead,
    markAllAsRead,
    removeNotification,
    updatePreferences,
    triggerChime,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'approvals' | 'alerts'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter((n) => {
    if (filterTab === 'unread') return !n.is_read;
    if (filterTab === 'approvals') return n.category === 'approvals';
    if (filterTab === 'alerts')
      return n.category === 'inventory' || n.severity === 'warning' || n.severity === 'error';
    return true;
  });

  const toggleSound = async () => {
    const nextState = !preferences.sound_enabled;
    await updatePreferences({ sound_enabled: nextState });
    if (nextState) {
      triggerChime();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        id="topbar-notification-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-xl p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-navy-900 dark:text-navy-300 dark:hover:bg-navy-800 dark:hover:text-white"
        title="Notifications & Approvals"
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-extrabold text-white shadow-sm ring-2 ring-white dark:ring-navy-900 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          id="notification-dropdown-panel"
          className="absolute right-0 top-full z-50 mt-2 w-84 sm:w-96 rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all dark:border-navy-700 dark:bg-navy-900 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-navy-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleSound}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:text-navy-400 dark:hover:bg-navy-800 dark:hover:text-white"
                title={preferences.sound_enabled ? 'Sound alerts on (click to mute)' : 'Sound alerts muted (click to enable)'}
              >
                {preferences.sound_enabled ? (
                  <Volume2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                ) : (
                  <VolumeX className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/60"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Read All
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex border-b border-gray-100 px-3 py-1.5 gap-1 bg-white dark:bg-navy-900 dark:border-navy-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`rounded-lg px-2.5 py-1 transition-colors ${
                filterTab === 'all'
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                  : 'text-gray-500 hover:bg-gray-50 dark:text-navy-400 dark:hover:bg-navy-800'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('unread')}
              className={`rounded-lg px-2.5 py-1 transition-colors ${
                filterTab === 'unread'
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                  : 'text-gray-500 hover:bg-gray-50 dark:text-navy-400 dark:hover:bg-navy-800'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('approvals')}
              className={`rounded-lg px-2.5 py-1 transition-colors ${
                filterTab === 'approvals'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'text-gray-500 hover:bg-gray-50 dark:text-navy-400 dark:hover:bg-navy-800'
              }`}
            >
              Approvals
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('alerts')}
              className={`rounded-lg px-2.5 py-1 transition-colors ${
                filterTab === 'alerts'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                  : 'text-gray-500 hover:bg-gray-50 dark:text-navy-400 dark:hover:bg-navy-800'
              }`}
            >
              Alerts
            </button>
          </div>

          {/* List Container */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1.5">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
                <span className="mt-2 text-xs">Checking alerts...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-navy-800 dark:text-navy-400 mb-2">
                  <Inbox className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-navy-900 dark:text-white">All caught up!</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  No {filterTab !== 'all' ? filterTab : ''} notifications at this time.
                </p>
              </div>
            ) : (
              filteredNotifications.slice(0, 8).map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onMarkAsRead={markAsRead}
                  onRemove={removeNotification}
                  onCloseDropdown={() => setIsOpen(false)}
                  compact
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50/70 p-2.5 text-center dark:border-navy-800 dark:bg-navy-950/60 flex items-center justify-between px-4">
            <Link
              to="/approvals"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Approvals Hub →
            </Link>

            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Notification Center <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
