/*
# Phase 7: Suppliers, Purchase Orders, Goods Receiving, Payments & Expense Management

## Purpose
Extends the platform with complete Supply Chain, Purchasing, and Expense capabilities:
1. `suppliers` - Supplier directory, payment terms, contact details, and financial balances.
2. `supplier_notes` - Team notes and interaction logs with suppliers.
3. `purchase_orders` - Purchase order records, workflow statuses, delivery dates, and monetary totals.
4. `purchase_order_items` - Line items per purchase order with cost price, discount, tax, ordered & received quantities.
5. `purchase_payments` - Payment vouchers against purchase orders with payment methods, reference numbers, and balances.
6. `purchase_returns` & `purchase_return_items` - Supplier returns foundation for damaged or oversupplied items.
7. `expense_categories` - Categorization system for company operating expenses.
8. `expenses` - Operating expense records with approval workflows, cash register links, and payee details.
9. `expense_attachments` - Secure metadata for uploaded invoices and receipts.
10. `recurring_expenses` - Automated schedule foundation for predictable periodic company overhead.

## Security (RLS)
- All tables have Row Level Security enabled.
- Read/Write policies are strictly scoped to users within the same tenant business.
- Optimized multi-column indexes for fast supplier searching, PO filtering, expense approval lookups, and financial reporting.
*/

-- ============================================================
-- 1. Suppliers Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_person text,
  supplier_type text NOT NULL DEFAULT 'wholesaler', -- 'manufacturer', 'wholesaler', 'distributor', 'importer', 'service_provider', 'other'
  tax_number text,
  website text,
  phone text,
  alternative_phone text,
  email text,
  address text,
  city text,
  country text DEFAULT 'Tanzania',
  payment_terms text NOT NULL DEFAULT 'net_30', -- 'net_15', 'net_30', 'net_60', 'cod', 'due_on_receipt', 'advance'
  credit_limit numeric(15,2) NOT NULL DEFAULT 0,
  current_balance numeric(15,2) NOT NULL DEFAULT 0, -- amount business owes the supplier
  notes text,
  assigned_branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'archived'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Supplier Notes Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.supplier_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. Purchase Orders Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  po_number text NOT NULL,
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date date,
  payment_terms text NOT NULL DEFAULT 'net_30',
  status text NOT NULL DEFAULT 'draft', -- 'draft', 'ordered', 'partially_received', 'received', 'cancelled'
  payment_status text NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid'
  subtotal numeric(15,2) NOT NULL DEFAULT 0,
  discount_amount numeric(15,2) NOT NULL DEFAULT 0,
  tax_amount numeric(15,2) NOT NULL DEFAULT 0,
  grand_total numeric(15,2) NOT NULL DEFAULT 0,
  paid_amount numeric(15,2) NOT NULL DEFAULT 0,
  due_amount numeric(15,2) NOT NULL DEFAULT 0,
  notes text,
  receiving_notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_po_business_number UNIQUE (business_id, po_number)
);

