import { useState, useEffect, type FormEvent } from 'react';
import { Loader2, Building2, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import type { Business } from '@/types/database';

export function SettingsPage() {
  const {
    business,
    user,
    profile,
    refreshProfile,
    isDemoMode,
    updateDemoBusiness,
    updateDemoProfile,
  } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<'business' | 'profile' | 'appearance' | 'security'>('business');
  const [saving, setSaving] = useState(false);

  const [bizForm, setBizForm] = useState<Business | null>(business);
  const [profileForm, setProfileForm] = useState({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });

  useEffect(() => {
    setBizForm(business);
    setProfileForm({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' });
  }, [business, profile]);

  const saveBusiness = async (e: FormEvent) => {
    e.preventDefault();
    if (!bizForm || !business) return;
    setSaving(true);

    if (isDemoMode) {
      updateDemoBusiness(bizForm);
      setSaving(false);
      toast('Business settings saved (Demo Mode).', 'success');
      return;
    }

    const { error } = await supabase
      .from('businesses')
      .update({
        name: bizForm.name,
        address: bizForm.address,
        phone: bizForm.phone,
        email: bizForm.email,
        currency: bizForm.currency,
        tax_rate: bizForm.tax_rate,
      })
      .eq('id', business.id);
    setSaving(false);
    if (error) toast(error.message, 'error');
    else {
      toast('Business settings saved.', 'success');
      refreshProfile();
    }
  };

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (isDemoMode) {
      updateDemoProfile(profileForm);
      setSaving(false);
      toast('Profile updated (Demo Mode).', 'success');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profileForm.full_name, phone: profileForm.phone })
      .eq('id', user?.id);
    setSaving(false);
    if (error) toast(error.message, 'error');
    else {
      toast('Profile updated.', 'success');
      refreshProfile();
    }
  };

  const updatePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      toast('New passwords do not match.', 'error');
      return;
    }
    if (passwordForm.next.length < 6) {
      toast('Password must be at least 6 characters.', 'error');
      return;
    }
    setSaving(true);

    if (isDemoMode) {
      setSaving(false);
      toast('Password updated (Demo Mode).', 'success');
      setPasswordForm({ current: '', next: '', confirm: '' });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: passwordForm.next });
    setSaving(false);
    if (error) toast(error.message, 'error');
    else {
      toast('Password updated.', 'success');
      setPasswordForm({ current: '', next: '', confirm: '' });
    }
  };

  const tabs = [
    { id: 'business' as const, label: 'Business' },
    { id: 'profile' as const, label: 'Profile' },
    { id: 'appearance' as const, label: 'Appearance' },
    { id: 'security' as const, label: 'Security' },
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Settings</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-navy-400">Manage your business, profile, and preferences.</p>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-navy-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-navy-900 dark:text-navy-400 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Business tab */}
      {tab === 'business' && bizForm && (
        <form onSubmit={saveBusiness} className="mt-6 space-y-4 card p-6">
          <div className="flex items-center gap-2 text-navy-900 dark:text-white">
            <Building2 className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold">Business Information</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Business name</label>
              <input className="input" value={bizForm.name} onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Currency</label>
              <select className="input" value={bizForm.currency} onChange={(e) => setBizForm({ ...bizForm, currency: e.target.value })}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="KES">KES (KSh)</option>
                <option value="NGN">NGN (₦)</option>
                <option value="GHS">GHS (₵)</option>
                <option value="ZAR">ZAR (R)</option>
              </select>
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={bizForm.phone ?? ''} onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" value={bizForm.email ?? ''} onChange={(e) => setBizForm({ ...bizForm, email: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input className="input" value={bizForm.address ?? ''} onChange={(e) => setBizForm({ ...bizForm, address: e.target.value })} />
            </div>
            <div>
              <label className="label">Default tax rate (%)</label>
              <input type="number" step="0.01" className="input" value={bizForm.tax_rate} onChange={(e) => setBizForm({ ...bizForm, tax_rate: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </button>
        </form>
      )}

      {/* Profile tab */}
      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="mt-6 space-y-4 card p-6">
          <h2 className="text-lg font-semibold text-navy-900 dark:text-white">Your Profile</h2>
          <div>
            <label className="label">Email (read-only)</label>
            <input className="input bg-gray-50 dark:bg-navy-950" value={user?.email ?? ''} disabled />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Full name</label>
              <input className="input" value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save profile
          </button>
        </form>
      )}

      {/* Appearance tab */}
      {tab === 'appearance' && <AppearanceTab />}

      {/* Security tab */}
      {tab === 'security' && (
        <form onSubmit={updatePassword} className="mt-6 space-y-4 card p-6">
          <h2 className="text-lg font-semibold text-navy-900 dark:text-white">Change Password</h2>
          <div>
            <label className="label">New password</label>
            <input type="password" className="input" value={passwordForm.next} onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })} />
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input type="password" className="input" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Update password
          </button>
        </form>
      )}
    </div>
  );
}

function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="mt-6 card p-6">
      <h2 className="text-lg font-semibold text-navy-900 dark:text-white">Appearance</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-navy-400">Choose how Verdant looks for you.</p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {(['light', 'dark'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`rounded-lg border-2 p-4 text-left transition-colors ${
              theme === t
                ? 'border-brand-600 bg-brand-50 dark:bg-brand-950'
                : 'border-gray-200 hover:border-gray-300 dark:border-navy-700 dark:hover:border-navy-600'
            }`}
          >
            <div className={`mb-2 h-20 rounded-md ${t === 'light' ? 'bg-gray-100' : 'bg-navy-900'}`}>
              <div className="flex h-full items-center justify-center gap-2">
                <div className={`h-3 w-3 rounded-full ${t === 'light' ? 'bg-brand-500' : 'bg-brand-400'}`} />
                <div className={`h-2 w-12 rounded ${t === 'light' ? 'bg-gray-300' : 'bg-navy-700'}`} />
              </div>
            </div>
            <p className="text-sm font-medium capitalize text-navy-900 dark:text-white">{t} mode</p>
          </button>
        ))}
      </div>
    </div>
  );
}
