import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  Sale,
  Product,
  InventoryItem,
  Expense,
  ExpenseCategory,
  PurchaseOrder,
  Customer,
  Supplier,
  Branch,
  StockMovement,
  PaymentMethod,
  Profile,
} from '@/types/database';
import { getStoredSales } from './saleService';
import { getStoredProducts, getStoredInventory, getStoredMovements } from './productService';
import { getStoredExpenses, getStoredExpenseCategories } from './expenseService';
import { getStoredPurchases } from './purchaseService';
import { getStoredCustomers } from './customerService';
import { getStoredSuppliers } from './supplierService';
import { getStoredEmployees, getStoredBranches } from './employeeService';
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  parseISO,
  isWithinInterval,
  format,
} from 'date-fns';

export type ReportDatePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'this_year'
  | 'last_30_days'
  | 'last_90_days'
  | 'custom';

export interface ReportFilterOptions {
  datePreset: ReportDatePreset;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  branchId?: string | null; // 'all' or branch UUID
}

export interface ReportsSummary {
  // Sales KPI
  totalSalesGross: number;
  totalSalesNet: number;
  totalTransactions: number;
  averageOrderValue: number;
  totalDiscounts: number;
  totalRefunds: number;

  // Financial & Profit KPI
  cogs: number;
  grossProfit: number;
  grossProfitMargin: number;
  totalExpenses: number;
  netProfit: number;
  netProfitMargin: number;

  // Inventory KPI
  totalProducts: number;
  totalInventoryUnits: number;
  totalInventoryCostValue: number;
  totalInventoryRetailValue: number;
  potentialInventoryProfit: number;
  lowStockCount: number;
  outOfStockCount: number;

  // Purchasing & Suppliers
  totalPurchases: number;
  totalPurchasesPaid: number;
  totalPurchasesDue: number;
  totalSuppliers: number;

  // Customers & Receivables
  totalCustomers: number;
  newCustomersInPeriod: number;
  totalReceivables: number;
}

export interface TimelineDataPoint {
  date: string;
  label: string;
  grossSales: number;
  netSales: number;
  transactions: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  purchases: number;
}

export interface SalesByBranchData {
  branchId: string;
  branchName: string;
  salesAmount: number;
  ordersCount: number;
  avgOrderValue: number;
  sharePercentage: number;
}

export interface SalesByEmployeeData {
  employeeId: string;
  employeeName: string;
  role: string;
  avatarUrl?: string | null;
  salesAmount: number;
  ordersCount: number;
  avgOrderValue: number;
}

export interface SalesByCategoryData {
  categoryId: string;
  categoryName: string;
  color: string;
  salesAmount: number;
  unitsSold: number;
  sharePercentage: number;
}

export interface SalesByProductData {
  productId: string;
  productName: string;
  sku: string;
  categoryName: string;
  unitsSold: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  marginPercentage: number;
}

export interface PaymentMethodData {
  method: PaymentMethod;
  label: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface HourlySalesData {
  hour: string;
  sales: number;
  transactions: number;
}

export interface SalesReportData {
  summary: {
    grossRevenue: number;
    discounts: number;
    refunds: number;
    netRevenue: number;
    transactionCount: number;
    avgOrderValue: number;
    cogs: number;
    grossProfit: number;
    marginPercent: number;
  };
  timeline: TimelineDataPoint[];
  salesByBranch: SalesByBranchData[];
  salesByEmployee: SalesByEmployeeData[];
  salesByCategory: SalesByCategoryData[];
  salesByProduct: SalesByProductData[];
  paymentMethods: PaymentMethodData[];
  hourlyDistribution: HourlySalesData[];
}

export interface ProfitLossReportData {
  periodLabel: string;
  revenue: {
    grossSales: number;
    discounts: number;
    returnsAndRefunds: number;
    netSales: number;
  };
  costOfGoodsSold: {
    directProductCost: number;
    totalCOGS: number;
  };
  grossProfit: number;
  grossMarginPercent: number;
  operatingExpenses: {
    categoryBreakdown: {
      categoryId: string;
      categoryName: string;
      code: string;
      color: string;
      amount: number;
      percentageOfExpenses: number;
      percentageOfRevenue: number;
    }[];
    totalOperatingExpenses: number;
  };
  netOperatingProfit: number;
  netMarginPercent: number;
  timeline: TimelineDataPoint[];
}

export interface InventoryCategoryValuation {
  categoryId: string;
  categoryName: string;
  productCount: number;
  totalUnits: number;
  costValue: number;
  retailValue: number;
  potentialProfit: number;
  marginPercent: number;
}

export interface LowStockAlertItem {
  productId: string;
  productName: string;
  sku: string;
  categoryName: string;
  branchName: string;
  branchId: string;
  currentStock: number;
  minStock: number;
  reorderPoint: number;
  costPrice: number;
  sellingPrice: number;
  estimatedReorderCost: number;
  deficitUnits: number;
  status: 'out_of_stock' | 'critical' | 'low';
}

export interface InventoryReportData {
  summary: {
    totalProducts: number;
    totalUnits: number;
    totalCostValue: number;
    totalRetailValue: number;
    potentialProfit: number;
    unrealizedMarginPercent: number;
    inStockCount: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  categoryValuations: InventoryCategoryValuation[];
  lowStockItems: LowStockAlertItem[];
  outOfStockItems: LowStockAlertItem[];
  stockMovements: {
    totalMovements: number;
    salesDeductions: number;
    purchasesReceived: number;
    adjustments: number;
    transfers: number;
    damages: number;
    recentMovements: StockMovement[];
  };
  fastMovingProducts: {
    productId: string;
    productName: string;
    sku: string;
    unitsSold: number;
    currentStock: number;
    turnoverVelocity: 'Very High' | 'High' | 'Moderate' | 'Slow';
  }[];
}

export interface ExpenseReportData {
  summary: {
    totalExpenses: number;
    expenseCount: number;
    approvedExpenses: number;
    pendingExpenses: number;
    paidExpenses: number;
    dailyAverage: number;
  };
  byCategory: {
    categoryId: string;
    name: string;
    code: string;
    color: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
  byBranch: {
    branchId: string;
    branchName: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
  timeline: {
    date: string;
    label: string;
    amount: number;
    count: number;
  }[];
  expensesList: Expense[];
}

export interface PurchaseReportData {
  summary: {
    totalOrders: number;
    totalPurchasesAmount: number;
    totalPaidAmount: number;
    totalDueAmount: number;
    receivedOrdersCount: number;
    pendingDeliveriesCount: number;
  };
  bySupplier: {
    supplierId: string;
    supplierName: string;
    contactPerson: string | null;
    ordersCount: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    sharePercentage: number;
  }[];
  timeline: {
    date: string;
    label: string;
    amount: number;
    ordersCount: number;
  }[];
  purchaseOrders: PurchaseOrder[];
}

export interface CustomerReportData {
  summary: {
    totalCustomers: number;
    activeCustomersCount: number;
    newCustomersInPeriod: number;
    totalCustomerSpend: number;
    averageCustomerLifetimeValue: number;
    totalReceivablesDue: number;
    debtorsCount: number;
  };
  topCustomers: {
    customerId: string;
    name: string;
    email: string | null;
    phone: string | null;
    customerType: string;
    ordersCount: number;
    totalSpent: number;
    avgOrderValue: number;
    lastPurchaseDate: string | null;
    creditBalance: number;
  }[];
  byType: {
    type: string;
    label: string;
    count: number;
    totalSpent: number;
    percentage: number;
  }[];
  receivables: {
    customerId: string;
    name: string;
    phone: string | null;
    creditLimit: number;
    currentBalance: number;
    lastPurchaseAt: string | null;
  }[];
}

// ----------------------------------------------------
// Helper: Calculate Date Intervals
// ----------------------------------------------------
export function getDateRangeInterval(
  preset: ReportDatePreset,
  customStart?: string,
  customEnd?: string
): { start: Date; end: Date; label: string } {
  const now = new Date();

  switch (preset) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
        label: 'Today (' + format(now, 'MMM dd, yyyy') + ')',
      };
    case 'yesterday': {
      const yest = subDays(now, 1);
      return {
        start: startOfDay(yest),
        end: endOfDay(yest),
        label: 'Yesterday (' + format(yest, 'MMM dd, yyyy') + ')',
      };
    }
    case 'this_week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
        label: 'This Week (' + format(startOfWeek(now, { weekStartsOn: 1 }), 'MMM dd') + ' – ' + format(endOfWeek(now, { weekStartsOn: 1 }), 'MMM dd, yyyy') + ')',
      };
    case 'this_month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: 'This Month (' + format(now, 'MMMM yyyy') + ')',
      };
    case 'this_year':
      return {
        start: startOfYear(now),
        end: endOfYear(now),
        label: 'This Year (' + format(now, 'yyyy') + ')',
      };
    case 'last_30_days': {
      const past30 = subDays(now, 30);
      return {
        start: startOfDay(past30),
        end: endOfDay(now),
        label: 'Last 30 Days (' + format(past30, 'MMM dd') + ' – ' + format(now, 'MMM dd, yyyy') + ')',
      };
    }
    case 'last_90_days': {
      const past90 = subDays(now, 90);
      return {
        start: startOfDay(past90),
        end: endOfDay(now),
        label: 'Last 90 Days (' + format(past90, 'MMM dd') + ' – ' + format(now, 'MMM dd, yyyy') + ')',
      };
    }
    case 'custom': {
      const start = customStart ? startOfDay(parseISO(customStart)) : startOfMonth(now);
      const end = customEnd ? endOfDay(parseISO(customEnd)) : endOfDay(now);
      return {
        start,
        end,
        label: `${format(start, 'MMM dd, yyyy')} – ${format(end, 'MMM dd, yyyy')}`,
      };
    }
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: format(now, 'MMMM yyyy'),
      };
  }
}

