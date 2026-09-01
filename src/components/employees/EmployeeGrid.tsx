import { motion } from 'motion/react';
import {
  Shield,
  Building2,
  Phone,
  Mail,
  MoreVertical,
  Eye,
  Edit2,
  History,
  Power,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { useState } from 'react';
import type { Employee } from '@/types/database';
import { getRoleBadgeStyle } from './EmployeeTable';

interface EmployeeGridProps {
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

export function EmployeeGrid({
  employees,
  onViewEmployee,
  onEditEmployee,
  onManagePermissions,
  onViewActivity,
  onToggleStatus,
  onSwitchUser,
  currentUserId,
  canEdit = true,
}: EmployeeGridProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  if (employees.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {employees.map((emp, idx) => {
        const roleName = emp.role?.name || emp.role_id;
        const roleLabel = emp.role?.display_name || emp.role?.name || 'Staff';
        const isCurrentUser = emp.id === currentUserId;

        return (
          <motion.div
            key={emp.id}
            id={`employee-card-${emp.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.03 }}
            className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
              emp.is_active ? 'border-slate-200/80' : 'border-slate-200/60 opacity-80 bg-slate-50/40'
            }`}
          >
            <div>
              {/* Header: Avatar, Info, Status, Menu */}
              <div className="flex items-start justify-between gap-2.5 mb-3.5">
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
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        emp.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4
                        onClick={() => onViewEmployee(emp)}
                        className="font-bold text-slate-900 text-sm hover:text-primary-600 cursor-pointer leading-tight"
                      >
                        {emp.full_name}
                      </h4>
                      {isCurrentUser && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary-100 text-primary-700">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{emp.job_title || 'Team Member'}</p>
                    <span className="inline-block font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mt-1">
                      {emp.employee_id || 'EMP-000'}
                    </span>
                  </div>
                </div>

                {/* Dropdown Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveMenuId(activeMenuId === emp.id ? null : emp.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {activeMenuId === emp.id && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />
                      <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 text-left">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            onViewEmployee(emp);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>View Profile</span>
                        </button>
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onEditEmployee(emp);
                              }}
                              className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Edit Info</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onManagePermissions(emp);
                              }}
                              className="w-full px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 font-medium"
                            >
                              <Shield className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Permissions</span>
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            onViewActivity(emp);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <History className="w-3.5 h-3.5 text-slate-400" />
                          <span>Activity Logs</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            onSwitchUser(emp);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-primary-700 hover:bg-primary-50 flex items-center gap-2 font-semibold"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-primary-500" />
                          <span>Test Role</span>
                        </button>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onToggleStatus(emp);
                            }}
                            className={`w-full px-3 py-1.5 text-xs flex items-center gap-2 border-t border-slate-100 ${
                              emp.is_active
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{emp.is_active ? 'Deactivate Account' : 'Activate Account'}</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Role and Branch Badges */}
              <div className="space-y-2 mb-3.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between gap-1 text-xs">
                  <span className="text-slate-400 font-medium">Role:</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${getRoleBadgeStyle(
                      roleName
                    )}`}
                  >
                    <Shield className="w-3 h-3" />
                    {roleLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1 text-xs">
                  <span className="text-slate-400 font-medium">Branch:</span>
                  <div className="flex items-center gap-1 text-slate-700 font-medium truncate max-w-[170px]">
                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate text-[11px]">{emp.branch?.name || 'All Locations (HQ)'}</span>
                  </div>
                </div>
              </div>

              {/* Contact meta */}
              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 mb-3.5">
                {emp.email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                )}
                {emp.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{emp.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>Joined: {emp.date_joined || '2024'}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => onViewEmployee(emp)}
                className="text-primary-600 hover:text-primary-700 font-semibold inline-flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Details</span>
              </button>

              <button
                type="button"
                onClick={() => onSwitchUser(emp)}
                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-medium text-[11px] inline-flex items-center gap-1"
              >
                <UserCheck className="w-3 h-3" />
                <span>Switch Role</span>
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
