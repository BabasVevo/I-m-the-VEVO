import { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Shield,
  History,
  CheckCircle2,
  XCircle,
  FileText,
  HeartHandshake,
  Edit2,
  UserCheck,
  Check,
  Clock,
} from 'lucide-react';
import type { Employee, ActivityLog } from '@/types/database';
import { getRoleBadgeStyle } from './EmployeeTable';
import { getActivityLogs } from '@/services/activityLogService';

interface EmployeeDetailDrawerProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (emp: Employee) => void;
  onManagePermissions: (emp: Employee) => void;
  onSwitchUser: (emp: Employee) => void;
  canEdit?: boolean;
}

export function EmployeeDetailDrawer({
  employee,
  isOpen,
  onClose,
  onEdit,
  onManagePermissions,
  onSwitchUser,
  canEdit = true,
}: EmployeeDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'permissions' | 'activity'>('profile');
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (employee && isOpen) {
      setLoadingLogs(true);
      getActivityLogs({ employeeId: employee.id, limit: 15 })
        .then((res) => setRecentLogs(res.data))
        .catch(console.error)
        .finally(() => setLoadingLogs(false));
    }
  }, [employee, isOpen]);

  if (!isOpen || !employee) return null;

  const roleName = employee.role?.name || employee.role_id;
  const roleLabel = employee.role?.display_name || employee.role?.name || 'Staff';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-250">
        {/* Top Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/90 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={
                  employee.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    employee.full_name
                  )}&background=0D8ABC&color=fff`
                }
                alt={employee.full_name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                referrerPolicy="no-referrer"
              />
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  employee.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{employee.full_name}</h2>
                <span className="font-mono text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                  {employee.employee_id || 'EMP-000'}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-600 mt-0.5">{employee.job_title || 'Team Member'}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getRoleBadgeStyle(
                    roleName
                  )}`}
                >
                  <Shield className="w-3 h-3" />
                  {roleLabel}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    employee.is_active
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {employee.is_active ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Active Account</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-slate-400" />
                      <span>Inactive</span>
                    </>
                  )}
                </span>
              </div>
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'permissions'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Role & Permissions</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Recent Activity ({recentLogs.length})</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {/* Contact and Branch Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Contact & Location Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Email Address:</span>
                    <div className="flex items-center gap-1.5 text-slate-800 font-medium mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{employee.email || 'None'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Phone Number:</span>
                    <div className="flex items-center gap-1.5 text-slate-800 font-mono font-medium mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{employee.phone || 'None'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Assigned Branch:</span>
                    <div className="flex items-center gap-1.5 text-slate-800 font-medium mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{employee.branch?.name || 'All Locations (HQ)'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Date Joined:</span>
                    <div className="flex items-center gap-1.5 text-slate-800 font-medium mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{employee.date_joined || 'Jan 2024'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
                  <span>Emergency Contact</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Name:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {employee.emergency_contact_name || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Relation:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {employee.emergency_contact_relation || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Emergency Phone:</span>
                    <p className="font-mono font-semibold text-slate-800 mt-0.5">
                      {employee.emergency_contact_phone || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              {employee.notes && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Internal Remarks & Notes</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                    {employee.notes}
                  </p>
                </div>
              )}

              {/* Security & Access meta */}
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="font-semibold text-indigo-900">Last Portal Session:</span>
                    <p className="text-[11px] text-indigo-700">
                      {employee.last_login_at
                        ? new Date(employee.last_login_at).toLocaleString()
                        : 'Active today'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSwitchUser(employee)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors"
                >
                  Test Role Login
                </button>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Assigned Role: {roleLabel}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {employee.role?.description || 'Standard role permissions apply to this account.'}
                  </p>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => onManagePermissions(employee)}
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    Customize Matrix
                  </button>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Assigned Permission Keys ({employee.role?.permissions?.length || 0})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(employee.role?.permissions || ['dashboard.view', 'pos.sell']).map((perm) => (
                    <div
                      key={perm}
                      className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs font-medium text-slate-700"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-mono text-[11px] truncate">{perm}</span>
                    </div>
                  ))}
                </div>
              </div>

              {employee.custom_permissions && employee.custom_permissions.length > 0 && (
                <div className="pt-3 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">
                    Custom Permission Overrides ({employee.custom_permissions.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {employee.custom_permissions.map((perm) => (
                      <div
                        key={perm}
                        className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg border border-indigo-200 text-xs font-medium text-indigo-900"
                      >
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-mono text-[11px] truncate">{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              {loadingLogs ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Loading activity logs...
                </div>
              ) : recentLogs.length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-8 text-center text-xs text-slate-500 border border-slate-200">
                  No recorded activity found for this employee yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition-colors text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span className="font-semibold uppercase tracking-wider text-slate-600">
                          {log.action_category} • {log.action_type}
                        </span>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <p className="font-medium text-slate-800">{log.description}</p>
                      {log.entity_label && (
                        <span className="inline-block font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                          {log.entity_label}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onSwitchUser(employee)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            <span>Switch Session to {employee.full_name.split(' ')[0]}</span>
          </button>

          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onManagePermissions(employee)}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Permissions
              </button>
              <button
                type="button"
                onClick={() => onEdit(employee)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
