/*
# Phase 1 Foundation: Businesses, Profiles, Roles, Permissions, Branches, Settings

## Purpose
Foundational schema for a multi-tenant business management SaaS platform.
Establishes organizational structure (businesses, branches), user profiles linked
to Supabase Auth, a flexible RBAC system (roles + permissions + role_permissions),
and per-business settings storage.

## New Tables
1. `businesses` - company/org on the platform.
2. `profiles` - app-level user, 1:1 with auth.users. business_id, branch_id, role_id.
3. `roles` - named roles (system + business-specific).
4. `permissions` - granular permission keys catalog.
5. `role_permissions` - many-to-many roles<->permissions.
6. `branches` - business locations. manager_id FK to profiles.
7. `business_settings` - key-value settings per business.

## Security (RLS)
- All tables RLS enabled.
- Policies scope to authenticated users belonging to the same business.
- profiles: self-access + same-business membership.
- permissions: readable by all authenticated (static catalog).
- System roles readable by all authenticated.

## Notes
1. Multi-user app with sign-in; policies scoped to `authenticated`.
2. Seeded system roles: super_admin, business_owner, branch_manager, cashier,
   marketing_manager, inventory_manager, accountant, staff.
3. Seeded permission catalog covers all spec modules.
4. updated_at auto-updated via trigger.
5. Circular FK (profiles.branch_id <-> branches.manager_id) resolved by creating
   both tables first, then adding FKs via ALTER.
6. All tables created first, then policies added (policies reference profiles which
   must exist before policy creation).
*/

-- ============================================================
-- Helper: updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- Step 1: Create ALL tables first (no policies yet)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  address text,
  phone text,
  email text,
  currency text NOT NULL DEFAULT 'USD',
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id uuid,
  full_name text NOT NULL,
  phone text,
  role_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  description text,
  module text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  phone text,
  email text,
  manager_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, key)
);

