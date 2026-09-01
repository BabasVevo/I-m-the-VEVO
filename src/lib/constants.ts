import {
  LayoutDashboard,
  ShoppingCart,
  DollarSign,
  Receipt,
  Package,
  Tags,
  Boxes,
  Truck,
  Users,
  UserCircle,
  Megaphone,
  Percent,
  Ticket,
  MessageSquare,
  Workflow,
  Building2,
  UserCog,
  ShieldCheck,
  Bell,
  Settings,
  CreditCard,
  History,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  permission: string;
  end?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view', end: true },
      { label: 'New Sale', path: '/pos', icon: ShoppingCart, permission: 'pos.sell' },
      { label: 'Cash Register', path: '/cash-register', icon: DollarSign, permission: 'cash_register.manage' },
      { label: 'Sales & Receipts', path: '/sales', icon: Receipt, permission: 'sales.view' },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Products', path: '/products', icon: Package, permission: 'products.view' },
      { label: 'Categories', path: '/categories', icon: Tags, permission: 'categories.manage' },
      { label: 'Stock', path: '/stock', icon: Boxes, permission: 'stock.view' },
      { label: 'Purchases', path: '/purchases', icon: Truck, permission: 'purchases.view' },
    ],
  },
  {
    title: 'Customers',
    items: [
      { label: 'Customers', path: '/customers', icon: Users, permission: 'customers.view' },
      { label: 'Customer Segments', path: '/segments', icon: UserCircle, permission: 'segments.manage' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { label: 'Campaigns', path: '/campaigns', icon: Megaphone, permission: 'campaigns.view' },
      { label: 'Promotions', path: '/promotions', icon: Percent, permission: 'promotions.manage' },
      { label: 'Coupons', path: '/coupons', icon: Ticket, permission: 'coupons.manage' },
      { label: 'Messages', path: '/messages', icon: MessageSquare, permission: 'messages.send' },
      { label: 'Marketing Automation', path: '/automation', icon: Workflow, permission: 'automation.manage' },
    ],
  },
  {
    title: 'Business',
    items: [
      { label: 'Approvals Hub', path: '/approvals', icon: ClipboardCheck, permission: 'expenses.view' },
      { label: 'Suppliers', path: '/suppliers', icon: Truck, permission: 'suppliers.view' },
      { label: 'Expenses', path: '/expenses', icon: CreditCard, permission: 'expenses.view' },
      { label: 'Reports', path: '/reports', icon: Receipt, permission: 'reports.view' },
      { label: 'Analytics', path: '/analytics', icon: LayoutDashboard, permission: 'analytics.view' },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Employees', path: '/employees', icon: UserCog, permission: 'employees.view' },
      { label: 'Roles & Permissions', path: '/roles', icon: ShieldCheck, permission: 'roles.manage' },
      { label: 'Activity Log', path: '/activity-log', icon: History, permission: 'employees.view' },
      { label: 'Branches', path: '/branches', icon: Building2, permission: 'branches.view' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Notifications', path: '/notifications', icon: Bell, permission: 'notifications.view' },
      { label: 'Settings', path: '/settings', icon: Settings, permission: 'settings.manage' },
      { label: 'Plans & Billing', path: '/plans', icon: CreditCard, permission: 'plans.manage' },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Administrator',
  admin: 'Administrator',
  business_owner: 'Business Owner',
  branch_manager: 'Branch Manager',
  cashier: 'Cashier',
  inventory_manager: 'Inventory Manager',
  sales_employee: 'Sales Employee',
  marketing_manager: 'Marketing Manager',
  accountant: 'Accountant',
  staff: 'Staff',
};