// ----------------------------------------------------
// Unified Core Data Aggregator
// ----------------------------------------------------
interface RawReportsDataset {
  sales: Sale[];
  products: Product[];
  inventory: InventoryItem[];
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  purchases: PurchaseOrder[];
  customers: Customer[];
  suppliers: Supplier[];
  branches: Branch[];
  movements: StockMovement[];
  employees: Profile[];
}

export async function fetchRawReportsData(businessId?: string): Promise<RawReportsDataset> {
  if (isSupabaseConfigured) {
    try {
      const [
        salesRes,
        productsRes,
        inventoryRes,
        expensesRes,
        expCatRes,
        purchasesRes,
        customersRes,
        suppliersRes,
        branchesRes,
        movementsRes,
        profilesRes,
      ] = await Promise.all([
        supabase.from('sales').select('*, items:sale_items(*), returns:sale_returns(*, items:sale_return_items(*)), cashier:profiles(*), customer:customers(*), branch:branches(*)').order('created_at', { ascending: false }),
        supabase.from('products').select('*, category:categories(*)').order('name'),
        supabase.from('inventory').select('*, product:products(*), branch:branches(*)'),
        supabase.from('expenses').select('*, category:expense_categories(*), branch:branches(*), supplier:suppliers(*)').order('expense_date', { ascending: false }),
        supabase.from('expense_categories').select('*').order('name'),
        supabase.from('purchase_orders').select('*, items:purchase_order_items(*), supplier:suppliers(*), branch:branches(*)').order('order_date', { ascending: false }),
        supabase.from('customers').select('*').order('name'),
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('branches').select('*').order('name'),
        supabase.from('stock_movements').select('*, product:products(*), branch:branches(*)').order('created_at', { ascending: false }).limit(200),
        supabase.from('profiles').select('*, role:roles(*), branch:branches(*)'),
      ]);

      let sales = (salesRes.data as Sale[]) || getStoredSales();
      let products = (productsRes.data as Product[]) || getStoredProducts();
      let inventory = (inventoryRes.data as InventoryItem[]) || getStoredInventory();
      let expenses = (expensesRes.data as Expense[]) || getStoredExpenses();
      let expenseCategories = (expCatRes.data as ExpenseCategory[]) || getStoredExpenseCategories();
      let purchases = (purchasesRes.data as PurchaseOrder[]) || getStoredPurchases();
      let customers = (customersRes.data as Customer[]) || getStoredCustomers();
      let suppliers = (suppliersRes.data as Supplier[]) || getStoredSuppliers();
      let branches = (branchesRes.data as Branch[]) || getStoredBranches();
      const movements = (movementsRes.data as StockMovement[]) || getStoredMovements();
      const employees = (profilesRes.data as Profile[]) || (getStoredEmployees() as unknown as Profile[]);

      if (businessId) {
        sales = sales.filter((s) => !s.business_id || s.business_id === businessId);
        products = products.filter((p) => !p.business_id || p.business_id === businessId);
        inventory = inventory.filter((i) => !i.business_id || i.business_id === businessId);
        expenses = expenses.filter((e) => !e.business_id || e.business_id === businessId);
        expenseCategories = expenseCategories.filter((ec) => !ec.business_id || ec.business_id === businessId);
        purchases = purchases.filter((pu) => !pu.business_id || pu.business_id === businessId);
        customers = customers.filter((c) => !c.business_id || c.business_id === businessId);
        suppliers = suppliers.filter((su) => !su.business_id || su.business_id === businessId);
        branches = branches.filter((b) => !b.business_id || b.business_id === businessId);
      }

      return {
        sales,
        products,
        inventory,
        expenses,
        expenseCategories,
        purchases,
        customers,
        suppliers,
        branches,
        movements,
        employees,
      };
    } catch (err) {
      console.warn('Error fetching Supabase reports data, using local state:', err);
    }
  }

  // Demo Fallback State
  return {
    sales: getStoredSales(),
    products: getStoredProducts(),
    inventory: getStoredInventory(),
    expenses: getStoredExpenses(),
    expenseCategories: getStoredExpenseCategories(),
    purchases: getStoredPurchases(),
    customers: getStoredCustomers(),
    suppliers: getStoredSuppliers(),
    branches: getStoredBranches(),
    movements: getStoredMovements(),
    employees: getStoredEmployees(),
  };
}

