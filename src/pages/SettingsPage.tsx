import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Coins,
  Monitor,
  Boxes,
  Shield,
  Globe2,
  Database,
  MapPin,
  Loader2,
  ShieldAlert,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { SettingsTabId, FullSystemSettings } from '@/types/settings';
import type { Branch } from '@/types/database';
import {
  fetchSystemSettings,
  saveSystemSectionSettings,
  DEFAULT_SYSTEM_SETTINGS,
} from '@/services/settingsService';
import { fetchAllBranches } from '@/services/branchService';

import { CompanyProfileTab } from '@/components/settings/CompanyProfileTab';
import { BranchSettingsTab } from '@/components/settings/BranchSettingsTab';
import { FinancialSettingsTab } from '@/components/settings/FinancialSettingsTab';
import { PosSettingsTab } from '@/components/settings/PosSettingsTab';
import { InventorySettingsTab } from '@/components/settings/InventorySettingsTab';
import { SecuritySettingsTab } from '@/components/settings/SecuritySettingsTab';
import { SystemPreferencesTab } from '@/components/settings/SystemPreferencesTab';
import { DataManagementTab } from '@/components/settings/DataManagementTab';
import { NotificationSettingsTab } from '@/components/settings/NotificationSettingsTab';

export function SettingsPage() {
  const { user, profile, role, hasPermission, branch } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<SettingsTabId>('company');
  const [settings, setSettings] = useState<FullSystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = role?.name === 'super_admin' || role?.name === 'business_owner';
  const canManageSettings = isSuperAdmin || hasPermission('settings.manage');
  const canManageBranches = isSuperAdmin || hasPermission('branches.manage') || hasPermission('settings.manage');

  // Load Settings and Branches on mount
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [loadedSettings, loadedBranches] = await Promise.all([
          fetchSystemSettings(),
          fetchAllBranches(),
        ]);
        setSettings(loadedSettings);
        setBranches(loadedBranches);
      } catch (err: unknown) {
        console.error('Failed to load system settings:', err);
        addToast('Failed to load system configuration.', 'error');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Sync tab with URL search parameter if present
  useEffect(() => {
    const tabParam = searchParams.get('tab') as SettingsTabId | null;
    if (
      tabParam &&
      [
        'company',
        'branches',
        'financial',
        'pos',
        'inventory',
        'notifications',
        'security',
        'preferences',
        'data',
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: SettingsTabId) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const handleSaveSection = async <K extends keyof FullSystemSettings>(
    sectionKey: K,
    updatedData: FullSystemSettings[K]
  ) => {
    const actor = {
      id: profile?.id || user?.id || 'admin',
      name: profile?.full_name || 'Administrator',
      role: role?.display_name || role?.name || 'Super Administrator',
      branchId: branch?.id,
    };

    const newFullSettings = await saveSystemSectionSettings(sectionKey, updatedData, actor);
    setSettings(newFullSettings);
  };

  const tabDefinitions: { id: SettingsTabId; label: string; icon: typeof Building2; adminOnly?: boolean }[] = [
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'branches', label: 'Branch & Locations', icon: MapPin },
    { id: 'financial', label: 'Currency & Financial', icon: Coins },
    { id: 'pos', label: 'POS & Receipts', icon: Monitor },
    { id: 'inventory', label: 'Inventory & Stock', icon: Boxes },
    { id: 'notifications', label: 'Notifications & Alerts', icon: Bell },
    { id: 'security', label: 'Security & Access', icon: Shield },
    { id: 'preferences', label: 'System Preferences', icon: Globe2 },
    { id: 'data', label: 'Data & Backup', icon: Database, adminOnly: true },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-sm font-medium text-navy-800 dark:text-navy-200">
          Loading BABAS system configuration...
        </p>
      </div>
    );
  }

  // Access check: User must have settings.view or settings.manage or be super admin
  const hasAnyAccess = canManageSettings || isSuperAdmin || hasPermission('settings.view');
  if (!hasAnyAccess) {
    return (
      <div className="p-12 text-center bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800 shadow-sm max-w-lg mx-auto mt-8">
        <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-navy-900 dark:text-white">
          Settings Access Restricted
        </h2>
        <p className="text-xs text-gray-500 dark:text-navy-400 mt-1 leading-relaxed">
          Your current account role does not have administrative privileges to modify system configuration. Please contact your Super Administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white flex items-center gap-2.5">
            <span>System Settings & Configuration</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-navy-300 mt-0.5">
            Configure {settings.company.name || 'BABAS'} legal identity, multi-location branches, financial parameters, thermal receipts, and inventory valuation.
          </p>
        </div>

        {branch && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900/50 self-start sm:self-auto">
            <MapPin className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <div className="text-xs">
              <span className="text-gray-500 dark:text-navy-400">Current Station: </span>
              <strong className="text-navy-900 dark:text-navy-100">{branch.name}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Main Settings Card with Horizontal/Vertical Responsive Tabs */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Navigation Sidebar Tabs */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200 dark:border-navy-800 bg-gray-50/70 dark:bg-navy-950/50 p-3 shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none">
            {tabDefinitions.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              if (item.adminOnly && !isSuperAdmin) return null;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition text-left w-full ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm font-bold'
                      : 'text-gray-600 dark:text-navy-300 hover:bg-gray-200/70 dark:hover:bg-navy-800/80 hover:text-navy-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400 dark:text-navy-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Tab Content Area */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {activeTab === 'company' && (
            <CompanyProfileTab
              initialConfig={settings.company}
              onSave={(updated) => handleSaveSection('company', updated)}
              canEdit={canManageSettings}
            />
          )}

          {activeTab === 'branches' && (
            <BranchSettingsTab
              isSuperAdmin={isSuperAdmin}
              canManageBranches={canManageBranches}
              userBranchId={branch?.id || null}
            />
          )}

          {activeTab === 'financial' && (
            <FinancialSettingsTab
              initialConfig={settings.financial}
              onSave={(updated) => handleSaveSection('financial', updated)}
              canEdit={canManageSettings}
            />
          )}

          {activeTab === 'pos' && (
            <PosSettingsTab
              initialConfig={settings.pos}
              companyConfig={settings.company}
              financialConfig={settings.financial}
              branches={branches}
              onSave={(updated) => handleSaveSection('pos', updated)}
              canEdit={canManageSettings}
            />
          )}

          {activeTab === 'inventory' && (
            <InventorySettingsTab
              initialConfig={settings.inventory}
              onSave={(updated) => handleSaveSection('inventory', updated)}
              canEdit={canManageSettings}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationSettingsTab
              initialConfig={settings.notifications}
              onSave={(updated) => handleSaveSection('notifications', updated)}
            />
          )}

          {activeTab === 'security' && (
            <SecuritySettingsTab
              initialConfig={settings.security}
              currentUser={profile}
              currentRole={role}
              onSave={(updated) => handleSaveSection('security', updated)}
              canEdit={canManageSettings}
            />
          )}

          {activeTab === 'preferences' && (
            <SystemPreferencesTab
              initialConfig={settings.preferences}
              onSave={(updated) => handleSaveSection('preferences', updated)}
              canEdit={canManageSettings}
            />
          )}

          {activeTab === 'data' && (
            <DataManagementTab
              isSuperAdmin={isSuperAdmin}
              canEdit={isSuperAdmin}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default SettingsPage;
