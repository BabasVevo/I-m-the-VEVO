import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  Employee,
  Role,
  Permission,
  Branch,
  EmployeeStats,
} from '@/types/database';
import { logActivity } from './activityLogService';

export const DEMO_EMPLOYEES_KEY = 'babas_demo_employees_v1';
export const DEMO_ROLES_KEY = 'babas_demo_roles_v1';
export const DEMO_PERMISSIONS_KEY = 'babas_demo_permissions_v1';
export const DEMO_ROLE_PERMS_KEY = 'babas_demo_role_perms_v1';
export const DEMO_BRANCHES_KEY = 'babas_demo_branches_v1';

export const SYSTEM_MODULES = [
  { id: 'dashboard', label: 'Dashboard & Overview', icon: 'LayoutDashboard' },
  { id: 'pos', label: 'Point of Sale (POS)', icon: 'ShoppingCart' },
  { id: 'sales', label: 'Sales Records & Receipts', icon: 'Receipt' },
  { id: 'products', label: 'Products Catalog', icon: 'Package' },
  { id: 'inventory', label: 'Inventory & Stock Management', icon: 'Boxes' },
  { id: 'purchases', label: 'Purchase Orders & Receiving', icon: 'Truck' },
  { id: 'suppliers', label: 'Suppliers & Vendors', icon: 'Building2' },
  { id: 'expenses', label: 'Expenses & Petty Cash', icon: 'CreditCard' },
  { id: 'customers', label: 'Customers CRM & Credit', icon: 'Users' },
  { id: 'reports', label: 'Reports & Analytics', icon: 'BarChart3' },
  { id: 'employees', label: 'Employees & Staff Management', icon: 'UserCog' },
  { id: 'branches', label: 'Branches & Locations', icon: 'Store' },
  { id: 'settings', label: 'System Settings & Branding', icon: 'Settings' },
] as const;

