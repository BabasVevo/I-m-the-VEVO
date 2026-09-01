import { useState, type FormEvent } from 'react';
import {
  Monitor,
  Printer,
  Percent,
  AlertTriangle,
  Save,
  Loader2,
  Store,
  Eye,
} from 'lucide-react';
import type { PosConfig, CompanyProfileConfig, FinancialConfig } from '@/types/settings';
import type { Branch } from '@/types/database';
import { useToast } from '@/context/ToastContext';

interface PosSettingsTabProps {
  initialConfig: PosConfig;
  companyConfig: CompanyProfileConfig;
  financialConfig: FinancialConfig;
  branches: Branch[];
  onSave: (config: PosConfig) => Promise<void>;
  loading?: boolean;
  canEdit?: boolean;
}

export function PosSettingsTab({
  initialConfig,
  companyConfig,
  financialConfig,
  branches,
  onSave,
  loading = false,
  canEdit = true,
}: PosSettingsTabProps) {
  const { addToast } = useToast();
  const [form, setForm] = useState<PosConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(true);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.max_discount_percentage < 0 || form.max_discount_percentage > 100) {
      addToast('Max discount percentage must be between 0% and 100%.', 'error');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      addToast('POS & receipt settings saved successfully.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save POS settings.';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Monitor className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            POS & Cash Register Configuration
          </h2>
          <p className="text-sm text-gray-500 dark:text-navy-300 mt-1">
            Customize thermal receipt layouts, cashier checkout constraints, discount policies, and inventory selling rules.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowReceiptPreview(!showReceiptPreview)}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-800 dark:text-navy-200 hover:bg-gray-50 transition self-start sm:self-auto"
        >
          <Eye className="h-4 w-4 text-brand-600" />
          {showReceiptPreview ? 'Hide Receipt Preview' : 'Show Live Receipt'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className={`space-y-6 ${showReceiptPreview ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          {/* Default Branch & Cashier Defaults */}
          <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <Store className="h-4 w-4 text-brand-600" />
              Default Register Routing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                  Default POS Branch Location
                </label>
                <select
                  value={form.default_branch_id || ''}
                  onChange={(e) => setForm({ ...form, default_branch_id: e.target.value || null })}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">-- Let Cashier Choose at Login --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city || 'Burundi'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                  Default Quick Payment Method
                </label>
                <select
                  value={form.default_payment_method}
                  onChange={(e) => setForm({ ...form, default_payment_method: e.target.value })}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="cash">Cash (Espèces)</option>
                  <option value="lumicash">Lumicash (Viettel)</option>
                  <option value="ecocash">EcoCash (Econet)</option>
                  <option value="bank_transfer">Bank Wire</option>
                  <option value="card">Card Terminal</option>
                  <option value="credit">Customer Credit Account</option>
                </select>
              </div>
            </div>
          </div>

          {/* Checkout Operational Rules */}
          <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <Percent className="h-4 w-4 text-emerald-600" />
              Checkout & Selling Rules
            </h3>

            <div className="space-y-3 divide-y divide-gray-100 dark:divide-navy-800 text-xs">
              {/* Discount Permission */}
              <div className="pt-2 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-navy-900 dark:text-white">
                    Enable Discounts at POS Register
                  </div>
                  <p className="text-gray-500 dark:text-navy-400">
                    Allow cashiers to apply item-level or cart-level promotional discounts.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enable_discounts}
                    onChange={(e) => setForm({ ...form, enable_discounts: e.target.checked })}
                    disabled={!canEdit}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-navy-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-navy-700 peer-checked:bg-brand-600"></div>
                </label>
              </div>

              {form.enable_discounts && (
                <div className="pt-3 pl-4 flex items-center gap-3">
                  <span className="text-gray-600 dark:text-navy-300">Max Discount Limit Allowed:</span>
                  <div className="flex items-center gap-1 w-24">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={form.max_discount_percentage}
                      onChange={(e) => setForm({ ...form, max_discount_percentage: parseInt(e.target.value, 10) || 0 })}
                      disabled={!canEdit}
                      className="w-full px-2 py-1 text-xs font-semibold rounded border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white"
                    />
                    <span>%</span>
                  </div>
                </div>
              )}

              {/* Prevent negative stock */}
              <div className="pt-3 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-navy-900 dark:text-white flex items-center gap-1.5">
                    <span>Allow Selling Out-of-Stock Items (Negative Stock)</span>
                    {form.allow_negative_stock_sale && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </div>
                  <p className="text-gray-500 dark:text-navy-400">
                    If disabled, cashiers cannot add products with 0 stock quantity to the cart.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allow_negative_stock_sale}
                    onChange={(e) => setForm({ ...form, allow_negative_stock_sale: e.target.checked })}
                    disabled={!canEdit}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-navy-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-navy-700 peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Mandatory customer */}
              <div className="pt-3 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-navy-900 dark:text-white">
                    Require Customer Selection for Every Sale
                  </div>
                  <p className="text-gray-500 dark:text-navy-400">
                    If disabled, allows quick checkout with anonymous "Walk-in Customer".
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.require_customer_selection}
                    onChange={(e) => setForm({ ...form, require_customer_selection: e.target.checked })}
                    disabled={!canEdit}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-navy-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-navy-700 peer-checked:bg-brand-600"></div>
                </label>
              </div>

              {/* Auto print */}
              <div className="pt-3 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-navy-900 dark:text-white">
                    Auto-trigger Print Dialog on Sale Completion
                  </div>
                  <p className="text-gray-500 dark:text-navy-400">
                    Immediately opens print preview for thermal printer receipt.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.auto_print_receipt}
                    onChange={(e) => setForm({ ...form, auto_print_receipt: e.target.checked })}
                    disabled={!canEdit}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-navy-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-navy-700 peer-checked:bg-brand-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Thermal Receipt Customization */}
          <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <Printer className="h-4 w-4 text-brand-600" />
              Thermal Receipt & Invoice Template
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                  Receipt Paper Width
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: '58mm', label: '58mm (Small Thermal)' },
                    { key: '80mm', label: '80mm (Standard POS)' },
                    { key: 'a4', label: 'A4 Full Page' },
                  ].map((size) => (
                    <button
                      key={size.key}
                      type="button"
                      onClick={() => setForm({ ...form, receipt_paper_size: size.key as '58mm' | '80mm' | 'a4' })}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border text-center transition ${
                        form.receipt_paper_size === size.key
                          ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-bold'
                          : 'border-gray-200 dark:border-navy-800 text-gray-700 dark:text-navy-300 hover:bg-gray-50'
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                  Receipt Header Title / Slogan
                </label>
                <input
                  type="text"
                  value={form.receipt_header}
                  onChange={(e) => setForm({ ...form, receipt_header: e.target.value })}
                  disabled={!canEdit}
                  placeholder="BABAS Retail & Distribution — Bujumbura"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                  Receipt Footer Message / Thank You Greeting
                </label>
                <textarea
                  rows={2}
                  value={form.receipt_footer}
                  onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })}
                  disabled={!canEdit}
                  placeholder="Murakoze cane kutugendera! / Merci de votre confiance!"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              {/* Toggles grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-navy-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.show_logo_on_receipt}
                    onChange={(e) => setForm({ ...form, show_logo_on_receipt: e.target.checked })}
                    className="rounded border-gray-300 text-brand-600"
                  />
                  <span>Print Company Logo</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-navy-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.show_tax_id_on_receipt}
                    onChange={(e) => setForm({ ...form, show_tax_id_on_receipt: e.target.checked })}
                    className="rounded border-gray-300 text-brand-600"
                  />
                  <span>Print Tax NIF & RC Number</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-navy-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.show_cashier_name}
                    onChange={(e) => setForm({ ...form, show_cashier_name: e.target.checked })}
                    className="rounded border-gray-300 text-brand-600"
                  />
                  <span>Print Cashier Full Name</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-navy-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.show_tax_breakdown}
                    onChange={(e) => setForm({ ...form, show_tax_breakdown: e.target.checked })}
                    className="rounded border-gray-300 text-brand-600"
                  />
                  <span>Print TVA Tax Breakdown</span>
                </label>
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
                Save POS Settings
              </button>
            </div>
          )}
        </form>

        {/* Live Thermal Receipt Preview Column */}
        {showReceiptPreview && (
          <div className="lg:col-span-5 space-y-3">
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold text-gray-500 dark:text-navy-400 tracking-wider">
                  Live Thermal Receipt Simulation ({form.receipt_paper_size})
                </span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                  ESC/POS Compliant
                </span>
              </div>

              {/* Thermal paper visual container */}
              <div className="bg-white text-navy-950 p-6 rounded-xl shadow-xl border border-gray-300 font-mono text-xs max-w-[340px] mx-auto border-t-8 border-t-brand-600">
                {/* Header */}
                <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-400">
                  {form.show_logo_on_receipt && companyConfig.logo_url && (
                    <img
                      src={companyConfig.logo_url}
                      alt="Logo"
                      className="h-10 mx-auto object-contain mb-1"
                    />
                  )}
                  <div className="font-bold text-sm tracking-wider uppercase">
                    {companyConfig.name || 'BABAS'}
                  </div>
                  <div className="text-[10px] text-gray-600">{form.receipt_header}</div>
                  <div className="text-[10px] text-gray-600">{companyConfig.address}</div>
                  <div className="text-[10px] text-gray-600">Tel: {companyConfig.phone}</div>
                  {form.show_tax_id_on_receipt && (
                    <div className="text-[10px] text-gray-600">
                      NIF: {companyConfig.tax_id} • RC: {companyConfig.registration_number}
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>Receipt #:</span>
                    <span className="font-bold">REC-2026-0841</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {form.show_cashier_name && (
                    <div className="flex justify-between">
                      <span>Cashier:</span>
                      <span>Nadia K. (POS #01)</span>
                    </div>
                  )}
                  {form.show_customer_info && (
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span>Hotel Club du Lac</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
                  <div className="flex justify-between font-bold pb-1 border-b border-gray-200">
                    <span>ITEM</span>
                    <span>TOTAL</span>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <div>Savon Brarudi 200g</div>
                      <div className="text-[10px] text-gray-500">2 x {financialConfig.currency_symbol} 4,500</div>
                    </div>
                    <span>{financialConfig.currency_symbol} 9,000</span>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <div>Lait UHT 1L (Pack 6)</div>
                      <div className="text-[10px] text-gray-500">1 x {financialConfig.currency_symbol} 24,000</div>
                    </div>
                    <span>{financialConfig.currency_symbol} 24,000</span>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <div>Sucre SOSUMO 1kg</div>
                      <div className="text-[10px] text-gray-500">3 x {financialConfig.currency_symbol} 3,800</div>
                    </div>
                    <span>{financialConfig.currency_symbol} 11,400</span>
                  </div>
                </div>

                {/* Calculations */}
                <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>{financialConfig.currency_symbol} 44,400</span>
                  </div>
                  {form.enable_discounts && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount (5%):</span>
                      <span>-{financialConfig.currency_symbol} 2,220</span>
                    </div>
                  )}
                  {form.show_tax_breakdown && (
                    <div className="flex justify-between text-gray-600">
                      <span>TVA (18% included):</span>
                      <span>{financialConfig.currency_symbol} 6,434</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-300">
                    <span>TOTAL:</span>
                    <span>{financialConfig.currency_symbol} 42,180</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-[10px] pt-1">
                    <span>Paid (Lumicash):</span>
                    <span>{financialConfig.currency_symbol} 42,180</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 text-center text-[10px] text-gray-600 leading-relaxed">
                  <p>{form.receipt_footer}</p>
                  <p className="mt-2 text-[9px] text-gray-400">Powered by BABAS POS & Inventory</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
