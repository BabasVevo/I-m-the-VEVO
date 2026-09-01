import { useState, type FormEvent } from 'react';
import {
  Boxes,
  Layers,
  Sliders,
  Save,
  Loader2,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import type { InventoryConfig, StockValuationMethod } from '@/types/settings';
import { useToast } from '@/context/ToastContext';

interface InventorySettingsTabProps {
  initialConfig: InventoryConfig;
  onSave: (config: InventoryConfig) => Promise<void>;
  loading?: boolean;
  canEdit?: boolean;
}

export function InventorySettingsTab({
  initialConfig,
  onSave,
  loading = false,
  canEdit = true,
}: InventorySettingsTabProps) {
  const { addToast } = useToast();
  const [form, setForm] = useState<InventoryConfig>(initialConfig);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.default_low_stock_threshold < 0) {
      addToast('Low stock threshold cannot be negative.', 'error');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      addToast('Inventory & stock valuation settings saved successfully.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save inventory settings.';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const sampleSku = `${form.sku_prefix}${String(1).padStart(form.sku_number_length, '0')}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
          <Boxes className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          Inventory & Stock Management Settings
        </h2>
        <p className="text-sm text-gray-500 dark:text-navy-300 mt-1">
          Define global valuation methodologies, low-stock threshold triggers, stock adjustment governance, and automated SKU generation schemes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Stock Valuation & Accounting Methods */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Stock Valuation Methodology
              </h3>
              <p className="text-xs text-gray-500 dark:text-navy-400">
                Dictates how cost of goods sold (COGS) and closing inventory asset balances are calculated across all branches.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: 'fifo',
                name: 'FIFO (First-In, First-Out)',
                desc: 'Oldest stock received is assumed sold first. Standard for retail & perishables.',
                badge: 'Recommended for BABAS',
              },
              {
                id: 'wac',
                name: 'WAC (Weighted Average Cost)',
                desc: 'Averages purchase cost per unit across all active batches in warehouse.',
                badge: 'Common in Distribution',
              },
              {
                id: 'lifo',
                name: 'LIFO (Last-In, First-Out)',
                desc: 'Newest stock received is accounted as sold first. Specialized accounting use.',
                badge: 'Specialized',
              },
            ].map((method) => (
              <label
                key={method.id}
                className={`relative flex flex-col justify-between p-4 rounded-xl border-2 cursor-pointer transition ${
                  form.stock_valuation_method === method.id
                    ? 'border-brand-600 bg-brand-50/40 dark:bg-brand-950/30'
                    : 'border-gray-200 dark:border-navy-800 hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-navy-900 dark:text-white">
                      {method.name}
                    </span>
                    <input
                      type="radio"
                      name="valuation_method"
                      value={method.id}
                      checked={form.stock_valuation_method === method.id}
                      onChange={(e) => setForm({ ...form, stock_valuation_method: e.target.value as StockValuationMethod })}
                      disabled={!canEdit}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-navy-400 mt-1 leading-relaxed">
                    {method.desc}
                  </p>
                </div>
                <span className="mt-3 text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-white dark:bg-navy-900 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-900 self-start">
                  {method.badge}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Global Thresholds & Stock Governance */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Thresholds & Stock Governance
              </h3>
              <p className="text-xs text-gray-500 dark:text-navy-400">
                Configure automated replenishment triggers and inventory adjustment authorization policies.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                Default Low Stock Warning Threshold (Units) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.default_low_stock_threshold}
                onChange={(e) => setForm({ ...form, default_low_stock_threshold: parseInt(e.target.value, 10) || 0 })}
                disabled={!canEdit}
                className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[11px] text-gray-500 dark:text-navy-400 mt-1">
                Products with on-hand quantity at or below this level automatically trigger low-stock alerts and purchase order recommendations.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                Barcode Symbology Standard
              </label>
              <select
                value={form.barcode_symbology}
                onChange={(e) => setForm({ ...form, barcode_symbology: e.target.value as 'code128' | 'ean13' | 'upca' | 'qr' })}
                disabled={!canEdit}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="code128">Code 128 (Universal High Density Barcode)</option>
                <option value="ean13">EAN-13 (Standard Retail Barcode)</option>
                <option value="upca">UPC-A (North American Retail)</option>
                <option value="qr">QR Code 2D Matrix</option>
              </select>
              <p className="text-[11px] text-gray-500 dark:text-navy-400 mt-1">
                Used for laser handheld scanners and printable shelf tags.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-navy-800 text-xs">
            {/* Prevent negative stock globally */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-navy-900 dark:text-white">
                  Prevent Negative Inventory Globally
                </div>
                <p className="text-gray-500 dark:text-navy-400">
                  Strictly block any warehouse adjustment, transfer, or sale that would cause on-hand stock to drop below 0.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.prevent_negative_inventory}
                  onChange={(e) => setForm({ ...form, prevent_negative_inventory: e.target.checked })}
                  disabled={!canEdit}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-navy-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-navy-700 peer-checked:bg-brand-600"></div>
              </label>
            </div>

            {/* Require approval */}
            <div className="pt-2 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-navy-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
                  Require Manager Approval for Stock Adjustments
                </div>
                <p className="text-gray-500 dark:text-navy-400">
                  Manual inventory write-offs (damage, expired, shrink) must be approved by an Admin or Branch Manager before ledger balance updates.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.require_adjustment_approval}
                  onChange={(e) => setForm({ ...form, require_adjustment_approval: e.target.checked })}
                  disabled={!canEdit}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-navy-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-navy-700 peer-checked:bg-brand-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Automated Product SKU Generation */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Automated Product SKU Scheme
              </h3>
              <p className="text-xs text-gray-500 dark:text-navy-400">
                Configure standard auto-numbering prefixes for newly created products in catalog.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                SKU Prefix
              </label>
              <input
                type="text"
                value={form.sku_prefix}
                onChange={(e) => setForm({ ...form, sku_prefix: e.target.value.toUpperCase() })}
                disabled={!canEdit}
                placeholder="BBS-"
                className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                Number Length (Zero-padding)
              </label>
              <select
                value={form.sku_number_length}
                onChange={(e) => setForm({ ...form, sku_number_length: parseInt(e.target.value, 10) || 5 })}
                disabled={!canEdit}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              >
                <option value={4}>4 Digits (e.g. 0001)</option>
                <option value={5}>5 Digits (e.g. 00001)</option>
                <option value={6}>6 Digits (e.g. 000001)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                Generated SKU Sample
              </label>
              <div className="h-10 flex items-center px-3 bg-gray-50 dark:bg-navy-950 rounded-lg border border-gray-200 dark:border-navy-800 font-mono font-bold text-brand-600 dark:text-brand-400 text-sm">
                {sampleSku}
              </div>
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Inventory Settings
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
