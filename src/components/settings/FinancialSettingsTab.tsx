import { useState, type FormEvent } from 'react';
import {
  Coins,
  Receipt,
  CreditCard,
  Smartphone,
  Building,
  DollarSign,
  Save,
  Loader2,
  Percent,
} from 'lucide-react';
import type { FinancialConfig } from '@/types/settings';
import { useToast } from '@/context/ToastContext';

interface FinancialSettingsTabProps {
  initialConfig: FinancialConfig;
  onSave: (config: FinancialConfig) => Promise<void>;
  loading?: boolean;
  canEdit?: boolean;
}

const SUPPORTED_CURRENCIES = [
  { code: 'BIF', name: 'Burundian Franc (BIF / FBu)', symbol: 'BIF', defaultDecimals: 0, region: 'Burundi (Primary)' },
  { code: 'RWF', name: 'Rwandan Franc (RWF / FRw)', symbol: 'RWF', defaultDecimals: 0, region: 'East Africa' },
  { code: 'TZS', name: 'Tanzanian Shilling (TZS)', symbol: 'TZS', defaultDecimals: 0, region: 'East Africa' },
  { code: 'UGX', name: 'Ugandan Shilling (UGX)', symbol: 'UGX', defaultDecimals: 0, region: 'East Africa' },
  { code: 'KES', name: 'Kenyan Shilling (KES)', symbol: 'KES', defaultDecimals: 0, region: 'East Africa' },
  { code: 'USD', name: 'US Dollar (USD / $)', symbol: '$', defaultDecimals: 2, region: 'International' },
  { code: 'EUR', name: 'Euro (EUR / €)', symbol: '€', defaultDecimals: 2, region: 'International' },
];