// ----------------------------------------------------
// 1. Reports Dashboard Summary
// ----------------------------------------------------
export async function getReportsSummary(
  filters: ReportFilterOptions,
  businessId?: string
): Promise<ReportsSummary> {
  const data = await fetchRawReportsData(businessId);
  const { start, end } = getDateRangeInterval(filters.datePreset, filters.startDate, filters.endDate);
  const branchFilter = filters.branchId && filters.branchId !== 'all' ? filters.branchId : null;

  // Filter Sales
  const filteredSales = data.sales.filter((s) => {
    if (s.payment_status === 'cancelled') return false;
    if (branchFilter && s.branch_id !== branchFilter) return false;
    const date = parseISO(s.created_at);
    return isWithinInterval(date, { start, end });
  });

  // Filter Expenses
  const filteredExpenses = data.expenses.filter((e) => {
    if (e.status === 'rejected' || e.status === 'draft') return false;
    if (branchFilter && e.branch_id !== branchFilter) return false;
    const date = parseISO(e.expense_date || e.created_at);
    return isWithinInterval(date, { start, end });
  });

  // Filter Purchases
  const filteredPurchases = data.purchases.filter((p) => {
    if (p.status === 'cancelled' || p.status === 'draft') return false;
    if (branchFilter && p.branch_id !== branchFilter) return false;
    const date = parseISO(p.order_date || p.created_at);
    return isWithinInterval(date, { start, end });
  });

  // Calculate Sales KPIs
  let totalSalesGross = 0;
  let totalDiscounts = 0;
  let totalRefunds = 0;
  let totalSalesNet = 0;
  let cogs = 0;

  filteredSales.forEach((s) => {
    totalSalesGross += s.subtotal || s.total_amount;
    totalDiscounts += s.discount_amount || 0;
    totalRefunds += s.refunded_amount || 0;
    totalSalesNet += s.total_amount - (s.refunded_amount || 0);

    // Calculate COGS from line items
    if (s.items && s.items.length > 0) {
      s.items.forEach((item) => {
        const itemCost = item.cost_price || 0;
        const netQty = Math.max(0, (item.quantity || 0) - (item.returned_quantity || 0));
        cogs += itemCost * netQty;
      });
    } else {
      // Fallback estimate 60% of revenue if cost not recorded
      cogs += (s.total_amount || 0) * 0.55;
    }
  });

  const totalTransactions = filteredSales.length;
  const averageOrderValue = totalTransactions > 0 ? totalSalesNet / totalTransactions : 0;
  const grossProfit = totalSalesNet - cogs;
  const grossProfitMargin = totalSalesNet > 0 ? (grossProfit / totalSalesNet) * 100 : 0;

  // Expenses
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = grossProfit - totalExpenses;
  const netProfitMargin = totalSalesNet > 0 ? (netProfit / totalSalesNet) * 100 : 0;

  // Inventory valuation
  let totalInventoryUnits = 0;
  let totalInventoryCostValue = 0;
  let totalInventoryRetailValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  const relevantInventory = branchFilter
    ? data.inventory.filter((i) => i.branch_id === branchFilter)
    : data.inventory;

  relevantInventory.forEach((inv) => {
    const qty = inv.quantity || 0;
    const prod = inv.product || data.products.find((p) => p.id === inv.product_id);
    const cost = prod?.cost_price || 0;
    const sell = prod?.selling_price || 0;
    const minQty = inv.min_quantity ?? prod?.min_stock_level ?? 5;

    totalInventoryUnits += qty;
    totalInventoryCostValue += qty * cost;
    totalInventoryRetailValue += qty * sell;

    if (qty <= 0) {
      outOfStockCount++;
    } else if (qty <= minQty) {
      lowStockCount++;
    }
  });

  const potentialInventoryProfit = totalInventoryRetailValue - totalInventoryCostValue;

  // Purchases KPIs
  let totalPurchases = 0;
  let totalPurchasesPaid = 0;
  let totalPurchasesDue = 0;

  filteredPurchases.forEach((p) => {
    totalPurchases += p.grand_total || 0;
    totalPurchasesPaid += p.paid_amount || 0;
    totalPurchasesDue += p.due_amount || 0;
  });

  // Customer KPIs
  const totalCustomers = data.customers.length;
  const newCustomersInPeriod = data.customers.filter((c) => {
    const date = parseISO(c.created_at);
    return isWithinInterval(date, { start, end });
  }).length;

  const totalReceivables = data.customers.reduce((sum, c) => sum + (c.current_balance > 0 ? c.current_balance : 0), 0);

  return {
    totalSalesGross,
    totalSalesNet,
    totalTransactions,
    averageOrderValue,
    totalDiscounts,
    totalRefunds,
    cogs,
    grossProfit,
    grossProfitMargin,
    totalExpenses,
    netProfit,
    netProfitMargin,
    totalProducts: data.products.length,
    totalInventoryUnits,
    totalInventoryCostValue,
    totalInventoryRetailValue,
    potentialInventoryProfit,
    lowStockCount,
    outOfStockCount,
    totalPurchases,
    totalPurchasesPaid,
    totalPurchasesDue,
    totalSuppliers: data.suppliers.length,
    totalCustomers,
    newCustomersInPeriod,
    totalReceivables,
  };
}