-- ============================================================
-- 4. Purchase Order Items Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  sku text,
  unit text NOT NULL DEFAULT 'pcs',
  quantity_ordered numeric(15,2) NOT NULL DEFAULT 1,
  quantity_received numeric(15,2) NOT NULL DEFAULT 0,
  quantity_damaged numeric(15,2) NOT NULL DEFAULT 0,
  unit_cost numeric(15,2) NOT NULL DEFAULT 0,
  discount_amount numeric(15,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount numeric(15,2) NOT NULL DEFAULT 0,
  line_total numeric(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. Purchase Payments Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.purchase_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  amount numeric(15,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'bank_transfer', -- 'cash', 'bank_transfer', 'mobile_money', 'card', 'credit', 'other'
  payment_date timestamptz NOT NULL DEFAULT now(),
  reference_number text,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. Purchase Returns Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.purchase_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  return_number text NOT NULL,
  return_date date NOT NULL DEFAULT CURRENT_DATE,
  total_refund_amount numeric(15,2) NOT NULL DEFAULT 0,
  reason text NOT NULL,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchase_return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES public.purchase_returns(id) ON DELETE CASCADE,
  purchase_item_id uuid NOT NULL REFERENCES public.purchase_order_items(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity numeric(15,2) NOT NULL DEFAULT 1,
  unit_cost numeric(15,2) NOT NULL DEFAULT 0,
  total_amount numeric(15,2) NOT NULL DEFAULT 0,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. Expense Categories Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  description text,
  color text DEFAULT 'emerald',
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_exp_cat_biz_name UNIQUE (business_id, name)
);

-- ============================================================
-- 8. Expenses Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
  expense_number text NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  amount numeric(15,2) NOT NULL DEFAULT 0,
  tax_amount numeric(15,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash', -- 'cash', 'card', 'mobile_money', 'bank_transfer', 'credit', 'other'
  reference_number text,
  payee text,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'approved', -- 'draft', 'pending_approval', 'approved', 'rejected', 'paid'
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  approval_notes text,
  paid_from_cash_register boolean NOT NULL DEFAULT false,
  register_session_id text,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_expense_biz_number UNIQUE (business_id, expense_number)
);

-- ============================================================
-- 9. Expense Attachments Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expense_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  file_url text NOT NULL,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. Recurring Expenses Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
  title text NOT NULL,
  amount numeric(15,2) NOT NULL DEFAULT 0,
  frequency text NOT NULL DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  start_date date NOT NULL,
  end_date date,
  last_generated_date date,
  next_due_date date NOT NULL,
  payment_method text NOT NULL DEFAULT 'bank_transfer',
  payee text,
  is_active boolean NOT NULL DEFAULT true,
  auto_generate boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. Enable Row Level Security (RLS)
-- ============================================================
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 12. RLS Policies
-- ============================================================
CREATE POLICY "suppliers_business_all" ON public.suppliers
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "supplier_notes_business_all" ON public.supplier_notes
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "purchase_orders_business_all" ON public.purchase_orders
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "purchase_order_items_business_all" ON public.purchase_order_items
  FOR ALL TO authenticated
  USING (purchase_order_id IN (
    SELECT id FROM public.purchase_orders WHERE business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid())
  ))
  WITH CHECK (purchase_order_id IN (
    SELECT id FROM public.purchase_orders WHERE business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid())
  ));

CREATE POLICY "purchase_payments_business_all" ON public.purchase_payments
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "purchase_returns_business_all" ON public.purchase_returns
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "purchase_return_items_business_all" ON public.purchase_return_items
  FOR ALL TO authenticated
  USING (return_id IN (
    SELECT id FROM public.purchase_returns WHERE business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid())
  ))
  WITH CHECK (return_id IN (
    SELECT id FROM public.purchase_returns WHERE business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid())
  ));

CREATE POLICY "expense_categories_business_all" ON public.expense_categories
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "expenses_business_all" ON public.expenses
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "expense_attachments_business_all" ON public.expense_attachments
  FOR ALL TO authenticated
  USING (expense_id IN (
    SELECT id FROM public.expenses WHERE business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid())
  ))
  WITH CHECK (expense_id IN (
    SELECT id FROM public.expenses WHERE business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid())
  ));

CREATE POLICY "recurring_expenses_business_all" ON public.recurring_expenses
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- ============================================================
-- 13. Performance Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_suppliers_business_status ON public.suppliers(business_id, status);
CREATE INDEX IF NOT EXISTS idx_suppliers_search ON public.suppliers(business_id, name, phone, email);

CREATE INDEX IF NOT EXISTS idx_po_business_branch ON public.purchase_orders(business_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON public.purchase_orders(business_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON public.purchase_orders(business_id, status, payment_status);
CREATE INDEX IF NOT EXISTS idx_po_dates ON public.purchase_orders(business_id, order_date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_business_branch ON public.expenses(business_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(business_id, category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(business_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(business_id, expense_date DESC);
