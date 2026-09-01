import { useState } from 'react';
import {
  Shield,
  Users,
  Check,
  Edit2,
  Lock,
  ShieldCheck,
  Building2,
  Boxes,
  ShoppingCart,
  Receipt,
} from 'lucide-react';
import type { Role, Employee } from '@/types/database';
import { getRoleBadgeStyle } from './EmployeeTable';
import { ALL_SYSTEM_PERMISSIONS, SYSTEM_MODULES } from '@/services/employeeService';

interface RolesManagementTabProps {
  roles: Role[];
  employees: Employee[];
  onUpdateRolePermissions: (roleId: string, permissions: string[]) => Promise<void>;
  canManageRoles?: boolean;
}

export function RolesManagementTab({
  roles,
  employees,
  onUpdateRolePermissions,
  canManageRoles = true,
}: RolesManagementTabProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(roles[0] || null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const getRoleIcon = (roleName?: string) => {
    switch (roleName) {
      case 'super_admin':
        return <Shield className="w-5 h-5 text-purple-600" />;
      case 'admin':
      case 'business_owner':
        return <ShieldCheck className="w-5 h-5 text-indigo-600" />;
      case 'branch_manager':
        return <Building2 className="w-5 h-5 text-sky-600" />;
      case 'cashier':
        return <ShoppingCart className="w-5 h-5 text-emerald-600" />;
      case 'inventory_manager':
        return <Boxes className="w-5 h-5 text-amber-600" />;
      case 'sales_employee':
        return <Receipt className="w-5 h-5 text-rose-600" />;
      default:
        return <Shield className="w-5 h-5 text-slate-600" />;
    }
  };

  const handleStartEdit = (role: Role) => {
    setEditingRole(role);
    setEditPermissions([...(role.permissions || [])]);
  };

  const handleToggleEditPerm = (key: string) => {
    setEditPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSaveRolePermissions = async () => {
    if (!editingRole) return;
    setIsSaving(true);
    try {
      await onUpdateRolePermissions(editingRole.id, editPermissions);
      setEditingRole(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">System Roles & Security Policies</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            BABAS POS implements granular Role-Based Access Control (RBAC). Employees inherit all permissions assigned to their role, with support for individual permission overrides.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/10 text-xs">
          <span className="font-bold text-white text-base">{roles.length}</span>
          <span className="text-slate-300">Standard Roles Active</span>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => {
          const roleEmps = employees.filter((e) => e.role_id === role.id || e.role?.name === role.name);
          const permCount = role.permissions?.length || role.permissions_count || 0;
          const isSelected = selectedRole?.id === role.id;

          return (
            <div
              key={role.id}
              onClick={() => setSelectedRole(role)}
              className={`bg-white rounded-xl border p-5 shadow-xs cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200/80'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    {getRoleIcon(role.name)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {role.display_name || role.name}
                    </h4>
                    <span
                      className={`inline-block font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded border mt-0.5 ${getRoleBadgeStyle(
                        role.name
                      )}`}
                    >
                      {role.name}
                    </span>
                  </div>
                </div>

                {role.is_system && (
                  <span
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                    title="System Managed Role"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4 min-h-[36px]">
                {role.description || 'Standard system role for store personnel.'}
              </p>

              {/* Stats Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {roleEmps.length} {roleEmps.length === 1 ? 'staff member' : 'staff members'}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                  <Shield className="w-3 h-3 text-indigo-500" />
                  <span>{permCount} permissions</span>
                </div>
              </div>

              {/* Action Button */}
              {canManageRoles && (
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(role);
                    }}
                    className="w-full py-1.5 px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Role Permissions</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Role Detail & Permissions Inspector */}
      {selectedRole && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                {getRoleIcon(selectedRole.name)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedRole.display_name || selectedRole.name} Role Details
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assigned to{' '}
                  {
                    employees.filter(
                      (e) =>
                        e.role_id === selectedRole.id || e.role?.name === selectedRole.name
                    ).length
                  }{' '}
                  staff members across branches
                </p>
              </div>
            </div>

            {canManageRoles && (
              <button
                type="button"
                onClick={() => handleStartEdit(selectedRole)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Customize Permissions Matrix</span>
              </button>
            )}
          </div>

          {/* Assigned Staff Pills */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Assigned Team Members:
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              {employees
                .filter(
                  (e) =>
                    e.role_id === selectedRole.id || e.role?.name === selectedRole.name
                )
                .map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg py-1 px-2.5 text-xs text-slate-800"
                  >
                    <img
                      src={
                        emp.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          emp.full_name
                        )}&background=0D8ABC&color=fff`
                      }
                      alt={emp.full_name}
                      className="w-5 h-5 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="font-semibold">{emp.full_name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({emp.branch?.name?.split(' ')[0] || 'HQ'})
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Permissions Grid */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Included Permissions (
              {selectedRole.permissions?.length || ALL_SYSTEM_PERMISSIONS.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {(selectedRole.permissions || ALL_SYSTEM_PERMISSIONS.map((p) => p.key)).map(
                (permKey) => {
                  const permObj = ALL_SYSTEM_PERMISSIONS.find((p) => p.key === permKey);
                  return (
                    <div
                      key={permKey}
                      className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs flex items-start gap-2"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate">
                          {permObj?.name || permKey}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 truncate block">
                          {permKey}
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}

      {/* Role Permissions Edit Modal */}
      {editingRole && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Edit Role Permissions: {editingRole.display_name || editingRole.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingRole(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <p className="text-xs text-slate-500">
                Modifying this role will update system permissions for all {employees.filter((e) => e.role_id === editingRole.id).length} staff members currently assigned to this role.
              </p>

              <div className="space-y-4">
                {SYSTEM_MODULES.map((mod) => {
                  const modPerms = ALL_SYSTEM_PERMISSIONS.filter((p) => p.module === mod.id);
                  return (
                    <div key={mod.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
                        <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                          {mod.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const keys = modPerms.map((p) => p.key);
                            const allOn = keys.every((k) => editPermissions.includes(k));
                            if (allOn) {
                              setEditPermissions((prev) => prev.filter((k) => !keys.includes(k)));
                            } else {
                              setEditPermissions((prev) => Array.from(new Set([...prev, ...keys])));
                            }
                          }}
                          className="text-xs text-primary-600 font-semibold hover:underline"
                        >
                          Toggle All
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {modPerms.map((p) => {
                          const checked = editPermissions.includes(p.key);
                          return (
                            <label
                              key={p.key}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                                checked
                                  ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900'
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggleEditPerm(p.key)}
                                className="rounded text-primary-600 focus:ring-primary-500"
                              />
                              <span className="font-medium truncate">{p.name || p.key}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-600">
                <strong className="text-slate-900">{editPermissions.length}</strong> permissions active for this role
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRolePermissions}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm"
                >
                  {isSaving ? 'Saving...' : 'Save Role Permissions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
