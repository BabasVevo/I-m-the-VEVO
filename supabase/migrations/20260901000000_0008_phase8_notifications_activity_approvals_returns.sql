/*
# Phase 8: Notifications, Activity Logs, Approval History & Sale Returns

## Purpose
Complements the existing schema with the four feature tables that the
application services already query but which were missing from the
earlier migrations:

1. `notifications`        - in-app notification center (low stock, approvals,
                            security alerts, sale events). Queried by
                            notificationService.ts.
2. `activity_logs`        - per-business audit trail of employee actions.
                            Queried by activityLogService.ts.
3. `approval_history`     - immutable approval/rejection/submission history
                            for expense vouchers and purchase orders.
                            Queried by approvalService.ts.
4. `sale_returns`         - POS return / refund headers.
5. `sale_return_items`    - returned line items per sale return.
                            Both queried by saleService.ts.

Also backfills columns the application already relies on that were absent
from the original table definitions (all guarded, idempotent):
- sales.refunded_amount            (saleService.ts updates it on returns)
- sale_items.returned_quantity     (return bookkeeping per line item)
- customer_notes.is_pinned         (pinned notes in the CRM drawer)
- customer_segments.icon           (segment editor icon selection)

## Security (RLS)
- All tables have Row Level Security enabled.
- Policies scope to authenticated users belonging to the same business,
  matching the pattern used by the earlier phase migrations.
*/

-- ============================================================
-- 1. Notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- null = all authorized users
  title text NOT NULL,
  message text NOT NULL,
  category text NOT NULL, -- 'inventory', 'approvals', 'sales', 'purchases', 'expenses', 'system', 'security'
  severity text NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
  action_url text,
  entity_type text, -- 'product', 'sale', 'purchase_order', 'expense', 'supplier', 'customer', 'employee', 'system', ...
  entity_id uuid,
  entity_label text,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  dedup_key text, -- client-side 24h de-duplication key
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_business_created
  ON public.notifications (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_business_unread
  ON public.notifications (business_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_business_category
  ON public.notifications (business_id, category);
CREATE INDEX IF NOT EXISTS idx_notifications_dedup
  ON public.notifications (business_id, dedup_key);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_all_members" ON public.notifications;
CREATE POLICY "notifications_all_members" ON public.notifications
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

DROP TRIGGER IF EXISTS trg_notifications_updated_at ON public.notifications;
CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 2. Activity Logs (audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  employee_name text NOT NULL,
  employee_role text NOT NULL DEFAULT '',
  employee_avatar text,
  action_type text NOT NULL, -- 'auth_login', 'sale_created', 'product_created', 'inventory_adjusted', ...
  action_category text NOT NULL, -- 'auth', 'sales', 'inventory', 'purchases', 'expenses', 'customers', 'suppliers', 'employees', 'settings'
  description text NOT NULL,
  details jsonb,
  entity_type text,
  entity_id text,
  entity_label text,
  branch_name text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_business_created
  ON public.activity_logs (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_business_employee
  ON public.activity_logs (business_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_business_category
  ON public.activity_logs (business_id, action_category);
CREATE INDEX IF NOT EXISTS idx_activity_logs_branch
  ON public.activity_logs (branch_id);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_logs_all_members" ON public.activity_logs;
CREATE POLICY "activity_logs_all_members" ON public.activity_logs
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- ============================================================
-- 3. Approval History (expenses + purchase orders)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.approval_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  entity_type text NOT NULL, -- 'expense', 'purchase_order'
  entity_id uuid NOT NULL,
  action text NOT NULL, -- 'submitted', 'approved', 'rejected', 'reopened', 'cancelled', 'paid', 'ordered', 'received'
  performed_by_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  performed_by_name text NOT NULL DEFAULT '',
  performed_by_role text NOT NULL DEFAULT '',
  comment text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_approval_history_entity_type
    CHECK (entity_type IN ('expense', 'purchase_order'))
);

CREATE INDEX IF NOT EXISTS idx_approval_history_entity
  ON public.approval_history (entity_type, entity_id, created_at);
CREATE INDEX IF NOT EXISTS idx_approval_history_business_created
  ON public.approval_history (business_id, created_at DESC);

ALTER TABLE public.approval_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "approval_history_all_members" ON public.approval_history;
CREATE POLICY "approval_history_all_members" ON public.approval_history
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- ============================================================
-- 4. Sale Returns (POS returns & refunds)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sale_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  return_number text NOT NULL,
  processed_by_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  refund_amount numeric(15,2) NOT NULL DEFAULT 0,
  refund_method text NOT NULL DEFAULT 'cash', -- 'cash', 'card', 'mobile_money', 'bank_transfer', 'store_credit'
  reason text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sale_returns_business_created
  ON public.sale_returns (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_returns_sale
  ON public.sale_returns (sale_id);

ALTER TABLE public.sale_returns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sale_returns_all_members" ON public.sale_returns;
CREATE POLICY "sale_returns_all_members" ON public.sale_returns
  FOR ALL TO authenticated
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- ============================================================
-- 5. Sale Return Items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sale_return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES public.sale_returns(id) ON DELETE CASCADE,
  sale_item_id uuid NOT NULL REFERENCES public.sale_items(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  sku text,
  quantity numeric(15,2) NOT NULL DEFAULT 0,
  unit_price numeric(15,2) NOT NULL DEFAULT 0,
  refund_amount numeric(15,2) NOT NULL DEFAULT 0,
  restock boolean NOT NULL DEFAULT true,
  reason text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sale_return_items_return
  ON public.sale_return_items (return_id);
CREATE INDEX IF NOT EXISTS idx_sale_return_items_sale_item
  ON public.sale_return_items (sale_item_id);

ALTER TABLE public.sale_return_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sale_return_items_all_members" ON public.sale_return_items;
CREATE POLICY "sale_return_items_all_members" ON public.sale_return_items
  FOR ALL TO authenticated
  USING (
    (SELECT business_id FROM public.sale_returns WHERE id = return_id) =
    (SELECT business_id FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    (SELECT business_id FROM public.sale_returns WHERE id = return_id) =
    (SELECT business_id FROM public.profiles WHERE id = auth.uid())
  );

-- ============================================================
-- 6. Backfill missing columns on existing tables (idempotent)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'refunded_amount'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN refunded_amount numeric(15,2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sale_items' AND column_name = 'returned_quantity'
  ) THEN
    ALTER TABLE public.sale_items ADD COLUMN returned_quantity numeric(15,2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_notes' AND column_name = 'is_pinned'
  ) THEN
    ALTER TABLE public.customer_notes ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_segments' AND column_name = 'icon'
  ) THEN
    ALTER TABLE public.customer_segments ADD COLUMN icon text;
  END IF;
END $$;