// ----------------------------------------------------
// 2. Detailed Sales Report
// ----------------------------------------------------
export async function getSalesReportData(
  filters: ReportFilterOptions,
  businessId?: string
): Promise<SalesReportData> {
  const data = await fetchRawReportsData(businessId);
  const { start, end } = getDateRangeInterval(filters.datePreset, filters.startDate, filters.endDate);
  const branchFilter = filters.branchId && filters.branchId !== 'all' ? filters.branchId : null;

  // Filter valid sales
  const validSales = data.sales.filter((s) => {
    if (s.payment_status === 'cancelled') return false;
    if (branchFilter && s.branch_id !== branchFilter) return false;
    const date = parseISO(s.created_at);
    return isWithinInterval(date, { start, end });
  });

  // Filter expenses for timeline integration
  const validExpenses = data.expenses.filter((e) => {
    if (e.status === 'rejected' || e.status === 'draft') return false;
    if (branchFilter && e.branch_id !== branchFilter) return false;
    const date = parseISO(e.expense_date || e.created_at);
    return isWithinInterval(date, { start, end });
  });

  // Calculate Overall Summary
  let grossRevenue = 0;
  let discounts = 0;
  let refunds = 0;
  let netRevenue = 0;
  let cogs = 0;

  validSales.forEach((s) => {
    grossRevenue += s.subtotal || s.total_amount;
    discounts += s.discount_amount || 0;
    refunds += s.refunded_amount || 0;
    netRevenue += s.total_amount - (s.refunded_amount || 0);

    if (s.items && s.items.length > 0) {
      s.items.forEach((item) => {
        const itemCost = item.cost_price || 0;
        const netQty = Math.max(0, (item.quantity || 0) - (item.returned_quantity || 0));
        cogs += itemCost * netQty;
      });
    } else {
      cogs += (s.total_amount || 0) * 0.55;
    }
  });

  const transactionCount = validSales.length;
  const avgOrderValue = transactionCount > 0 ? netRevenue / transactionCount : 0;
  const grossProfit = netRevenue - cogs;
  const marginPercent = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

  // 1. Timeline aggregation (Daily breakdown)
  const timelineMap = new Map<string, TimelineDataPoint>();

  // Determine timeline keys
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
  const isSingleDay = diffDays <= 1;

  if (isSingleDay) {
    // Hour by hour
    for (let h = 8; h <= 21; h++) {
      const hStr = `${String(h).padStart(2, '0')}:00`;
      timelineMap.set(hStr, {
        date: hStr,
        label: hStr,
        grossSales: 0,
        netSales: 0,
        transactions: 0,
        cogs: 0,
        grossProfit: 0,
        expenses: 0,
        netProfit: 0,
        purchases: 0,
      });
    }

    validSales.forEach((s) => {
      const d = parseISO(s.created_at);
      const h = d.getHours();
      const hStr = `${String(Math.min(Math.max(h, 8), 21)).padStart(2, '0')}:00`;
      const pt = timelineMap.get(hStr);
      if (pt) {
        pt.grossSales += s.subtotal || s.total_amount;
        const net = s.total_amount - (s.refunded_amount || 0);
        pt.netSales += net;
        pt.transactions += 1;
        let saleCogs = 0;
        s.items?.forEach((it) => {
          saleCogs += (it.cost_price || 0) * (it.quantity || 1);
        });
        pt.cogs += saleCogs;
        pt.grossProfit += net - saleCogs;
        pt.netProfit += net - saleCogs;
      }
    });
  } else {
    // Day by day
    validSales.forEach((s) => {
      const dStr = s.created_at.slice(0, 10);
      let pt = timelineMap.get(dStr);
      if (!pt) {
        pt = {
          date: dStr,
          label: format(parseISO(dStr), 'MMM dd'),
          grossSales: 0,
          netSales: 0,
          transactions: 0,
          cogs: 0,
          grossProfit: 0,
          expenses: 0,
          netProfit: 0,
          purchases: 0,
        };
        timelineMap.set(dStr, pt);
      }
      pt.grossSales += s.subtotal || s.total_amount;
      const net = s.total_amount - (s.refunded_amount || 0);
      pt.netSales += net;
      pt.transactions += 1;

      let saleCogs = 0;
      if (s.items && s.items.length > 0) {
        s.items.forEach((it) => {
          saleCogs += (it.cost_price || 0) * ((it.quantity || 0) - (it.returned_quantity || 0));
        });
      } else {
        saleCogs = net * 0.55;
      }
      pt.cogs += saleCogs;
      pt.grossProfit += net - saleCogs;
      pt.netProfit += net - saleCogs;
    });

    validExpenses.forEach((e) => {
      const dStr = (e.expense_date || e.created_at).slice(0, 10);
      let pt = timelineMap.get(dStr);
      if (!pt) {
        pt = {
          date: dStr,
          label: format(parseISO(dStr), 'MMM dd'),
          grossSales: 0,
          netSales: 0,
          transactions: 0,
          cogs: 0,
          grossProfit: 0,
          expenses: 0,
          netProfit: 0,
          purchases: 0,
        };
        timelineMap.set(dStr, pt);
      }
      pt.expenses += e.amount || 0;
      pt.netProfit -= e.amount || 0;
    });
  }

  const timeline = Array.from(timelineMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // 2. Sales by Branch
  const branchSalesMap = new Map<string, { amount: number; count: number; name: string }>();
  data.branches.forEach((b) => {
    branchSalesMap.set(b.id, { amount: 0, count: 0, name: b.name });
  });

  validSales.forEach((s) => {
    const bId = s.branch_id || 'branch-downtown';
    const curr = branchSalesMap.get(bId) || { amount: 0, count: 0, name: s.branch?.name || 'Main Branch' };
    curr.amount += s.total_amount - (s.refunded_amount || 0);
    curr.count += 1;
    branchSalesMap.set(bId, curr);
  });

  const salesByBranch: SalesByBranchData[] = Array.from(branchSalesMap.entries())
    .filter(([bId]) => !branchFilter || bId === branchFilter)
    .map(([branchId, stat]) => ({
      branchId,
      branchName: stat.name,
      salesAmount: stat.amount,
      ordersCount: stat.count,
      avgOrderValue: stat.count > 0 ? stat.amount / stat.count : 0,
      sharePercentage: netRevenue > 0 ? (stat.amount / netRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.salesAmount - a.salesAmount);

  // 3. Sales by Employee / Cashier
  const employeeSalesMap = new Map<
    string,
    { name: string; role: string; avatarUrl?: string | null; amount: number; count: number }
  >();

  validSales.forEach((s) => {
    const empId = s.cashier_id || 'emp-unassigned';
    const empName = s.cashier?.full_name || 'Cashier Desk';
    const empRole = s.cashier?.job_title || s.cashier?.role?.name || 'Sales Staff';
    const curr = employeeSalesMap.get(empId) || {
      name: empName,
      role: empRole,
      avatarUrl: s.cashier?.avatar_url,
      amount: 0,
      count: 0,
    };
    curr.amount += s.total_amount - (s.refunded_amount || 0);
    curr.count += 1;
    employeeSalesMap.set(empId, curr);
  });

  const salesByEmployee: SalesByEmployeeData[] = Array.from(employeeSalesMap.entries())
    .map(([employeeId, stat]) => ({
      employeeId,
      employeeName: stat.name,
      role: stat.role,
      avatarUrl: stat.avatarUrl,
      salesAmount: stat.amount,
      ordersCount: stat.count,
      avgOrderValue: stat.count > 0 ? stat.amount / stat.count : 0,
    }))
    .sort((a, b) => b.salesAmount - a.salesAmount);

  // 4. Sales by Category & Product
  const productSalesMap = new Map<
    string,
    {
      name: string;
      sku: string;
      categoryId: string;
      categoryName: string;
      units: number;
      revenue: number;
      cogs: number;
    }
  >();

  const categoryColors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'];
  const categorySalesMap = new Map<string, { name: string; amount: number; units: number }>();

  validSales.forEach((s) => {
    s.items?.forEach((it) => {
      const pId = it.product_id || it.product_name;
      const netQty = Math.max(0, (it.quantity || 0) - (it.returned_quantity || 0));
      const lineRevenue = it.total_price || (it.unit_price * netQty);
      const lineCogs = (it.cost_price || 0) * netQty;

      // Product grouping
      const prodMeta = data.products.find((p) => p.id === it.product_id);
      const catName = prodMeta?.category?.name || 'General Products';
      const catId = prodMeta?.category_id || 'cat-general';

      const prodCurr = productSalesMap.get(pId) || {
        name: it.product_name,
        sku: it.sku || prodMeta?.sku || 'SKU-GEN',
        categoryId: catId,
        categoryName: catName,
        units: 0,
        revenue: 0,
        cogs: 0,
      };
      prodCurr.units += netQty;
      prodCurr.revenue += lineRevenue;
      prodCurr.cogs += lineCogs;
      productSalesMap.set(pId, prodCurr);

      // Category grouping
      const catCurr = categorySalesMap.get(catName) || { name: catName, amount: 0, units: 0 };
      catCurr.amount += lineRevenue;
      catCurr.units += netQty;
      categorySalesMap.set(catName, catCurr);
    });
  });

  const salesByProduct: SalesByProductData[] = Array.from(productSalesMap.entries())
    .map(([productId, p]) => {
      const profit = p.revenue - p.cogs;
      return {
        productId,
        productName: p.name,
        sku: p.sku,
        categoryName: p.categoryName,
        unitsSold: p.units,
        revenue: p.revenue,
        cogs: p.cogs,
        grossProfit: profit,
        marginPercentage: p.revenue > 0 ? (profit / p.revenue) * 100 : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const salesByCategory: SalesByCategoryData[] = Array.from(categorySalesMap.entries())
    .map(([categoryName, stat], idx) => ({
      categoryId: `cat-${idx}`,
      categoryName,
      color: categoryColors[idx % categoryColors.length],
      salesAmount: stat.amount,
      unitsSold: stat.units,
      sharePercentage: netRevenue > 0 ? (stat.amount / netRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.salesAmount - a.salesAmount);

  // 5. Payment Methods Distribution
  const paymentMethodLabels: Record<PaymentMethod, string> = {
    cash: 'Cash (BIF)',
    card: 'Card / POS Terminal',
    mobile_money: 'Mobile Money (Lumicash / EcoCash)',
    bank_transfer: 'Bank Wire / Transfer',
    credit: 'Customer Credit',
    split: 'Split Payment',
  };

  const paymentMap = new Map<PaymentMethod, { amount: number; count: number }>();
  validSales.forEach((s) => {
    const m = s.payment_method || 'cash';
    const curr = paymentMap.get(m) || { amount: 0, count: 0 };
    curr.amount += s.total_amount - (s.refunded_amount || 0);
    curr.count += 1;
    paymentMap.set(m, curr);
  });

  const paymentMethods: PaymentMethodData[] = Array.from(paymentMap.entries())
    .map(([method, stat]) => ({
      method,
      label: paymentMethodLabels[method] || method,
      amount: stat.amount,
      count: stat.count,
      percentage: netRevenue > 0 ? (stat.amount / netRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // 6. Hourly Distribution
  const hourBuckets: Record<string, { sales: number; count: number }> = {};
  for (let h = 8; h <= 21; h++) {
    hourBuckets[`${String(h).padStart(2, '0')}:00`] = { sales: 0, count: 0 };
  }

  validSales.forEach((s) => {
    const d = parseISO(s.created_at);
    const h = d.getHours();
    const hKey = `${String(Math.min(Math.max(h, 8), 21)).padStart(2, '0')}:00`;
    if (hourBuckets[hKey]) {
      hourBuckets[hKey].sales += s.total_amount - (s.refunded_amount || 0);
      hourBuckets[hKey].count += 1;
    }
  });

  const hourlyDistribution: HourlySalesData[] = Object.entries(hourBuckets).map(([hour, stat]) => ({
    hour,
    sales: stat.sales,
    transactions: stat.count,
  }));

  return {
    summary: {
      grossRevenue,
      discounts,
      refunds,
      netRevenue,
      transactionCount,
      avgOrderValue,
      cogs,
      grossProfit,
      marginPercent,
    },
    timeline,
    salesByBranch,
    salesByEmployee,
    salesByCategory,
    salesByProduct,
    paymentMethods,
    hourlyDistribution,
  };
}

// ----------------------------------------------------
// 3. Profit & Loss (P&L) Report
// ----------------------------------------------------
export async function getProfitLossData(
  filters: ReportFilterOptions,
  businessId?: string
): Promise<ProfitLossReportData> {
  const data = await fetchRawReportsData(businessId);
  const { start, end, label } = getDateRangeInterval(filters.datePreset, filters.startDate, filters.endDate);
  const branchFilter = filters.branchId && filters.branchId !== 'all' ? filters.branchId : null;

  // Filter sales
  const sales = data.sales.filter((s) => {
    if (s.payment_status === 'cancelled') return false;
    if (branchFilter && s.branch_id !== branchFilter) return false;
    const date = parseISO(s.created_at);
    return isWithinInterval(date, { start, end });
  });

  // Filter expenses
  const expenses = data.expenses.filter((e) => {
    if (e.status === 'rejected' || e.status === 'draft') return false;
    if (branchFilter && e.branch_id !== branchFilter) return false;
    const date = parseISO(e.expense_date || e.created_at);
    return isWithinInterval(date, { start, end });
  });

  // Revenue breakdown
  let grossSales = 0;
  let discounts = 0;
  let returnsAndRefunds = 0;
  let directProductCost = 0;

  sales.forEach((s) => {
    grossSales += s.subtotal || s.total_amount;
    discounts += s.discount_amount || 0;
    returnsAndRefunds += s.refunded_amount || 0;

    if (s.items && s.items.length > 0) {
      s.items.forEach((item) => {
        const netQty = Math.max(0, (item.quantity || 0) - (item.returned_quantity || 0));
        directProductCost += (item.cost_price || 0) * netQty;
      });
    } else {
      directProductCost += (s.total_amount || 0) * 0.55;
    }
  });

  const netSales = grossSales - discounts - returnsAndRefunds;
  const totalCOGS = directProductCost;
  const grossProfit = netSales - totalCOGS;
  const grossMarginPercent = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

  // Operating Expenses breakdown by Category
  const expenseCatMap = new Map<
    string,
    { name: string; code: string; color: string; amount: number }
  >();

  data.expenseCategories.forEach((cat) => {
    expenseCatMap.set(cat.id, {
      name: cat.name,
      code: cat.code || cat.name.slice(0, 4).toUpperCase(),
      color: cat.color || '#3b82f6',
      amount: 0,
    });
  });

  let totalOperatingExpenses = 0;
  expenses.forEach((e) => {
    totalOperatingExpenses += e.amount || 0;
    const catId = e.category_id || 'expcat-other';
    const curr = expenseCatMap.get(catId) || {
      name: e.category?.name || 'General Expense',
      code: 'GEN',
      color: '#64748b',
      amount: 0,
    };
    curr.amount += e.amount || 0;
    expenseCatMap.set(catId, curr);
  });

  const categoryBreakdown = Array.from(expenseCatMap.entries())
    .filter(([, c]) => c.amount > 0)
    .map(([categoryId, c]) => ({
      categoryId,
      categoryName: c.name,
      code: c.code,
      color: c.color,
      amount: c.amount,
      percentageOfExpenses: totalOperatingExpenses > 0 ? (c.amount / totalOperatingExpenses) * 100 : 0,
      percentageOfRevenue: netSales > 0 ? (c.amount / netSales) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const netOperatingProfit = grossProfit - totalOperatingExpenses;
  const netMarginPercent = netSales > 0 ? (netOperatingProfit / netSales) * 100 : 0;

  // Daily timeline
  const salesReport = await getSalesReportData(filters, businessId);

  return {
    periodLabel: label,
    revenue: {
      grossSales,
      discounts,
      returnsAndRefunds,
      netSales,
    },
    costOfGoodsSold: {
      directProductCost,
      totalCOGS,
    },
    grossProfit,
    grossMarginPercent,
    operatingExpenses: {
      categoryBreakdown,
      totalOperatingExpenses,
    },
    netOperatingProfit,
    netMarginPercent,
    timeline: salesReport.timeline,
  };
}

// ----------------------------------------------------
// 4. Inventory & Valuation Reports
// ----------------------------------------------------
export async function getInventoryReportData(
  filters: ReportFilterOptions,
  businessId?: string
): Promise<InventoryReportData> {
  const data = await fetchRawReportsData(businessId);
  const branchFilter = filters.branchId && filters.branchId !== 'all' ? filters.branchId : null;

  const relevantInventory = branchFilter
    ? data.inventory.filter((i) => i.branch_id === branchFilter)
    : data.inventory;

  let totalUnits = 0;
  let totalCostValue = 0;
  let totalRetailValue = 0;
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  const lowStockItems: LowStockAlertItem[] = [];
  const outOfStockItems: LowStockAlertItem[] = [];

  // Group by category
  const categoryValMap = new Map<
    string,
    { name: string; productCount: number; units: number; cost: number; retail: number }
  >();

  relevantInventory.forEach((inv) => {
    const qty = inv.quantity || 0;
    const prod = inv.product || data.products.find((p) => p.id === inv.product_id);
    const branch = inv.branch || data.branches.find((b) => b.id === inv.branch_id);
    const cost = prod?.cost_price || 0;
    const sell = prod?.selling_price || 0;
    const minStock = inv.min_quantity ?? prod?.min_stock_level ?? 10;
    const reorderPoint = inv.reorder_point || minStock * 1.5;
    const catName = prod?.category?.name || 'General Products';
    const catId = prod?.category_id || 'cat-general';

    totalUnits += qty;
    totalCostValue += qty * cost;
    totalRetailValue += qty * sell;

    // Category bucket
    const catCurr = categoryValMap.get(catId) || {
      name: catName,
      productCount: 0,
      units: 0,
      cost: 0,
      retail: 0,
    };
    catCurr.productCount += 1;
    catCurr.units += qty;
    catCurr.cost += qty * cost;
    catCurr.retail += qty * sell;
    categoryValMap.set(catId, catCurr);

    const alertItem: LowStockAlertItem = {
      productId: prod?.id || inv.product_id,
      productName: prod?.name || 'Unknown Product',
      sku: prod?.sku || 'SKU-000',
      categoryName: catName,
      branchName: branch?.name || 'Main Branch',
      branchId: inv.branch_id,
      currentStock: qty,
      minStock,
      reorderPoint,
      costPrice: cost,
      sellingPrice: sell,
      deficitUnits: Math.max(0, reorderPoint - qty),
      estimatedReorderCost: Math.max(0, reorderPoint - qty) * cost,
      status: qty <= 0 ? 'out_of_stock' : qty <= minStock ? 'critical' : 'low',
    };

    if (qty <= 0) {
      outOfStockCount++;
      outOfStockItems.push(alertItem);
    } else if (qty <= minStock) {
      lowStockCount++;
      lowStockItems.push(alertItem);
    } else {
      inStockCount++;
    }
  });

  const potentialProfit = totalRetailValue - totalCostValue;
  const unrealizedMarginPercent = totalRetailValue > 0 ? (potentialProfit / totalRetailValue) * 100 : 0;

  const categoryValuations: InventoryCategoryValuation[] = Array.from(categoryValMap.entries())
    .map(([categoryId, c]) => {
      const catProfit = c.retail - c.cost;
      return {
        categoryId,
        categoryName: c.name,
        productCount: c.productCount,
        totalUnits: c.units,
        costValue: c.cost,
        retailValue: c.retail,
        potentialProfit: catProfit,
        marginPercent: c.retail > 0 ? (catProfit / c.retail) * 100 : 0,
      };
    })
    .sort((a, b) => b.costValue - a.costValue);

  // Stock movements breakdown
  const relevantMovements = branchFilter
    ? data.movements.filter((m) => m.branch_id === branchFilter)
    : data.movements;

  let salesDeductions = 0;
  let purchasesReceived = 0;
  let adjustments = 0;
  let transfers = 0;
  let damages = 0;

  relevantMovements.forEach((m) => {
    const qty = Math.abs(m.quantity || 0);
    if (m.movement_type === 'sale') salesDeductions += qty;
    else if (m.movement_type === 'purchase') purchasesReceived += qty;
    else if (m.movement_type === 'adjustment') adjustments += qty;
    else if (m.movement_type === 'transfer') transfers += qty;
    else if (m.movement_type === 'damaged' || m.movement_type === 'expired') damages += qty;
  });

  // Fast moving products estimation
  const salesReport = await getSalesReportData(filters, businessId);
  const fastMovingProducts = salesReport.salesByProduct.slice(0, 10).map((sp) => {
    const inv = relevantInventory.find((i) => i.product_id === sp.productId);
    const stock = inv?.quantity || 0;
    let velocity: 'Very High' | 'High' | 'Moderate' | 'Slow' = 'Moderate';
    if (sp.unitsSold >= 100) velocity = 'Very High';
    else if (sp.unitsSold >= 40) velocity = 'High';
    else if (sp.unitsSold <= 5) velocity = 'Slow';

    return {
      productId: sp.productId,
      productName: sp.productName,
      sku: sp.sku,
      unitsSold: sp.unitsSold,
      currentStock: stock,
      turnoverVelocity: velocity,
    };
  });

  return {
    summary: {
      totalProducts: data.products.length,
      totalUnits,
      totalCostValue,
      totalRetailValue,
      potentialProfit,
      unrealizedMarginPercent,
      inStockCount,
      lowStockCount,
      outOfStockCount,
    },
    categoryValuations,
    lowStockItems: lowStockItems.sort((a, b) => a.currentStock - b.currentStock),
    outOfStockItems,
    stockMovements: {
      totalMovements: relevantMovements.length,
      salesDeductions,
      purchasesReceived,
      adjustments,
      transfers,
      damages,
      recentMovements: relevantMovements.slice(0, 30),
    },
    fastMovingProducts,
  };
}

// ----------------------------------------------------
// 5. Expense Reports
// ----------------------------------------------------
export async function getExpenseReportData(
  filters: ReportFilterOptions,
  businessId?: string
): Promise<ExpenseReportData> {
  const data = await fetchRawReportsData(businessId);
  const { start, end } = getDateRangeInterval(filters.datePreset, filters.startDate, filters.endDate);
  const branchFilter = filters.branchId && filters.branchId !== 'all' ? filters.branchId : null;

  const filteredExpenses = data.expenses.filter((e) => {
    if (e.status === 'rejected' || e.status === 'draft') return false;
    if (branchFilter && e.branch_id !== branchFilter) return false;
    const date = parseISO(e.expense_date || e.created_at);
    return isWithinInterval(date, { start, end });
  });

  let totalExpenses = 0;
  let approvedExpenses = 0;
  let pendingExpenses = 0;
  let paidExpenses = 0;

  const catMap = new Map<string, { name: string; code: string; color: string; amount: number; count: number }>();
  const branchMap = new Map<string, { name: string; amount: number; count: number }>();
  const timelineMap = new Map<string, { amount: number; count: number; label: string }>();

  filteredExpenses.forEach((e) => {
    const amt = e.amount || 0;
    totalExpenses += amt;

    if (e.status === 'approved') approvedExpenses += amt;
    else if (e.status === 'pending_approval') pendingExpenses += amt;
    else if (e.status === 'paid') paidExpenses += amt;

    // Category grouping
    const catId = e.category_id || 'cat-general';
    const catName = e.category?.name || 'General Expense';
    const currCat = catMap.get(catId) || {
      name: catName,
      code: e.category?.code || 'EXP',
      color: e.category?.color || '#3b82f6',
      amount: 0,
      count: 0,
    };
    currCat.amount += amt;
    currCat.count += 1;
    catMap.set(catId, currCat);

    // Branch grouping
    const bId = e.branch_id || 'branch-downtown';
    const bName = e.branch?.name || 'Main Flagship';
    const currBranch = branchMap.get(bId) || { name: bName, amount: 0, count: 0 };
    currBranch.amount += amt;
    currBranch.count += 1;
    branchMap.set(bId, currBranch);

    // Timeline
    const dStr = (e.expense_date || e.created_at).slice(0, 10);
    const currTime = timelineMap.get(dStr) || {
      amount: 0,
      count: 0,
      label: format(parseISO(dStr), 'MMM dd'),
    };
    currTime.amount += amt;
    currTime.count += 1;
    timelineMap.set(dStr, currTime);
  });

  const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
  const dailyAverage = totalExpenses / diffDays;

  const byCategory = Array.from(catMap.entries())
    .map(([categoryId, c]) => ({
      categoryId,
      name: c.name,
      code: c.code,
      color: c.color,
      amount: c.amount,
      count: c.count,
      percentage: totalExpenses > 0 ? (c.amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const byBranch = Array.from(branchMap.entries())
    .map(([branchId, b]) => ({
      branchId,
      branchName: b.name,
      amount: b.amount,
      count: b.count,
      percentage: totalExpenses > 0 ? (b.amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const timeline = Array.from(timelineMap.entries())
    .map(([date, t]) => ({
      date,
      label: t.label,
      amount: t.amount,
      count: t.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    summary: {
      totalExpenses,
      expenseCount: filteredExpenses.length,
      approvedExpenses,
      pendingExpenses,
      paidExpenses,
      dailyAverage,
    },
    byCategory,
    byBranch,
    timeline,
    expensesList: filteredExpenses,
  };
}

// ----------------------------------------------------
// 6. Purchase & Supplier Reports
// ----------------------------------------------------
export async function getPurchaseReportData(
  filters: ReportFilterOptions,
  businessId?: string
): Promise<PurchaseReportData> {
  const data = await fetchRawReportsData(businessId);
  const { start, end } = getDateRangeInterval(filters.datePreset, filters.startDate, filters.endDate);
  const branchFilter = filters.branchId && filters.branchId !== 'all' ? filters.branchId : null;

  const filteredPurchases = data.purchases.filter((p) => {
    if (p.status === 'cancelled' || p.status === 'draft') return false;
    if (branchFilter && p.branch_id !== branchFilter) return false;
    const date = parseISO(p.order_date || p.created_at);
    return isWithinInterval(date, { start, end });
  });

  let totalPurchasesAmount = 0;
  let totalPaidAmount = 0;
  let totalDueAmount = 0;
  let receivedOrdersCount = 0;
  let pendingDeliveriesCount = 0;

  const supplierMap = new Map<
    string,
    {
      name: string;
      contact: string | null;
      ordersCount: number;
      total: number;
      paid: number;
      due: number;
    }
  >();

  const timelineMap = new Map<string, { amount: number; count: number; label: string }>();

  filteredPurchases.forEach((p) => {
    const total = p.grand_total || 0;
    const paid = p.paid_amount || 0;
    const due = p.due_amount || 0;

    totalPurchasesAmount += total;
    totalPaidAmount += paid;
    totalDueAmount += due;

    if (p.status === 'received') receivedOrdersCount += 1;
    else pendingDeliveriesCount += 1;

    // Supplier grouping
    const suppId = p.supplier_id || 'supp-unknown';
    const suppName = p.supplier?.name || 'Direct Supplier';
    const currSupp = supplierMap.get(suppId) || {
      name: suppName,
      contact: p.supplier?.contact_person || null,
      ordersCount: 0,
      total: 0,
      paid: 0,
      due: 0,
    };
    currSupp.ordersCount += 1;
    currSupp.total += total;
    currSupp.paid += paid;
    currSupp.due += due;
    supplierMap.set(suppId, currSupp);

    // Timeline
    const dStr = (p.order_date || p.created_at).slice(0, 10);
    const currTime = timelineMap.get(dStr) || {
      amount: 0,
      count: 0,
      label: format(parseISO(dStr), 'MMM dd'),
    };
    currTime.amount += total;
    currTime.count += 1;
    timelineMap.set(dStr, currTime);
  });

  const bySupplier = Array.from(supplierMap.entries())
    .map(([supplierId, s]) => ({
      supplierId,
      supplierName: s.name,
      contactPerson: s.contact,
      ordersCount: s.ordersCount,
      totalAmount: s.total,
      paidAmount: s.paid,
      dueAmount: s.due,
      sharePercentage: totalPurchasesAmount > 0 ? (s.total / totalPurchasesAmount) * 100 : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const timeline = Array.from(timelineMap.entries())
    .map(([date, t]) => ({
      date,
      label: t.label,
      amount: t.amount,
      ordersCount: t.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    summary: {
      totalOrders: filteredPurchases.length,
      totalPurchasesAmount,
      totalPaidAmount,
      totalDueAmount,
      receivedOrdersCount,
      pendingDeliveriesCount,
    },
    bySupplier,
    timeline,
    purchaseOrders: filteredPurchases,
  };
}

// ----------------------------------------------------
// 7. Customer Analytics & Intelligence
// ----------------------------------------------------
export async function getCustomerReportData(
  filters: ReportFilterOptions,
  businessId?: string
): Promise<CustomerReportData> {
  const data = await fetchRawReportsData(businessId);
  const { start, end } = getDateRangeInterval(filters.datePreset, filters.startDate, filters.endDate);

  const totalCustomers = data.customers.length;
  const newCustomersInPeriod = data.customers.filter((c) => {
    const d = parseISO(c.created_at);
    return isWithinInterval(d, { start, end });
  }).length;

  let totalCustomerSpend = 0;
  let totalReceivablesDue = 0;
  let debtorsCount = 0;

  const topCustomers = data.customers
    .map((c) => {
      const spent = c.total_spent || 0;
      const orders = c.total_orders || 0;
      const bal = c.current_balance || 0;

      totalCustomerSpend += spent;
      if (bal > 0) {
        totalReceivablesDue += bal;
        debtorsCount++;
      }

      return {
        customerId: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        customerType: c.customer_type || 'regular',
        ordersCount: orders,
        totalSpent: spent,
        avgOrderValue: orders > 0 ? spent / orders : 0,
        lastPurchaseDate: c.last_purchase_at || null,
        creditBalance: bal,
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent);

  const activeCustomersCount = topCustomers.filter((c) => c.ordersCount > 0).length;
  const averageCustomerLifetimeValue = totalCustomers > 0 ? totalCustomerSpend / totalCustomers : 0;

  // By customer type
  const typeMap = new Map<string, { count: number; spend: number }>();
  data.customers.forEach((c) => {
    const t = c.customer_type || 'regular';
    const curr = typeMap.get(t) || { count: 0, spend: 0 };
    curr.count += 1;
    curr.spend += c.total_spent || 0;
    typeMap.set(t, curr);
  });

  const typeLabels: Record<string, string> = {
    regular: 'Regular Customer',
    vip: 'VIP / Key Account',
    wholesale: 'Wholesale Buyer',
    business: 'Corporate / B2B',
    walk_in: 'Walk-in / Cash & Carry',
  };

  const byType = Array.from(typeMap.entries()).map(([type, stat]) => ({
    type,
    label: typeLabels[type] || type,
    count: stat.count,
    totalSpent: stat.spend,
    percentage: totalCustomers > 0 ? (stat.count / totalCustomers) * 100 : 0,
  }));

  const receivables = data.customers
    .filter((c) => (c.current_balance || 0) > 0)
    .map((c) => ({
      customerId: c.id,
      name: c.name,
      phone: c.phone,
      creditLimit: c.credit_limit || 0,
      currentBalance: c.current_balance,
      lastPurchaseAt: c.last_purchase_at || null,
    }))
    .sort((a, b) => b.currentBalance - a.currentBalance);

  return {
    summary: {
      totalCustomers,
      activeCustomersCount,
      newCustomersInPeriod,
      totalCustomerSpend,
      averageCustomerLifetimeValue,
      totalReceivablesDue,
      debtorsCount,
    },
    topCustomers,
    byType,
    receivables,
  };
}

// ----------------------------------------------------
// 8. CSV Data Exporter
// ----------------------------------------------------
export function generateReportCsv(
  reportType: 'sales' | 'pnl' | 'inventory' | 'expenses' | 'purchases' | 'customers',
  data:
    | SalesReportData
    | ProfitLossReportData
    | InventoryReportData
    | ExpenseReportData
    | PurchaseReportData
    | CustomerReportData
    | null
    | undefined,
  currency = 'BIF'
): string {
  if (!data) return '';

  const sanitize = (val: string | number | null | undefined) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows: string[][] = [];

  if (reportType === 'sales') {
    const sData = data as SalesReportData;
    rows.push(['BABAS POS & INVENTORY — SALES REPORT']);
    rows.push([`Generated At: ${new Date().toLocaleString()}`, `Currency: ${currency}`]);
    rows.push([]);
    rows.push(['Product Name', 'SKU', 'Category', 'Units Sold', `Revenue (${currency})`, `COGS (${currency})`, `Gross Profit (${currency})`, 'Margin %']);

    const items: SalesByProductData[] = sData.salesByProduct || [];
    items.forEach((p) => {
      rows.push([
        p.productName,
        p.sku,
        p.categoryName,
        p.unitsSold.toString(),
        Math.round(p.revenue).toString(),
        Math.round(p.cogs).toString(),
        Math.round(p.grossProfit).toString(),
        p.marginPercentage.toFixed(1) + '%',
      ]);
    });
  } else if (reportType === 'pnl') {
    const pnl: ProfitLossReportData = data;
    rows.push(['BABAS POS & INVENTORY — PROFIT & LOSS STATEMENT']);
    rows.push([`Period: ${pnl.periodLabel}`, `Currency: ${currency}`]);
    rows.push([]);
    rows.push(['Statement Line Item', `Amount (${currency})`, '% of Net Sales']);
    rows.push(['Gross Sales Revenue', Math.round(pnl.revenue.grossSales).toString(), '']);
    rows.push(['Less: Discounts Granted', `-${Math.round(pnl.revenue.discounts)}`, '']);
    rows.push(['Less: Returns & Refunds', `-${Math.round(pnl.revenue.returnsAndRefunds)}`, '']);
    rows.push(['NET SALES REVENUE', Math.round(pnl.revenue.netSales).toString(), '100.0%']);
    rows.push([]);
    rows.push(['Cost of Goods Sold (COGS)', Math.round(pnl.costOfGoodsSold.totalCOGS).toString(), ((pnl.costOfGoodsSold.totalCOGS / (pnl.revenue.netSales || 1)) * 100).toFixed(1) + '%']);
    rows.push(['GROSS PROFIT', Math.round(pnl.grossProfit).toString(), pnl.grossMarginPercent.toFixed(1) + '%']);
    rows.push([]);
    rows.push(['OPERATING EXPENSES']);
    pnl.operatingExpenses.categoryBreakdown.forEach((cat) => {
      rows.push([`  ${cat.categoryName} (${cat.code})`, Math.round(cat.amount).toString(), cat.percentageOfRevenue.toFixed(1) + '%']);
    });
    rows.push(['Total Operating Expenses', Math.round(pnl.operatingExpenses.totalOperatingExpenses).toString(), ((pnl.operatingExpenses.totalOperatingExpenses / (pnl.revenue.netSales || 1)) * 100).toFixed(1) + '%']);
    rows.push([]);
    rows.push(['NET PROFIT (EBIT)', Math.round(pnl.netOperatingProfit).toString(), pnl.netMarginPercent.toFixed(1) + '%']);
  } else if (reportType === 'inventory') {
    const inv: InventoryReportData = data;
    rows.push(['BABAS POS & INVENTORY — INVENTORY VALUATION REPORT']);
    rows.push([`Generated At: ${new Date().toLocaleString()}`, `Currency: ${currency}`]);
    rows.push([]);
    rows.push(['Category', 'Products Count', 'Stock Units', `Cost Value (${currency})`, `Retail Value (${currency})`, `Potential Profit (${currency})`, 'Margin %']);
    inv.categoryValuations.forEach((c) => {
      rows.push([
        c.categoryName,
        c.productCount.toString(),
        c.totalUnits.toString(),
        Math.round(c.costValue).toString(),
        Math.round(c.retailValue).toString(),
        Math.round(c.potentialProfit).toString(),
        c.marginPercent.toFixed(1) + '%',
      ]);
    });
    rows.push([]);
    rows.push(['LOW STOCK & OUT OF STOCK ALERTS']);
    rows.push(['Product Name', 'SKU', 'Branch', 'Current Qty', 'Min Qty', 'Reorder Point', `Est. Reorder Cost (${currency})`, 'Status']);
    [...inv.outOfStockItems, ...inv.lowStockItems].forEach((item) => {
      rows.push([
        item.productName,
        item.sku,
        item.branchName,
        item.currentStock.toString(),
        item.minStock.toString(),
        item.reorderPoint.toString(),
        Math.round(item.estimatedReorderCost).toString(),
        item.status.toUpperCase(),
      ]);
    });
  } else if (reportType === 'expenses') {
    const exp: ExpenseReportData = data;
    rows.push(['BABAS POS & INVENTORY — EXPENSE REPORT']);
    rows.push([`Generated At: ${new Date().toLocaleString()}`, `Currency: ${currency}`]);
    rows.push([]);
    rows.push(['Expense #', 'Date', 'Category', 'Description', 'Branch', 'Payment Method', `Amount (${currency})`, 'Status']);
    exp.expensesList.forEach((e) => {
      rows.push([
        e.expense_number,
        e.expense_date || e.created_at.slice(0, 10),
        e.category?.name || 'General',
        e.description,
        e.branch?.name || 'Main Branch',
        e.payment_method.toUpperCase(),
        Math.round(e.amount).toString(),
        e.status.toUpperCase(),
      ]);
    });
  } else if (reportType === 'purchases') {
    const pur: PurchaseReportData = data;
    rows.push(['BABAS POS & INVENTORY — PURCHASE REPORT']);
    rows.push([`Generated At: ${new Date().toLocaleString()}`, `Currency: ${currency}`]);
    rows.push([]);
    rows.push(['PO #', 'Date', 'Supplier', 'Branch', 'Status', 'Payment Status', `Total (${currency})`, `Paid (${currency})`, `Due (${currency})`]);
    pur.purchaseOrders.forEach((p) => {
      rows.push([
        p.po_number,
        p.order_date,
        p.supplier?.name || 'Supplier',
        p.branch?.name || 'Main Branch',
        p.status.toUpperCase(),
        p.payment_status.toUpperCase(),
        Math.round(p.grand_total).toString(),
        Math.round(p.paid_amount).toString(),
        Math.round(p.due_amount).toString(),
      ]);
    });
  } else if (reportType === 'customers') {
    const cust: CustomerReportData = data;
    rows.push(['BABAS POS & INVENTORY — CUSTOMER INTELLIGENCE REPORT']);
    rows.push([`Generated At: ${new Date().toLocaleString()}`, `Currency: ${currency}`]);
    rows.push([]);
    rows.push(['Customer Name', 'Type', 'Phone', 'Orders Count', `Total Spent (${currency})`, `Avg Order (${currency})`, `Credit Balance (${currency})`, 'Last Purchase']);
    cust.topCustomers.forEach((c) => {
      rows.push([
        c.name,
        c.customerType.toUpperCase(),
        c.phone || '—',
        c.ordersCount.toString(),
        Math.round(c.totalSpent).toString(),
        Math.round(c.avgOrderValue).toString(),
        Math.round(c.creditBalance).toString(),
        c.lastPurchaseDate ? c.lastPurchaseDate.slice(0, 10) : 'Never',
      ]);
    });
  }

  return rows.map((r) => r.map(sanitize).join(',')).join('\n');
}

export function downloadCsvFile(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
