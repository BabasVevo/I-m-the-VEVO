/*
# Phase 2: Dashboard, Sales, Inventory & Target Schema

## Purpose
Extends the business management platform with:
1. `categories` - Product classification
2. `products` - Catalog items with pricing, SKU, barcodes, and minimum stock
3. `inventory` - Per-branch product stock levels and reorder thresholds
4. `customers` - Customer CRM profiles and credit tracking
5. `sales` - Point of Sale transactions and receipts
6. `sale_items` - Line items associated with sales
7. `sales_targets` - Daily revenue goals per business/branch

## Security (RLS)
- All tables have Row Level Security enabled.
- Read/Write policies are strictly scoped to users in the same business.
- Indexes created for high-performance dashboard aggregations (branch_id, created_at, status).
*/

-- ============================================================
-- 1. Create Tables
-- ============================================================

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  sku text,
  barcode text,
  description text,
  unit text NOT NULL DEFAULT 'pcs',
  cost_price numeric(15,2) NOT NULL DEFAULT 0,
  selling_price numeric(15,2) NOT NULL DEFAULT 0,
  min_stock_level numeric(15,2) NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Inventory (Branch Stock Levels)
CREATE TABLE IF NOT EXISTS public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity numeric(15,2) NOT NULL DEFAULT 0,
  min_quantity numeric(15,2) NOT NULL DEFAULT 5,
  reorder_point numeric(15,2) NOT NULL DEFAULT 10,
  location_in_store text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_branch_product_unique UNIQUE (branch_id, product_id)
);

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  credit_limit numeric(15,2) NOT NULL DEFAULT 0,
  current_balance numeric(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sales / Transactions
CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  cashier_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  receipt_number text NOT NULL,
  subtotal numeric(15,2) NOT NULL DEFAULT 0,
  tax_amount numeric(15,2) NOT NULL DEFAULT 0,
  discount_amount numeric(15,2) NOT NULL DEFAULT 0,
  total_amount numeric(15,2) NOT NULL DEFAULT 0,
  paid_amount numeric(15,2) NOT NULL DEFAULT 0,
  due_amount numeric(15,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash', -- 'cash', 'card', 'mobile_money', 'bank_transfer', 'credit', 'split'
  payment_status text NOT NULL DEFAULT 'completed', -- 'completed', 'partial', 'pending', 'refunded', 'cancelled'
  due_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sale Line Items
CREATE TABLE IF NOT EXISTS public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  sku text,
  quantity numeric(15,2) NOT NULL DEFAULT 1,
  unit_price numeric(15,2) NOT NULL DEFAULT 0,
  cost_price numeric(15,2) NOT NULL DEFAULT 0,
  discount_amount numeric(15,2) NOT NULL DEFAULT 0,
  tax_amount numeric(15,2) NOT NULL DEFAULT 0,
  total_price numeric(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Sales Targets
CREATE TABLE IF NOT EXISTS public.sales_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE, -- NULL indicates whole business
  target_date date NOT NULL DEFAULT CURRENT_DATE,
  target_amount numeric(15,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure unique target per business/branch/date
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_targets_unique
  ON public.sales_targets (business_id, COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid), target_date);

-- ============================================================
-- 2. Enable RLS
-- ============================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. RLS Policies
-- ============================================================

-- categories
DROP POLICY IF EXISTS "categories_all_members" ON public.categories;
CREATE POLICY "categories_all_members" ON public.categories
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- products
DROP POLICY IF EXISTS "products_all_members" ON public.products;
CREATE POLICY "products_all_members" ON public.products
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- inventory
DROP POLICY IF EXISTS "inventory_all_members" ON public.inventory;
CREATE POLICY "inventory_all_members" ON public.inventory
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- customers
DROP POLICY IF EXISTS "customers_all_members" ON public.customers;
CREATE POLICY "customers_all_members" ON public.customers
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- sales
DROP POLICY IF EXISTS "sales_all_members" ON public.sales;
CREATE POLICY "sales_all_members" ON public.sales
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- sale_items
DROP POLICY IF EXISTS "sale_items_all_members" ON public.sale_items;
CREATE POLICY "sale_items_all_members" ON public.sale_items
  FOR ALL TO authenticated
  USING (
    sale_id IN (
      SELECT id FROM public.sales
      WHERE business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    sale_id IN (
      SELECT id FROM public.sales
      WHERE business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- sales_targets
DROP POLICY IF EXISTS "sales_targets_all_members" ON public.sales_targets;
CREATE POLICY "sales_targets_all_members" ON public.sales_targets
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- ============================================================
-- 4. Triggers for updated_at
-- ============================================================
DROP TRIGGER IF EXISTS trg_categories_updated ON public.categories;
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated ON public.products;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_inventory_updated ON public.inventory;
CREATE TRIGGER trg_inventory_updated BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated ON public.customers;
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_sales_updated ON public.sales;
CREATE TRIGGER trg_sales_updated BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_sales_targets_updated ON public.sales_targets;
CREATE TRIGGER trg_sales_targets_updated BEFORE UPDATE ON public.sales_targets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 5. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_business ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(business_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(business_id, barcode);

CREATE INDEX IF NOT EXISTS idx_inventory_business_branch ON public.inventory(business_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON public.inventory(quantity);

CREATE INDEX IF NOT EXISTS idx_sales_business_branch ON public.sales(business_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_receipt ON public.sales(business_id, receipt_number);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON public.sales(business_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_due_date ON public.sales(business_id, due_date);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_targets_date ON public.sales_targets(business_id, target_date);
