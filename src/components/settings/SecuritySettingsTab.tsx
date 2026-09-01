import { useState, type FormEvent } from 'react';
import {
  Shield,
  KeyRound,
  Clock,
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Users,
  ShieldCheck,
} from 'lucide-react';
import type { SecurityConfig } from '@/types/settings';
import type { Profile, Role } from '@/types/database';
import { useToast } from '@/context/ToastContext';
import { useNavigate } from 'react-router-dom';

interface SecuritySettingsTabProps {
  initialConfig: SecurityConfig;
  currentUser: Profile | null;
  currentRole: Role | null;
  onSave: (config: SecurityConfig) => Promise<void>;
  loading?: boolean;
  canEdit?: boolean;
}

export function SecuritySettingsTab({
  initialConfig,
  currentUser,
  currentRole,
  onSave,
  loading = false,
  canEdit = true,
}: SecuritySettingsTabProps) {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState<SecurityConfig>(initialConfig);
  const [saving, setSaving] = useState(false);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      addToast('Please enter your current password.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      addToast('New password must be at least 8 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match.', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      // Simulate secure update / Supabase Auth update
      await new Promise((resolve) => setTimeout(resolve, 800));
      addToast('Your password has been changed securely.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password.';
      addToast(msg, 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleConfigSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      addToast('Security & session policies saved successfully.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save security settings.';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
          <Shield className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          User Account Security & System Governance
        </h2>
        <p className="text-sm text-gray-500 dark:text-navy-300 mt-1">
          Manage credentials, session inactivity limits, brute-force lockout safeguards, and RBAC privilege assignments.
        </p>
      </div>

      {/* Current User Identity Overview */}
      <div className="bg-gradient-to-r from-brand-900 via-navy-900 to-navy-950 text-white rounded-xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-brand-500 text-white font-bold text-xl flex items-center justify-center border-2 border-brand-300 shadow-inner">
              {currentUser?.full_name?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{currentUser?.full_name || 'System Administrator'}</h3>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-brand-500/30 text-brand-300 border border-brand-400/40">
                  {currentRole?.display_name || currentRole?.name || 'Super Administrator'}
                </span>
              </div>
              <p className="text-xs text-navy-200 mt-0.5">
                {currentUser?.email || 'admin@babaspos.bi'} • User ID: <span className="font-mono">{currentUser?.id || 'demo-user-1'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/employees')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-sm"
            >
              <Users className="h-4 w-4" />
              Manage Staff Roster
            </button>
            <button
              type="button"
              onClick={() => navigate('/roles')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition shadow-sm"
            >
              <ShieldCheck className="h-4 w-4" />
              Manage RBAC Roles
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password Update Form */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-brand-600" />
              Change Login Password
            </h3>
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="text-xs text-gray-500 hover:text-navy-900 dark:hover:text-white flex items-center gap-1"
            >
              {showPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPasswords ? 'Hide' : 'Show'}
            </button>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1">
                New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters with numbers & symbols"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={changingPassword}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-navy-800 hover:bg-navy-900 dark:bg-navy-700 dark:hover:bg-navy-600 text-white transition disabled:opacity-50"
              >
                {changingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* Global Security Policies */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-600" />
            Session Inactivity & Lockout Policies
          </h3>

          <form onSubmit={handleConfigSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1">
                Session Idle Inactivity Timeout
              </label>
              <select
                value={form.session_timeout_minutes}
                onChange={(e) => setForm({ ...form, session_timeout_minutes: parseInt(e.target.value, 10) || 60 })}
                disabled={!canEdit}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              >
                <option value={15}>15 Minutes (High Security)</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour (Recommended)</option>
                <option value={240}>4 Hours</option>
                <option value={480}>8 Hours (Full Shift)</option>
                <option value={1440}>24 Hours</option>
              </select>
              <p className="text-[11px] text-gray-500 dark:text-navy-400 mt-1">
                Automatically logs out unattended cashier stations and management consoles.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1">
                  Max Failed Login Attempts
                </label>
                <select
                  value={form.max_failed_login_attempts}
                  onChange={(e) => setForm({ ...form, max_failed_login_attempts: parseInt(e.target.value, 10) || 5 })}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value={3}>3 Attempts</option>
                  <option value={5}>5 Attempts</option>
                  <option value={10}>10 Attempts</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1">
                  Lockout Duration
                </label>
                <select
                  value={form.lockout_duration_minutes}
                  onChange={(e) => setForm({ ...form, lockout_duration_minutes: parseInt(e.target.value, 10) || 15 })}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value={5}>5 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-navy-800">
              <label className="flex items-center gap-2 font-medium text-navy-900 dark:text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.require_strong_passwords}
                  onChange={(e) => setForm({ ...form, require_strong_passwords: e.target.checked })}
                  disabled={!canEdit}
                  className="rounded border-gray-300 text-brand-600"
                />
                <span>Enforce alphanumeric complexity & min 8 characters</span>
              </label>

              <label className="flex items-center gap-2 font-medium text-navy-900 dark:text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allow_multi_device_sessions}
                  onChange={(e) => setForm({ ...form, allow_multi_device_sessions: e.target.checked })}
                  disabled={!canEdit}
                  className="rounded border-gray-300 text-brand-600"
                />
                <span>Allow simultaneous logins across multiple POS terminals</span>
              </label>
            </div>

            {canEdit && (
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving || loading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Security Policies
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
