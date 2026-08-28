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
  description: string | null;
  unit: string;
  cost_price: number;
  selling_price: number;
  min_stock_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category | null;
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
  | 'partial'
  | 'pending'
  | 'refunded'
  | 'cancelled';

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
