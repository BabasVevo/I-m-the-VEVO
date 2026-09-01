import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Business } from '@/types/database';
import type {
  FullSystemSettings,
  CompanyProfileConfig,
  FinancialConfig,
  PaymentMethodOption,
  DataBackupSummary,
} from '@/types/settings';
import { logActivity } from './activityLogService';
import { getStoredProducts, getStoredInventory } from './productService';
import { getStoredSales } from './saleService';
import { getStoredPurchases } from './purchaseService';
import { getStoredExpenses } from './expenseService';
import { getStoredCustomers } from './customerService';
import { getStoredEmployees, getStoredBranches } from './employeeService';
import { getStoredSuppliers } from './supplierService';

export const SETTINGS_STORAGE_KEY = 'babas_system_settings_v2';
export const BIZ_STORAGE_KEY = 'babas_demo_biz';

export const DEFAULT_PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'pm-cash',
    key: 'cash',
    name: 'Cash (Espèces / Amahera)',
    description: 'Physical cash payments at point of sale and cash register drawer.',
    enabled: true,
    is_default: true,
    requires_reference: false,
  },
  {
    id: 'pm-lumicash',
    key: 'lumicash',
    name: 'Lumicash (Viettel Burundi)',
    description: 'Direct mobile money transfers via Lumicash merchant paycode or phone number.',
    enabled: true,
    is_default: false,
    requires_reference: true,
  },
  {
    id: 'pm-ecocash',
    key: 'ecocash',
    name: 'EcoCash (Econet Leo)',
    description: 'Mobile money payments via EcoCash Burundi USSD / wallet.',
    enabled: true,
    is_default: false,
    requires_reference: true,
  },
  {
    id: 'pm-bank',
    key: 'bank_transfer',
    name: 'Bank Transfer (Virement Bancaire)',
    description: 'Direct wire / check deposit via Bancobu, BCB, Interbank, CRDB Burundi, or Finbank.',
    enabled: true,
    is_default: false,
    requires_reference: true,
  },
  {
    id: 'pm-card',
    key: 'card',
    name: 'Debit / Credit Card (Visa & Mastercard)',
    description: 'POS terminal card payments & regional electronic debit cards.',
    enabled: true,
    is_default: false,
    requires_reference: true,
  },
  {
    id: 'pm-credit',
    key: 'credit',
    name: 'Customer Account / Credit Ledger',
    description: 'Post-paid debtor invoices for vetted VIP and wholesale business accounts.',
    enabled: true,
    is_default: false,
    requires_reference: true,
  },
];

export const DEFAULT_SYSTEM_SETTINGS: FullSystemSettings = {
  company: {
    name: 'BABAS',
    logo_url: null,
    email: 'contact@babaspos.bi',
    phone: '+257 22 25 1200',
    address: 'Boulevard du 1er Novembre, Rohero',
    country: 'Burundi',
    city: 'Bujumbura',
    description: 'Leading retail and distribution enterprise providing quality consumer goods, beverages, and electronics across Burundi.',
    tax_id: '4001289567', // NIF Burundi
    registration_number: 'RC/BJM/2022/B/1429', // Registre de Commerce
  },
  financial: {
    primary_currency: 'BIF',
    currency_symbol: 'BIF',
    decimal_places: 0,
    tax_rate: 18.0,
    tax_name: 'TVA (Taxe sur la Valeur Ajoutée)',
    tax_enabled: true,
    prices_include_tax: true,
    payment_methods: DEFAULT_PAYMENT_METHODS,
  },
  pos: {
    default_branch_id: 'branch-downtown',
    default_payment_method: 'cash',
    receipt_header: 'BABAS Retail & Distribution — Bujumbura',
    receipt_footer: 'Murakoze cane kutugendera! / Merci de votre confiance! / Thank you for your business!',
    receipt_paper_size: '80mm',
    show_logo_on_receipt: true,
    show_tax_id_on_receipt: true,
    show_cashier_name: true,
    show_customer_info: true,
    show_tax_breakdown: true,
    enable_discounts: true,
    max_discount_percentage: 20,
    allow_negative_stock_sale: false,
    require_customer_selection: false,
    auto_print_receipt: true,
  },
  inventory: {
    default_low_stock_threshold: 10,
    stock_valuation_method: 'fifo',
    prevent_negative_inventory: true,
    require_adjustment_approval: true,
    sku_prefix: 'BBS-',
    auto_generate_sku: true,
    sku_number_length: 5,
    barcode_symbology: 'code128',
    notify_on_out_of_stock: true,
  },
  notifications: {
    inventory_low_stock: true,
    inventory_out_of_stock: true,
    inventory_adjustments: true,
    inventory_negative_stock_prevention: true,
    approvals_expense_requests: true,
    approvals_purchase_requests: true,
    approvals_decisions: true,
    sales_large_transactions: true,
    sales_large_transaction_threshold: 500000,
    sales_void_and_refunds: true,
    sales_unusual_activity: true,
    purchases_po_updates: true,
    purchases_supplier_overdue: true,
    expenses_large_threshold: 1000000,
    security_alerts_enabled: true,
    sound_enabled: true,
    email_digest: 'daily',
  },
  security: {
    session_timeout_minutes: 60,
    require_strong_passwords: true,
    max_failed_login_attempts: 5,
    lockout_duration_minutes: 15,
    allow_multi_device_sessions: true,
    audit_logging_enabled: true,
  },
  preferences: {
    date_format: 'DD/MM/YYYY',
    time_format: '24h',
    timezone: 'Africa/Bujumbura',
    language: 'en',
    default_country: 'Burundi',
    default_country_code: '+257',
    theme: 'system',
  },
};

