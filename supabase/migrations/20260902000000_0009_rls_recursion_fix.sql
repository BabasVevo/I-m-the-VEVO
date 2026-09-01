-- ============================================================================
-- Migration 0009 — Fix RLS infinite recursion on public.profiles
-- ============================================================================
-- Every business table's RLS policy scopes rows via:
--     business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid())
-- The profiles policies themselves contained the same subquery, so evaluating
-- ANY RLS-protected query re-entered the profiles policy recursively and
-- failed with:  ERROR: infinite recursion detected in policy for relation "profiles"
--
-- Fix (standard Supabase pattern):
--   1. public.current_business_id() — SECURITY DEFINER helper (PL/pgSQL so it
--      is never inlined, preserving the definer security context) that reads
--      the caller's own business_id. As SECURITY DEFINER it runs with the
--      table owner's (postgres) privileges, which bypass RLS — no recursion.
--   2. Rebuild the two profiles policies to use the helper instead of a
--      self-referencing subquery.
--
-- All other policies keep their (SELECT ... FROM public.profiles ...)
-- subqueries: with the profiles policies non-recursive, that subquery now
-- terminates after a single RLS pass and returns exactly the caller's
-- business_id.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Helper: current user's business_id (RLS-safe, non-recursive)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_business_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  bid uuid;
BEGIN
  SELECT business_id
  INTO bid
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
  RETURN bid;
END;
$fn$;

-- Restrict execution to authenticated users only (anon should not probe it).
REVOKE EXECUTE ON FUNCTION public.current_business_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_business_id() TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. Explicit table grants for authenticated
--    Supabase platform defaults normally cover this, but being explicit keeps
--    the schema portable (e.g. plain Postgres) and self-documenting.
--    Idempotent: granting the same privilege twice is a no-op.
-- ----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- RLS policies call auth.uid(); make sure authenticated can use the schema
-- (Supabase platform defaults cover this; guarded so plain Postgres is fine).
DO $authgrants$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    GRANT USAGE ON SCHEMA auth TO authenticated;
  END IF;
END
$authgrants$;

DO $grants$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated',
      rec.relname
    );
  END LOOP;
END
$grants$;

-- ----------------------------------------------------------------------------
-- 3. Rebuild the two recursive profiles policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_self_or_members" ON public.profiles;
CREATE POLICY "profiles_select_self_or_members" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR business_id = public.current_business_id()
  );

DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    OR business_id = public.current_business_id()
  )
  WITH CHECK (
    id = auth.uid()
    OR business_id = public.current_business_id()
  );
