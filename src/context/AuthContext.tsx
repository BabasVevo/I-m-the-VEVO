import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Profile, Business, Branch, Role } from '@/types/database';
import { ALL_NAV_ITEMS } from '@/lib/constants';

const DEMO_STORAGE_KEY = 'verdant_demo_session';
const DEMO_BIZ_KEY = 'verdant_demo_biz';
const DEMO_PROF_KEY = 'verdant_demo_prof';

const DEFAULT_DEMO_BUSINESS: Business = {
  id: 'demo-biz-1',
  name: 'Verdant Retail & Co.',
  logo_url: null,
  address: '14 Kivukoni Front, Dar es Salaam',
  phone: '+255 22 211 4300',
  email: 'admin@verdantpos.com',
  currency: 'TZS',
  tax_rate: 18.0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEFAULT_DEMO_BRANCH: Branch = {
  id: 'branch-downtown',
  business_id: 'demo-biz-1',
  name: 'Downtown Flagship',
  address: '14 Kivukoni Front, Dar es Salaam',
  phone: '+255 22 211 4300',
  email: 'downtown@verdant.co.tz',
  manager_id: 'demo-user-1',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEFAULT_DEMO_ROLE: Role = {
  id: 'demo-role-owner',
  business_id: 'demo-biz-1',
  name: 'business_owner',
  description: 'Business Owner with Full Access',
  is_system: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEFAULT_DEMO_PROFILE: Profile = {
  id: 'demo-user-1',
  business_id: 'demo-biz-1',
  branch_id: 'demo-branch-1',
  full_name: 'Alex Rivera',
  phone: '+1 (555) 234-5678',
  role_id: 'demo-role-owner',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  role: DEFAULT_DEMO_ROLE,
  branch: DEFAULT_DEMO_BRANCH,
};

const ALL_PERMS = Array.from(new Set(ALL_NAV_ITEMS.map((item) => item.permission)));

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

  const loadProfileData = useCallback(async (uid: string) => {
    if (!isSupabaseConfigured) return;
    const { data: prof, error } = await supabase
      .from('profiles')
      .select('*, role:roles(*), branch:branches(*)')
      .eq('id', uid)
      .maybeSingle();

    if (error || !prof) {
      setProfile(null);
      setBusiness(null);
      setBranch(null);
      setRole(null);
      setPermissions([]);
      return;
    }

    setProfile(prof as Profile);
    setRole((prof as Profile).role ?? null);
    setBranch((prof as Profile).branch ?? null);

    if ((prof as Profile).role_id) {
      const { data: rp } = await supabase
        .from('role_permissions')
        .select('permission:permissions(key)')
        .eq('role_id', (prof as Profile).role_id!);

      const perms = (rp ?? [])
        .map((r) => (r.permission as { key: string } | null)?.key)
        .filter((k): k is string => Boolean(k));
      setPermissions(perms);
    } else {
      setPermissions([]);
    }

    const { data: biz } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', (prof as Profile).business_id)
      .maybeSingle();
    setBusiness(biz as Business | null);
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

    const activeBiz: Business = storedBiz ? JSON.parse(storedBiz) : DEFAULT_DEMO_BUSINESS;
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
        email: activeBiz.email ?? 'admin@verdantpos.com',
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
      await loadProfileData(session.user.id);
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
        loadProfileData(s.user.id).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        (async () => {
          await loadProfileData(s.user.id);
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
      : { ...DEFAULT_DEMO_PROFILE, full_name: name || DEFAULT_DEMO_PROFILE.full_name };

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
        email: email || activeBiz.email || 'admin@verdantpos.com',
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
        address: data.address ?? '123 Main Street',
        phone: data.phone ?? '+1 (555) 000-0000',
        email: data.email,
        currency: 'USD',
        tax_rate: 8.5,
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
        full_name: data.fullName,
        phone: data.phone ?? null,
        role_id: 'demo-role-owner',
        is_active: true,
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