export async function fetchSystemSettings(): Promise<FullSystemSettings> {
  if (isSupabaseConfigured) {
    try {
      // 1. Fetch business record
      const { data: bizData } = await supabase.from('businesses').select('*').limit(1).maybeSingle();
      
      // 2. Fetch business_settings table key-values
      const { data: settingsRows } = await supabase.from('business_settings').select('*');
      
      const remoteSettings: Partial<FullSystemSettings> = {};
      if (settingsRows && settingsRows.length > 0) {
        settingsRows.forEach((row) => {
          if (row.key in DEFAULT_SYSTEM_SETTINGS) {
            (remoteSettings as Record<string, unknown>)[row.key] = row.value;
          }
        });
      }

      if (bizData) {
        const mergedCompany: CompanyProfileConfig = {
          ...DEFAULT_SYSTEM_SETTINGS.company,
          name: bizData.name || 'BABAS',
          logo_url: bizData.logo_url || null,
          email: bizData.email || DEFAULT_SYSTEM_SETTINGS.company.email,
          phone: bizData.phone || DEFAULT_SYSTEM_SETTINGS.company.phone,
          address: bizData.address || DEFAULT_SYSTEM_SETTINGS.company.address,
          country: bizData.country || 'Burundi',
          city: bizData.city || 'Bujumbura',
          description: bizData.description || DEFAULT_SYSTEM_SETTINGS.company.description,
          tax_id: bizData.tax_id || DEFAULT_SYSTEM_SETTINGS.company.tax_id,
          registration_number: bizData.registration_number || DEFAULT_SYSTEM_SETTINGS.company.registration_number,
          ...(remoteSettings.company || {}),
        };

        const mergedFinancial: FinancialConfig = {
          ...DEFAULT_SYSTEM_SETTINGS.financial,
          primary_currency: bizData.currency || 'BIF',
          currency_symbol: bizData.currency_symbol || bizData.currency || 'BIF',
          tax_rate: bizData.tax_rate !== undefined ? bizData.tax_rate : 18.0,
          tax_name: bizData.tax_name || 'TVA',
          tax_enabled: bizData.tax_enabled !== undefined ? bizData.tax_enabled : true,
          ...(remoteSettings.financial || {}),
        };

        return {
          company: mergedCompany,
          financial: mergedFinancial,
          pos: { ...DEFAULT_SYSTEM_SETTINGS.pos, ...(remoteSettings.pos || {}) },
          inventory: { ...DEFAULT_SYSTEM_SETTINGS.inventory, ...(remoteSettings.inventory || {}) },
          notifications: { ...DEFAULT_SYSTEM_SETTINGS.notifications, ...(remoteSettings.notifications || {}) },
          security: { ...DEFAULT_SYSTEM_SETTINGS.security, ...(remoteSettings.security || {}) },
          preferences: { ...DEFAULT_SYSTEM_SETTINGS.preferences, ...(remoteSettings.preferences || {}) },
        };
      }
    } catch (err) {
      console.warn('Supabase settings query error, falling back to local storage:', err);
    }
  }

  // Local demo fallback
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const storedBizRaw = localStorage.getItem(BIZ_STORAGE_KEY);
    
    let base = DEFAULT_SYSTEM_SETTINGS;
    if (raw) {
      const parsed = JSON.parse(raw);
      base = {
        company: { ...DEFAULT_SYSTEM_SETTINGS.company, ...(parsed.company || {}) },
        financial: { ...DEFAULT_SYSTEM_SETTINGS.financial, ...(parsed.financial || {}) },
        pos: { ...DEFAULT_SYSTEM_SETTINGS.pos, ...(parsed.pos || {}) },
        inventory: { ...DEFAULT_SYSTEM_SETTINGS.inventory, ...(parsed.inventory || {}) },
        notifications: { ...DEFAULT_SYSTEM_SETTINGS.notifications, ...(parsed.notifications || {}) },
        security: { ...DEFAULT_SYSTEM_SETTINGS.security, ...(parsed.security || {}) },
        preferences: { ...DEFAULT_SYSTEM_SETTINGS.preferences, ...(parsed.preferences || {}) },
      };
    }

    if (storedBizRaw) {
      const biz: Business = JSON.parse(storedBizRaw);
      if (biz.name) base.company.name = biz.name;
      if (biz.logo_url) base.company.logo_url = biz.logo_url;
      if (biz.email) base.company.email = biz.email;
      if (biz.phone) base.company.phone = biz.phone;
      if (biz.address) base.company.address = biz.address;
      if (biz.currency) {
        base.financial.primary_currency = biz.currency;
        base.financial.currency_symbol = biz.currency;
      }
      if (biz.tax_rate !== undefined) base.financial.tax_rate = biz.tax_rate;
    }

    return base;
  } catch {
    return DEFAULT_SYSTEM_SETTINGS;
  }
}