-- ============================================================
-- Step 2: Add circular FK constraints
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_branch_id_fkey' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_branch_id_fkey
      FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'branches_manager_id_fkey' AND table_name = 'branches'
  ) THEN
    ALTER TABLE public.branches
      ADD CONSTRAINT branches_manager_id_fkey
      FOREIGN KEY (manager_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_role_id_fkey' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_id_fkey
      FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- Step 3: Enable RLS on all tables
-- ============================================================
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Step 4: Create policies (all tables now exist)
-- ============================================================

-- businesses
DROP POLICY IF EXISTS "businesses_select_members" ON public.businesses;
CREATE POLICY "businesses_select_members" ON public.businesses
  FOR SELECT TO authenticated
  USING (id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "businesses_update_members" ON public.businesses;
CREATE POLICY "businesses_update_members" ON public.businesses
  FOR UPDATE TO authenticated
  USING (id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- profiles
DROP POLICY IF EXISTS "profiles_select_self_or_members" ON public.profiles;
CREATE POLICY "profiles_select_self_or_members" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR business_id = (SELECT business_id FROM public.profiles p WHERE p.id = auth.uid())
  );

DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    OR business_id = (SELECT business_id FROM public.profiles p WHERE p.id = auth.uid())
  ) WITH CHECK (
    id = auth.uid()
    OR business_id = (SELECT business_id FROM public.profiles p WHERE p.id = auth.uid())
  );

-- roles
DROP POLICY IF EXISTS "roles_select_members" ON public.roles;
CREATE POLICY "roles_select_members" ON public.roles
  FOR SELECT TO authenticated
  USING (
    is_system = true
    OR business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "roles_insert_members" ON public.roles;
CREATE POLICY "roles_insert_members" ON public.roles
  FOR INSERT TO authenticated
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "roles_update_members" ON public.roles;
CREATE POLICY "roles_update_members" ON public.roles
  FOR UPDATE TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- permissions (readable by all authenticated)
DROP POLICY IF EXISTS "permissions_select_all" ON public.permissions;
CREATE POLICY "permissions_select_all" ON public.permissions
  FOR SELECT TO authenticated USING (true);

-- role_permissions
DROP POLICY IF EXISTS "role_permissions_select_members" ON public.role_permissions;
CREATE POLICY "role_permissions_select_members" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (
    role_id IN (
      SELECT r.id FROM public.roles r
      WHERE r.is_system = true
         OR r.business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- branches
DROP POLICY IF EXISTS "branches_select_members" ON public.branches;
CREATE POLICY "branches_select_members" ON public.branches
  FOR SELECT TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "branches_insert_members" ON public.branches;
CREATE POLICY "branches_insert_members" ON public.branches
  FOR INSERT TO authenticated
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "branches_update_members" ON public.branches;
CREATE POLICY "branches_update_members" ON public.branches
  FOR UPDATE TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "branches_delete_members" ON public.branches;
CREATE POLICY "branches_delete_members" ON public.branches
  FOR DELETE TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- business_settings
DROP POLICY IF EXISTS "business_settings_select_members" ON public.business_settings;
CREATE POLICY "business_settings_select_members" ON public.business_settings
  FOR SELECT TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "business_settings_insert_members" ON public.business_settings;
CREATE POLICY "business_settings_insert_members" ON public.business_settings
  FOR INSERT TO authenticated
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "business_settings_update_members" ON public.business_settings;
CREATE POLICY "business_settings_update_members" ON public.business_settings
  FOR UPDATE TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "business_settings_delete_members" ON public.business_settings;
CREATE POLICY "business_settings_delete_members" ON public.business_settings
  FOR DELETE TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- ============================================================
-- Step 5: Triggers for updated_at
-- ============================================================
DROP TRIGGER IF EXISTS trg_businesses_updated ON public.businesses;
CREATE TRIGGER trg_businesses_updated BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_roles_updated ON public.roles;
CREATE TRIGGER trg_roles_updated BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_branches_updated ON public.branches;
CREATE TRIGGER trg_branches_updated BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_business_settings_updated ON public.business_settings;
CREATE TRIGGER trg_business_settings_updated BEFORE UPDATE ON public.business_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Step 6: Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_branches_business_id ON public.branches(business_id);
CREATE INDEX IF NOT EXISTS idx_roles_business_id ON public.roles(business_id);
CREATE INDEX IF NOT EXISTS idx_profiles_business_id ON public.profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_profiles_branch_id ON public.profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_business_settings_business_id ON public.business_settings(business_id);

-- ============================================================
-- Step 7: Seed system roles
-- ============================================================
INSERT INTO public.roles (business_id, name, description, is_system)
VALUES
  (NULL, 'super_admin', 'Full platform access', true),
  (NULL, 'business_owner', 'Full access to own business', true),
  (NULL, 'branch_manager', 'Manage a single branch', true),
  (NULL, 'cashier', 'Process sales at POS', true),
  (NULL, 'marketing_manager', 'Manage marketing campaigns', true),
  (NULL, 'inventory_manager', 'Manage products and inventory', true),
  (NULL, 'accountant', 'Manage expenses and view reports', true),
  (NULL, 'staff', 'Basic staff access', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Step 8: Seed permission catalog
-- ============================================================
INSERT INTO public.permissions (key, description, module)
VALUES
  ('dashboard.view', 'View dashboard', 'dashboard'),
  ('pos.sell', 'Process sales at POS', 'pos'),
  ('pos.refund', 'Issue refunds', 'pos'),
  ('pos.hold_sale', 'Hold and resume sales', 'pos'),
  ('cash_register.manage', 'Open/close cash register', 'cash_register'),
  ('sales.view', 'View sales and receipts', 'sales'),
  ('sales.refund', 'Refund sales', 'sales'),
  ('sales.cancel', 'Cancel sales', 'sales'),
  ('products.view', 'View products', 'inventory'),
  ('products.manage', 'Create/edit products', 'inventory'),
  ('products.archive', 'Archive products', 'inventory'),
  ('products.import', 'Bulk import products', 'inventory'),
  ('categories.manage', 'Manage product categories', 'inventory'),
  ('stock.view', 'View stock levels', 'inventory'),
  ('stock.adjust', 'Adjust stock levels', 'inventory'),
  ('stock.transfer', 'Transfer stock between branches', 'inventory'),
  ('purchases.view', 'View purchases', 'inventory'),
  ('purchases.manage', 'Create/edit purchases', 'inventory'),
  ('customers.view', 'View customers', 'crm'),
  ('customers.manage', 'Create/edit customers', 'crm'),
  ('segments.manage', 'Manage customer segments', 'crm'),
  ('campaigns.view', 'View marketing campaigns', 'marketing'),
  ('campaigns.manage', 'Create/edit campaigns', 'marketing'),
  ('promotions.manage', 'Manage promotions', 'marketing'),
  ('coupons.manage', 'Manage coupons', 'marketing'),
  ('messages.send', 'Send marketing messages', 'marketing'),
  ('automation.manage', 'Manage marketing automations', 'marketing'),
  ('suppliers.view', 'View suppliers', 'business'),
  ('suppliers.manage', 'Create/edit suppliers', 'business'),
  ('expenses.view', 'View expenses', 'business'),
  ('expenses.manage', 'Create/edit expenses', 'business'),
  ('reports.view', 'View reports', 'business'),
  ('analytics.view', 'View analytics', 'business'),
  ('branches.view', 'View branches', 'management'),
  ('branches.manage', 'Create/edit branches', 'management'),
  ('staff.view', 'View staff', 'management'),
  ('staff.manage', 'Create/edit staff', 'management'),
  ('roles.manage', 'Manage roles and permissions', 'management'),
  ('notifications.view', 'View notifications', 'account'),
  ('settings.manage', 'Manage business settings', 'account'),
  ('plans.manage', 'Manage subscription and billing', 'account'),
  ('audit.view', 'View audit logs', 'management')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Step 9: Seed role_permissions for system roles
-- ============================================================
DO $$
DECLARE
  r_super_admin uuid;
  r_business_owner uuid;
  r_branch_manager uuid;
  r_cashier uuid;
  r_marketing_manager uuid;
  r_inventory_manager uuid;
  r_accountant uuid;
  r_staff uuid;
BEGIN
  SELECT id INTO r_super_admin FROM public.roles WHERE name = 'super_admin' AND is_system = true;
  SELECT id INTO r_business_owner FROM public.roles WHERE name = 'business_owner' AND is_system = true;
  SELECT id INTO r_branch_manager FROM public.roles WHERE name = 'branch_manager' AND is_system = true;
  SELECT id INTO r_cashier FROM public.roles WHERE name = 'cashier' AND is_system = true;
  SELECT id INTO r_marketing_manager FROM public.roles WHERE name = 'marketing_manager' AND is_system = true;
  SELECT id INTO r_inventory_manager FROM public.roles WHERE name = 'inventory_manager' AND is_system = true;
  SELECT id INTO r_accountant FROM public.roles WHERE name = 'accountant' AND is_system = true;
  SELECT id INTO r_staff FROM public.roles WHERE name = 'staff' AND is_system = true;

  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT r_super_admin, id FROM public.permissions ON CONFLICT DO NOTHING;

  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT r_business_owner, id FROM public.permissions ON CONFLICT DO NOTHING;

  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT r_branch_manager, id FROM public.permissions
  WHERE key IN (
    'dashboard.view','pos.sell','pos.refund','pos.hold_sale','cash_register.manage',
    'sales.view','sales.refund','sales.cancel','products.view','stock.view',
    'purchases.view','customers.view','customers.manage','suppliers.view',
    'expenses.view','reports.view','analytics.view','branches.view',
    'staff.view','notifications.view'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT r_cashier, id FROM public.permissions
  WHERE key IN (
    'dashboard.view','pos.sell','pos.hold_sale','cash_register.manage',
    'sales.view','customers.view','notifications.view'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT r_marketing_manager, id FROM public.permissions
  WHERE key IN (
    'dashboard.view','campaigns.view','campaigns.manage','promotions.manage',
    'coupons.manage','messages.send','automation.manage','customers.view',
    'segments.manage','reports.view','analytics.view','notifications.view'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT r_inventory_manager, id FROM public.permissions
  WHERE key IN (
    'dashboard.view','products.view','products.manage','products.archive',
    'products.import','categories.manage','stock.view','stock.adjust',
    'stock.transfer','purchases.view','purchases.manage','suppliers.view',
    'suppliers.manage','notifications.view'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT r_accountant, id FROM public.permissions
  WHERE key IN (
    'dashboard.view','expenses.view','expenses.manage','reports.view',
    'analytics.view','sales.view','notifications.view','audit.view'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT r_staff, id FROM public.permissions
  WHERE key IN (
    'dashboard.view','sales.view','customers.view','notifications.view'
  ) ON CONFLICT DO NOTHING;
END $$;