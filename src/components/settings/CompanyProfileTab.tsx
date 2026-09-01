import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import {
  Building2,
  Upload,
  Trash2,
  Save,
  CheckCircle2,
  FileText,
  Phone,
  Mail,
  MapPin,
  Globe,
  Hash,
  Loader2,
  Eye,
} from 'lucide-react';
import type { CompanyProfileConfig } from '@/types/settings';
import { uploadBusinessLogo } from '@/services/settingsService';
import { useToast } from '@/context/ToastContext';

interface CompanyProfileTabProps {
  initialConfig: CompanyProfileConfig;
  onSave: (config: CompanyProfileConfig) => Promise<void>;
  loading?: boolean;
  canEdit?: boolean;
}

export function CompanyProfileTab({
  initialConfig,
  onSave,
  loading = false,
  canEdit = true,
}: CompanyProfileTabProps) {
  const { addToast } = useToast();
  const [form, setForm] = useState<CompanyProfileConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showDocPreview, setShowDocPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (field: keyof CompanyProfileConfig, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const dataUrl = await uploadBusinessLogo(file);
      setForm((prev) => ({ ...prev, logo_url: dataUrl }));
      addToast('Company logo uploaded successfully.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload logo.';
      addToast(msg, 'error');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setForm((prev) => ({ ...prev, logo_url: null }));
    addToast('Company logo removed.', 'info');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      addToast('Company name is required.', 'error');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      addToast('Company profile settings saved successfully.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save company settings.';
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
            <Building2 className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            Company & Business Profile
          </h2>
          <p className="text-sm text-gray-500 dark:text-navy-300 mt-1">
            Manage your legal entity identity, official branding, tax identification numbers, and contact details.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowDocPreview(!showDocPreview)}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-gray-700 dark:text-navy-200 hover:bg-gray-50 dark:hover:bg-navy-700 transition"
        >
          <Eye className="h-4 w-4 text-brand-600" />
          {showDocPreview ? 'Hide Document Preview' : 'Preview Official Header'}
        </button>
      </div>

      {/* Live Official Header Preview */}
      {showDocPreview && (
        <div className="bg-gradient-to-r from-gray-50 to-brand-50/30 dark:from-navy-900/90 dark:to-navy-800/60 p-5 rounded-xl border border-brand-200 dark:border-brand-900/40 shadow-sm animate-in fade-in">
          <div className="text-xs uppercase font-bold tracking-wider text-brand-700 dark:text-brand-300 mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Document Header & Invoice Letterhead Preview
          </div>
          <div className="bg-white dark:bg-navy-950 p-4 rounded-lg border border-gray-200 dark:border-navy-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {form.logo_url ? (
                <img
                  src={form.logo_url}
                  alt={form.name}
                  className="h-14 w-14 object-contain rounded-lg border border-gray-200 dark:border-navy-700 bg-white p-1"
                />
              ) : (
                <div className="h-14 w-14 rounded-lg bg-brand-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                  {form.name.slice(0, 2).toUpperCase() || 'BB'}
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-navy-900 dark:text-white tracking-wide">{form.name || 'BABAS'}</h3>
                <p className="text-xs text-gray-500 dark:text-navy-400">{form.address || 'Boulevard du 1er Novembre, Bujumbura'}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-navy-300 mt-1">
                  <span>Tel: {form.phone || '+257 22 25 1200'}</span>
                  <span>Email: {form.email || 'contact@babaspos.bi'}</span>
                </div>
              </div>
            </div>
            <div className="text-left md:text-right text-xs text-gray-500 dark:text-navy-400 border-t md:border-t-0 pt-2 md:pt-0 border-gray-100 dark:border-navy-800">
              <div className="font-semibold text-navy-900 dark:text-navy-100">
                NIF: <span className="font-mono text-brand-600 dark:text-brand-400">{form.tax_id || '4001289567'}</span>
              </div>
              <div className="text-gray-600 dark:text-navy-300">
                RC: <span className="font-mono">{form.registration_number || 'RC/BJM/2022/B/1429'}</span>
              </div>
              <div className="text-gray-400 dark:text-navy-500 mt-0.5">{form.city}, {form.country}</div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Logo Management */}
          <div>
            <label className="block text-sm font-semibold text-navy-900 dark:text-navy-100 mb-2">
              Business Logo & Visual Identity
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-lg bg-gray-50 dark:bg-navy-950/60 border border-gray-200 dark:border-navy-800">
              <div className="relative group">
                {form.logo_url ? (
                  <img
                    src={form.logo_url}
                    alt={form.name}
                    className="h-20 w-20 object-contain rounded-xl border-2 border-brand-500 bg-white p-1 shadow-sm"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-xl bg-brand-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-md">
                    {form.name ? form.name.slice(0, 2).toUpperCase() : 'BB'}
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    className="hidden"
                    disabled={!canEdit || uploadingLogo}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!canEdit || uploadingLogo}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition disabled:opacity-50"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Upload Logo
                  </button>

                  {form.logo_url && canEdit && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/50 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-navy-400">
                  Recommended size: Square PNG or SVG with transparent background (Max 3MB). Appears on POS receipts and invoices.
                </p>
              </div>
            </div>
          </div>

          {/* Primary Legal & Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                Company / Business Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={!canEdit}
                  required
                  placeholder="e.g. BABAS"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 dark:disabled:bg-navy-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                Official Business Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={!canEdit}
                  required
                  placeholder="contact@babaspos.bi"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 dark:disabled:bg-navy-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                Official Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={!canEdit}
                  required
                  placeholder="+257 22 25 1200"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 dark:disabled:bg-navy-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                Physical Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  disabled={!canEdit}
                  required
                  placeholder="Boulevard du 1er Novembre, Rohero"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 dark:disabled:bg-navy-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                City / Municipality
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                disabled={!canEdit}
                placeholder="Bujumbura"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 dark:disabled:bg-navy-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                Country
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  disabled={!canEdit}
                  placeholder="Burundi"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 dark:disabled:bg-navy-900"
                />
              </div>
            </div>
          </div>

          {/* Legal Identifiers (NIF & Registre de Commerce) */}
          <div className="pt-2 border-t border-gray-100 dark:border-navy-800">
            <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-600" />
              Tax & Legal Registration Details (Burundi)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                  Tax Identification Number (NIF / TIN)
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.tax_id}
                    onChange={(e) => handleChange('tax_id', e.target.value)}
                    disabled={!canEdit}
                    placeholder="e.g. 4001289567"
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-navy-400 mt-1">
                  Numéro d'Identification Fiscale (Office Burundais des Recettes - OBR).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
                  Business Registration Number (RC)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.registration_number}
                    onChange={(e) => handleChange('registration_number', e.target.value)}
                    disabled={!canEdit}
                    placeholder="e.g. RC/BJM/2022/B/1429"
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-navy-400 mt-1">
                  Registre de Commerce et du Crédit Mobilier (RCCM / Tribunal de Commerce).
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1.5">
              Company Description & Business Scope
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={!canEdit}
              placeholder="Provide a brief summary of the business operations, retail categories, or branch services."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
            />
          </div>
        </div>

        {canEdit && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-navy-950/80 border-t border-gray-200 dark:border-navy-800 flex justify-end">
            <button
              type="submit"
              disabled={saving || loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Company Profile
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
