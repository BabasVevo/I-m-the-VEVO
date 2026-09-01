import { useAuth } from '@/context/AuthContext';
import type { Role, Profile } from '@/types/database';
import type { User } from '@supabase/supabase-js';

/**
 * Normalizes role names and strings to ensure consistent matching
 */
function normalizeRoleStr(val?: string | null): string {
  if (!val) return '';
  return val.toLowerCase().replace(/[\s_-]+/g, '');
}

/**
 * Robust check if a user/profile/role represents a Super Administrator or System Owner
 */
export function checkIsSuperAdmin(role?: Role | null, profile?: Profile | null, user?: User | null): boolean {
  if (!role && !profile && !user) return false;

  const roleName = normalizeRoleStr(role?.name);
  const roleDisplay = normalizeRoleStr(role?.display_name);
  const userMetaRole = normalizeRoleStr(
    String(user?.user_metadata?.role || user?.app_metadata?.role || '')
  );
  const profileJob = normalizeRoleStr(profile?.job_title);

  // Direct super admin variations
  if (
    roleName === 'superadmin' ||
    roleName === 'superadministrator' ||
    roleDisplay === 'superadmin' ||
    roleDisplay === 'superadministrator' ||
    userMetaRole === 'superadmin' ||
    userMetaRole === 'superadministrator' ||
    role?.id === 'role-super-admin' ||
    profile?.role_id === 'role-super-admin' ||
    profile?.role_id === 'demo-role-owner' ||
    role?.id === 'demo-role-owner' ||
    roleName === 'businessowner' ||
    roleName === 'systemowner' ||
    roleName === 'owner' ||
    roleDisplay === 'businessowner' ||
    roleDisplay === 'systemowner' ||
    roleDisplay === 'owner' ||
    profileJob.includes('founder') ||
    profileJob.includes('superadmin') ||
    profileJob.includes('managingdirector')
  ) {
    return true;
  }

  // System owner root email check
  if (
    user?.email === 'admin@babaspos.bi' ||
    user?.email === 'alex.rivera@babaspos.bi' ||
    profile?.email === 'admin@babaspos.bi' ||
    profile?.email === 'alex.rivera@babaspos.bi'
  ) {
    return true;
  }

  return false;
}

/**
 * Robust check if a user has Administrator privileges
 */
export function checkIsAdmin(role?: Role | null, profile?: Profile | null, user?: User | null): boolean {
  if (checkIsSuperAdmin(role, profile, user)) return true;

  const roleName = normalizeRoleStr(role?.name);
  const roleDisplay = normalizeRoleStr(role?.display_name);
  const userMetaRole = normalizeRoleStr(
    String(user?.user_metadata?.role || user?.app_metadata?.role || '')
  );
  const profileJob = normalizeRoleStr(profile?.job_title);

  if (
    roleName === 'admin' ||
    roleName === 'administrator' ||
    roleDisplay === 'admin' ||
    roleDisplay === 'administrator' ||
    userMetaRole === 'admin' ||
    userMetaRole === 'administrator' ||
    role?.id === 'role-admin' ||
    profile?.role_id === 'role-admin' ||
    profileJob.includes('administrator') ||
    profileJob.includes('coo')
  ) {
    return true;
  }

  return false;
}

export function usePermissions() {
  const { permissions, role, profile, user } = useAuth();

  const isSuperAdmin = checkIsSuperAdmin(role, profile, user);
  const isAdmin = checkIsAdmin(role, profile, user);
  const isSuperOrAdmin = isSuperAdmin || isAdmin;

  const hasPermission = (key: string): boolean => {
    // 1. Super Administrator has FULL unrestricted master access to everything
    if (isSuperAdmin) return true;

    // 2. Administrator has access to all standard business and management modules
    if (isAdmin) {
      if (key === 'plans.manage' && !isSuperAdmin) {
        // Optional plan billing restriction if needed, otherwise allow
        return true;
      }
      return true;
    }

    // 3. Custom permissions override on employee profile
    if (profile?.custom_permissions && Array.isArray(profile.custom_permissions)) {
      if (profile.custom_permissions.includes(key) || profile.custom_permissions.includes('*')) {
        return true;
      }
    }

    // 4. Role permissions check
    if (permissions && Array.isArray(permissions)) {
      if (permissions.includes(key) || permissions.includes('*')) {
        return true;
      }

      // Module-level wildcard check e.g., 'products.*'
      const modulePrefix = key.split('.')[0];
      if (permissions.includes(`${modulePrefix}.*`) || permissions.includes(`${modulePrefix}.manage`)) {
        return true;
      }
    }

    // 5. Intelligent permission aliases and fallback relationships
    const permsSet = new Set(permissions || []);
    const customSet = new Set(profile?.custom_permissions || []);
    const hasKey = (k: string) => permsSet.has(k) || customSet.has(k);

    // Employees / Staff
    if (key === 'staff.view' && hasKey('employees.view')) return true;
    if (key === 'employees.view' && hasKey('staff.view')) return true;
    if (key === 'employees.manage' && (hasKey('employees.edit') || hasKey('employees.create'))) return true;

    // Stock / Inventory
    if (key === 'stock.view' && hasKey('inventory.view')) return true;
    if (key === 'inventory.view' && hasKey('stock.view')) return true;
    if (key === 'stock.adjust' && (hasKey('inventory.adjust') || hasKey('inventory.manage'))) return true;
    if (key === 'inventory.adjust' && (hasKey('stock.adjust') || hasKey('inventory.manage'))) return true;
    if (key === 'stock.transfer' && (hasKey('inventory.transfer') || hasKey('inventory.manage'))) return true;
    if (key === 'inventory.transfer' && (hasKey('stock.transfer') || hasKey('inventory.manage'))) return true;

    // POS & Cash Register
    if (key === 'cash_register.manage' && hasKey('pos.sell')) return true;
    if (key === 'pos.sell' && hasKey('cash_register.manage')) return true;

    // Categories & Products
    if (key === 'categories.manage' && (hasKey('products.create') || hasKey('products.edit') || hasKey('products.view'))) return true;

    // Segments & Customers
    if (key === 'segments.manage' && hasKey('customers.view')) return true;

    // Activity Log & Audit
    if (key === 'activity.view' && (hasKey('employees.view') || hasKey('dashboard.view'))) return true;
    if (key === 'activity_log.view' && (hasKey('employees.view') || hasKey('dashboard.view'))) return true;

    // Settings & Branches
    if (key === 'settings.view' && (hasKey('settings.manage') || isSuperOrAdmin)) return true;
    if (key === 'branches.view' && hasKey('dashboard.view')) return true;

    return false;
  };

  const hasAnyPermission = (keys: string[]): boolean => {
    if (isSuperAdmin || isAdmin) return true;
    return keys.some((k) => hasPermission(k));
  };

  const hasAllPermissions = (keys: string[]): boolean => {
    if (isSuperAdmin) return true;
    return keys.every((k) => hasPermission(k));
  };

  const can = (action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' | 'manage', module: string): boolean => {
    if (isSuperAdmin) return true;
    return (
      hasPermission(`${module}.${action}`) ||
      hasPermission(`${module}.manage`) ||
      hasPermission(`${module}.*`)
    );
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    permissions,
    isSuperAdmin,
    isAdmin,
    isSuperOrAdmin,
    currentRole: role?.display_name || role?.name,
  };
}

