export type RoleName =
  | 'super_admin'
  | 'admin'
  | 'business_owner'
  | 'branch_manager'
  | 'cashier'
  | 'inventory_manager'
  | 'sales_employee'
  | 'marketing_manager'
  | 'accountant'
  | 'staff';

export interface Business {
  id: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  currency_symbol?: string | null;
  decimal_places?: number;
  tax_rate: number;
  tax_name?: string | null;
  tax_enabled?: boolean;
  country?: string | null;
  city?: string | null;
  description?: string | null;
  tax_id?: string | null;
  registration_number?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  business_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  manager_id: string | null;
  is_active: boolean;
  city?: string | null;
  created_at: string;
  updated_at: string;
  manager?: Profile | null;
  employee_count?: number;
}

export interface Role {
  id: string;
  business_id: string | null;
  name: RoleName;
  display_name?: string;
  description: string | null;
  is_system: boolean;
  permissions_count?: number;
  employee_count?: number;
  permissions?: string[];
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  key: string;
  name?: string;
  description: string | null;
  module:
    | 'dashboard'
    | 'pos'
    | 'sales'
    | 'products'
    | 'inventory'
    | 'customers'
    | 'suppliers'
    | 'purchases'
    | 'expenses'
    | 'reports'
    | 'employees'
    | 'settings'
    | 'branches'
    | 'marketing';
  action?: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' | 'manage';
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  business_id: string;
  branch_id: string | null;
  employee_id?: string | null;
  full_name: string;
  email?: string | null;
  phone: string | null;
  avatar_url?: string | null;
  job_title?: string | null;
  role_id: string | null;
  status?: 'active' | 'inactive';
  is_active: boolean;
  date_joined?: string | null;
  custom_permissions?: string[] | null;
  notes?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
  role?: Role | null;
  branch?: Branch | null;
}

export type Employee = Profile;

export type ActivityActionType =
  | 'auth_login'
  | 'auth_logout'
  | 'sale_created'
  | 'sale_refunded'
  | 'sale_cancelled'
  | 'product_created'
  | 'product_updated'
  | 'product_deleted'
  | 'inventory_adjusted'
  | 'inventory_transferred'
  | 'expense_created'
  | 'expense_approved'
  | 'expense_deleted'
  | 'po_created'
  | 'po_received'
  | 'po_payment_recorded'
  | 'customer_created'
  | 'customer_updated'
  | 'supplier_created'
  | 'supplier_payment'
  | 'employee_created'
  | 'employee_updated'
  | 'employee_status_changed'
  | 'permissions_updated'
  | 'settings_updated';

export type ActivityActionCategory =
  | 'auth'
  | 'sales'
  | 'inventory'
  | 'purchases'
  | 'expenses'
  | 'customers'
  | 'suppliers'
  | 'employees'
  | 'settings';

export interface ActivityLog {
  id: string;
  business_id: string;
  branch_id: string | null;
  employee_id: string;
  employee_name: string;
  employee_role: string;
  employee_avatar?: string | null;
  action_type: ActivityActionType;
  action_category: ActivityActionCategory;
  description: string;
  details?: Record<string, unknown> | null;
  entity_type?: string | null;
  entity_id?: string | null;
  entity_label?: string | null;
  branch_name?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  newThisMonth: number;
  roleCounts: Record<string, number>;
  branchCounts: Record<string, number>;
}

