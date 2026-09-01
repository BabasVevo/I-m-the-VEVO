import { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Check,
  Search,
  Sparkles,
  CheckSquare,
  Square,
} from 'lucide-react';
import type { Employee, Role } from '@/types/database';
import { ALL_SYSTEM_PERMISSIONS, SYSTEM_MODULES } from '@/services/employeeService';

interface EmployeePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  roles: Role[];
  onSave: (empId: string, customPerms: string[]) => Promise<void>;
  isLoading?: boolean;
}

export function EmployeePermissionsModal({
  isOpen,
  onClose,
  employee,
  roles,
  onSave,
  isLoading = false,
}: EmployeePermissionsModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [activeModule, setActiveModule] = useState<string>('all');

  useEffect(() => {
    if (employee && isOpen) {
      const basePerms = employee.role?.permissions || [];
      const customPerms = employee.custom_permissions || [];
      setSelectedPermissions(Array.from(new Set([...basePerms, ...customPerms])));
    }
    setSearch('');
    setActiveModule('all');
  }, [employee, isOpen]);

  if (!isOpen || !employee) return null;

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleModulePermissions = (moduleId: string) => {
    const modulePerms = ALL_SYSTEM_PERMISSIONS.filter((p) => p.module === moduleId).map(
      (p) => p.key
    );
    const allSelected = modulePerms.every((k) => selectedPermissions.includes(k));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((k) => !modulePerms.includes(k)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...modulePerms])));
    }
  };

  const applyRolePreset = (roleName: string) => {
    const r = roles.find((role) => role.name === roleName);
    if (r && r.permissions) {
      setSelectedPermissions([...r.permissions]);
    }
  };

  const handleSelectAll = () => {
    setSelectedPermissions(ALL_SYSTEM_PERMISSIONS.map((p) => p.key));
  };

  const handleClearAll = () => {
    setSelectedPermissions([]);
  };

  const handleResetToRoleDefault = () => {
    if (employee.role?.permissions) {
      setSelectedPermissions([...employee.role.permissions]);
    }
  };

  const filteredPermissions = ALL_SYSTEM_PERMISSIONS.filter((p) => {
    if (activeModule !== 'all' && p.module !== activeModule) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.key.toLowerCase().includes(q) ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSubmit = async () => {
    await onSave(employee.id, selectedPermissions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Manage Granular Permissions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configuring permissions for <span className="font-semibold text-slate-800">{employee.full_name}</span> ({employee.role?.display_name || employee.role?.name})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets & Toolbar */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-600 mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Role Presets:
            </span>
            <button
              type="button"
              onClick={() => applyRolePreset('super_admin')}
              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium rounded-md border border-purple-200/60"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => applyRolePreset('admin')}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-md border border-indigo-200/60"
            >
              Administrator
            </button>
            <button
              type="button"
              onClick={() => applyRolePreset('branch_manager')}
              className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-medium rounded-md border border-sky-200/60"
            >
              Branch Manager
            </button>
            <button
              type="button"
              onClick={() => applyRolePreset('cashier')}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded-md border border-emerald-200/60"
            >
              Cashier
            </button>
            <button
              type="button"
              onClick={() => applyRolePreset('inventory_manager')}
              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium rounded-md border border-amber-200/60"
            >
              Inventory Mgr
            </button>
            <button
              type="button"
              onClick={() => applyRolePreset('sales_employee')}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium rounded-md border border-rose-200/60"
            >
              Sales Staff
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleResetToRoleDefault}
              className="text-slate-600 hover:text-slate-900 underline font-medium"
            >
              Reset to Role Default
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Select All
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-rose-600 hover:text-rose-700 font-semibold"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Filter bar by Module & Search */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter permissions by keyword (e.g. pos.discount, refund, reports)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveModule('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeModule === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Modules ({ALL_SYSTEM_PERMISSIONS.length})
            </button>
            {SYSTEM_MODULES.map((mod) => {
              const count = ALL_SYSTEM_PERMISSIONS.filter((p) => p.module === mod.id).length;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActiveModule(mod.id)}
                  className={`px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeModule === mod.id
                      ? 'bg-primary-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {mod.label.split(' ')[0]} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {SYSTEM_MODULES.filter((m) => activeModule === 'all' || m.id === activeModule).map(
            (module) => {
              const permsInModule = filteredPermissions.filter((p) => p.module === module.id);
              if (permsInModule.length === 0) return null;

              const allModuleKeys = ALL_SYSTEM_PERMISSIONS.filter((p) => p.module === module.id).map(
                (p) => p.key
              );
              const allChecked = allModuleKeys.every((k) => selectedPermissions.includes(k));

              return (
                <div
                  key={module.id}
                  className="bg-slate-50/70 rounded-xl border border-slate-200 p-4"
                >
                  {/* Module header */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                        {module.label}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({allModuleKeys.filter((k) => selectedPermissions.includes(k)).length} /{' '}
                        {allModuleKeys.length} enabled)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleModulePermissions(module.id)}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-800"
                    >
                      {allChecked ? 'Deselect Module' : 'Enable All'}
                    </button>
                  </div>

                  {/* Permission Items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {permsInModule.map((perm) => {
                      const isChecked = selectedPermissions.includes(perm.key);
                      return (
                        <div
                          key={perm.key}
                          onClick={() => togglePermission(perm.key)}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950'
                              : 'bg-white border-slate-200/80 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div className="mt-0.5">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {perm.name || perm.key}
                              </span>
                              <span className="font-mono text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.2 rounded shrink-0">
                                {perm.key}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              {perm.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600">
            <span className="font-bold text-slate-900">{selectedPermissions.length}</span> of{' '}
            {ALL_SYSTEM_PERMISSIONS.length} system permissions selected
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save Permissions Matrix</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
