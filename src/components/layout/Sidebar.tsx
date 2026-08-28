import { Link, useLocation } from 'react-router-dom';
import { Leaf, ChevronLeft, X } from 'lucide-react';
import { NAV_SECTIONS } from '@/lib/constants';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/lib/constants';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const { profile, role } = useAuth();

  const isActive = (path: string, end?: boolean) =>
    end ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-200 dark:border-navy-800 dark:bg-navy-900 lg:translate-x-0 ${
          collapsed ? 'w-16' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-navy-800">
          <Link to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Leaf className="h-4 w-4" />
            </div>
            {!collapsed && <span className="text-lg font-bold text-navy-900 dark:text-white">Verdant</span>}
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-gray-400 hover:text-navy-900 dark:hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto py-4">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter((item) => hasPermission(item.permission));
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.title} className="mb-4">
                {!collapsed && (
                  <p className="px-4 pb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-navy-500">
                    {section.title}
                  </p>
                )}
                <div className="space-y-0.5 px-2">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path, item.end);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                          active
                            ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                            : 'text-navy-700 hover:bg-gray-100 dark:text-navy-300 dark:hover:bg-navy-800'
                        } ${collapsed ? 'justify-center' : ''}`}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-navy-400'}`} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-gray-200 p-3 dark:border-navy-800">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
              {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-navy-900 dark:text-white">{profile?.full_name}</p>
                <p className="truncate text-xs text-gray-400 dark:text-navy-500">{role ? ROLE_LABELS[role.name] ?? role.name : 'User'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden items-center justify-center border-t border-gray-200 py-3 text-gray-400 hover:bg-gray-50 hover:text-navy-900 dark:border-navy-800 dark:hover:bg-navy-800 dark:hover:text-white lg:flex"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>
    </>
  );
}
