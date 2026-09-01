import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Shield, Building2, Calendar, HeartHandshake, Check } from 'lucide-react';
import type { Employee, Branch, Role } from '@/types/database';
import type { CreateEmployeeInput } from '@/services/employeeService';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEmployeeInput) => Promise<void>;
  initialEmployee?: Employee | null;
  branches: Branch[];
  roles: Role[];
  isLoading?: boolean;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
];

export function EmployeeFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialEmployee,
  branches,
  roles,
  isLoading = false,
}: EmployeeFormModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+257 ');
  const [employeeId, setEmployeeId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [roleId, setRoleId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [dateJoined, setDateJoined] = useState(new Date().toISOString().split('T')[0]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialEmployee) {
      setFullName(initialEmployee.full_name || '');
      setEmail(initialEmployee.email || '');
      setPhone(initialEmployee.phone || '+257 ');
      setEmployeeId(initialEmployee.employee_id || '');
      setJobTitle(initialEmployee.job_title || '');
      setRoleId(initialEmployee.role_id || (roles[0]?.id ?? ''));
      setBranchId(initialEmployee.branch_id || '');
      setIsActive(initialEmployee.is_active ?? true);
      setDateJoined(
        initialEmployee.date_joined ||
          (initialEmployee.created_at
            ? initialEmployee.created_at.split('T')[0]
            : new Date().toISOString().split('T')[0])
      );
      setAvatarUrl(initialEmployee.avatar_url || AVATAR_PRESETS[0]);
      setNotes(initialEmployee.notes || '');
      setEmergencyName(initialEmployee.emergency_contact_name || '');
      setEmergencyPhone(initialEmployee.emergency_contact_phone || '');
      setEmergencyRelation(initialEmployee.emergency_contact_relation || '');
    } else {
      setFullName('');
      setEmail('');
      setPhone('+257 7');
      setEmployeeId('');
      setJobTitle('');
      setRoleId(roles.find((r) => r.name === 'cashier')?.id || roles[0]?.id || '');
      setBranchId(branches[0]?.id || '');
      setIsActive(true);
      setDateJoined(new Date().toISOString().split('T')[0]);
      setAvatarUrl(AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)]);
      setNotes('');
      setEmergencyName('');
      setEmergencyPhone('');
      setEmergencyRelation('');
    }
    setErrors({});
  }, [initialEmployee, isOpen, roles, branches]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    if (!email.trim()) errs.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Valid email is required';
    if (!jobTitle.trim()) errs.jobTitle = 'Job title is required';
    if (!roleId) errs.roleId = 'Please select a system role';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      employee_id: employeeId.trim() || undefined,
      job_title: jobTitle.trim(),
      role_id: roleId,
      branch_id: branchId || undefined,
      is_active: isActive,
      date_joined: dateJoined,
      avatar_url: avatarUrl || undefined,
      notes: notes.trim() || undefined,
      emergency_contact_name: emergencyName.trim() || undefined,
      emergency_contact_phone: emergencyPhone.trim() || undefined,
      emergency_contact_relation: emergencyRelation.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {initialEmployee ? 'Edit Employee Information' : 'Onboard New Employee'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {initialEmployee
                ? `Updating profile and access settings for ${initialEmployee.full_name}`
                : 'Add a team member, assign store branch and configure system role'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Avatar selector & preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              <img
                src={
                  avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    fullName || 'Staff'
                  )}&background=0D8ABC&color=fff`
                }
                alt="Avatar preview"
                className="w-14 h-14 rounded-full object-cover border-2 border-primary-500 shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-1.5">Choose an avatar preset or provide photo URL:</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {AVATAR_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatarUrl(preset)}
                      className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-transform ${
                        avatarUrl === preset ? 'border-primary-600 scale-110' : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt={`Preset ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="employee-form-fullname"
                  type="text"
                  placeholder="e.g. Eric Ndayisaba"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 ${
                    errors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.fullName && <p className="text-xs text-rose-500 mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="employee-form-email"
                  type="email"
                  placeholder="e.g. eric.ndayisaba@babaspos.bi"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 ${
                    errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number (Burundi)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="employee-form-phone"
                  type="text"
                  placeholder="+257 79 12 34 56"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employee ID
              </label>
              <input
                id="employee-form-id"
                type="text"
                placeholder="Auto-generated (e.g. EMP-009)"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Section 2: Role, Job Title, Branch */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="employee-form-jobtitle"
                type="text"
                placeholder="e.g. Senior POS Cashier"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 ${
                  errors.jobTitle ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.jobTitle && <p className="text-xs text-rose-500 mt-1">{errors.jobTitle}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                System Role <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  id="employee-form-role"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.display_name || r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Branch / Store
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  id="employee-form-branch"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                >
                  <option value="">All Branches (HQ)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Date Joined & Active Switch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date Joined
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="employee-form-datejoined"
                  type="date"
                  value={dateJoined}
                  onChange={(e) => setDateJoined(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-xs font-bold text-slate-800">Account Status</span>
                <p className="text-[11px] text-slate-500">
                  {isActive ? 'Active and permitted to log in' : 'Deactivated account (blocked)'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isActive ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 4: Emergency Contact */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-slate-400" />
              <span>Emergency Contact Information</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <input
                  id="employee-form-em-name"
                  type="text"
                  placeholder="Contact Name"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div>
                <input
                  id="employee-form-em-phone"
                  type="text"
                  placeholder="Emergency Phone"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div>
                <input
                  id="employee-form-em-relation"
                  type="text"
                  placeholder="Relationship (e.g. Spouse, Brother)"
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Notes */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Employee Notes & Remarks
            </label>
            <textarea
              id="employee-form-notes"
              rows={2}
              placeholder="e.g. Special training completed, assigned cash register drawer #2..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="employee-form-submit"
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{initialEmployee ? 'Update Employee' : 'Create Employee'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