export const ALL_SYSTEM_PERMISSIONS: Permission[] = [
  // Dashboard
  { id: 'perm-dash-view', key: 'dashboard.view', name: 'View Dashboard', module: 'dashboard', action: 'view', description: 'Access KPI metrics, sales totals, and revenue graphs', created_at: new Date().toISOString() },
  { id: 'perm-dash-analytics', key: 'dashboard.analytics', name: 'Advanced Analytics', module: 'dashboard', action: 'view', description: 'View deep performance metrics and multi-branch analytics', created_at: new Date().toISOString() },

  // POS
  { id: 'perm-pos-sell', key: 'pos.sell', name: 'Create POS Sales', module: 'pos', action: 'create', description: 'Scan items, add products to cart, and process checkout', created_at: new Date().toISOString() },
  { id: 'perm-pos-discount', key: 'pos.discount', name: 'Apply Discounts', module: 'pos', action: 'edit', description: 'Apply cart or item-level discounts during POS checkout', created_at: new Date().toISOString() },
  { id: 'perm-pos-refund', key: 'pos.refund', name: 'Process Instant Refunds', module: 'pos', action: 'edit', description: 'Issue cash or mobile money refunds directly at the register', created_at: new Date().toISOString() },

  // Cash Register
  { id: 'perm-reg-manage', key: 'cash_register.manage', name: 'Manage Register Sessions', module: 'pos', action: 'manage', description: 'Open, count cash, reconcile, and close daily cash registers', created_at: new Date().toISOString() },

  // Sales
  { id: 'perm-sales-view', key: 'sales.view', name: 'View Sales History', module: 'sales', action: 'view', description: 'Browse and inspect past sales tickets, invoices, and receipts', created_at: new Date().toISOString() },
  { id: 'perm-sales-refund', key: 'sales.refund', name: 'Approve Sales Refunds', module: 'sales', action: 'approve', description: 'Review and approve customer returns and refund requests', created_at: new Date().toISOString() },
  { id: 'perm-sales-export', key: 'sales.export', name: 'Export Sales Ledgers', module: 'sales', action: 'export', description: 'Download CSV and Excel files of all sales receipts', created_at: new Date().toISOString() },

  // Products
  { id: 'perm-prod-view', key: 'products.view', name: 'View Products Catalog', module: 'products', action: 'view', description: 'Search and inspect products, prices, barcodes, and SKUs', created_at: new Date().toISOString() },
  { id: 'perm-prod-create', key: 'products.create', name: 'Add New Products', module: 'products', action: 'create', description: 'Create new catalog items with barcodes, prices, and units', created_at: new Date().toISOString() },
  { id: 'perm-prod-edit', key: 'products.edit', name: 'Edit Product Details', module: 'products', action: 'edit', description: 'Update selling prices, costs, descriptions, and categories', created_at: new Date().toISOString() },
  { id: 'perm-prod-delete', key: 'products.delete', name: 'Delete Products', module: 'products', action: 'delete', description: 'Remove catalog products and deactivate SKUs', created_at: new Date().toISOString() },

  // Categories
  { id: 'perm-cat-manage', key: 'categories.manage', name: 'Manage Categories', module: 'products', action: 'manage', description: 'Create, update, and organize product categories', created_at: new Date().toISOString() },

  // Inventory & Stock
  { id: 'perm-inv-view', key: 'inventory.view', name: 'View Stock Quantities', module: 'inventory', action: 'view', description: 'Monitor inventory levels, low stock alerts, and valuation', created_at: new Date().toISOString() },
  { id: 'perm-stock-view', key: 'stock.view', name: 'View Stock Page', module: 'inventory', action: 'view', description: 'Access the dedicated stock inspection view', created_at: new Date().toISOString() },
  { id: 'perm-inv-adjust', key: 'inventory.adjust', name: 'Stock Adjustments', module: 'inventory', action: 'edit', description: 'Perform manual stock count corrections and write-offs', created_at: new Date().toISOString() },
  { id: 'perm-inv-transfer', key: 'inventory.transfer', name: 'Transfer Between Branches', module: 'inventory', action: 'edit', description: 'Initiate and receive stock transfers across business branches', created_at: new Date().toISOString() },

  // Purchases
  { id: 'perm-pur-view', key: 'purchases.view', name: 'View Purchase Orders', module: 'purchases', action: 'view', description: 'Browse supplier purchase orders, bills, and deliveries', created_at: new Date().toISOString() },
  { id: 'perm-pur-create', key: 'purchases.create', name: 'Create Purchase Orders', module: 'purchases', action: 'create', description: 'Draft and submit new purchase orders to suppliers', created_at: new Date().toISOString() },
  { id: 'perm-pur-approve', key: 'purchases.approve', name: 'Approve & Receive POs', module: 'purchases', action: 'approve', description: 'Approve purchase orders and confirm stock receipt into warehouse', created_at: new Date().toISOString() },
  { id: 'perm-pur-pay', key: 'purchases.pay', name: 'Record Supplier Payments', module: 'purchases', action: 'edit', description: 'Record payments made to suppliers for purchase orders', created_at: new Date().toISOString() },

  // Suppliers
  { id: 'perm-sup-view', key: 'suppliers.view', name: 'View Suppliers', module: 'suppliers', action: 'view', description: 'Access supplier list, contact info, and transaction history', created_at: new Date().toISOString() },
  { id: 'perm-sup-create', key: 'suppliers.create', name: 'Create Suppliers', module: 'suppliers', action: 'create', description: 'Add new supplier profiles and payment terms', created_at: new Date().toISOString() },
  { id: 'perm-sup-edit', key: 'suppliers.edit', name: 'Edit Suppliers', module: 'suppliers', action: 'edit', description: 'Update supplier contracts, phone numbers, and addresses', created_at: new Date().toISOString() },
  { id: 'perm-sup-delete', key: 'suppliers.delete', name: 'Delete Suppliers', module: 'suppliers', action: 'delete', description: 'Archive or remove supplier records', created_at: new Date().toISOString() },

  // Expenses
  { id: 'perm-exp-view', key: 'expenses.view', name: 'View Expense Records', module: 'expenses', action: 'view', description: 'Inspect operational expenses, petty cash, and receipts', created_at: new Date().toISOString() },
  { id: 'perm-exp-create', key: 'expenses.create', name: 'Record Expenses', module: 'expenses', action: 'create', description: 'Submit new expense claims and operational payments', created_at: new Date().toISOString() },
  { id: 'perm-exp-approve', key: 'expenses.approve', name: 'Approve Expenses', module: 'expenses', action: 'approve', description: 'Authorize pending expense payments and receipts', created_at: new Date().toISOString() },
  { id: 'perm-exp-delete', key: 'expenses.delete', name: 'Delete Expenses', module: 'expenses', action: 'delete', description: 'Void or remove erroneous expense entries', created_at: new Date().toISOString() },

  // Customers & Segments
  { id: 'perm-cust-view', key: 'customers.view', name: 'View Customers CRM', module: 'customers', action: 'view', description: 'Browse customer list, purchase histories, and credit ledgers', created_at: new Date().toISOString() },
  { id: 'perm-cust-create', key: 'customers.create', name: 'Register Customers', module: 'customers', action: 'create', description: 'Add new retail, wholesale, and VIP customer profiles', created_at: new Date().toISOString() },
  { id: 'perm-cust-edit', key: 'customers.edit', name: 'Edit Customers', module: 'customers', action: 'edit', description: 'Update customer details, credit limits, and addresses', created_at: new Date().toISOString() },
  { id: 'perm-cust-delete', key: 'customers.delete', name: 'Delete Customers', module: 'customers', action: 'delete', description: 'Archive or remove inactive customer records', created_at: new Date().toISOString() },
  { id: 'perm-seg-manage', key: 'segments.manage', name: 'Manage Customer Segments', module: 'customers', action: 'manage', description: 'Configure automated and custom customer tags/segments', created_at: new Date().toISOString() },

  // Reports
  { id: 'perm-rep-view', key: 'reports.view', name: 'View Financial Reports', module: 'reports', action: 'view', description: 'Access P&L, sales breakdowns, tax summaries, and audit data', created_at: new Date().toISOString() },
  { id: 'perm-rep-export', key: 'reports.export', name: 'Export Reports', module: 'reports', action: 'export', description: 'Download financial statements and tax export files', created_at: new Date().toISOString() },
  { id: 'perm-ana-view', key: 'analytics.view', name: 'View Analytics Dashboard', module: 'reports', action: 'view', description: 'Analyze long-term trends, retention, and margins', created_at: new Date().toISOString() },

  // Employees & Staff
  { id: 'perm-emp-view', key: 'employees.view', name: 'View Employees List', module: 'employees', action: 'view', description: 'View staff directory, job roles, and contact cards', created_at: new Date().toISOString() },
  { id: 'perm-staff-view', key: 'staff.view', name: 'Access Staff Portal', module: 'employees', action: 'view', description: 'Alias permission for employee directory viewing', created_at: new Date().toISOString() },
  { id: 'perm-emp-create', key: 'employees.create', name: 'Add New Employees', module: 'employees', action: 'create', description: 'Onboard new staff, generate employee IDs, and assign roles', created_at: new Date().toISOString() },
  { id: 'perm-emp-edit', key: 'employees.edit', name: 'Edit Employee Profiles', module: 'employees', action: 'edit', description: 'Update job titles, branches, contact info, and status', created_at: new Date().toISOString() },
  { id: 'perm-emp-delete', key: 'employees.delete', name: 'Deactivate / Remove Staff', module: 'employees', action: 'delete', description: 'Deactivate employee accounts and revoke system access', created_at: new Date().toISOString() },
  { id: 'perm-emp-perms', key: 'employees.permissions', name: 'Manage Staff Permissions', module: 'employees', action: 'manage', description: 'Configure granular permission overrides per staff member', created_at: new Date().toISOString() },

  // Roles & Permissions
  { id: 'perm-roles-manage', key: 'roles.manage', name: 'Manage System Roles', module: 'employees', action: 'manage', description: 'Create and customize role definitions and security policies', created_at: new Date().toISOString() },

  // Branches
  { id: 'perm-br-view', key: 'branches.view', name: 'View Branches', module: 'branches', action: 'view', description: 'Inspect store locations, branch metrics, and assigned managers', created_at: new Date().toISOString() },
  { id: 'perm-br-manage', key: 'branches.manage', name: 'Manage Branches', module: 'branches', action: 'manage', description: 'Create new branches, configure locations, and assign managers', created_at: new Date().toISOString() },

  // Settings
  { id: 'perm-set-view', key: 'settings.view', name: 'View Business Settings', module: 'settings', action: 'view', description: 'Inspect store profile, currency, tax rates, and receipt formats', created_at: new Date().toISOString() },
  { id: 'perm-set-manage', key: 'settings.manage', name: 'Manage Business Settings', module: 'settings', action: 'manage', description: 'Change business currency, tax configuration, and store credentials', created_at: new Date().toISOString() },
  { id: 'perm-notif-view', key: 'notifications.view', name: 'View System Notifications', module: 'settings', action: 'view', description: 'Receive inventory alerts, order status, and audit triggers', created_at: new Date().toISOString() },
  { id: 'perm-plans-manage', key: 'plans.manage', name: 'Manage Subscription & Plans', module: 'settings', action: 'manage', description: 'Manage billing tiers and cloud enterprise features', created_at: new Date().toISOString() },
];

