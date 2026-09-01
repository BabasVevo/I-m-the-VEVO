import { useState } from 'react';
import {
  X,
  UserCheck,
  Shield,
  Check,
  ArrowRight,
  Info,
} from 'lucide-react';
import type { Employee } from '@/types/database';
import { getRoleBadgeStyle } from './EmployeeTable';

interface QuickUserSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  currentUserId?: string;
  onSelectEmployee: (empId: string) => Promise<void>;
}

export function QuickUserSwitcherModal({
  isOpen,
  onClose,
  employees,
  currentUserId,
  onSelectEmployee,
}: QuickUserSwitcherModalProps) {
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = async (emp: Employee) => {
    setSwitchingId(emp.id);
    try {
      await onSelectEmployee(emp.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Quick Role & Employee Switcher
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Switch identity to test role-based permissions, navigation, and access control
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

        {/* Tip banner */}
        <div className="px-6 py-3 bg-indigo-50/70 border-b border-indigo-100/70 flex items-center gap-2.5 text-xs text-indigo-900">
          <Info className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            Selecting a profile updates your session permissions and active branch immediately.
          </span>
        </div>

        {/* Employee Options List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-2.5">
          {employees.map((emp) => {
            const roleName = emp.role?.name || emp.role_id;
            const roleLabel = emp.role?.display_name || emp.role?.name || 'Staff';
            const isCurrent = emp.id === currentUserId;
            const isPending = switchingId === emp.id;

            return (
              <div
                key={emp.id}
                onClick={() => !isCurrent && handleSelect(emp)}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isCurrent
                    ? 'bg-primary-50/40 border-primary-300 ring-2 ring-primary-500/15'
                    : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50/80 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <img
                      src={
                        emp.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          emp.full_name
                        )}&background=0D8ABC&color=fff`
                      }
                      alt={emp.full_name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        emp.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {emp.full_name}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-100 text-primary-700">
                          Active User
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{emp.job_title || 'Team Member'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.2 rounded text-[10px] font-semibold border ${getRoleBadgeStyle(
                          roleName
                        )}`}
                      >
                        <Shield className="w-2.5 h-2.5" />
                        {roleLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono truncate">
                        {emp.branch?.name?.split(' ')[0] || 'HQ'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  {isCurrent ? (
                    <div className="flex items-center gap-1 text-xs font-semibold text-primary-600">
                      <Check className="w-4 h-4" />
                      <span>Logged In</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isPending}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1"
                    >
                      <span>{isPending ? 'Switching...' : 'Switch'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
