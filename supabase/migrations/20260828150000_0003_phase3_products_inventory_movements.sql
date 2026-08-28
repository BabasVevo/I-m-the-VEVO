/*
# Phase 3: Products, Categories, Inventory & Stock Movements Schema

## Purpose
Extends and refines the database schema for comprehensive product and inventory management:
1. Enhances `products` table with `brand` and `image_url` columns.
2. Enhances `categories` table with `is_active` column.
3. Creates `stock_movements` table for tracking all stock additions, deductions, corrections, and transfers.
4. Sets up Row Level Security (RLS) and policies for `stock_movements`.
5. Adds performance indexes for inventory search, barcode lookups, and movement audit logs.
*/

-- 1. Alter products if brand or image_url are missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'brand'
  ) THEN
    ALTER TABLE public.products ADD COLUMN brand text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.products ADD COLUMN image_url text;
  END IF;
END $$;

-- 2. Alter categories if is_active is missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.categories ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- 3. Create stock_movements table
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type text NOT NULL, -- 'initial_stock', 'adjustment', 'purchase', 'sale', 'transfer', 'return', 'damaged', 'expired'
  quantity numeric(15,2) NOT NULL, -- positive for additions, negative for reductions
  previous_stock numeric(15,2) NOT NULL DEFAULT 0,
  new_stock numeric(15,2) NOT NULL DEFAULT 0,
  reason text,
  reference_id text, -- e.g. receipt number or adjustment reference
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable RLS on stock_movements
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for stock_movements
DROP POLICY IF EXISTS "stock_movements_all_members" ON public.stock_movements;
CREATE POLICY "stock_movements_all_members" ON public.stock_movements
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- 6. Indexes for stock_movements and fast filtering
CREATE INDEX IF NOT EXISTS idx_stock_movements_business_branch ON public.stock_movements(business_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(business_id, product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON public.stock_movements(business_id, movement_type);