export const INITIAL_DEMO_BRANCHES: Branch[] = [
  {
    id: 'branch-downtown',
    business_id: 'demo-biz-1',
    name: 'Bujumbura Flagship (Rohero)',
    address: 'Boulevard du 1er Novembre, Rohero, Bujumbura, Burundi',
    phone: '+257 22 25 1200',
    email: 'bujumbura@babaspos.bi',
    manager_id: 'demo-user-1',
    is_active: true,
    created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'branch-gitega',
    business_id: 'demo-biz-1',
    name: 'Gitega Central Branch',
    address: 'Avenue du Commerce, Centre-Ville, Gitega, Burundi',
    phone: '+257 22 40 2150',
    email: 'gitega@babaspos.bi',
    manager_id: 'emp-mgr-1',
    is_active: true,
    created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'branch-ngozi',
    business_id: 'demo-biz-1',
    name: 'Ngozi Distribution Hub',
    address: 'Quartier Kanyami, Ngozi, Burundi',
    phone: '+257 22 30 1880',
    email: 'ngozi@babaspos.bi',
    manager_id: 'emp-inv-1',
    is_active: true,
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_DEMO_ROLES: Role[] = [
  {
    id: 'role-super-admin',
    business_id: 'demo-biz-1',
    name: 'super_admin',
    display_name: 'Super Administrator',
    description: 'Full master access to all business modules, financial audits, security policies, and branches.',
    is_system: true,
    permissions_count: ALL_SYSTEM_PERMISSIONS.length,
    employee_count: 1,
    permissions: ALL_SYSTEM_PERMISSIONS.map((p) => p.key),
    created_at: new Date(Date.now() - 200 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'role-admin',
    business_id: 'demo-biz-1',
    name: 'admin',
    display_name: 'Administrator',
    description: 'Comprehensive business management across sales, inventory, purchasing, expenses, and staff operations.',
    is_system: true,
    permissions_count: ALL_SYSTEM_PERMISSIONS.length - 2,
    employee_count: 1,
    permissions: ALL_SYSTEM_PERMISSIONS.filter((p) => p.key !== 'plans.manage').map((p) => p.key),
    created_at: new Date(Date.now() - 200 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'role-branch-manager',
    business_id: 'demo-biz-1',
    name: 'branch_manager',
    display_name: 'Branch Manager',
    description: 'Operational control of assigned store location, staff supervision, stock transfers, and sales approvals.',
    is_system: true,
    permissions_count: 24,
    employee_count: 1,
    permissions: [
      'dashboard.view',
      'pos.sell',
      'pos.discount',
      'pos.refund',
      'cash_register.manage',
      'sales.view',
      'sales.refund',
      'sales.export',
      'products.view',
      'products.create',
      'products.edit',
      'categories.manage',
      'inventory.view',
      'stock.view',
      'inventory.adjust',
      'inventory.transfer',
      'purchases.view',
      'purchases.create',
      'purchases.approve',
      'purchases.pay',
      'suppliers.view',
      'expenses.view',
      'expenses.create',
      'customers.view',
      'customers.create',
      'customers.edit',
      'reports.view',
      'employees.view',
      'staff.view',
      'branches.view',
      'notifications.view',
    ],
    created_at: new Date(Date.now() - 200 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'role-cashier',
    business_id: 'demo-biz-1',
    name: 'cashier',
    display_name: 'Cashier',
    description: 'Optimized for front-desk point-of-sale checkout, customer lookup, cash register sessions, and receipt printing.',
    is_system: true,
    permissions_count: 7,
    employee_count: 2,
    permissions: [
      'dashboard.view',
      'pos.sell',
      'pos.discount',
      'cash_register.manage',
      'sales.view',
      'products.view',
      'inventory.view',
      'customers.view',
      'customers.create',
      'notifications.view',
    ],
    created_at: new Date(Date.now() - 200 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'role-inventory-manager',
    business_id: 'demo-biz-1',
    name: 'inventory_manager',
    display_name: 'Inventory Manager',
    description: 'Dedicated to product catalog management, stock audits, warehouse transfers, and supplier purchase orders.',
    is_system: true,
    permissions_count: 16,
    employee_count: 1,
    permissions: [
      'dashboard.view',
      'products.view',
      'products.create',
      'products.edit',
      'products.delete',
      'categories.manage',
      'inventory.view',
      'stock.view',
      'inventory.adjust',
      'inventory.transfer',
      'purchases.view',
      'purchases.create',
      'purchases.approve',
      'purchases.pay',
      'suppliers.view',
      'suppliers.create',
      'suppliers.edit',
      'reports.view',
      'notifications.view',
    ],
    created_at: new Date(Date.now() - 200 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'role-sales-employee',
    business_id: 'demo-biz-1',
    name: 'sales_employee',
    display_name: 'Sales Employee',
    description: 'Customer prospecting, wholesale quotes, order generation, and personalized customer CRM engagement.',
    is_system: true,
    permissions_count: 9,
    employee_count: 2,
    permissions: [
      'dashboard.view',
      'pos.sell',
      'sales.view',
      'products.view',
      'inventory.view',
      'customers.view',
      'customers.create',
      'customers.edit',
      'notifications.view',
    ],
    created_at: new Date(Date.now() - 200 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_DEMO_EMPLOYEES: Employee[] = [
  {
    id: 'demo-user-1',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    employee_id: 'EMP-001',
    full_name: 'Alex Rivera',
    email: 'alex.rivera@babaspos.bi',
    phone: '+257 22 25 1201',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    job_title: 'Managing Director & Founder',
    role_id: 'role-super-admin',
    is_active: true,
    status: 'active',
    date_joined: '2024-01-15',
    notes: 'Primary business founder and system administrator.',
    emergency_contact_name: 'Sarah Rivera',
    emergency_contact_phone: '+257 79 10 20 30',
    emergency_contact_relation: 'Spouse',
    last_login_at: new Date(Date.now() - 15 * 60000).toISOString(),
    created_at: '2024-01-15T08:00:00.000Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'emp-admin-1',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    employee_id: 'EMP-002',
    full_name: 'Diane Niyonkuru',
    email: 'diane.niyonkuru@babaspos.bi',
    phone: '+257 79 88 44 22',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    job_title: 'Chief Operations Officer (COO)',
    role_id: 'role-admin',
    is_active: true,
    status: 'active',
    date_joined: '2024-03-01',
    notes: 'Supervises retail operations and company accounting.',
    emergency_contact_name: 'Jean Niyonkuru',
    emergency_contact_phone: '+257 79 33 11 00',
    emergency_contact_relation: 'Brother',
    last_login_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    created_at: '2024-03-01T08:00:00.000Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'emp-mgr-1',
    business_id: 'demo-biz-1',
    branch_id: 'branch-gitega',
    employee_id: 'EMP-003',
    full_name: 'Eric Ndayisaba',
    email: 'eric.ndayisaba@babaspos.bi',
    phone: '+257 71 55 66 77',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    job_title: 'Gitega Branch Manager',
    role_id: 'role-branch-manager',
    is_active: true,
    status: 'active',
    date_joined: '2024-05-10',
    notes: 'Supervises all retail and inventory operations at Gitega branch.',
    emergency_contact_name: 'Aline Ndayisaba',
    emergency_contact_phone: '+257 71 22 33 44',
    emergency_contact_relation: 'Spouse',
    last_login_at: new Date(Date.now() - 7 * 3600000).toISOString(),
    created_at: '2024-05-10T08:00:00.000Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'emp-cashier-1',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    employee_id: 'EMP-004',
    full_name: 'Nadia Kaneza',
    email: 'nadia.kaneza@babaspos.bi',
    phone: '+257 76 11 22 33',
    avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
    job_title: 'Senior POS Cashier',
    role_id: 'role-cashier',
    is_active: true,
    status: 'active',
    date_joined: '2024-06-01',
    notes: 'Handles high-speed register checkout at Rohero Flagship.',
    emergency_contact_name: 'Pascal Kaneza',
    emergency_contact_phone: '+257 76 99 88 77',
    emergency_contact_relation: 'Father',
    last_login_at: new Date(Date.now() - 45 * 60000).toISOString(),
    created_at: '2024-06-01T08:00:00.000Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'emp-inv-1',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    employee_id: 'EMP-005',
    full_name: 'Thierry Habimana',
    email: 'thierry.habimana@babaspos.bi',
    phone: '+257 75 33 44 55',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    job_title: 'Inventory & Warehouse Lead',
    role_id: 'role-inventory-manager',
    is_active: true,
    status: 'active',
    date_joined: '2024-04-12',
    notes: 'Oversees goods receiving, barcode tagging, and stock counts.',
    emergency_contact_name: 'Chantal Habimana',
    emergency_contact_phone: '+257 75 88 77 66',
    emergency_contact_relation: 'Mother',
    last_login_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    created_at: '2024-04-12T08:00:00.000Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'emp-sales-1',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    employee_id: 'EMP-006',
    full_name: 'Grace Irakoze',
    email: 'grace.irakoze@babaspos.bi',
    phone: '+257 79 12 34 56',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    job_title: 'Corporate Sales Consultant',
    role_id: 'role-sales-employee',
    is_active: true,
    status: 'active',
    date_joined: '2024-07-15',
    notes: 'Handles B2B corporate customer accounts and hotel deliveries.',
    emergency_contact_name: 'David Irakoze',
    emergency_contact_phone: '+257 79 65 43 21',
    emergency_contact_relation: 'Spouse',
    last_login_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    created_at: '2024-07-15T08:00:00.000Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'emp-cashier-2',
    business_id: 'demo-biz-1',
    branch_id: 'branch-gitega',
    employee_id: 'EMP-007',
    full_name: 'Clovis Hakizimana',
    email: 'clovis.hakizimana@babaspos.bi',
    phone: '+257 71 89 01 23',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    job_title: 'Cashier & Customer Assistant',
    role_id: 'role-cashier',
    is_active: true,
    status: 'active',
    date_joined: '2024-08-01',
    notes: 'Afternoon shift cashier for Gitega retail store.',
    emergency_contact_name: 'Marie Hakizimana',
    emergency_contact_phone: '+257 71 43 21 09',
    emergency_contact_relation: 'Sister',
    last_login_at: new Date(Date.now() - 18 * 3600000).toISOString(),
    created_at: '2024-08-01T08:00:00.000Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'emp-sales-2',
    business_id: 'demo-biz-1',
    branch_id: 'branch-ngozi',
    employee_id: 'EMP-008',
    full_name: 'Bella Mukamana',
    email: 'bella.mukamana@babaspos.bi',
    phone: '+257 78 44 55 66',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    job_title: 'Regional Sales Representative',
    role_id: 'role-sales-employee',
    is_active: false,
    status: 'inactive',
    date_joined: '2024-05-20',
    notes: 'Temporarily on maternity leave since August 2026.',
    emergency_contact_name: 'Jean Mukamana',
    emergency_contact_phone: '+257 78 11 22 33',
    emergency_contact_relation: 'Father',
    last_login_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    created_at: '2024-05-20T08:00:00.000Z',
    updated_at: new Date().toISOString(),
  },
];

// LocalStorage helpers
export function getStoredEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(DEMO_EMPLOYEES_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_EMPLOYEES_KEY, JSON.stringify(INITIAL_DEMO_EMPLOYEES));
      return INITIAL_DEMO_EMPLOYEES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_EMPLOYEES;
  }
}

export function getStoredBranches(): Branch[] {
  try {
    const raw = localStorage.getItem(DEMO_BRANCHES_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_BRANCHES_KEY, JSON.stringify(INITIAL_DEMO_BRANCHES));
      return INITIAL_DEMO_BRANCHES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_BRANCHES;
  }
}

function saveStoredEmployees(emps: Employee[]): void {
  try {
    localStorage.setItem(DEMO_EMPLOYEES_KEY, JSON.stringify(emps));
  } catch (err) {
    console.error('Failed to save employees to localStorage', err);
  }
}

function getStoredRoles(): Role[] {
  try {
    const raw = localStorage.getItem(DEMO_ROLES_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_ROLES_KEY, JSON.stringify(INITIAL_DEMO_ROLES));
      return INITIAL_DEMO_ROLES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_ROLES;
  }
}

function saveStoredRoles(roles: Role[]): void {
  try {
    localStorage.setItem(DEMO_ROLES_KEY, JSON.stringify(roles));
  } catch (err) {
    console.error('Failed to save roles to localStorage', err);
  }
}

export interface GetEmployeesParams {
  businessId?: string;
  branchId?: string;
  roleId?: string;
  status?: 'active' | 'inactive' | 'all';
  search?: string;
}

export async function getEmployees(params: GetEmployeesParams = {}): Promise<Employee[]> {
  const branches = await getBranches();
  const roles = await getRoles();
  const branchMap = new Map(branches.map((b) => [b.id, b]));
  const roleMap = new Map(roles.map((r) => [r.id, r]));

  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('profiles').select('*, role:roles(*), branch:branches(*)');
      if (params.branchId && params.branchId !== 'all') {
        query = query.eq('branch_id', params.branchId);
      }
      if (params.roleId && params.roleId !== 'all') {
        query = query.eq('role_id', params.roleId);
      }
      if (params.status && params.status !== 'all') {
        query = query.eq('is_active', params.status === 'active');
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        let list = data as Employee[];
        if (params.search) {
          const q = params.search.toLowerCase();
          list = list.filter(
            (e) =>
              e.full_name?.toLowerCase().includes(q) ||
              e.email?.toLowerCase().includes(q) ||
              e.employee_id?.toLowerCase().includes(q) ||
              e.job_title?.toLowerCase().includes(q) ||
              e.phone?.toLowerCase().includes(q)
          );
        }
        return list;
      }
    } catch (err) {
      console.warn('Supabase profiles query fallback to localStorage:', err);
    }
  }

  // Fallback demo
  let employees = getStoredEmployees().map((emp) => ({
    ...emp,
    branch: emp.branch_id ? branchMap.get(emp.branch_id) || null : null,
    role: emp.role_id ? roleMap.get(emp.role_id) || null : null,
  }));

  if (params.branchId && params.branchId !== 'all') {
    employees = employees.filter((e) => e.branch_id === params.branchId);
  }
  if (params.roleId && params.roleId !== 'all') {
    employees = employees.filter((e) => e.role_id === params.roleId);
  }
  if (params.status && params.status !== 'all') {
    const isAct = params.status === 'active';
    employees = employees.filter((e) => e.is_active === isAct);
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    employees = employees.filter(
      (e) =>
        e.full_name.toLowerCase().includes(q) ||
        (e.email && e.email.toLowerCase().includes(q)) ||
        (e.employee_id && e.employee_id.toLowerCase().includes(q)) ||
        (e.job_title && e.job_title.toLowerCase().includes(q)) ||
        (e.phone && e.phone.toLowerCase().includes(q))
    );
  }

  return employees;
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const employees = await getEmployees();
  return employees.find((e) => e.id === id) || null;
}

export async function getBranches(): Promise<Branch[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('branches').select('*').order('name');
      if (!error && data && data.length > 0) return data as Branch[];
    } catch (err) {
      console.warn('Supabase branches fetch fallback:', err);
    }
  }
  try {
    const raw = localStorage.getItem(DEMO_BRANCHES_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_BRANCHES_KEY, JSON.stringify(INITIAL_DEMO_BRANCHES));
      return INITIAL_DEMO_BRANCHES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_BRANCHES;
  }
}

export async function getRoles(): Promise<Role[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('roles').select('*').order('created_at');
      if (!error && data && data.length > 0) return data as Role[];
    } catch (err) {
      console.warn('Supabase roles fetch fallback:', err);
    }
  }
  return getStoredRoles();
}

export async function getPermissions(): Promise<Permission[]> {
  return ALL_SYSTEM_PERMISSIONS;
}

export interface CreateEmployeeInput {
  full_name: string;
  email: string;
  phone?: string;
  employee_id?: string;
  job_title: string;
  role_id: string;
  branch_id?: string;
  is_active?: boolean;
  date_joined?: string;
  avatar_url?: string;
  notes?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  custom_permissions?: string[];
}

export async function createEmployee(
  input: CreateEmployeeInput,
  actor?: { id: string; name: string; role: string; branchId?: string }
): Promise<Employee> {
  const emps = getStoredEmployees();

  // Generate Employee ID if not provided
  let empId = input.employee_id;
  if (!empId) {
    const maxNum = emps.reduce((acc, curr) => {
      const match = curr.employee_id?.match(/EMP-(\d+)/);
      return match ? Math.max(acc, parseInt(match[1], 10)) : acc;
    }, 0);
    empId = `EMP-${String(maxNum + 1).padStart(3, '0')}`;
  }

  const newEmployee: Employee = {
    id: 'emp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    business_id: 'demo-biz-1',
    branch_id: input.branch_id || null,
    employee_id: empId,
    full_name: input.full_name,
    email: input.email,
    phone: input.phone || null,
    avatar_url:
      input.avatar_url ||
      `https://images.unsplash.com/photo-${1500000000000 + (emps.length % 10) * 100000}?w=150&auto=format&fit=crop&q=80`,
    job_title: input.job_title,
    role_id: input.role_id,
    is_active: input.is_active !== undefined ? input.is_active : true,
    status: input.is_active !== false ? 'active' : 'inactive',
    date_joined: input.date_joined || new Date().toISOString().split('T')[0],
    notes: input.notes || null,
    emergency_contact_name: input.emergency_contact_name || null,
    emergency_contact_phone: input.emergency_contact_phone || null,
    emergency_contact_relation: input.emergency_contact_relation || null,
    custom_permissions: input.custom_permissions || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('profiles').insert([newEmployee]).select().single();
      if (!error && data) {
        // Log activity
        await logActivity({
          business_id: 'demo-biz-1',
          branch_id: newEmployee.branch_id,
          employee_id: actor?.id || 'admin',
          employee_name: actor?.name || 'Administrator',
          employee_role: actor?.role || 'Super Administrator',
          action_type: 'employee_created',
          action_category: 'employees',
          description: `Onboarded new employee "${newEmployee.full_name}" (${newEmployee.job_title})`,
          entity_type: 'employee',
          entity_id: newEmployee.id,
          entity_label: `${newEmployee.full_name} (${newEmployee.employee_id})`,
        });
        return data as Employee;
      }
    } catch (err) {
      console.warn('Supabase create employee fallback:', err);
    }
  }

  emps.push(newEmployee);
  saveStoredEmployees(emps);

  // Log activity
  await logActivity({
    business_id: 'demo-biz-1',
    branch_id: newEmployee.branch_id,
    employee_id: actor?.id || 'admin',
    employee_name: actor?.name || 'Administrator',
    employee_role: actor?.role || 'Super Administrator',
    action_type: 'employee_created',
    action_category: 'employees',
    description: `Onboarded new employee "${newEmployee.full_name}" (${newEmployee.job_title})`,
    entity_type: 'employee',
    entity_id: newEmployee.id,
    entity_label: `${newEmployee.full_name} (${newEmployee.employee_id})`,
  });

  return newEmployee;
}

export async function updateEmployee(
  id: string,
  input: Partial<CreateEmployeeInput>,
  actor?: { id: string; name: string; role: string; branchId?: string }
): Promise<Employee> {
  const emps = getStoredEmployees();
  const idx = emps.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error('Employee not found');

  const existing = emps[idx];
  const updated: Employee = {
    ...existing,
    ...input,
    status: input.is_active !== undefined ? (input.is_active ? 'active' : 'inactive') : existing.status,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updated)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        await logActivity({
          business_id: 'demo-biz-1',
          branch_id: updated.branch_id,
          employee_id: actor?.id || 'admin',
          employee_name: actor?.name || 'Administrator',
          employee_role: actor?.role || 'Super Administrator',
          action_type: 'employee_updated',
          action_category: 'employees',
          description: `Updated profile details for "${updated.full_name}"`,
          entity_type: 'employee',
          entity_id: updated.id,
          entity_label: `${updated.full_name} (${updated.employee_id})`,
        });
        return data as Employee;
      }
    } catch (err) {
      console.warn('Supabase update employee fallback:', err);
    }
  }

  emps[idx] = updated;
  saveStoredEmployees(emps);

  await logActivity({
    business_id: 'demo-biz-1',
    branch_id: updated.branch_id,
    employee_id: actor?.id || 'admin',
    employee_name: actor?.name || 'Administrator',
    employee_role: actor?.role || 'Super Administrator',
    action_type: 'employee_updated',
    action_category: 'employees',
    description: `Updated profile details for "${updated.full_name}"`,
    entity_type: 'employee',
    entity_id: updated.id,
    entity_label: `${updated.full_name} (${updated.employee_id})`,
  });

  return updated;
}

