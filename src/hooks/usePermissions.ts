import { useAuth } from '@/context/AuthContext';

export function usePermissions() {
  const { permissions, role } = useAuth();

  const hasPermission = (key: string): boolean => {
    if (role?.name === 'super_admin' || role?.name === 'business_owner') return true;
    return permissions.includes(key);
  };

  const hasAnyPermission = (keys: string[]): boolean => {
    if (role?.name === 'super_admin' || role?.name === 'business_owner') return true;
    return keys.some((k) => permissions.includes(k));
  };

  return { hasPermission, hasAnyPermission, permissions };
}