export async function saveSystemSectionSettings<K extends keyof FullSystemSettings>(
  sectionKey: K,
  settings: FullSystemSettings[K],
  actor?: { id: string; name: string; role: string; branchId?: string }
): Promise<FullSystemSettings> {
  const current = await fetchSystemSettings();
  const updated: FullSystemSettings = {
    ...current,
    [sectionKey]: settings,
  };

  if (isSupabaseConfigured) {
    try {
      // 1. If company or financial, also sync to businesses row
      if (sectionKey === 'company') {
        const comp = settings as CompanyProfileConfig;
        await supabase
          .from('businesses')
          .update({
            name: comp.name,
            logo_url: comp.logo_url,
            email: comp.email,
            phone: comp.phone,
            address: comp.address,
            country: comp.country,
            city: comp.city,
            description: comp.description,
            tax_id: comp.tax_id,
            registration_number: comp.registration_number,
            updated_at: new Date().toISOString(),
          })
          .neq('id', '00000000-0000-0000-0000-000000000000');
      } else if (sectionKey === 'financial') {
        const fin = settings as FinancialConfig;
        await supabase
          .from('businesses')
          .update({
            currency: fin.primary_currency,
            currency_symbol: fin.currency_symbol,
            decimal_places: fin.decimal_places,
            tax_rate: fin.tax_rate,
            tax_name: fin.tax_name,
            tax_enabled: fin.tax_enabled,
            updated_at: new Date().toISOString(),
          })
          .neq('id', '00000000-0000-0000-0000-000000000000');
      }

      // 2. Upsert key in business_settings
      await supabase
        .from('business_settings')
        .upsert(
          {
            key: sectionKey,
            value: settings as unknown as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );
    } catch (err) {
      console.warn(`Supabase save ${sectionKey} failed, persisting locally:`, err);
    }
  }

  // Local persistence
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));

    // Also update demo business cache
    const storedBizRaw = localStorage.getItem(BIZ_STORAGE_KEY);
    let biz: Business = storedBizRaw ? JSON.parse(storedBizRaw) : {
      id: 'demo-biz-1',
      name: 'BABAS',
      logo_url: null,
      address: '',
      phone: '',
      email: '',
      currency: 'BIF',
      tax_rate: 18.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (sectionKey === 'company') {
      const comp = settings as CompanyProfileConfig;
      biz = {
        ...biz,
        name: comp.name,
        logo_url: comp.logo_url,
        email: comp.email,
        phone: comp.phone,
        address: comp.address,
        country: comp.country,
        city: comp.city,
        description: comp.description,
        tax_id: comp.tax_id,
        registration_number: comp.registration_number,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(BIZ_STORAGE_KEY, JSON.stringify(biz));
    } else if (sectionKey === 'financial') {
      const fin = settings as FinancialConfig;
      biz = {
        ...biz,
        currency: fin.primary_currency,
        currency_symbol: fin.currency_symbol,
        decimal_places: fin.decimal_places,
        tax_rate: fin.tax_rate,
        tax_name: fin.tax_name,
        tax_enabled: fin.tax_enabled,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(BIZ_STORAGE_KEY, JSON.stringify(biz));
    }
  } catch (err) {
    console.error('LocalStorage settings save failed:', err);
  }

  // Log activity
  await logActivity({
    business_id: 'demo-biz-1',
    branch_id: actor?.branchId || null,
    employee_id: actor?.id || 'admin',
    employee_name: actor?.name || 'Administrator',
    employee_role: actor?.role || 'Super Administrator',
    action_type: 'settings_updated',
    action_category: 'settings',
    description: `Updated system configuration section "${sectionKey.toUpperCase()}"`,
    details: { section: sectionKey },
    entity_type: 'settings',
    entity_id: sectionKey,
    entity_label: `${sectionKey.toUpperCase()} Settings`,
  });

  return updated;
}

// Logo upload helper
export async function uploadBusinessLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please upload an image file (PNG, JPG, SVG, WebP).'));
    }
    if (file.size > 3 * 1024 * 1024) {
      return reject(new Error('Logo image size exceeds 3MB limit.'));
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      resolve(base64Url);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read image file.'));
    };
    reader.readAsDataURL(file);
  });
}

