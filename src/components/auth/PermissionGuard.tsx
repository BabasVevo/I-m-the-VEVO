import { Navigate, Link } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Home } from 'lucide-react';
import type { ReactNode } from 'react';

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
}

export function PermissionGuard({ permission, children }: PermissionGuardProps) {
  const { hasPermission, isSuperAdmin, isSuperOrAdmin } = usePermissions();
  const { loading } = useAuth();

  if (loading) {
    return null;
  }

  // Super Administrator and authorized managers are never blocked
  if (isSuperAdmin || (isSuperOrAdmin && permission !== 'plans.manage')) {
    return <>{children}</>;
  }

  if (!hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold text-navy-900 dark:text-white">Access denied</h2>
        <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-navy-400">
          You don't have permission to view this page. Contact your administrator if you need access.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <Home className="w-3.5 h-3.5" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { hasPermission } = usePermissions();
  // This is a simple wrapper — actual auth check is done at router level
  void hasPermission;
  return <>{children}</>;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  // Auth check handled in App routing; this is a passthrough for clarity
  return <>{children}</>;
}

export function RedirectIfAuth({ children }: { children: ReactNode }) {
  void children;
  return <Navigate to="/dashboard" replace />;
}
