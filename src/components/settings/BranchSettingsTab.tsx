import { useState, useEffect, type FormEvent } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  AlertTriangle,
  Eye,
  Store,
} from 'lucide-react';
import type { Branch, Employee } from '@/types/database';
import {
  fetchAllBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  toggleBranchStatus,
  type CreateBranchInput,
} from '@/services/branchService';
import { getEmployees } from '@/services/employeeService';
import { useToast } from '@/context/ToastContext';

interface BranchSettingsTabProps {
  isSuperAdmin: boolean;
  canManageBranches: boolean;
  userBranchId?: string | null;
}

export function BranchSettingsTab({
  isSuperAdmin,
  canManageBranches,
  userBranchId,
}: BranchSettingsTabProps) {
  const { addToast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [viewingEmployeesBranch, setViewingEmployeesBranch] = useState<Branch | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State for Create/Edit
  const [formState, setFormState] = useState<CreateBranchInput>({
    name: '',
    address: '',
    phone: '',
    email: '',
    city: 'Bujumbura',
    manager_id: null,
    is_active: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [branchList, empList] = await Promise.all([
        fetchAllBranches(),
        getEmployees(),
      ]);
      setBranches(branchList);
      setEmployees(empList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load branch data.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setFormState({
      name: '',
      address: '',
      phone: '',
      email: '',
      city: 'Bujumbura',
      manager_id: null,
      is_active: true,
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setFormState({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      city: branch.city || 'Bujumbura',
      manager_id: branch.manager_id || null,
      is_active: branch.is_active,
    });
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) {
      addToast('Branch name is required.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await createBranch(formState);
      addToast(`Branch "${formState.name}" created successfully.`, 'success');
      setIsCreateModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create branch.';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    if (!formState.name.trim()) {
      addToast('Branch name is required.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await updateBranch(editingBranch.id, formState);
      addToast(`Branch "${formState.name}" updated successfully.`, 'success');
      setEditingBranch(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update branch.';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (branch: Branch) => {
    try {
      const nextStatus = !branch.is_active;
      await toggleBranchStatus(branch.id, nextStatus);
      addToast(`Branch "${branch.name}" is now ${nextStatus ? 'active' : 'inactive'}.`, 'success');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle branch status.';
      addToast(msg, 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBranch) return;
    setSubmitting(true);
    try {
      await deleteBranch(deletingBranch.id);
      addToast(`Branch "${deletingBranch.name}" has been deleted.`, 'success');
      setDeletingBranch(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete branch.';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter branches according to RBAC:
  // If super admin or has global manage permission, view all. Otherwise filter by user's assigned branch.
  const visibleBranches = branches.filter((b) => {
    if (!isSuperAdmin && !canManageBranches && userBranchId && b.id !== userBranchId) {
      return false;
    }
    if (statusFilter === 'active' && !b.is_active) return false;
    if (statusFilter === 'inactive' && b.is_active) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        (b.address && b.address.toLowerCase().includes(q)) ||
        (b.city && b.city.toLowerCase().includes(q)) ||
        (b.phone && b.phone.toLowerCase().includes(q)) ||
        (b.manager?.full_name && b.manager.full_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const branchAssignedEmployees = viewingEmployeesBranch
    ? employees.filter((e) => e.branch_id === viewingEmployeesBranch.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            Branch & Location Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-navy-300 mt-1">
            Configure regional commercial hubs, assign branch managers, manage contact details, and audit assigned staff.
          </p>
        </div>

        {(isSuperAdmin || canManageBranches) && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Add New Branch
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-navy-900 p-4 rounded-xl border border-gray-200 dark:border-navy-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search branches by name, city, address, or manager..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-gray-50 dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="w-full sm:w-auto px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-gray-50 dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Statuses ({branches.length})</option>
            <option value="active">Active Only ({branches.filter((b) => b.is_active).length})</option>
            <option value="inactive">Inactive ({branches.filter((b) => !b.is_active).length})</option>
          </select>
        </div>
      </div>

      {/* Branch Cards Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500 dark:text-navy-300">Loading branch network...</p>
        </div>
      ) : visibleBranches.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800">
          <Store className="h-10 w-10 text-gray-400 mx-auto" />
          <h3 className="mt-3 text-base font-bold text-navy-900 dark:text-white">No Branches Found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-navy-400">
            {searchQuery ? 'No branches match your search criteria.' : 'No branches are currently registered.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {visibleBranches.map((branch) => {
            const managerEmp = branch.manager_id ? employees.find((e) => e.id === branch.manager_id) : null;
            const staffCount = employees.filter((e) => e.branch_id === branch.id).length;

            return (
              <div
                key={branch.id}
                className={`bg-white dark:bg-navy-900 rounded-xl border transition shadow-sm overflow-hidden flex flex-col justify-between ${
                  branch.is_active
                    ? 'border-gray-200 dark:border-navy-800 hover:border-brand-400 dark:hover:border-brand-600'
                    : 'border-gray-200 dark:border-navy-800 opacity-75 bg-gray-50/50 dark:bg-navy-950/40'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-11 w-11 rounded-lg flex items-center justify-center font-bold text-lg ${
                          branch.is_active
                            ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'
                            : 'bg-gray-200 dark:bg-navy-800 text-gray-500'
                        }`}
                      >
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-navy-900 dark:text-white text-base leading-tight">
                          {branch.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-navy-400 mt-0.5">
                          {branch.city || 'Burundi'} • ID: <span className="font-mono">{branch.id}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                        branch.is_active
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                          : 'bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-navy-400 border border-gray-300 dark:border-navy-700'
                      }`}
                    >
                      {branch.is_active ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </>
                      )}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600 dark:text-navy-300 mt-4 pt-3 border-t border-gray-100 dark:border-navy-800">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{branch.address || 'Address not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>{branch.phone || '+257 22 -- ----'}</span>
                    </div>
                    {branch.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{branch.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Branch Manager & Staff Counter */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-navy-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                      <div className="text-xs">
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Branch Manager</span>
                        <span className="font-medium text-navy-900 dark:text-white">
                          {managerEmp ? managerEmp.full_name : 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewingEmployeesBranch(branch)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-navy-800 hover:bg-gray-200 dark:hover:bg-navy-700 text-gray-700 dark:text-navy-200 transition"
                    >
                      <Users className="h-3.5 w-3.5 text-brand-600" />
                      <span>{staffCount} Staff</span>
                      <Eye className="h-3 w-3 ml-0.5" />
                    </button>
                  </div>
                </div>

                {/* Actions Footer */}
                {(isSuperAdmin || canManageBranches) && (
                  <div className="px-5 py-3 bg-gray-50 dark:bg-navy-950/60 border-t border-gray-200 dark:border-navy-800 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(branch)}
                      className={`font-semibold transition ${
                        branch.is_active
                          ? 'text-amber-600 dark:text-amber-400 hover:underline'
                          : 'text-emerald-600 dark:text-emerald-400 hover:underline'
                      }`}
                    >
                      {branch.is_active ? 'Deactivate Branch' : 'Activate Branch'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(branch)}
                        className="p-1.5 text-gray-600 dark:text-navy-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-md hover:bg-gray-200 dark:hover:bg-navy-800 transition"
                        title="Edit Branch"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => setDeletingBranch(branch)}
                          className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-700 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Delete Branch"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE BRANCH MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-navy-900 w-full max-w-lg rounded-xl shadow-xl border border-gray-200 dark:border-navy-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-navy-800">
              <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-brand-600" />
                Register New Branch Location
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-navy-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1">
                  Branch Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  placeholder="e.g. Ngozi Wholesale & Distribution"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1">
                    City / Province
                  </label>
                  <input
                    type="text"
                    value={formState.city}
                    onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                    placeholder="e.g. Bujumbura, Gitega, Ngozi"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    placeholder="+257 22 25 1200"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1">
                  Physical Address
                </label>
                <input
                  type="text"
                  value={formState.address}
                  onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                  placeholder="Street / Avenue, Quartier"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1">
                    Branch Email
                  </label>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder="branch@babaspos.bi"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1">
                    Assign Branch Manager
                  </label>
                  <select
                    value={formState.manager_id || ''}
                    onChange={(e) => setFormState({ ...formState, manager_id: e.target.value || null })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">-- No Manager Assigned --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.job_title || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-navy-800 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold text-navy-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.is_active}
                    onChange={(e) => setFormState({ ...formState, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>Activate immediately for POS & Inventory</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-navy-300 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition shadow-sm disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BRANCH MODAL */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-navy-900 w-full max-w-lg rounded-xl shadow-xl border border-gray-200 dark:border-navy-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-navy-800">
              <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-brand-600" />
                Edit Branch: {editingBranch.name}
              </h3>
              <button
                onClick={() => setEditingBranch(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-navy-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1">
                  Branch Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1">
                    City / Province
                  </label>
                  <input
                    type="text"
                    value={formState.city}
                    onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1">
                  Physical Address
                </label>
                <input
                  type="text"
                  value={formState.address}
                  onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1">
                    Branch Email
                  </label>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-800 dark:text-navy-200 mb-1">
                    Assign Branch Manager
                  </label>
                  <select
                    value={formState.manager_id || ''}
                    onChange={(e) => setFormState({ ...formState, manager_id: e.target.value || null })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">-- No Manager Assigned --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.job_title || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-navy-800">
                <label className="flex items-center gap-2 text-xs font-semibold text-navy-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.is_active}
                    onChange={(e) => setFormState({ ...formState, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>Active Branch (Available for cashier logins, stock transfers, and POS sales)</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-navy-300 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition shadow-sm disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGNED EMPLOYEES ROSTER MODAL */}
      {viewingEmployeesBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-navy-900 w-full max-w-2xl rounded-xl shadow-xl border border-gray-200 dark:border-navy-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-navy-800">
              <div>
                <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-brand-600" />
                  Staff Assigned to: {viewingEmployeesBranch.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-navy-400 mt-0.5">
                  {branchAssignedEmployees.length} registered employees stationed at this branch.
                </p>
              </div>
              <button
                onClick={() => setViewingEmployeesBranch(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-navy-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {branchAssignedEmployees.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No employees currently stationed at this branch.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-navy-800">
                  {branchAssignedEmployees.map((emp) => {
                    const isManager = emp.id === viewingEmployeesBranch.manager_id;
                    return (
                      <div key={emp.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {emp.avatar_url ? (
                            <img
                              src={emp.avatar_url}
                              alt={emp.full_name}
                              className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-navy-700"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-brand-600 text-white font-bold text-sm flex items-center justify-center">
                              {emp.full_name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-navy-900 dark:text-white text-sm">
                                {emp.full_name}
                              </span>
                              {isManager && (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                                  Branch Manager
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-navy-400">
                              {emp.job_title || 'Staff Member'} • <span className="font-mono">{emp.employee_id}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right text-xs text-gray-500 dark:text-navy-400">
                          <div>{emp.phone || 'No phone'}</div>
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full mt-1 ${
                              emp.is_active
                                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                                : 'bg-gray-100 dark:bg-navy-800 text-gray-600'
                            }`}
                          >
                            {emp.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-gray-50 dark:bg-navy-950/80 border-t border-gray-200 dark:border-navy-800 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingEmployeesBranch(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-200 dark:bg-navy-800 text-gray-800 dark:text-navy-200 hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-navy-900 w-full max-w-md rounded-xl shadow-xl border border-gray-200 dark:border-navy-800 overflow-hidden p-6">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Delete Branch Location?
              </h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-navy-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-navy-900 dark:text-white">{deletingBranch.name}</strong>?
              This action cannot be undone. You cannot delete a branch if employees or inventory stock remain assigned to it.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingBranch(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-navy-300 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-sm disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
