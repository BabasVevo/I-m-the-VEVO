import { useState } from 'react';
import { X, Save, Sliders, RotateCcw } from 'lucide-react';
import type { ReceiptSettings } from '@/types/database';
import { DEFAULT_RECEIPT_SETTINGS } from '@/services/saleService';
import { useToast } from '@/context/ToastContext';

interface ReceiptSettingsModalProps {
  isOpen: boolean;
  settings: ReceiptSettings;
  businessId?: string;
  onSave: (settings: ReceiptSettings) => void;
  onClose: () => void;
}

export function ReceiptSettingsModal({
  isOpen,
  settings: initialSettings,
  onSave,
  onClose,
}: ReceiptSettingsModalProps) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState<ReceiptSettings>({
    ...DEFAULT_RECEIPT_SETTINGS,
    ...initialSettings,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    addToast({
      type: 'success',
      title: 'Receipt Settings Saved',
      message: 'Receipt format and custom text preferences updated successfully.',
    });
    onClose();
  };

  const handleReset = () => {
    setFormData(DEFAULT_RECEIPT_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-xs">
      <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all dark:bg-navy-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Receipt & Print Settings
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Customize receipt layout, footer messages, and return policies
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-navy-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Format Selection */}
          <div>
            <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider dark:text-white">
              Default Print Layout
            </label>
            <div className="mt-2 grid grid-cols-3 gap-3">
              {[
                { id: '80mm', label: '80mm Thermal', desc: 'Standard POS Receipt' },
                { id: '58mm', label: '58mm Mini', desc: 'Compact Mobile POS' },
                { id: 'a4', label: 'A4 / Letter', desc: 'Full-page Tax Invoice' },
              ].map((f) => (
                <button
                  type="button"
                  key={f.id}
                  onClick={() =>
                    setFormData({ ...formData, default_format: f.id as '80mm' | '58mm' | 'a4' })
                  }
                  className={`rounded-2xl border p-3 text-left transition-all ${
                    formData.default_format === f.id
                      ? 'border-brand-500 bg-brand-50/50 dark:border-brand-500 dark:bg-brand-950/40'
                      : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-navy-800 dark:bg-navy-800'
                  }`}
                >
                  <p className="text-xs font-bold text-navy-900 dark:text-white">{f.label}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Business Titles & Tagline */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Receipt Header Title (Optional Override)
              </label>
              <input
                type="text"
                placeholder="Leave blank to use Business Name"
                value={formData.header_title || ''}
                onChange={(e) => setFormData({ ...formData, header_title: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-navy-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Subtitle / Slogan
              </label>
              <input
                type="text"
                placeholder="e.g. Quality Retail & Fresh Goods"
                value={formData.subtitle || ''}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-navy-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
              />
            </div>
          </div>

          {/* Footer & Return Policy */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Footer Thank You Message
              </label>
              <input
                type="text"
                value={formData.footer_message || ''}
                onChange={(e) => setFormData({ ...formData, footer_message: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-navy-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Return & Refund Policy Notice
              </label>
              <textarea
                rows={2}
                value={formData.return_policy || ''}
                onChange={(e) => setFormData({ ...formData, return_policy: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-navy-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
              />
            </div>
          </div>

          {/* Display Toggles */}
          <div>
            <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider dark:text-white">
              Display Elements
            </label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white p-3 dark:border-navy-800 dark:bg-navy-800">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Show Tax / VAT Breakdown
                </span>
                <input
                  type="checkbox"
                  checked={formData.show_tax_breakdown}
                  onChange={(e) =>
                    setFormData({ ...formData, show_tax_breakdown: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white p-3 dark:border-navy-800 dark:bg-navy-800">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Show Cashier / Staff Name
                </span>
                <input
                  type="checkbox"
                  checked={formData.show_cashier}
                  onChange={(e) => setFormData({ ...formData, show_cashier: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white p-3 dark:border-navy-800 dark:bg-navy-800">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Show Scannable Barcode
                </span>
                <input
                  type="checkbox"
                  checked={formData.show_barcode}
                  onChange={(e) => setFormData({ ...formData, show_barcode: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white p-3 dark:border-navy-800 dark:bg-navy-800">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Show Customer Information
                </span>
                <input
                  type="checkbox"
                  checked={formData.show_customer_info}
                  onChange={(e) =>
                    setFormData({ ...formData, show_customer_info: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-navy-800">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-navy-900 dark:hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:bg-navy-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 active:scale-95"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
