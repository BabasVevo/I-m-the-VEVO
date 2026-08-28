import { useState } from 'react';
import { Menu, Sun, Moon, LogOut, Bell, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/lib/constants';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { profile, role, business, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur dark:border-navy-800 dark:bg-navy-900/80">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="text-gray-500 hover:text-navy-900 dark:text-navy-300 dark:hover:text-white lg:hidden">
          <Menu className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-navy-900 dark:text-white sm:text-base">
            {business?.name ?? 'Verdant'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-navy-900 dark:text-navy-300 dark:hover:bg-navy-800 dark:hover:text-white"
          title="Toggle theme"
          aria-label="Toggle light or dark theme"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        <Link
          to="/notifications"
          className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-navy-900 dark:text-navy-300 dark:hover:bg-navy-800 dark:hover:text-white"
          title="Notifications"
          aria-label="View notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white dark:ring-navy-900" />
        </Link>

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
              <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-navy-700 dark:bg-navy-900">
                <div className="border-b border-gray-100 px-4 py-3 dark:border-navy-800">
                  <p className="truncate text-sm font-medium text-navy-900 dark:text-white">{profile?.full_name}</p>
                  <p className="truncate text-xs text-gray-400">{role ? ROLE_LABELS[role.name] ?? role.name : 'User'}</p>
                </div>
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-navy-700 hover:bg-gray-50 dark:text-navy-200 dark:hover:bg-navy-800"
                >
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
