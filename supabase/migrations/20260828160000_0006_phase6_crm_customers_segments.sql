/*
# Phase 6: CRM, Customers, Tags, Notes, Activity & Customer Segments

## Purpose
Establishes a robust CRM & Customer Segmentation system:
1. Enhances `customers` with extensive CRM profile attributes, status, branch association, and aggregate statistics.
2. Creates `tags` and `customer_tag_assignments` for multi-tag classification.
3. Creates `customer_notes` for internal team notes, preferences, and follow-ups.
4. Creates `customer_activity` for complete audit and interaction history.
5. Creates `customer_segments` for automated and custom segmentation with configurable rule evaluation.
6. Enforces strict Row Level Security (RLS) across all business resources.
7. Adds performance indexes for customer lookup, phone searches, and segment filters.
*/

-- 1. Enhance customers table with CRM fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'first_name') THEN
    ALTER TABLE public.customers ADD COLUMN first_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'last_name') THEN
    ALTER TABLE public.customers ADD COLUMN last_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'city') THEN
    ALTER TABLE public.customers ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'country') THEN
    ALTER TABLE public.customers ADD COLUMN country text DEFAULT 'Tanzania';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'date_of_birth') THEN
    ALTER TABLE public.customers ADD COLUMN date_of_birth date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'gender') THEN
    ALTER TABLE public.customers ADD COLUMN gender text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'customer_type') THEN
    ALTER TABLE public.customers ADD COLUMN customer_type text NOT NULL DEFAULT 'regular';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'notes') THEN
    ALTER TABLE public.customers ADD COLUMN notes text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'assigned_branch_id') THEN
    ALTER TABLE public.customers ADD COLUMN assigned_branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'status') THEN
    ALTER TABLE public.customers ADD COLUMN status text NOT NULL DEFAULT 'active';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'total_orders') THEN
    ALTER TABLE public.customers ADD COLUMN total_orders integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'total_spent') THEN
    ALTER TABLE public.customers ADD COLUMN total_spent numeric(15,2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'total_refunded') THEN
    ALTER TABLE public.customers ADD COLUMN total_refunded numeric(15,2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'first_purchase_at') THEN
    ALTER TABLE public.customers ADD COLUMN first_purchase_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'last_purchase_at') THEN
    ALTER TABLE public.customers ADD COLUMN last_purchase_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'metadata') THEN
    ALTER TABLE public.customers ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 2. Create Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'emerald',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_tags_biz_name UNIQUE (business_id, name)
);

-- 3. Create Customer Tag Assignments
CREATE TABLE IF NOT EXISTS public.customer_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_cust_tag_assignment UNIQUE (customer_id, tag_id)
);

-- 4. Create Customer Notes Table
CREATE TABLE IF NOT EXISTS public.customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  note_type text NOT NULL DEFAULT 'general', -- 'general', 'preference', 'special_request', 'follow_up', 'relationship'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Create Customer Activity Table
CREATE TABLE IF NOT EXISTS public.customer_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'created', 'sale', 'refund', 'coupon_used', 'note_added', 'tag_assigned', 'tag_removed', 'segment_change', 'status_change', 'balance_adjusted'
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  performed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Create Customer Segments Table
CREATE TABLE IF NOT EXISTS public.customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  segment_type text NOT NULL DEFAULT 'custom', -- 'system', 'custom'
  color text NOT NULL DEFAULT 'emerald',
  is_active boolean NOT NULL DEFAULT true,
  conditions_logic text NOT NULL DEFAULT 'AND', -- 'AND', 'OR'
  rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Enable RLS on all CRM tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;

-- 8. Policies for Customers
DROP POLICY IF EXISTS "customers_all_members" ON public.customers;
CREATE POLICY "customers_all_members" ON public.customers
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- 9. Policies for Tags
DROP POLICY IF EXISTS "tags_all_members" ON public.tags;
CREATE POLICY "tags_all_members" ON public.tags
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- 10. Policies for Customer Tag Assignments
DROP POLICY IF EXISTS "cust_tag_assignments_all_members" ON public.customer_tag_assignments;
CREATE POLICY "cust_tag_assignments_all_members" ON public.customer_tag_assignments
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- 11. Policies for Customer Notes
DROP POLICY IF EXISTS "cust_notes_all_members" ON public.customer_notes;
CREATE POLICY "cust_notes_all_members" ON public.customer_notes
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- 12. Policies for Customer Activity
DROP POLICY IF EXISTS "cust_activity_all_members" ON public.customer_activity;
CREATE POLICY "cust_activity_all_members" ON public.customer_activity
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- 13. Policies for Customer Segments
DROP POLICY IF EXISTS "cust_segments_all_members" ON public.customer_segments;
CREATE POLICY "cust_segments_all_members" ON public.customer_segments
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- 14. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_customers_biz_status ON public.customers(business_id, status);
CREATE INDEX IF NOT EXISTS idx_customers_biz_type ON public.customers(business_id, customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(business_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(business_id, email);
CREATE INDEX IF NOT EXISTS idx_customers_branch ON public.customers(business_id, assigned_branch_id);
CREATE INDEX IF NOT EXISTS idx_customers_last_purchase ON public.customers(business_id, last_purchase_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_tags_tag_id ON public.customer_tag_assignments(business_id, tag_id);
CREATE INDEX IF NOT EXISTS idx_customer_tags_cust_id ON public.customer_tag_assignments(business_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_cust_id ON public.customer_notes(business_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activity_cust_id ON public.customer_activity(business_id, customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_segments_biz ON public.customer_segments(business_id);
