import { useState, useEffect } from 'react';
import { Menu, Sun, Moon, LogOut, ChevronDown, UserCheck, Shield, Users, History } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/lib/constants';
import { QuickUserSwitcherModal } from '@/components/employees/QuickUserSwitcherModal';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { getEmployees } from '@/services/employeeService';
import type { Employee } from '@/types/database';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { profile, role, business, signOut, switchEmployee } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    getEmployees().then(setEmployees).catch(console.error);
  }, [profile?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSwitchUser = async (empId: string) => {
    await switchEmployee(empId);
    setSwitcherOpen(false);
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur dark:border-navy-800 dark:bg-navy-900/80">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="text-gray-500 hover:text-navy-900 dark:text-navy-300 dark:hover:text-white lg:hidden">
          <Menu className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-navy-900 dark:text-white sm:text-base">
            {business?.name ?? 'BABAS POS & Inventory'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick Role Test Switcher Button */}
        <button
          type="button"
          onClick={() => setSwitcherOpen(true)}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 text-xs font-semibold transition-colors"
          title="Quick switch employee or role"
        >
          <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Switch Role</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-navy-900 dark:text-navy-300 dark:hover:bg-navy-800 dark:hover:text-white"
          title="Toggle theme"
          aria-label="Toggle light or dark theme"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        <NotificationDropdown />

        {/* User dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 rounded-xl p-1.5 transition hover:bg-gray-100 dark:hover:bg-navy-800"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
              {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="hidden text-left sm:block">
              <p className="truncate text-xs font-semibold text-navy-900 dark:text-white max-w-[120px]">
                {profile?.full_name ?? 'User'}
              </p>
              <p className="truncate text-[10px] text-gray-400 dark:text-navy-400">
                {role ? ROLE_LABELS[role.name] ?? role.name : 'Staff'}
              </p>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-60 rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl dark:border-navy-700 dark:bg-navy-900">
                <div className="border-b border-gray-100 px-4 py-3 dark:border-navy-800">
                  <p className="truncate text-sm font-bold text-navy-900 dark:text-white">{profile?.full_name}</p>
                  <p className="truncate text-xs text-brand-600 dark:text-brand-400 font-semibold mt-0.5">
                    {role ? ROLE_LABELS[role.name] ?? role.name : 'User'}
                  </p>
                  <p className="truncate text-[11px] text-gray-400">{profile?.email}</p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setSwitcherOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/60"
                  >
                    <UserCheck className="h-4 w-4" /> Switch Role / Staff
                  </button>

                  <Link
                    to="/employees"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-navy-700 hover:bg-gray-50 dark:text-navy-200 dark:hover:bg-navy-800"
                  >
                    <Users className="h-4 w-4 text-gray-400" /> Employees Directory
                  </Link>

                  <Link
                    to="/roles"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-navy-700 hover:bg-gray-50 dark:text-navy-200 dark:hover:bg-navy-800"
                  >
                    <Shield className="h-4 w-4 text-gray-400" /> Roles & Permissions
                  </Link>

                  <Link
                    to="/activity-log"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-navy-700 hover:bg-gray-50 dark:text-navy-200 dark:hover:bg-navy-800"
                  >
                    <History className="h-4 w-4 text-gray-400" /> Activity Log
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-xs text-navy-700 hover:bg-gray-50 dark:text-navy-200 dark:hover:bg-navy-800"
                  >
                    Settings
                  </Link>
                </div>

                <div className="border-t border-gray-100 pt-1 dark:border-navy-800">
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Switcher Modal */}
      <QuickUserSwitcherModal
        isOpen={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        employees={employees}
        currentUserId={profile?.id}
        onSelectEmployee={handleSwitchUser}
      />
    </header>
  );
}

