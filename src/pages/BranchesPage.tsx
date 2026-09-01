import { BranchSettingsTab } from '@/components/settings/BranchSettingsTab';
import { useAuth } from '@/context/AuthContext';

export function BranchesPage() {
  const { role, hasPermission, branch } = useAuth();
  const isSuperAdmin = role?.name === 'super_admin' || role?.name === 'business_owner';
  const canManageBranches = hasPermission('branches.manage') || hasPermission('settings.manage');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
            Branch Network & Locations
          </h1>
          <p className="text-sm text-gray-500 dark:text-navy-300 mt-1">
            Manage regional outlets, warehouse depots, and commercial branches across Burundi.
          </p>
        </div>
      </div>

      <BranchSettingsTab
        isSuperAdmin={isSuperAdmin}
        canManageBranches={canManageBranches}
        userBranchId={branch?.id || null}
      />
    </div>
  );
}
export default BranchesPage;