export function FinancialSettingsTab({
  initialConfig,
  onSave,
  loading = false,
  canEdit = true,
}: FinancialSettingsTabProps) {
  const { addToast } = useToast();
  const [form, setForm] = useState<FinancialConfig>(initialConfig);
  const [saving, setSaving] = useState(false);

  const handleCurrencyChange = (code: string) => {
    const found = SUPPORTED_CURRENCIES.find((c) => c.code === code);
    if (found) {
      setForm((prev) => ({
        ...prev,
        primary_currency: found.code,
        currency_symbol: found.symbol,
        decimal_places: found.defaultDecimals,
      }));
    }
  };

  const togglePaymentMethod = (id: string) => {
    setForm((prev) => {
      const updated = prev.payment_methods.map((pm) => {
        if (pm.id === id) {
          // Cannot disable if it's default
          if (pm.is_default && pm.enabled) {
            addToast('Cannot disable the default payment method. Set another default first.', 'warning');
            return pm;
          }
          return { ...pm, enabled: !pm.enabled };
        }
        return pm;
      });
      return { ...prev, payment_methods: updated };
    });
  };

  const setDefaultPaymentMethod = (id: string) => {
    setForm((prev) => {
      const updated = prev.payment_methods.map((pm) => ({
        ...pm,
        is_default: pm.id === id,
        enabled: pm.id === id ? true : pm.enabled, // ensure default is enabled
      }));
      return { ...prev, payment_methods: updated };
    });
    addToast('Default payment method updated.', 'info');
  };

  const toggleReferenceRequired = (id: string) => {
    setForm((prev) => {
      const updated = prev.payment_methods.map((pm) => {
        if (pm.id === id) {
          return { ...pm, requires_reference: !pm.requires_reference };
        }
        return pm;
      });
      return { ...prev, payment_methods: updated };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.tax_rate < 0 || form.tax_rate > 100) {
      addToast('Tax rate must be between 0% and 100%.', 'error');
      return;
    }

    setSaving(true);
    try {
      await onSave(form);
      addToast('Financial & currency settings saved successfully.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save financial settings.';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Preview formatting calculation
  const sampleAmount = 145000;
  const formattedSample = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: form.decimal_places,
    maximumFractionDigits: form.decimal_places,
  }).format(sampleAmount);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
          <Coins className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          Currency & Financial Settings
        </h2>
        <p className="text-sm text-gray-500 dark:text-navy-300 mt-1">
          Configure default base currency (Burundian Franc - BIF), tax parameters (TVA), decimal precision, and accepted payment channels.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Currency Card */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Base Operating Currency
              </h3>
              <p className="text-xs text-gray-500 dark:text-navy-400">
                Determines how all prices, ledger entries, POS registers, and revenue reports are denominated.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                Primary Currency <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.primary_currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                disabled={!canEdit}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              >
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.name} ({curr.region})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                Currency Symbol / Display Prefix
              </label>
              <input
                type="text"
                value={form.currency_symbol}
                onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })}
                disabled={!canEdit}
                placeholder="BIF"
                className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                Decimal Precision (Places)
              </label>
              <select
                value={form.decimal_places}
                onChange={(e) => setForm({ ...form, decimal_places: parseInt(e.target.value, 10) })}
                disabled={!canEdit}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              >
                <option value={0}>0 Decimals (Standard for BIF, RWF, UGX)</option>
                <option value={2}>2 Decimals (Standard for USD, EUR)</option>
                <option value={3}>3 Decimals</option>
              </select>
            </div>
          </div>

          {/* Live Currency Display Widget */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-navy-950/60 border border-gray-200 dark:border-navy-800 flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-navy-400">
              <span className="font-semibold text-navy-900 dark:text-navy-200 block mb-0.5">Live Format Preview:</span>
              Standard retail sale of 145,000 units
            </div>
            <div className="text-base font-bold text-brand-600 dark:text-brand-400 font-mono">
              {form.currency_symbol} {formattedSample}
            </div>
          </div>
        </div>

        {/* Tax (TVA) Settings Card */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-900 dark:text-white">
                  Tax & Value-Added Tax (TVA) Configuration
                </h3>
                <p className="text-xs text-gray-500 dark:text-navy-400">
                  Set standard rates for OBR Burundi compliance and fiscal receipt calculations.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.tax_enabled}
                onChange={(e) => setForm({ ...form, tax_enabled: e.target.checked })}
                disabled={!canEdit}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-navy-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-navy-700 peer-checked:bg-brand-600"></div>
              <span className="ml-3 text-xs font-semibold text-navy-900 dark:text-white">
                {form.tax_enabled ? 'Tax Enabled' : 'Tax Disabled'}
              </span>
            </label>
          </div>

          {form.tax_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 border-t border-gray-100 dark:border-navy-800">
              <div>
                <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                  Tax Rate (%) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={form.tax_rate}
                    onChange={(e) => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full pl-9 pr-3 py-2 text-sm font-semibold rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-navy-400 mt-1">
                  Default standard TVA in Burundi is 18.00%.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                  Tax Label / Name on Receipts
                </label>
                <input
                  type="text"
                  value={form.tax_name}
                  onChange={(e) => setForm({ ...form, tax_name: e.target.value })}
                  disabled={!canEdit}
                  placeholder="TVA (18%)"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                  Price Presentation Mode
                </label>
                <div className="space-y-2 mt-1">
                  <label className="flex items-center gap-2 text-xs text-navy-800 dark:text-navy-200 cursor-pointer">
                    <input
                      type="radio"
                      name="tax_included"
                      checked={form.prices_include_tax}
                      onChange={() => setForm({ ...form, prices_include_tax: true })}
                      disabled={!canEdit}
                      className="text-brand-600"
                    />
                    <span>Gross (Product prices already include tax)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-navy-800 dark:text-navy-200 cursor-pointer">
                    <input
                      type="radio"
                      name="tax_included"
                      checked={!form.prices_include_tax}
                      onChange={() => setForm({ ...form, prices_include_tax: false })}
                      disabled={!canEdit}
                      className="text-brand-600"
                    />
                    <span>Net (Tax calculated and added on top at POS)</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accepted Payment Methods Card */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Payment Methods & Financial Channels
              </h3>
              <p className="text-xs text-gray-500 dark:text-navy-400">
                Activate mobile money (Lumicash, EcoCash), cash registers, bank wires, and card processing for POS checkouts.
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-navy-800">
            {form.payment_methods.map((method) => {
              const getIcon = () => {
                switch (method.key) {
                  case 'cash':
                    return <Coins className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
                  case 'lumicash':
                  case 'ecocash':
                  case 'mobile_money':
                    return <Smartphone className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
                  case 'bank_transfer':
                    return <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
                  case 'card':
                    return <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
                  default:
                    return <DollarSign className="h-5 w-5 text-gray-500" />;
                }
              };

              return (
                <div
                  key={method.id}
                  className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                    !method.enabled ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-navy-800 shrink-0">
                      {getIcon()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-navy-900 dark:text-white">
                          {method.name}
                        </span>
                        {method.is_default && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                            Default at POS
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-navy-400 mt-0.5 max-w-lg">
                        {method.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    {/* Require reference toggle */}
                    {method.enabled && method.key !== 'cash' && (
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-navy-300 cursor-pointer mr-2">
                        <input
                          type="checkbox"
                          checked={method.requires_reference || false}
                          onChange={() => toggleReferenceRequired(method.id)}
                          disabled={!canEdit}
                          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span>Require Ref / Transaction ID</span>
                      </label>
                    )}

                    {/* Set Default Button */}
                    {method.enabled && !method.is_default && canEdit && (
                      <button
                        type="button"
                        onClick={() => setDefaultPaymentMethod(method.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-gray-600 dark:text-navy-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-800 transition"
                      >
                        Set as Default
                      </button>
                    )}

                    {/* Enable/Disable Switch */}
                    {canEdit && (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={method.enabled}
                          onChange={() => togglePaymentMethod(method.id)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-navy-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-navy-700 peer-checked:bg-emerald-600"></div>
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
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
              Save Financial Settings
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
