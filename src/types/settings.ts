import type { NotificationPreferencesConfig } from './notifications';

export type SettingsTabId =
  | 'company'
  | 'branches'
  | 'financial'
  | 'pos'
  | 'inventory'
  | 'notifications'
  | 'security'
  | 'preferences'
  | 'data'
  | 'appearance';

export interface CompanyProfileConfig {
  name: string;
  logo_url: string | null;
  email: string;
  phone: string;
  address: string;
  country: string;
  city: string;
  description: string;
  tax_id: string; // NIF / TIN
  registration_number: string; // Registre de Commerce (RC)
}

export interface PaymentMethodOption {
  id: string;
  key: 'cash' | 'mobile_money' | 'lumicash' | 'ecocash' | 'bank_transfer' | 'card' | 'credit';
  name: string;
  description: string;
  enabled: boolean;
  is_default: boolean;
  requires_reference?: boolean;
}

export interface FinancialConfig {
  primary_currency: string;
  currency_symbol: string;
  decimal_places: number;
  tax_rate: number;
  tax_name: string;
  tax_enabled: boolean;
  prices_include_tax: boolean;
  payment_methods: PaymentMethodOption[];
}

export interface PosConfig {
  default_branch_id: string | null;
  default_payment_method: string;
  receipt_header: string;
  receipt_footer: string;
  receipt_paper_size: '58mm' | '80mm' | 'a4';
  show_logo_on_receipt: boolean;
  show_tax_id_on_receipt: boolean;
  show_cashier_name: boolean;
  show_customer_info: boolean;
  show_tax_breakdown: boolean;
  enable_discounts: boolean;
  max_discount_percentage: number;
  allow_negative_stock_sale: boolean;
  require_customer_selection: boolean;
  auto_print_receipt: boolean;
}

export type StockValuationMethod = 'fifo' | 'wac' | 'lifo';

export interface InventoryConfig {
  default_low_stock_threshold: number;
  stock_valuation_method: StockValuationMethod;
  prevent_negative_inventory: boolean;
  require_adjustment_approval: boolean;
  sku_prefix: string;
  auto_generate_sku: boolean;
  sku_number_length: number;
  barcode_symbology: 'code128' | 'ean13' | 'upca' | 'qr';
  notify_on_out_of_stock: boolean;
}

export interface SecurityConfig {
  session_timeout_minutes: number;
  require_strong_passwords: boolean;
  max_failed_login_attempts: number;
  lockout_duration_minutes: number;
  allow_multi_device_sessions: boolean;
  audit_logging_enabled: boolean;
}

export interface SystemPreferencesConfig {
  date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  time_format: '24h' | '12h';
  timezone: string;
  language: 'en' | 'fr' | 'rn';
  default_country: string;
  default_country_code: string;
  theme: 'light' | 'dark' | 'system';
}

export interface FullSystemSettings {
  company: CompanyProfileConfig;
  financial: FinancialConfig;
  pos: PosConfig;
  inventory: InventoryConfig;
  notifications: NotificationPreferencesConfig;
  security: SecurityConfig;
  preferences: SystemPreferencesConfig;
}

export interface DataBackupSummary {
  business_name: string;
  exported_at: string;
  version: string;
  counts: {
    products: number;
    inventory: number;
    customers: number;
    sales: number;
    purchases: number;
    expenses: number;
    employees: number;
    branches: number;
  };
}
