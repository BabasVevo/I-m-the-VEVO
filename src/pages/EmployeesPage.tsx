import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  ShieldCheck,
  History,
  Plus,
  RefreshCw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import type { Employee, Role, Branch, EmployeeStats } from '@/types/database';
import type { CreateEmployeeInput } from '@/services/employeeService';
import {
  getEmployees,
  getRoles,
  getBranches,
  getEmployeeStats,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
  updateRolePermissions,
  exportEmployeesAsCSV,
} from '@/services/employeeService';

import { EmployeeStatsCards } from '@/components/employees/EmployeeStatsCards';
import { EmployeeFilterBar } from '@/components/employees/EmployeeFilterBar';
import { EmployeeTable } from '@/components/employees/EmployeeTable';
import { EmployeeGrid } from '@/components/employees/EmployeeGrid';
import { EmployeeFormModal } from '@/components/employees/EmployeeFormModal';
import { EmployeeDetailDrawer } from '@/components/employees/EmployeeDetailDrawer';
import { EmployeePermissionsModal } from '@/components/employees/EmployeePermissionsModal';
import { RolesManagementTab } from '@/components/employees/RolesManagementTab';
import { ActivityLogView } from '@/components/employees/ActivityLogView';
import { QuickUserSwitcherModal } from '@/components/employees/QuickUserSwitcherModal';

