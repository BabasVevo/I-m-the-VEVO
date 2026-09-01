import React, { useState } from 'react';
import {
  Bell,
  Boxes,
  ClipboardCheck,
  Receipt,
  Volume2,
  Save,
  CheckCircle2,
  Play,
} from 'lucide-react';
import type { NotificationPreferencesConfig } from '@/types/notifications';
import { useNotifications } from '@/context/NotificationContext';
import { useToast } from '@/context/ToastContext';

interface NotificationSettingsTabProps {
  initialConfig?: NotificationPreferencesConfig;
  onSave?: (config: NotificationPreferencesConfig) => Promise<void>;
}

export function NotificationSettingsTab({
  initialConfig,
  onSave,
}: NotificationSettingsTabProps) {
  const { preferences, updatePreferences, triggerChime } = useNotifications();
  const { showToast } = useToast();

  const [config, setConfig] = useState<NotificationPreferencesConfig>(
    initialConfig || preferences
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggle = (key: keyof NotificationPreferencesConfig) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleThresholdChange = (key: 'sales_large_transaction_threshold' | 'expenses_large_threshold', value: number) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (onSave) {
        await onSave(config);
      } else {
        await updatePreferences(config);
      }
      setSavedSuccess(true);
      showToast('Notification settings saved successfully', 'success');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Tab Intro */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-navy-800">
        <div>
          <h2 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            Notifications & Workflow Automation Settings
          </h2>
          <p className="text-xs text-gray-500 dark:text-navy-400 mt-1">
            Configure automated alerts, threshold triggers, approval routing, and audio chime feedback.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-700 transition disabled:opacity-50"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Preferences
            </>
          )}
        </button>
      </div>

      {/* 1. INVENTORY AUTOMATED ALERTS */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-navy-800 dark:bg-navy-900">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">Inventory & Stock Alerts</h3>
            <p className="text-xs text-gray-500 dark:text-navy-400">Real-time alerts for stock availability and reorder triggers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start justify-between rounded-xl border border-gray-100 p-3.5 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40">
            <div>
              <p className="text-xs font-bold text-navy-900 dark:text-white">Low Stock Warnings</p>
              <p className="text-[11px] text-gray-500 dark:text-navy-400 mt-0.5">
                Notify when items drop to or below their reorder threshold.
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.inventory_low_stock}
              onChange={() => handleToggle('inventory_low_stock')}
              className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 mt-1 cursor-pointer"
            />
          </div>

          <div className="flex items-start justify-between rounded-xl border border-gray-100 p-3.5 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40">
            <div>
              <p className="text-xs font-bold text-navy-900 dark:text-white">Out of Stock Alerts</p>
              <p className="text-[11px] text-gray-500 dark:text-navy-400 mt-0.5">
                Critical priority alert when an inventory item hits 0 units.
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.inventory_out_of_stock}
              onChange={() => handleToggle('inventory_out_of_stock')}
              className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 mt-1 cursor-pointer"
            />
          </div>

          <div className="flex items-start justify-between rounded-xl border border-gray-100 p-3.5 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40">
            <div>
              <p className="text-xs font-bold text-navy-900 dark:text-white">Stock Adjustment Logging</p>
              <p className="text-[11px] text-gray-500 dark:text-navy-400 mt-0.5">
                Notify managers when inventory counts are manually adjusted or corrected.
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.inventory_adjustments}
              onChange={() => handleToggle('inventory_adjustments')}
              className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 mt-1 cursor-pointer"
            />
          </div>

          <div className="flex items-start justify-between rounded-xl border border-gray-100 p-3.5 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40">
            <div>
              <p className="text-xs font-bold text-navy-900 dark:text-white">Negative Stock Prevention Alerts</p>
              <p className="text-[11px] text-gray-500 dark:text-navy-400 mt-0.5">
                Log and alert when cashiers attempt to sell unstocked goods.
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.inventory_negative_stock_prevention}
              onChange={() => handleToggle('inventory_negative_stock_prevention')}
              className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 mt-1 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 2. APPROVAL WORKFLOWS */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-navy-800 dark:bg-navy-900">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">Approval Workflows & Sign-Offs</h3>
            <p className="text-xs text-gray-500 dark:text-navy-400">Routing and notifications for manager authorizations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start justify-between rounded-xl border border-gray-100 p-3.5 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40">
            <div>
              <p className="text-xs font-bold text-navy-900 dark:text-white">Expense Approval Requests</p>
              <p className="text-[11px] text-gray-500 dark:text-navy-400 mt-0.5">
                Alert branch managers when staff submit expense vouchers for review.
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.approvals_expense_requests}
              onChange={() => handleToggle('approvals_expense_requests')}
              className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 mt-1 cursor-pointer"
            />
          </div>

          <div className="flex items-start justify-between rounded-xl border border-gray-100 p-3.5 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40">
            <div>
              <p className="text-xs font-bold text-navy-900 dark:text-white">Purchase Order Approvals</p>
              <p className="text-[11px] text-gray-500 dark:text-navy-400 mt-0.5">
                Alert administrators when purchase orders require sign-off before supplier issuance.
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.approvals_purchase_requests}
              onChange={() => handleToggle('approvals_purchase_requests')}
              className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 mt-1 cursor-pointer"
            />
          </div>

          <div className="flex items-start justify-between rounded-xl border border-gray-100 p-3.5 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 md:col-span-2">
            <div>
              <p className="text-xs font-bold text-navy-900 dark:text-white">Decision Feedback to Requesters</p>
              <p className="text-[11px] text-gray-500 dark:text-navy-400 mt-0.5">
                Instantly notify staff members when their submitted expenses or purchase orders are approved or rejected.
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.approvals_decisions}
              onChange={() => handleToggle('approvals_decisions')}
              className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 mt-1 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. SALES & POS THRESHOLD NOTIFICATIONS */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-navy-800 dark:bg-navy-900">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">Sales & POS Alerts</h3>
            <p className="text-xs text-gray-500 dark:text-navy-400">Large transaction triggers, void receipts, and cashier anomalies</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gray-100 p-3.5 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40">
            <div className="flex-1">
              <p className="text-xs font-bold text-navy-900 dark:text-white">High-Value Sale Alert Trigger</p>
              <p className="text-[11px] text-gray-500 dark:text-navy-400 mt-0.5">
                Trigger manager notification when a single receipt exceeds this amount.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.sales_large_transactions}
                onChange={() => handleToggle('sales_large_transactions')}
                className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-500">Threshold (BIF):</span>
                <input
                  type="number"
                  min="50000"
                  step="50000"
                  value={config.sales_large_transaction_threshold}
                  onChange={(e) =>
                    handleThresholdChange(
                      'sales_large_transaction_threshold',
                      parseInt(e.target.value) || 500000
                    )
                  }
                  className="w-32 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-bold text-navy-900 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start justify-between rounded-xl border border-gray-100 p-3.5 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40">
              <div>
                <p className="text-xs font-bold text-navy-900 dark:text-white">Voided Receipts & Returns</p>
                <p className="text-[11px] text-gray-500 dark:text-navy-400 mt-0.5">
                  Alert on voided sales or customer returns for audit integrity.
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.sales_void_and_refunds}
                onChange={() => handleToggle('sales_void_and_refunds')}
                className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 mt-1 cursor-pointer"
              />
            </div>

            <div className="flex items-start justify-between rounded-xl border border-gray-100 p-3.5 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40">
              <div>
                <p className="text-xs font-bold text-navy-900 dark:text-white">Unusual Discount / Price Overrides</p>
                <p className="text-[11px] text-gray-500 dark:text-navy-400 mt-0.5">
                  Notify when discounts above 15% are applied at checkout.
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.sales_unusual_activity}
                onChange={() => handleToggle('sales_unusual_activity')}
                className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 mt-1 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. SOUND & DELIVERY PREFERENCES */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-navy-800 dark:bg-navy-900">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
            <Volume2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">Audio & Delivery Preferences</h3>
            <p className="text-xs text-gray-500 dark:text-navy-400">Sound chime feedback and digest frequency</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3.5 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40">
            <div>
              <p className="text-xs font-bold text-navy-900 dark:text-white">Audio Chime on New Notifications</p>
              <p className="text-[11px] text-gray-500 dark:text-navy-400 mt-0.5">
                Play a gentle acoustic chime when urgent alerts or approvals arrive.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={triggerChime}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-2xs font-semibold text-navy-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200"
                title="Play test audio chime"
              >
                <Play className="h-3 w-3" /> Test
              </button>
              <input
                type="checkbox"
                checked={config.sound_enabled}
                onChange={() => handleToggle('sound_enabled')}
                className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 p-3.5 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40">
            <p className="text-xs font-bold text-navy-900 dark:text-white">Summary Digest Frequency</p>
            <p className="text-[11px] text-gray-500 dark:text-navy-400 mt-0.5 mb-2">
              Automated manager executive summary report dispatch.
            </p>
            <select
              value={config.email_digest}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  email_digest: e.target.value as NotificationPreferencesConfig['email_digest'],
                }))
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-900 dark:text-white"
            >
              <option value="daily">Daily Morning Digest (07:30 CAT)</option>
              <option value="weekly">Weekly Executive Summary (Monday 08:00)</option>
              <option value="instant">Instant Alerts Only</option>
              <option value="none">Disabled</option>
            </select>
          </div>
        </div>
      </div>
    </form>
  );
}
