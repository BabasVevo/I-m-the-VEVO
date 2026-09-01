import { useState } from 'react';
import {
  MoreVertical,
  Eye,
  Edit2,
  Shield,
  History,
  Power,
  UserCheck,
  Building2,
  Phone,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { Employee } from '@/types/database';

interface EmployeeTableProps {
  employees: Employee[];
  onViewEmployee: (emp: Employee) => void;
  onEditEmployee: (emp: Employee) => void;
  onManagePermissions: (emp: Employee) => void;
  onViewActivity: (emp: Employee) => void;
  onToggleStatus: (emp: Employee) => void;
  onSwitchUser: (emp: Employee) => void;
  currentUserId?: string;
  canEdit?: boolean;
}

export function getRoleBadgeStyle(roleName?: string | null) {
  switch (roleName) {
    case 'super_admin':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'admin':
    case 'business_owner':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'branch_manager':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'cashier':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'inventory_manager':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'sales_employee':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'marketing_manager':
      return 'bg-pink-100 text-pink-800 border-pink-200';
    case 'accountant':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
}

export function EmployeeTable({
  employees,
  onViewEmployee,
  onEditEmployee,
  onManagePermissions,
  onViewActivity,
  onToggleStatus,
  onSwitchUser,
  currentUserId,
  canEdit = true,
}: EmployeeTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <UserCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">No employees found</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          No staff records matched your search query or filter criteria. Try adjusting your filters or add a new team member.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Job Title</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Assigned Branch</th>
              <th className="py-3 px-4">Contact Info</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((emp) => {
              const roleName = emp.role?.name || emp.role_id;
              const roleLabel = emp.role?.display_name || emp.role?.name || 'Staff';
              const isCurrentUser = emp.id === currentUserId;

              return (
                <tr
                  key={emp.id}
                  id={`employee-row-${emp.id}`}
                  className="hover:bg-slate-50/60 transition-colors group"
                >
                  {/* Profile Column */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={
                            emp.avatar_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              emp.full_name
                            )}&background=0D8ABC&color=fff`
                          }
                          alt={emp.full_name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                            emp.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => onViewEmployee(emp)}
                            className="font-semibold text-slate-900 hover:text-primary-600 cursor-pointer text-sm"
                          >
                            {emp.full_name}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-100 text-primary-700">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded text-[11px]">
                            {emp.employee_id || 'EMP-000'}
                          </span>
                          <span>•</span>
                          <span className="truncate max-w-[160px]">{emp.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Job Title */}
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-800">{emp.job_title || 'Team Member'}</span>
                    <p className="text-[11px] text-slate-400">
                      Joined {emp.date_joined || 'Recently'}
                    </p>
                  </td>

                  {/* Role Badge */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border ${getRoleBadgeStyle(
                        roleName
                      )}`}
                    >
                      <Shield className="w-3 h-3" />
                      {roleLabel}
                    </span>
                    {emp.custom_permissions && emp.custom_permissions.length > 0 && (
                      <span className="block text-[10px] text-indigo-600 mt-0.5 font-medium">
                        +{emp.custom_permissions.length} custom perms
                      </span>
                    )}
                  </td>

                  {/* Assigned Branch */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-700 text-xs font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[180px]">
                        {emp.branch?.name || 'All Branches (HQ)'}
                      </span>
                    </div>
                  </td>

                  {/* Contact Info */}
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    {emp.phone ? (
                      <div className="flex items-center gap-1 text-slate-700 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{emp.phone}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No phone</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => canEdit && onToggleStatus(emp)}
                      disabled={!canEdit}
                      title={emp.is_active ? 'Click to deactivate' : 'Click to activate'}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                        emp.is_active
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {emp.is_active ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-slate-400" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right relative">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onViewEmployee(emp)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onEditEmployee(emp)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Employee"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(activeMenuId === emp.id ? null : emp.id)
                          }
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === emp.id && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setActiveMenuId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 text-left">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onViewEmployee(emp);
                                }}
                                className="w-full px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                <span>View Full Profile</span>
                              </button>

                              {canEdit && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onEditEmployee(emp);
                                    }}
                                    className="w-full px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Edit Information</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onManagePermissions(emp);
                                    }}
                                    className="w-full px-3.5 py-1.5 text-xs text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 font-medium"
                                  >
                                    <Shield className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>Manage Permissions</span>
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onViewActivity(emp);
                                }}
                                className="w-full px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <History className="w-3.5 h-3.5 text-slate-400" />
                                <span>View Activity Logs</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onSwitchUser(emp);
                                }}
                                className="w-full px-3.5 py-1.5 text-xs text-primary-700 hover:bg-primary-50 flex items-center gap-2 font-semibold"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-primary-500" />
                                <span>Switch User & Test Role</span>
                              </button>

                              {canEdit && (
                                <div className="border-t border-slate-100 my-1 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onToggleStatus(emp);
                                    }}
                                    className={`w-full px-3.5 py-1.5 text-xs flex items-center gap-2 ${
                                      emp.is_active
                                        ? 'text-amber-700 hover:bg-amber-50'
                                        : 'text-emerald-700 hover:bg-emerald-50'
                                    }`}
                                  >
                                    <Power className="w-3.5 h-3.5" />
                                    <span>
                                      {emp.is_active ? 'Deactivate Account' : 'Activate Account'}
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