export function EmployeesPage() {
  const { profile, switchEmployee } = useAuth();
  const { hasPermission, isSuperOrAdmin } = usePermissions();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'employees' | 'roles' | 'activity'>('employees');

  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stats, setStats] = useState<EmployeeStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    newThisMonth: 0,
    roleCounts: {},
    branchCounts: {},
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [drawerEmployee, setDrawerEmployee] = useState<Employee | null>(null);
  const [permissionsModalEmployee, setPermissionsModalEmployee] = useState<Employee | null>(null);
  const [isQuickSwitcherOpen, setIsQuickSwitcherOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empsData, rolesData, branchesData, statsData] = await Promise.all([
        getEmployees({
          search: search.trim() || undefined,
          branchId: selectedBranch,
          roleId: selectedRole,
          status: selectedStatus,
        }),
        getRoles(),
        getBranches(),
        getEmployeeStats(),
      ]);

      setEmployees(empsData);
      setRoles(rolesData);
      setBranches(branchesData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load employee data:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedBranch, selectedRole, selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleCreateOrUpdateEmployee = async (input: CreateEmployeeInput) => {
    const actor = profile
      ? {
          id: profile.id,
          name: profile.full_name,
          role: profile.role?.display_name || profile.role?.name || 'Administrator',
          branchId: profile.branch_id || undefined,
        }
      : undefined;

    if (editingEmployee) {
      await updateEmployee(editingEmployee.id, input, actor);
      showToast(`Updated employee details for ${input.full_name}`);
    } else {
      await createEmployee(input, actor);
      showToast(`Successfully onboarded new employee ${input.full_name}`);
    }

    setIsAddModalOpen(false);
    setEditingEmployee(null);
    loadData();
  };

  const handleToggleStatus = async (emp: Employee) => {
    const nextStatus = !emp.is_active;
    const actor = profile
      ? {
          id: profile.id,
          name: profile.full_name,
          role: profile.role?.display_name || profile.role?.name || 'Administrator',
          branchId: profile.branch_id || undefined,
        }
      : undefined;

    await toggleEmployeeStatus(emp.id, nextStatus, actor);
    showToast(
      `${nextStatus ? 'Activated' : 'Deactivated'} account for ${emp.full_name}`
    );
    loadData();
  };

  const handleSaveCustomPermissions = async (empId: string, customPerms: string[]) => {
    const actor = profile
      ? {
          id: profile.id,
          name: profile.full_name,
          role: profile.role?.display_name || profile.role?.name || 'Administrator',
          branchId: profile.branch_id || undefined,
        }
      : undefined;

    await updateEmployee(empId, { custom_permissions: customPerms }, actor);
    showToast(`Updated custom permissions matrix (${customPerms.length} rules)`);
    loadData();
  };

  const handleUpdateRolePermissions = async (roleId: string, perms: string[]) => {
    const actor = profile
      ? {
          id: profile.id,
          name: profile.full_name,
          role: profile.role?.display_name || profile.role?.name || 'Administrator',
        }
      : undefined;

    await updateRolePermissions(roleId, perms, actor);
    showToast(`Role security policy updated (${perms.length} permissions)`);
    loadData();
  };

  const handleSwitchUser = async (empId: string) => {
    await switchEmployee(empId);
    const target = employees.find((e) => e.id === empId);
    showToast(`Switched active session to ${target?.full_name || 'Staff'}`);
    loadData();
  };

  const canEditStaff = isSuperOrAdmin || hasPermission('employees.edit') || hasPermission('employees.create');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Title & Tab Nav */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Employee Management & Roles
            </h1>
            <span className="bg-primary-50 text-primary-700 border border-primary-100 text-xs font-semibold px-2 py-0.5 rounded-md">
              Burundi (BIF)
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Manage staff profiles, store branch assignments, granular RBAC permissions, and real-time activity logs.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsQuickSwitcherOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Test Role Login</span>
          </button>

          {canEditStaff && (
            <button
              type="button"
              onClick={() => {
                setEditingEmployee(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <EmployeeStatsCards stats={stats} totalBranches={branches.length} />

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('employees')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'employees'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Employees Directory ({employees.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'roles'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Roles & Permissions ({roles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'activity'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Activity Log & Audit Trail</span>
        </button>
      </div>

      {/* Tab 1: Employees Directory */}
      {activeTab === 'employees' && (
        <div>
          <EmployeeFilterBar
            search={search}
            onSearchChange={setSearch}
            selectedBranch={selectedBranch}
            onBranchChange={setSelectedBranch}
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            branches={branches}
            roles={roles}
            onAddEmployee={() => {
              setEditingEmployee(null);
              setIsAddModalOpen(true);
            }}
            onExportCSV={() => exportEmployeesAsCSV(employees)}
            onOpenQuickSwitcher={() => setIsQuickSwitcherOpen(true)}
            canCreateEmployee={canEditStaff}
          />

          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary-600 mb-2" />
              <span className="text-xs text-slate-500">Loading employee directory...</span>
            </div>
          ) : viewMode === 'table' ? (
            <EmployeeTable
              employees={employees}
              onViewEmployee={(emp) => setDrawerEmployee(emp)}
              onEditEmployee={(emp) => {
                setEditingEmployee(emp);
                setIsAddModalOpen(true);
              }}
              onManagePermissions={(emp) => setPermissionsModalEmployee(emp)}
              onViewActivity={(emp) => setDrawerEmployee(emp)}
              onToggleStatus={handleToggleStatus}
              onSwitchUser={(emp) => handleSwitchUser(emp.id)}
              currentUserId={profile?.id}
              canEdit={canEditStaff}
            />
          ) : (
            <EmployeeGrid
              employees={employees}
              onViewEmployee={(emp) => setDrawerEmployee(emp)}
              onEditEmployee={(emp) => {
                setEditingEmployee(emp);
                setIsAddModalOpen(true);
              }}
              onManagePermissions={(emp) => setPermissionsModalEmployee(emp)}
              onViewActivity={(emp) => setDrawerEmployee(emp)}
              onToggleStatus={handleToggleStatus}
              onSwitchUser={(emp) => handleSwitchUser(emp.id)}
              currentUserId={profile?.id}
              canEdit={canEditStaff}
            />
          )}
        </div>
      )}

      {/* Tab 2: Roles & Permissions Matrix */}
      {activeTab === 'roles' && (
        <RolesManagementTab
          roles={roles}
          employees={employees}
          onUpdateRolePermissions={handleUpdateRolePermissions}
          canManageRoles={isSuperOrAdmin}
        />
      )}

      {/* Tab 3: Activity Log & Audit Trail */}
      {activeTab === 'activity' && (
        <ActivityLogView employees={employees} branches={branches} />
      )}

      {/* Modals and Drawers */}
      <EmployeeFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingEmployee(null);
        }}
        onSubmit={handleCreateOrUpdateEmployee}
        initialEmployee={editingEmployee}
        branches={branches}
        roles={roles}
      />

      <EmployeeDetailDrawer
        employee={drawerEmployee}
        isOpen={!!drawerEmployee}
        onClose={() => setDrawerEmployee(null)}
        onEdit={(emp) => {
          setDrawerEmployee(null);
          setEditingEmployee(emp);
          setIsAddModalOpen(true);
        }}
        onManagePermissions={(emp) => {
          setDrawerEmployee(null);
          setPermissionsModalEmployee(emp);
        }}
        onSwitchUser={(emp) => {
          setDrawerEmployee(null);
          handleSwitchUser(emp.id);
        }}
        canEdit={canEditStaff}
      />

      <EmployeePermissionsModal
        isOpen={!!permissionsModalEmployee}
        employee={permissionsModalEmployee}
        roles={roles}
        onClose={() => setPermissionsModalEmployee(null)}
        onSave={handleSaveCustomPermissions}
      />

      <QuickUserSwitcherModal
        isOpen={isQuickSwitcherOpen}
        onClose={() => setIsQuickSwitcherOpen(false)}
        employees={employees}
        currentUserId={profile?.id}
        onSelectEmployee={handleSwitchUser}
      />
    </div>
  );
}