export async function toggleEmployeeStatus(
  id: string,
  isActive: boolean,
  actor?: { id: string; name: string; role: string; branchId?: string }
): Promise<Employee> {
  const emps = getStoredEmployees();
  const emp = emps.find((e) => e.id === id);
  if (!emp) throw new Error('Employee not found');

  const updated = await updateEmployee(
    id,
    { is_active: isActive },
    actor
  );

  await logActivity({
    business_id: 'demo-biz-1',
    branch_id: updated.branch_id,
    employee_id: actor?.id || 'admin',
    employee_name: actor?.name || 'Administrator',
    employee_role: actor?.role || 'Super Administrator',
    action_type: 'employee_status_changed',
    action_category: 'employees',
    description: `${isActive ? 'Activated' : 'Deactivated'} employee account for "${updated.full_name}"`,
    entity_type: 'employee',
    entity_id: updated.id,
    entity_label: `${updated.full_name} (${isActive ? 'Active' : 'Inactive'})`,
  });

  return updated;
}

export async function updateRolePermissions(
  roleId: string,
  permissions: string[],
  actor?: { id: string; name: string; role: string }
): Promise<Role> {
  const roles = getStoredRoles();
  const rIdx = roles.findIndex((r) => r.id === roleId);
  if (rIdx === -1) throw new Error('Role not found');

  roles[rIdx] = {
    ...roles[rIdx],
    permissions,
    permissions_count: permissions.length,
    updated_at: new Date().toISOString(),
  };

  saveStoredRoles(roles);

  await logActivity({
    business_id: 'demo-biz-1',
    branch_id: null,
    employee_id: actor?.id || 'admin',
    employee_name: actor?.name || 'Administrator',
    employee_role: actor?.role || 'Super Administrator',
    action_type: 'permissions_updated',
    action_category: 'employees',
    description: `Updated permissions for role "${roles[rIdx].display_name || roles[rIdx].name}" (${permissions.length} permissions)`,
    entity_type: 'role',
    entity_id: roleId,
    entity_label: roles[rIdx].display_name || roles[rIdx].name,
  });

  return roles[rIdx];
}