export interface BusinessSetting {
  id: string;
  business_id: string;
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface Category {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  is_active?: boolean;
  product_count?: number;
  total_stock?: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  category_id: string | null;
  name: string;
  sku: string | null;
  barcode: string | null;
  brand?: string | null;
  description: string | null;
  unit: string;
  cost_price: number;
  selling_price: number;
  min_stock_level: number;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  total_stock?: number;
  inventory?: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  business_id: string;
  branch_id: string;
  product_id: string;
  quantity: number;
  min_quantity: number;
  reorder_point: number;
  location_in_store: string | null;
  created_at: string;
  updated_at: string;
  product?: Product | null;
  branch?: Branch | null;
}

export type StockMovementType =
  | 'initial_stock'
  | 'adjustment'
  | 'purchase'
  | 'sale'
  | 'transfer'
  | 'return'
  | 'damaged'
  | 'expired';

export interface StockMovement {
  id: string;
  business_id: string;
  branch_id: string;
  product_id: string;
  movement_type: StockMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  reference_id: string | null;
  created_by: string | null;
  created_at: string;
  product?: Product | null;
  branch?: Branch | null;
  creator?: Profile | null;
}

export type CustomerType = 'regular' | 'vip' | 'wholesale' | 'business' | 'walk_in' | 'corporate';
export type CustomerStatus = 'active' | 'inactive' | 'archived';
export type CustomerGender = 'male' | 'female' | 'other';

export interface Tag {
  id: string;
  business_id: string;
  name: string;
  color: string;
  description?: string | null;
  created_at: string;
  customer_count?: number;
}

export interface CustomerTagAssignment {
  id: string;
  business_id: string;
  customer_id: string;
  tag_id: string;
  tag?: Tag;
  created_at: string;
}

export type CustomerNoteType = 'general' | 'preference' | 'special_request' | 'follow_up' | 'relationship' | 'pinned';

export interface CustomerNote {
  id: string;
  business_id: string;
  customer_id: string;
  author_id: string | null;
  author?: Profile | null;
  content: string;
  note_type: CustomerNoteType;
  is_pinned?: boolean | null;
  created_at: string;
  updated_at: string;
}

export type CustomerActivityType =
  | 'created'
  | 'sale'
  | 'refund'
  | 'coupon_used'
  | 'note_added'
  | 'tag_assigned'
  | 'tag_removed'
  | 'segment_change'
  | 'status_change'
  | 'balance_adjusted'
  | 'credit_adjustment';

export interface CustomerActivity {
  id: string;
  business_id: string;
  customer_id: string;
  activity_type: CustomerActivityType;
  description: string;
  metadata?: Record<string, unknown> | null;
  performed_by?: string | null;
  performer?: Profile | null;
  created_at: string;
}

export interface SegmentRuleCondition {
  id?: string;
  field:
    | 'total_spent'
    | 'total_orders'
    | 'last_purchase_days'
    | 'first_purchase_days'
    | 'customer_type'
    | 'status'
    | 'city'
    | 'assigned_branch_id'
    | 'has_tag'
    | 'credit_balance';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_or_equal' | 'less_or_equal' | 'contains' | 'in';
  value: string | number | string[];
}

export interface CustomerSegment {
  id: string;
  business_id: string;
  name: string;
  description?: string | null;
  segment_type: 'system' | 'custom';
  color: string;
  icon?: string | null;
  is_active: boolean;
  conditions_logic: 'AND' | 'OR';
  rules: SegmentRuleCondition[];
  customer_count?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Flat rule shape used by the segment editor UI.
 * Converted to/from SegmentRuleCondition[] (the stored format).
 */
export interface SegmentRules {
  min_total_spent?: number;
  max_total_spent?: number;
  min_total_orders?: number;
  max_total_orders?: number;
  days_since_last_purchase?: number;
  has_outstanding_balance?: boolean;
  customer_types?: string[];
  tag_ids?: string[];
  branch_id?: string | null;
}

export interface SegmentSettings {
  new_customer_days: number;
  active_customer_days: number;
  regular_order_count: number;
  vip_spend_threshold: number;
  high_value_spend_threshold: number;
  inactive_days: number;
  at_risk_min_days: number;
  at_risk_max_days: number;
  lost_customer_days: number;
}

export interface CustomerPurchasedProduct {
  product_id: string | null;
  product_name: string;
  sku: string | null;
  quantity_purchased: number;
  order_count: number;
  total_spent: number;
  last_purchase_date: string;
}

export interface CustomerBranchHistory {
  branch_id: string;
  branch_name: string;
  purchase_count: number;
  total_spent: number;
  last_visit: string;
}

export interface CustomerStatsSummary {
  total_customers: number;
  new_customers_this_month: number;
  active_customers: number;
  inactive_customers: number;
  vip_customers: number;
  avg_customer_spending: number;
  avg_order_value: number;
  repeat_customer_rate: number;
  total_receivables: number;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  newThisMonth: number;
  vipCustomers: number;
  wholesaleCustomers: number;
  totalRevenue: number;
  averageCustomerSpend: number;
  totalOutstandingBalance: number;
  debtorsCount: number;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city?: string | null;
  country?: string | null;
  date_of_birth?: string | null;
  gender?: CustomerGender | null;
  customer_type?: CustomerType;
  notes?: string | null;
  assigned_branch_id?: string | null;
  assigned_branch?: Branch | null;
  status?: CustomerStatus;
  credit_limit: number;
  current_balance: number;
  total_orders?: number;
  total_spent?: number;
  total_refunded?: number;
  first_purchase_at?: string | null;
  last_purchase_at?: string | null;
  tags?: Tag[];
  created_at: string;
  updated_at: string;
}

export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'mobile_money'
  | 'bank_transfer'
  | 'credit'
  | 'split';

export type PaymentStatus =
  | 'completed'
  | 'partially_refunded'
  | 'refunded'
  | 'cancelled'
  | 'partial'
  | 'pending';

export type ReturnReason =
  | 'defective'
  | 'wrong_item'
  | 'customer_change'
  | 'expired'
  | 'damaged'
  | 'other';

export interface SaleReturnItem {
  id: string;
  return_id: string;
  sale_item_id: string;
  product_id: string | null;
  product_name: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  refund_amount: number;
  restock: boolean;
  reason: ReturnReason;
  notes?: string | null;
  created_at: string;
}

export interface SaleReturn {
  id: string;
  sale_id: string;
  business_id: string;
  branch_id: string;
  return_number: string;
  processed_by_id: string | null;
  processed_by?: Profile | null;
  refund_amount: number;
  refund_method: PaymentMethod | 'store_credit';
  reason: string;
  notes?: string | null;
  created_at: string;
  items?: SaleReturnItem[];
}

export interface ReceiptSettings {
  header_title?: string;
  subtitle?: string;
  footer_message?: string;
  return_policy?: string;
  default_format?: '80mm' | '58mm' | 'a4';
  show_logo?: boolean;
  show_tax_breakdown?: boolean;
  show_cashier?: boolean;
  show_barcode?: boolean;
  show_customer_info?: boolean;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  cost_price: number;
  discount_amount: number;
  tax_amount: number;
  total_price: number;
  returned_quantity?: number;
  created_at: string;
}

export interface Sale {
  id: string;
  business_id: string;
  branch_id: string;
  cashier_id: string | null;
  customer_id: string | null;
  receipt_number: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  refunded_amount?: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  branch?: Branch | null;
  cashier?: Profile | null;
  customer?: Customer | null;
  items?: SaleItem[];
  returns?: SaleReturn[];
}

export interface SalesTarget {
  id: string;
  business_id: string;
  branch_id: string | null;
  target_date: string;
  target_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Phase 7: Suppliers, Purchase Orders & Expense Management
// ============================================================

export type SupplierType =
  | 'manufacturer'
  | 'wholesaler'
  | 'distributor'
  | 'importer'
  | 'service_provider'
  | 'other';

export type SupplierStatus = 'active' | 'inactive' | 'archived';

export type PaymentTerms =
  | 'net_15'
  | 'net_30'
  | 'net_60'
  | 'cod'
  | 'due_on_receipt'
  | 'advance';

export interface Supplier {
  id: string;
  business_id: string;
  name: string;
  contact_person: string | null;
  supplier_type: SupplierType;
  tax_number: string | null;
  website: string | null;
  phone: string | null;
  alternative_phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  payment_terms: PaymentTerms;
  credit_limit: number;
  current_balance: number;
  notes: string | null;
  assigned_branch_id: string | null;
  status: SupplierStatus;
  total_purchases_count?: number;
  total_purchases_amount?: number;
  total_paid_amount?: number;
  last_purchase_date?: string | null;
  assigned_branch?: Branch | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierNote {
  id: string;
  business_id: string;
  supplier_id: string;
  author_id: string | null;
  author?: Profile | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  totalPurchased: number;
  totalOutstandingPayables: number;
  overduePayablesCount: number;
}

export type PurchaseOrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'ordered'
  | 'partially_received'
  | 'received'
  | 'cancelled';

export type PurchaseOrderPaymentStatus = 'unpaid' | 'partial' | 'paid';

/** Parameters for receiving stock against a purchase order (UI layer). */
export interface ReceivePurchaseStockParams {
  poId: string;
  items: Array<{
    item_id: string;
    product_id?: string | null;
    product_name: string;
    quantity_to_receive: number;
    quantity_damaged?: number;
  }>;
  notes?: string | null;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string | null;
  product_name: string;
  sku: string | null;
  unit: string;
  quantity_ordered: number;
  quantity_received: number;
  quantity_damaged?: number;
  unit_cost: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  product?: Product | null;
  created_at: string;
}

export interface PurchasePayment {
  id: string;
  business_id: string;
  purchase_order_id: string;
  supplier_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  created_by: string | null;
  creator?: Profile | null;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  business_id: string;
  branch_id: string;
  supplier_id: string;
  po_number: string;
  order_date: string;
  expected_delivery_date: string | null;
  payment_terms: PaymentTerms;
  status: PurchaseOrderStatus;
  payment_status: PurchaseOrderPaymentStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  notes: string | null;
  receiving_notes?: string | null;
  created_by: string | null;
  received_at?: string | null;
  created_at: string;
  updated_at: string;
  branch?: Branch | null;
  supplier?: Supplier | null;
  creator?: Profile | null;
  items?: PurchaseOrderItem[];
  payments?: PurchasePayment[];
  returns?: PurchaseReturn[];
}

export interface PurchaseReturnItem {
  id: string;
  return_id: string;
  purchase_item_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_amount: number;
  reason: string;
  created_at: string;
}

export interface PurchaseReturn {
  id: string;
  business_id: string;
  branch_id: string;
  purchase_order_id: string;
  supplier_id: string;
  return_number: string;
  return_date: string;
  total_refund_amount: number;
  reason: string;
  notes?: string | null;
  created_by: string | null;
  created_at: string;
  items?: PurchaseReturnItem[];
}

export interface PurchasingStats {
  totalOrders: number;
  totalPurchasesAmount: number;
  totalPaid: number;
  totalPayablesDue: number;
  pendingDeliveriesCount: number;
  partiallyReceivedCount: number;
  draftsCount: number;
}

export interface ExpenseCategory {
  id: string;
  business_id: string;
  name: string;
  code?: string | null;
  description: string | null;
  color?: string;
  icon?: string;
  is_active: boolean;
  expenses_count?: number;
  total_spent?: number;
  created_at: string;
  updated_at: string;
}

export type ExpenseStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'paid';

export type RecurrenceInterval = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface ExpenseAttachment {
  id: string;
  expense_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  business_id: string;
  branch_id: string;
  category_id: string;
  expense_number: string;
  expense_date: string;
  description: string;
  amount: number;
  tax_amount?: number;
  payment_method: PaymentMethod;
  reference_number: string | null;
  payee: string | null;
  supplier_id?: string | null;
  status: ExpenseStatus;
  approved_by: string | null;
  approved_at: string | null;
  approval_notes: string | null;
  paid_from_cash_register?: boolean;
  register_session_id?: string | null;
  notes: string | null;
  created_by: string | null;
  /** UI convenience fields (recurring profile linkage); not persisted on the base table */
  is_recurring?: boolean;
  recurrence_interval?: RecurrenceInterval | null;
  created_at: string;
  updated_at: string;
  branch?: Branch | null;
  category?: ExpenseCategory | null;
  supplier?: Supplier | null;
  creator?: Profile | null;
  approver?: Profile | null;
  attachments?: ExpenseAttachment[];
}

export interface RecurringExpense {
  id: string;
  business_id: string;
  branch_id: string;
  category_id: string;
  title: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date?: string | null;
  last_generated_date?: string | null;
  next_due_date: string;
  payment_method: PaymentMethod;
  payee?: string | null;
  is_active: boolean;
  auto_generate?: boolean;
  created_at: string;
  updated_at: string;
  category?: ExpenseCategory | null;
  branch?: Branch | null;
}

export interface ExpenseStatsCategory {
  category_id: string;
  name: string;
  amount: number;
  count: number;
}

export interface ExpenseStats {
  totalExpensesToday: number;
  totalExpensesThisMonth: number;
  pendingApprovalCount: number;
  pendingApprovalAmount: number;
  approvedPaidThisMonth: number;
  /** Alias of totalExpensesThisMonth (used by the stats cards) */
  thisMonthExpenses: number;
  /** All-time total of paid/approved expenses */
  totalExpenses: number;
  /** Count of paid/approved expense vouchers */
  expensesCount: number;
  /** Number of active recurring expense profiles */
  activeRecurringCount: number;
  /** Spend grouped by category */
  byCategory: ExpenseStatsCategory[];
}