// Backup & Data Export utilities
export async function generateFullSystemBackup(): Promise<{ summary: DataBackupSummary; jsonPayload: string }> {
  const products = getStoredProducts();
  const inventory = getStoredInventory();
  const sales = getStoredSales();
  const purchases = getStoredPurchases();
  const expenses = getStoredExpenses();
  const customers = getStoredCustomers();
  const employees = getStoredEmployees();
  const branches = getStoredBranches();
  const suppliers = getStoredSuppliers();
  const settings = await fetchSystemSettings();

  const backupData = {
    metadata: {
      version: '1.0.0',
      system: 'BABAS POS & Inventory Management System',
      business_name: settings.company.name || 'BABAS',
      exported_at: new Date().toISOString(),
      country: 'Burundi',
      currency: settings.financial.primary_currency,
    },
    settings,
    branches,
    employees,
    products,
    inventory,
    customers,
    suppliers,
    sales,
    purchases,
    expenses,
  };

  const summary: DataBackupSummary = {
    business_name: settings.company.name || 'BABAS',
    exported_at: backupData.metadata.exported_at,
    version: backupData.metadata.version,
    counts: {
      products: products.length,
      inventory: inventory.length,
      customers: customers.length,
      sales: sales.length,
      purchases: purchases.length,
      expenses: expenses.length,
      employees: employees.length,
      branches: branches.length,
    },
  };

  return {
    summary,
    jsonPayload: JSON.stringify(backupData, null, 2),
  };
}

