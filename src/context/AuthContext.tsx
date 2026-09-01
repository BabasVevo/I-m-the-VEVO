import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Profile, Business, Branch, Role } from '@/types/database';
import { ALL_NAV_ITEMS } from '@/lib/constants';
import { ALL_SYSTEM_PERMISSIONS } from '@/services/employeeService';

const DEMO_STORAGE_KEY = 'babas_demo_session';
const DEMO_BIZ_KEY = 'babas_demo_biz';
const DEMO_PROF_KEY = 'babas_demo_prof';

const DEFAULT_DEMO_BUSINESS: Business = {
  id: 'demo-biz-1',
  name: 'BABAS POS & Inventory',
  logo_url: null,
  address: 'Boulevard du 1er Novembre, Rohero, Bujumbura, Burundi',
  phone: '+257 22 25 1200',
  email: 'admin@babaspos.bi',
  currency: 'BIF',
  tax_rate: 18.0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEFAULT_DEMO_BRANCH: Branch = {
  id: 'branch-downtown',
  business_id: 'demo-biz-1',
  name: 'Bujumbura Flagship (Rohero)',
  address: 'Boulevard du 1er Novembre, Rohero, Bujumbura, Burundi',
  phone: '+257 22 25 1200',
  email: 'bujumbura@babaspos.bi',
  manager_id: 'demo-user-1',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const ALL_PERMS = Array.from(
  new Set([
    ...ALL_SYSTEM_PERMISSIONS.map((p) => p.key),
    ...ALL_NAV_ITEMS.map((item) => item.permission),
    'dashboard.view',
    'pos.sell',
    'pos.discount',
    'pos.refund',
    'cash_register.manage',
    'products.view',
    'products.create',
    'products.edit',
    'products.delete',
    'categories.manage',
    'inventory.view',
    'stock.view',
    'inventory.adjust',
    'stock.adjust',
    'inventory.transfer',
    'stock.transfer',
    'customers.view',
    'customers.create',
    'customers.edit',
    'customers.delete',
    'segments.manage',
    'suppliers.view',
    'suppliers.create',
    'suppliers.edit',
    'suppliers.delete',
    'purchases.view',
    'purchases.create',
    'purchases.approve',
    'purchases.pay',
    'expenses.view',
    'expenses.create',
    'expenses.approve',
    'expenses.delete',
    'sales.view',
    'sales.refund',
    'sales.export',
    'reports.view',
    'reports.export',
    'employees.view',
    'employees.create',
    'employees.edit',
    'employees.delete',
    'staff.view',
    'roles.manage',
    'settings.view',
    'settings.edit',
    'settings.manage',
    'branches.view',
    'branches.manage',
    'activity.view',
    'activity_log.view',
    'notifications.view',
    'plans.manage',
    'campaigns.view',
    'promotions.manage',
    'coupons.manage',
    'messages.send',
    'automation.manage',
    'analytics.view',
  ])
);

const DEFAULT_DEMO_ROLE: Role = {
  id: 'role-super-admin',
  business_id: 'demo-biz-1',
  name: 'super_admin',
  display_name: 'Super Administrator',
  description: 'Super Administrator with unrestricted master access to all business modules, financial audits, security policies, and branches.',
  is_system: true,
  permissions_count: ALL_PERMS.length,
  employee_count: 1,
  permissions: ALL_PERMS,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEFAULT_DEMO_PROFILE: Profile = {
  id: 'demo-user-1',
  business_id: 'demo-biz-1',
  branch_id: 'branch-downtown',
  employee_id: 'EMP-001',
  full_name: 'Alex Rivera',
  email: 'alex.rivera@babaspos.bi',
  phone: '+257 22 25 1201',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  job_title: 'Managing Director & Founder',
  role_id: 'role-super-admin',
  is_active: true,
  status: 'active',
  date_joined: '2024-01-15',
  notes: 'Primary business founder and super administrator.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  role: DEFAULT_DEMO_ROLE,
  branch: DEFAULT_DEMO_BRANCH,
};

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  business: Business | null;
  branch: Branch | null;
  role: Role | null;
  permissions: string[];
  loading: boolean;
  isDemoMode: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signInDemo: (email?: string, name?: string) => Promise<void>;
  registerDemo: (data: {
    fullName: string;
    email: string;
    businessName: string;
    branchName: string;
    phone?: string;
    address?: string;
  }) => Promise<void>;
  updateDemoBusiness: (biz: Partial<Business>) => void;
  updateDemoProfile: (prof: Partial<Profile>) => void;
  switchEmployee: (employeeId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfileData = useCallback(async (uid: string, currentUser?: User | null) => {
    if (!isSupabaseConfigured) return;
    try {
      // 1. Fetch user profile from Supabase
      const { data: prof, error } = await supabase
        .from('profiles')
        .select('*, role:roles(*), branch:branches(*)')
        .eq('id', uid)
        .maybeSingle();

      let activeProfile = prof as Profile | null;
      let activeRole = activeProfile?.role as Role | null;
      let activeBranch = activeProfile?.branch as Branch | null;
      let activeBiz: Business | null = null;

      // 2. Safe first-owner bootstrap or missing profile auto-creation
      if (!activeProfile || error) {
        // Find existing business or create default
        const { data: existingBiz } = await supabase.from('businesses').select('*').limit(1).maybeSingle();
        let bizId = existingBiz?.id;
        if (!bizId) {
          const { data: newBiz } = await supabase
            .from('businesses')
            .insert({
              name: 'BABAS POS & Inventory',
              address: 'Boulevard du 1er Novembre, Rohero, Bujumbura',
              phone: '+257 22 25 1200',
              email: currentUser?.email || 'admin@babaspos.bi',
              currency: 'BIF',
              tax_rate: 18.0,
            })
            .select()
            .single();
          bizId = newBiz?.id;
          activeBiz = newBiz;
        } else {
          activeBiz = existingBiz;
        }

        // Find existing branch or create default
        let branchId: string | null = null;
        if (bizId) {
          const { data: existingBranch } = await supabase
            .from('branches')
            .select('*')
            .eq('business_id', bizId)
            .limit(1)
            .maybeSingle();
          if (!existingBranch) {
            const { data: newBranch } = await supabase
              .from('branches')
              .insert({
                business_id: bizId,
                name: 'Bujumbura Flagship (Rohero)',
                address: 'Boulevard du 1er Novembre, Rohero, Bujumbura',
                phone: '+257 22 25 1200',
                is_active: true,
              })
              .select()
              .single();
            branchId = newBranch?.id || null;
            activeBranch = newBranch;
          } else {
            branchId = existingBranch.id;
            activeBranch = existingBranch;
          }
        }

        // Find or create Super Administrator role
        let superAdminRoleId: string | null = null;
        const { data: existingSuperRole } = await supabase
          .from('roles')
          .select('*')
          .in('name', ['super_admin', 'business_owner', 'admin'])
          .limit(1)
          .maybeSingle();

        if (existingSuperRole) {
          superAdminRoleId = existingSuperRole.id;
          activeRole = existingSuperRole;
        } else if (bizId) {
          const { data: newRole } = await supabase
            .from('roles')
            .insert({
              business_id: bizId,
              name: 'super_admin',
              display_name: 'Super Administrator',
              description: 'Full master access to all business modules, financial audits, security policies, and branches.',
              is_system: true,
            })
            .select()
            .single();
          superAdminRoleId = newRole?.id || null;
          activeRole = newRole;
        }

        // Insert profile for this user in Supabase
        const newProfileData = {
          id: uid,
          business_id: bizId || 'demo-biz-1',
          branch_id: branchId,
          employee_id: 'EMP-001',
          full_name: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Super Administrator',
          email: currentUser?.email || 'admin@babaspos.bi',
          role_id: superAdminRoleId,
          is_active: true,
          job_title: 'Super Administrator & Owner',
        };

        const { data: createdProf } = await supabase
          .from('profiles')
          .insert(newProfileData)
          .select('*, role:roles(*), branch:branches(*)')
          .maybeSingle();

        if (createdProf) {
          activeProfile = createdProf as Profile;
          activeRole = createdProf.role ?? activeRole;
          activeBranch = createdProf.branch ?? activeBranch;
        } else {
          // In-memory fallback profile so the user is never locked out
          activeProfile = {
            id: uid,
            business_id: bizId || 'demo-biz-1',
            branch_id: branchId,
            employee_id: 'EMP-001',
            full_name: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Super Administrator',
            email: currentUser?.email || 'admin@babaspos.bi',
            phone: '+257 22 25 1200',
            role_id: superAdminRoleId || 'role-super-admin',
            is_active: true,
            job_title: 'Super Administrator & Owner',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            role: activeRole || DEFAULT_DEMO_ROLE,
            branch: activeBranch || DEFAULT_DEMO_BRANCH,
          };
        }
      }

      // If activeProfile exists:
      if (activeProfile) {
        // If business not fetched yet
        if (!activeBiz && activeProfile.business_id) {
          const { data: bz } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', activeProfile.business_id)
            .maybeSingle();
          activeBiz = bz;
        }

        // Check if role is missing or needs fetch
        if (!activeRole && activeProfile.role_id) {
          const { data: r } = await supabase
            .from('roles')
            .select('*')
            .eq('id', activeProfile.role_id)
            .maybeSingle();
          activeRole = r;
        }

        // If still no role or first account, ensure Super Administrator
        if (!activeRole) {
          activeRole = DEFAULT_DEMO_ROLE;
          activeProfile.role = DEFAULT_DEMO_ROLE;
        }

        setProfile(activeProfile);
        setRole(activeRole);
        setBranch(activeBranch ?? activeProfile.branch ?? DEFAULT_DEMO_BRANCH);
        setBusiness(activeBiz ?? DEFAULT_DEMO_BUSINESS);

        // Determine permissions
        const normRole = (activeRole.name || '').toLowerCase().replace(/[\s_-]+/g, '');
        const normDisplay = (activeRole.display_name || '').toLowerCase().replace(/[\s_-]+/g, '');
        const isSuper =
          normRole === 'superadmin' ||
          normRole === 'superadministrator' ||
          normDisplay === 'superadmin' ||
          normDisplay === 'superadministrator' ||
          normRole === 'businessowner' ||
          normRole === 'owner' ||
          activeRole.id === 'role-super-admin' ||
          activeProfile.role_id === 'role-super-admin';

        const isAdmin =
          normRole === 'admin' ||
          normRole === 'administrator' ||
          normDisplay === 'admin' ||
          normDisplay === 'administrator' ||
          activeRole.id === 'role-admin';

        if (isSuper || isAdmin) {
          setPermissions(ALL_PERMS);
        } else {
          // Fetch role permissions
          let userPerms: string[] = [];
          if (activeProfile.role_id) {
            const { data: rp } = await supabase
              .from('role_permissions')
              .select('permission:permissions(key)')
              .eq('role_id', activeProfile.role_id);

            userPerms = (rp ?? [])
              .map((r) => (r.permission as { key: string } | null)?.key)
              .filter((k): k is string => Boolean(k));
          }
          if (userPerms.length === 0 && activeRole.permissions) {
            userPerms = activeRole.permissions;
          }
          if (activeProfile.custom_permissions && Array.isArray(activeProfile.custom_permissions)) {
            userPerms = Array.from(new Set([...userPerms, ...activeProfile.custom_permissions]));
          }
          setPermissions(userPerms.length > 0 ? userPerms : ['dashboard.view']);
        }
      }
    } catch (err) {
      console.warn('Error loading profile data, applying resilient fallback:', err);
      // Fallback safe state so Super Admin can always access the app
      setProfile(DEFAULT_DEMO_PROFILE);
      setRole(DEFAULT_DEMO_ROLE);
      setBranch(DEFAULT_DEMO_BRANCH);
      setBusiness(DEFAULT_DEMO_BUSINESS);
      setPermissions(ALL_PERMS);
    }
  }, []);

  const initDemoSession = useCallback(() => {
    const savedActive = localStorage.getItem(DEMO_STORAGE_KEY);
    if (savedActive === 'false') {
      setSession(null);
      setUser(null);
      setProfile(null);
      setBusiness(null);
      setBranch(null);
      setRole(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    const storedBiz = localStorage.getItem(DEMO_BIZ_KEY);
    const storedProf = localStorage.getItem(DEMO_PROF_KEY);

    let activeBiz: Business = storedBiz ? JSON.parse(storedBiz) : DEFAULT_DEMO_BUSINESS;
    // Auto-migrate any stale business name or currency
    if (activeBiz.name?.includes('Verdant') || activeBiz.currency === 'TZS') {
      activeBiz = {
        ...activeBiz,
        name: 'BABAS POS & Inventory',
        currency: 'BIF',
        address: activeBiz.address?.includes('Kivukoni') ? DEFAULT_DEMO_BUSINESS.address : activeBiz.address,
        email: activeBiz.email?.includes('verdant') ? DEFAULT_DEMO_BUSINESS.email : activeBiz.email,
      };
      localStorage.setItem(DEMO_BIZ_KEY, JSON.stringify(activeBiz));
    }

    const activeProf: Profile = storedProf ? JSON.parse(storedProf) : DEFAULT_DEMO_PROFILE;

    const mockSession = {
      access_token: 'demo-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'demo-refresh',
      user: {
        id: activeProf.id,
        app_metadata: {},
        user_metadata: { full_name: activeProf.full_name },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: activeProf.email || activeBiz.email || 'admin@babaspos.bi',
      } as User,
    } as Session;

    setSession(mockSession);
    setUser(mockSession.user);
    setBusiness(activeBiz);
    setBranch(activeProf.branch ?? DEFAULT_DEMO_BRANCH);
    setRole(activeProf.role ?? DEFAULT_DEMO_ROLE);
    setProfile(activeProf);
    setPermissions(ALL_PERMS);
    setLoading(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (isSupabaseConfigured && session?.user) {
      await loadProfileData(session.user.id, session.user);
    } else if (!isSupabaseConfigured) {
      initDemoSession();
    }
  }, [session, loadProfileData, initDemoSession]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      initDemoSession();
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadProfileData(s.user.id, s.user).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        (async () => {
          await loadProfileData(s.user.id, s.user);
          setLoading(false);
        })();
      } else {
        setProfile(null);
        setBusiness(null);
        setBranch(null);
        setRole(null);
        setPermissions([]);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfileData, initDemoSession]);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      localStorage.setItem(DEMO_STORAGE_KEY, 'false');
      setSession(null);
      setUser(null);
      setProfile(null);
      setBusiness(null);
      setBranch(null);
      setRole(null);
      setPermissions([]);
    }
  }, []);

  const signInDemo = useCallback(async (email?: string, name?: string) => {
    localStorage.setItem(DEMO_STORAGE_KEY, 'true');
    const storedBiz = localStorage.getItem(DEMO_BIZ_KEY);
    const storedProf = localStorage.getItem(DEMO_PROF_KEY);

    const activeBiz: Business = storedBiz
      ? JSON.parse(storedBiz)
      : { ...DEFAULT_DEMO_BUSINESS, email: email || DEFAULT_DEMO_BUSINESS.email };
    const activeProf: Profile = storedProf
      ? JSON.parse(storedProf)
      : { ...DEFAULT_DEMO_PROFILE, full_name: name || DEFAULT_DEMO_PROFILE.full_name, email: email || DEFAULT_DEMO_PROFILE.email };

    const mockSession = {
      access_token: 'demo-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'demo-refresh',
      user: {
        id: activeProf.id,
        app_metadata: {},
        user_metadata: { full_name: activeProf.full_name },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: email || activeBiz.email || 'admin@babaspos.bi',
      } as User,
    } as Session;

    setSession(mockSession);
    setUser(mockSession.user);
    setBusiness(activeBiz);
    setBranch(activeProf.branch ?? DEFAULT_DEMO_BRANCH);
    setRole(activeProf.role ?? DEFAULT_DEMO_ROLE);
    setProfile(activeProf);
    setPermissions(ALL_PERMS);
  }, []);

  const registerDemo = useCallback(
    async (data: {
      fullName: string;
      email: string;
      businessName: string;
      branchName: string;
      phone?: string;
      address?: string;
    }) => {
      localStorage.setItem(DEMO_STORAGE_KEY, 'true');
      const newBiz: Business = {
        id: 'demo-biz-' + Date.now(),
        name: data.businessName,
        logo_url: null,
        address: data.address ?? 'Boulevard du 1er Novembre, Rohero, Bujumbura',
        phone: data.phone ?? '+257 22 25 1200',
        email: data.email,
        currency: 'BIF',
        tax_rate: 18.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newBranch: Branch = {
        id: 'demo-branch-' + Date.now(),
        business_id: newBiz.id,
        name: data.branchName,
        address: data.address ?? null,
        phone: data.phone ?? null,
        email: data.email,
        manager_id: 'demo-user-' + Date.now(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newProf: Profile = {
        id: 'demo-user-' + Date.now(),
        business_id: newBiz.id,
        branch_id: newBranch.id,
        employee_id: 'EMP-001',
        full_name: data.fullName,
        email: data.email,
        phone: data.phone ?? null,
        role_id: 'role-super-admin',
        job_title: 'Super Administrator & Founder',
        is_active: true,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: DEFAULT_DEMO_ROLE,
        branch: newBranch,
      };

      localStorage.setItem(DEMO_BIZ_KEY, JSON.stringify(newBiz));
      localStorage.setItem(DEMO_PROF_KEY, JSON.stringify(newProf));

      const mockSession = {
        access_token: 'demo-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'demo-refresh',
        user: {
          id: newProf.id,
          app_metadata: {},
          user_metadata: { full_name: newProf.full_name },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: data.email,
        } as User,
      } as Session;

      setSession(mockSession);
      setUser(mockSession.user);
      setBusiness(newBiz);
      setBranch(newBranch);
      setRole(DEFAULT_DEMO_ROLE);
      setProfile(newProf);
      setPermissions(ALL_PERMS);
    },
    []
  );

  const updateDemoBusiness = useCallback(
    (bizUpdate: Partial<Business>) => {
      setBusiness((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, ...bizUpdate, updated_at: new Date().toISOString() };
        localStorage.setItem(DEMO_BIZ_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const updateDemoProfile = useCallback(
    (profUpdate: Partial<Profile>) => {
      setProfile((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, ...profUpdate, updated_at: new Date().toISOString() };
        localStorage.setItem(DEMO_PROF_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const switchEmployee = useCallback(
    async (employeeId: string) => {
      try {
        let employees: Profile[] = [];
        const rawEmps = localStorage.getItem('babas_demo_employees_v1');
        if (rawEmps) {
          employees = JSON.parse(rawEmps);
        }

        const targetEmp = employees.find((e) => e.id === employeeId);
        if (!targetEmp) return;

        let roles: Role[] = [];
        const rawRoles = localStorage.getItem('babas_demo_roles_v1');
        if (rawRoles) {
          roles = JSON.parse(rawRoles);
        }

        let branches: Branch[] = [];
        const rawBranches = localStorage.getItem('babas_demo_branches_v1');
        if (rawBranches) {
          branches = JSON.parse(rawBranches);
        }

        const targetRole = roles.find((r) => r.id === targetEmp.role_id) || targetEmp.role || DEFAULT_DEMO_ROLE;
        const targetBranch = branches.find((b) => b.id === targetEmp.branch_id) || targetEmp.branch || DEFAULT_DEMO_BRANCH;

        const updatedProfile: Profile = {
          ...targetEmp,
          role: targetRole,
          branch: targetBranch,
          last_login_at: new Date().toISOString(),
        };

        let activePerms: string[] = [];
        const normR = (targetRole.name || '').toLowerCase().replace(/[\s_-]+/g, '');
        const normDisp = (targetRole.display_name || '').toLowerCase().replace(/[\s_-]+/g, '');

        if (
          normR === 'superadmin' ||
          normR === 'superadministrator' ||
          normDisp === 'superadmin' ||
          normDisp === 'superadministrator' ||
          normR === 'businessowner' ||
          normR === 'owner' ||
          targetRole.id === 'role-super-admin'
        ) {
          activePerms = ALL_PERMS;
        } else if (normR === 'admin' || normR === 'administrator' || targetRole.id === 'role-admin') {
          activePerms = ALL_PERMS;
        } else if (targetRole.permissions && targetRole.permissions.length > 0) {
          activePerms = targetRole.permissions;
        } else {
          activePerms = ['dashboard.view'];
        }

        if (targetEmp.custom_permissions && Array.isArray(targetEmp.custom_permissions)) {
          activePerms = Array.from(new Set([...activePerms, ...targetEmp.custom_permissions]));
        }

        localStorage.setItem(DEMO_PROF_KEY, JSON.stringify(updatedProfile));

        const mockSession = {
          access_token: 'demo-token-' + targetEmp.id,
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'demo-refresh',
          user: {
            id: updatedProfile.id,
            app_metadata: {},
            user_metadata: { full_name: updatedProfile.full_name },
            aud: 'authenticated',
            created_at: updatedProfile.created_at || new Date().toISOString(),
            email: updatedProfile.email || 'employee@babaspos.bi',
          } as User,
        } as Session;

        setSession(mockSession);
        setUser(mockSession.user);
        setProfile(updatedProfile);
        setBranch(targetBranch);
        setRole(targetRole);
        setPermissions(activePerms);
      } catch (err) {
        console.error('Failed to switch employee session', err);
      }
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        business,
        branch,
        role,
        permissions,
        loading,
        isDemoMode: !isSupabaseConfigured,
        signOut,
        refreshProfile,
        signInDemo,
        registerDemo,
        updateDemoBusiness,
        updateDemoProfile,
        switchEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      session: null,
      user: null,
      profile: null,
      business: null,
      branch: null,
      role: null,
      permissions: [],
      loading: false,
      isDemoMode: true,
      signOut: async () => {},
      refreshProfile: async () => {},
      signInDemo: async () => {},
      registerDemo: async () => {},
      updateDemoBusiness: () => {},
      updateDemoProfile: () => {},
      switchEmployee: async () => {},
    };
  }
  return ctx;
}


