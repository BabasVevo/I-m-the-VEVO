import { useState, type FormEvent } from 'react';
import {
  Globe2,
  Calendar,
  Clock,
  Languages,
  Moon,
  Sun,
  Laptop,
  Save,
  Loader2,
} from 'lucide-react';
import type { SystemPreferencesConfig } from '@/types/settings';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';

interface SystemPreferencesTabProps {
  initialConfig: SystemPreferencesConfig;
  onSave: (config: SystemPreferencesConfig) => Promise<void>;
  loading?: boolean;
  canEdit?: boolean;
}

const SUPPORTED_TIMEZONES = [
  { value: 'Africa/Bujumbura', label: 'Bujumbura (GMT+2, Central Africa Time - CAT)', country: 'Burundi (Default)' },
  { value: 'Africa/Kigali', label: 'Kigali (GMT+2, CAT)', country: 'Rwanda' },
  { value: 'Africa/Dar_es_Salaam', label: 'Dar es Salaam (GMT+3, EAT)', country: 'Tanzania' },
  { value: 'Africa/Nairobi', label: 'Nairobi (GMT+3, East Africa Time - EAT)', country: 'Kenya' },
  { value: 'Africa/Kampala', label: 'Kampala (GMT+3, EAT)', country: 'Uganda' },
  { value: 'Africa/Lubumbashi', label: 'Lubumbashi (GMT+2, CAT)', country: 'DR Congo' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', country: 'Global' },
];

export function SystemPreferencesTab({
  initialConfig,
  onSave,
  loading = false,
  canEdit = true,
}: SystemPreferencesTabProps) {
  const { addToast } = useToast();
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState<SystemPreferencesConfig>({
    ...initialConfig,
    theme: theme as 'light' | 'dark' | 'system',
  });
  const [saving, setSaving] = useState(false);

  const handleThemeSelect = (selectedTheme: 'light' | 'dark' | 'system') => {
    setForm((prev) => ({ ...prev, theme: selectedTheme }));
    setTheme(selectedTheme);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      addToast('System preferences saved successfully.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save system preferences.';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Preview formatted time & date
  const now = new Date();
  const datePreview = form.date_format === 'DD/MM/YYYY'
    ? `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
    : form.date_format === 'MM/DD/YYYY'
    ? `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const timePreview = form.time_format === '24h'
    ? now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
          <Globe2 className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          Localization & System Preferences
        </h2>
        <p className="text-sm text-gray-500 dark:text-navy-300 mt-1">
          Configure regional date/time formats, Burundian timezone (CAT), language interfaces, and theme aesthetics.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Regional Date & Time Formatting */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Date & Time Formats
              </h3>
              <p className="text-xs text-gray-500 dark:text-navy-400">
                Applied to receipts, sales timestamps, activity audit records, and financial statement exports.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                Date Format
              </label>
              <select
                value={form.date_format}
                onChange={(e) => setForm({ ...form, date_format: e.target.value as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' })}
                disabled={!canEdit}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (Standard Burundi)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO International)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                Time Format
              </label>
              <select
                value={form.time_format}
                onChange={(e) => setForm({ ...form, time_format: e.target.value as '24h' | '12h' })}
                disabled={!canEdit}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="24h">24-Hour (14:30) - Standard</option>
                <option value="12h">12-Hour (02:30 PM)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                Live Timestamp Preview
              </label>
              <div className="h-10 flex items-center px-3 bg-gray-50 dark:bg-navy-950 rounded-lg border border-gray-200 dark:border-navy-800 font-mono text-sm text-brand-600 dark:text-brand-400 font-semibold">
                {datePreview} • {timePreview}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
              Operating Time Zone (Burundi & Regional Hubs)
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <select
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                disabled={!canEdit}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              >
                {SUPPORTED_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Language & Regional Defaults */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Languages className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Language & Regional Localization
              </h3>
              <p className="text-xs text-gray-500 dark:text-navy-400">
                Set preferred display language for UI navigation and default national telephone country dialing codes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                Interface Language
              </label>
              <select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value as 'en' | 'fr' | 'rn' })}
                disabled={!canEdit}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="en">English (Official System Default)</option>
                <option value="fr">Français (Burundi & Regional Commercial)</option>
                <option value="rn">Ikirundi (National Language)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                Default Country
              </label>
              <input
                type="text"
                value={form.default_country}
                onChange={(e) => setForm({ ...form, default_country: e.target.value })}
                disabled={!canEdit}
                placeholder="Burundi"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                Default Telephone Dial Code
              </label>
              <input
                type="text"
                value={form.default_country_code}
                onChange={(e) => setForm({ ...form, default_country_code: e.target.value })}
                disabled={!canEdit}
                placeholder="+257"
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Visual Appearance & Theme */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Interface Appearance
              </h3>
              <p className="text-xs text-gray-500 dark:text-navy-400">
                Choose between clear high-contrast light mode, night-optimized dark mode, or system automatic sync.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: 'light', name: 'Light Mode', icon: Sun, desc: 'Clean high-contrast daytime interface' },
              { id: 'dark', name: 'Dark Mode', icon: Moon, desc: 'Eye-safe contrast for low-light registers' },
              { id: 'system', name: 'System Default', icon: Laptop, desc: 'Sync automatically with OS preferences' },
            ].map((th) => {
              const Icon = th.icon;
              const isSelected = form.theme === th.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => handleThemeSelect(th.id as 'light' | 'dark' | 'system')}
                  className={`flex flex-col items-start p-4 rounded-xl border-2 text-left transition ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/30'
                      : 'border-gray-200 dark:border-navy-800 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="p-2 rounded-lg bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700">
                      <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    {isSelected && (
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-600 ring-4 ring-brand-100 dark:ring-brand-950"></span>
                    )}
                  </div>
                  <span className="font-bold text-sm text-navy-900 dark:text-white">
                    {th.name}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-navy-400 mt-0.5">
                    {th.desc}
                  </p>
                </button>
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
              Save System Preferences
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
