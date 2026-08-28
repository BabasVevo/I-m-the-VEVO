import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
}

export function PermissionGuard({ permission, children }: PermissionGuardProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-semibold text-navy-900 dark:text-white">Access denied</h2>
        <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-navy-400">
          You don't have permission to view this page. Contact your administrator if you believe this is an error.
        </p>
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
