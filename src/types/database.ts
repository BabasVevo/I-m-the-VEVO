export type RoleName =
  | 'super_admin'
  | 'business_owner'
  | 'branch_manager'
  | 'cashier'
  | 'marketing_manager'
  | 'inventory_manager'
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
  tax_rate: number;
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
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  business_id: string | null;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  key: string;
  description: string | null;
  module: string;
  created_at: string;
}

export interface Profile {
  id: string;
  business_id: string;
  branch_id: string | null;
  full_name: string;
  phone: string | null;
  role_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role?: Role | null;
  branch?: Branch | null;
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

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  credit_limit: number;
  current_balance: number;
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