export function downloadJsonFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadCsvFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportProductsCsv(): Promise<void> {
  const products = getStoredProducts();
  const headers = ['Product ID', 'SKU', 'Barcode', 'Product Name', 'Unit', 'Cost Price (BIF)', 'Selling Price (BIF)', 'Min Stock Level', 'Status'];
  const rows = products.map((p) => [
    `"${p.id}"`,
    `"${p.sku || ''}"`,
    `"${p.barcode || ''}"`,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.unit}"`,
    p.cost_price,
    p.selling_price,
    p.min_stock_level,
    p.is_active ? 'Active' : 'Inactive',
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadCsvFile(csv, `babas_products_${new Date().toISOString().split('T')[0]}.csv`);
}

export async function exportCustomersCsv(): Promise<void> {
  const customers = getStoredCustomers();
  const headers = ['Customer ID', 'Full Name', 'Phone', 'Email', 'Customer Type', 'City', 'Status', 'Total Spent (BIF)', 'Total Orders', 'Credit Balance (BIF)'];
  const rows = customers.map((c) => [
    `"${c.id}"`,
    `"${(c.first_name && c.last_name ? `${c.first_name} ${c.last_name}` : c.name || '').replace(/"/g, '""')}"`,
    `"${c.phone || ''}"`,
    `"${c.email || ''}"`,
    `"${c.customer_type || 'regular'}"`,
    `"${c.city || ''}"`,
    `"${c.status || 'active'}"`,
    c.total_spent || 0,
    c.total_orders || 0,
    c.current_balance || 0,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadCsvFile(csv, `babas_customers_${new Date().toISOString().split('T')[0]}.csv`);
}

export async function exportSalesCsv(): Promise<void> {
  const sales = getStoredSales();
  const headers = ['Receipt #', 'Date', 'Cashier', 'Customer', 'Payment Method', 'Subtotal (BIF)', 'Tax (BIF)', 'Discount (BIF)', 'Total (BIF)', 'Status'];
  const rows = sales.map((s) => [
    `"${s.receipt_number || s.id}"`,
    `"${new Date(s.created_at).toLocaleString()}"`,
    `"${s.cashier?.full_name || 'Staff'}"`,
    `"${s.customer?.name || 'Walk-in'}"`,
    `"${s.payment_method}"`,
    s.subtotal,
    s.tax_amount,
    s.discount_amount,
    s.total_amount,
    `"${s.payment_status}"`,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadCsvFile(csv, `babas_sales_${new Date().toISOString().split('T')[0]}.csv`);
}

export async function exportExpensesCsv(): Promise<void> {
  const expenses = getStoredExpenses();
  const headers = ['Expense ID', 'Date', 'Category', 'Description', 'Amount (BIF)', 'Payment Method', 'Recorded By', 'Status'];
  const rows = expenses.map((e) => [
    `"${e.id}"`,
    `"${new Date(e.expense_date || e.created_at).toLocaleDateString()}"`,
    `"${e.category_id}"`,
    `"${e.description.replace(/"/g, '""')}"`,
    e.amount,
    `"${e.payment_method}"`,
    `"${e.created_by || 'Admin'}"`,
    `"${e.status || 'approved'}"`,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadCsvFile(csv, `babas_expenses_${new Date().toISOString().split('T')[0]}.csv`);
}

export async function exportPurchasesCsv(): Promise<void> {
  const purchases = getStoredPurchases();
  const headers = ['PO Number', 'Date', 'Supplier', 'Items Count', 'Total Amount (BIF)', 'Amount Paid (BIF)', 'Payment Status', 'Delivery Status'];
  const rows = purchases.map((p) => [
    `"${p.po_number || p.id}"`,
    `"${new Date(p.order_date || p.created_at).toLocaleDateString()}"`,
    `"${p.supplier?.name || p.supplier_id || 'Supplier'}"`,
    p.items?.length || 0,
    p.grand_total,
    p.paid_amount || 0,
    `"${p.payment_status}"`,
    `"${p.status}"`,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadCsvFile(csv, `babas_purchases_${new Date().toISOString().split('T')[0]}.csv`);
}

// System Database Status & Stats
export async function getDatabaseStats() {
  const products = getStoredProducts();
  const inventory = getStoredInventory();
  const customers = getStoredCustomers();
  const sales = getStoredSales();
  const purchases = getStoredPurchases();
  const expenses = getStoredExpenses();
  const employees = getStoredEmployees();
  const branches = getStoredBranches();

  const totalRecords =
    products.length +
    inventory.length +
    customers.length +
    sales.length +
    purchases.length +
    expenses.length +
    employees.length +
    branches.length;

  const approximateSizeBytes = totalRecords * 1024; // ~1KB per record rough estimation
  const storageMb = (approximateSizeBytes / (1024 * 1024)).toFixed(2);

  return {
    isSupabaseConnected: isSupabaseConfigured,
    totalRecords,
    storageMb,
    counts: {
      products: products.length,
      inventory: inventory.length,
      customers: customers.length,
      sales: sales.length,
      purchases: purchases.length,
      expenses: expenses.length,
      employees: employees.length,
      branches: branches.length,
    },
  };
}

// Safe Reset Demo Data
export async function resetSystemDemoData(
  actor?: { id: string; name: string; role: string; branchId?: string }
): Promise<void> {
  localStorage.removeItem(SETTINGS_STORAGE_KEY);
  localStorage.removeItem('babas_demo_branches_v2');
  localStorage.removeItem('babas_demo_employees_v1');
  localStorage.removeItem('babas_demo_customers_v1');
  localStorage.removeItem('babas_demo_products_v1');
  localStorage.removeItem('babas_demo_inventory_v1');
  localStorage.removeItem('babas_demo_sales_v1');
  localStorage.removeItem('babas_demo_purchases_v1');
  localStorage.removeItem('babas_demo_expenses_v1');
  localStorage.removeItem('babas_demo_suppliers_v1');

  await logActivity({
    business_id: 'demo-biz-1',
    branch_id: actor?.branchId || null,
    employee_id: actor?.id || 'admin',
    employee_name: actor?.name || 'Super Administrator',
    employee_role: actor?.role || 'Super Administrator',
    action_type: 'settings_updated',
    action_category: 'settings',
    description: 'Executed system demo data reset and initial seed restore.',
    entity_type: 'system',
    entity_id: 'reset',
    entity_label: 'System Factory Reset',
  });
}