export async function getEmployeeStats(): Promise<EmployeeStats> {
  const employees = await getEmployees();
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.is_active).length;
  const inactiveEmployees = totalEmployees - activeEmployees;

  // New this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const newThisMonth = employees.filter(
    (e) => new Date(e.created_at || e.date_joined || '').getTime() >= startOfMonth
  ).length;

  const roleCounts: Record<string, number> = {};
  const branchCounts: Record<string, number> = {};

  employees.forEach((e) => {
    const rKey = e.role?.name || e.role_id || 'unassigned';
    roleCounts[rKey] = (roleCounts[rKey] || 0) + 1;

    const bKey = e.branch?.name || 'Unassigned';
    branchCounts[bKey] = (branchCounts[bKey] || 0) + 1;
  });

  return {
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    newThisMonth,
    roleCounts,
    branchCounts,
  };
}

export function exportEmployeesAsCSV(employees: Employee[]): void {
  const headers = [
    'Employee ID',
    'Full Name',
    'Job Title',
    'Role',
    'Branch',
    'Email Address',
    'Phone Number',
    'Status',
    'Date Joined',
    'Emergency Contact',
    'Emergency Phone',
  ];

  const rows = employees.map((e) => [
    `"${e.employee_id || ''}"`,
    `"${e.full_name}"`,
    `"${e.job_title || ''}"`,
    `"${e.role?.display_name || e.role?.name || ''}"`,
    `"${e.branch?.name || 'All Branches'}"`,
    `"${e.email || ''}"`,
    `"${e.phone || ''}"`,
    `"${e.is_active ? 'Active' : 'Inactive'}"`,
    `"${e.date_joined || ''}"`,
    `"${e.emergency_contact_name || ''}"`,
    `"${e.emergency_contact_phone || ''}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `babas_employees_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
