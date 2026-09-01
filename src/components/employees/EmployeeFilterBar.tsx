import { Search, Plus, Download, LayoutGrid, Table, Shield } from 'lucide-react';
import type { Branch, Role } from '@/types/database';

interface EmployeeFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedBranch: string;
  onBranchChange: (val: string) => void;
  selectedRole: string;
  onRoleChange: (val: string) => void;
  selectedStatus: 'all' | 'active' | 'inactive';
  onStatusChange: (val: 'all' | 'active' | 'inactive') => void;
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
  branches: Branch[];
  roles: Role[];
  onAddEmployee: () => void;
  onExportCSV: () => void;
  onOpenQuickSwitcher: () => void;
  canCreateEmployee?: boolean;
}

export function EmployeeFilterBar({
  search,
  onSearchChange,
  selectedBranch,
  onBranchChange,
  selectedRole,
  onRoleChange,
  selectedStatus,
  onStatusChange,
  viewMode,
  onViewModeChange,
  branches,
  roles,
  onAddEmployee,
  onExportCSV,
  onOpenQuickSwitcher,
  canCreateEmployee = true,
}: EmployeeFilterBarProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm mb-5">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="employee-search-input"
            type="text"
            placeholder="Search by name, ID (e.g. EMP-001), job title, or phone..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full px-1.5 py-0.5"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Branch filter */}
          <select
            id="employee-branch-filter"
            value={selectedBranch}
            onChange={(e) => onBranchChange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          >
            <option value="all">All Branches ({branches.length})</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Role filter */}
          <select
            id="employee-role-filter"
            value={selectedRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          >
            <option value="all">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.display_name || r.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              id="employee-status-filter-all"
              type="button"
              onClick={() => onStatusChange('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              id="employee-status-filter-active"
              type="button"
              onClick={() => onStatusChange('active')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedStatus === 'active'
                  ? 'bg-emerald-500 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              id="employee-status-filter-inactive"
              type="button"
              onClick={() => onStatusChange('inactive')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedStatus === 'inactive'
                  ? 'bg-amber-500 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactive
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              id="employee-view-table"
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-primary-600 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Table View"
            >
              <Table className="w-4 h-4" />
            </button>
            <button
              id="employee-view-grid"
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-primary-600 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Impersonate Switcher */}
          <button
            id="btn-quick-switch-identity"
            type="button"
            onClick={onOpenQuickSwitcher}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-lg text-xs font-semibold transition-colors"
            title="Switch your active login to test role permissions on the fly"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Switch Role</span>
          </button>

          {/* Export CSV */}
          <button
            id="btn-export-employees-csv"
            type="button"
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Add Employee Button */}
          {canCreateEmployee && (
            <button
              id="btn-add-employee"
              type="button"
              onClick={onAddEmployee}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
