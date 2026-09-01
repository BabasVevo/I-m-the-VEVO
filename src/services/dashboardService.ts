import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Sale, InventoryItem, SalesTarget, Branch, Product } from '@/types/database';

export interface DashboardStatsResult {
  salesToday: number;
  transactionsToday: number;
  salesThisMonth: number;
  stockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  amountDue: number;
  overdueAmount: number;
}

export interface RecentSalesFilter {
  branchId?: string | null;
  search?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  page?: number;
  pageSize?: number;
}

export interface RecentSalesResponse {
  sales: Sale[];
  totalCount: number;
}

// ----------------------------------------------------
// Demo Fallback Data Generator & Local Storage Store
// ----------------------------------------------------
const DEMO_SALES_KEY = 'verdant_demo_sales_v2';
const DEMO_INVENTORY_KEY = 'verdant_demo_inventory_v3';
const DEMO_TARGETS_KEY = 'verdant_demo_targets_v2';
const DEMO_BRANCHES_KEY = 'verdant_demo_branches_v2';

export const INITIAL_DEMO_BRANCHES: Branch[] = [
  {
    id: 'branch-downtown',
    business_id: 'demo-biz-1',
    name: 'Downtown Flagship',
    address: '14 Kivukoni Front, Dar es Salaam',
    phone: '+255 22 211 4300',
    email: 'downtown@verdant.co.tz',
    manager_id: 'demo-user-1',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'branch-masaki',
    business_id: 'demo-biz-1',
    name: 'Masaki Peninsula Store',
    address: 'Haile Selassie Rd, Masaki',
    phone: '+255 22 260 1250',
    email: 'masaki@verdant.co.tz',
    manager_id: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'branch-arusha',
    business_id: 'demo-biz-1',
    name: 'Arusha Clock Tower Branch',
    address: 'Boma Road, Arusha',
    phone: '+255 27 254 8890',
    email: 'arusha@verdant.co.tz',
    manager_id: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function getInitialDemoInventory(): InventoryItem[] {
  return [
    {
      id: 'inv-1',
      business_id: 'demo-biz-1',
      branch_id: 'branch-downtown',
      product_id: 'prod-1',
      quantity: 3,
      min_quantity: 10,
      reorder_point: 15,
      location_in_store: 'Aisle 2 - Shelf B',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      product: {
        id: 'prod-1',
        business_id: 'demo-biz-1',
        category_id: 'cat-1',
        name: 'Organic Arabica Coffee Beans (1kg)',
        sku: 'COF-ARA-001',
        barcode: '616400018901',
        description: 'Kilimanjaro single-origin whole bean coffee',
        unit: 'kg',
        cost_price: 18000,
        selling_price: 32000,
        min_stock_level: 10,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: {
          id: 'cat-1',
          business_id: 'demo-biz-1',
          name: 'Beverages & Pantry',
          description: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      branch: INITIAL_DEMO_BRANCHES[0],
    },
    {
      id: 'inv-2',
      business_id: 'demo-biz-1',
      branch_id: 'branch-downtown',
      product_id: 'prod-2',
      quantity: 0,
      min_quantity: 8,
      reorder_point: 12,
      location_in_store: 'Aisle 1 - Top Rack',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      product: {
        id: 'prod-2',
        business_id: 'demo-biz-1',
        category_id: 'cat-1',
        name: 'African Spiced Chai Tea (500g)',
        sku: 'TEA-CHAI-002',
        barcode: '616400018902',
        description: 'Zanzibar spiced black tea blend',
        unit: 'box',
        cost_price: 9500,
        selling_price: 18500,
        min_stock_level: 8,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: {
          id: 'cat-1',
          business_id: 'demo-biz-1',
          name: 'Beverages & Pantry',
          description: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      branch: INITIAL_DEMO_BRANCHES[0],
    },
    {
      id: 'inv-3',
      business_id: 'demo-biz-1',
      branch_id: 'branch-masaki',
      product_id: 'prod-3',
      quantity: 4,
      min_quantity: 12,
      reorder_point: 20,
      location_in_store: 'Counter Display 3',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      product: {
        id: 'prod-3',
        business_id: 'demo-biz-1',
        category_id: 'cat-2',
        name: 'Thermal Receipt Paper Roll 80x80mm (Box of 50)',
        sku: 'POS-PPR-080',
        barcode: '616400018903',
        description: 'BPA-free high-density thermal paper rolls',
        unit: 'box',
        cost_price: 45000,
        selling_price: 75000,
        min_stock_level: 12,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: {
          id: 'cat-2',
          business_id: 'demo-biz-1',
          name: 'POS Supplies',
          description: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      branch: INITIAL_DEMO_BRANCHES[1],
    },
    {
      id: 'inv-4',
      business_id: 'demo-biz-1',
      branch_id: 'branch-arusha',
      product_id: 'prod-4',
      quantity: 2,
      min_quantity: 6,
      reorder_point: 10,
      location_in_store: 'Secure Cabinet B',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      product: {
        id: 'prod-4',
        business_id: 'demo-biz-1',
        category_id: 'cat-3',
        name: 'Wireless 2D Barcode Scanner Bluetooth',
        sku: 'HDW-SCN-200',
        barcode: '616400018904',
        description: 'High-speed handheld barcode and QR reader',
        unit: 'pcs',
        cost_price: 120000,
        selling_price: 210000,
        min_stock_level: 6,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: {
          id: 'cat-3',
          business_id: 'demo-biz-1',
          name: 'Hardware & Accessories',
          description: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      branch: INITIAL_DEMO_BRANCHES[2],
    },
    {
      id: 'inv-5',
      business_id: 'demo-biz-1',
      branch_id: 'branch-downtown',
      product_id: 'prod-5',
      quantity: 45,
      min_quantity: 10,
      reorder_point: 20,
      location_in_store: 'Main Shelf 4',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      product: {
        id: 'prod-5',
        business_id: 'demo-biz-1',
        category_id: 'cat-1',
        name: 'Raw Pure Honey (500g Jar)',
        sku: 'HNY-RAW-005',
        barcode: '616400018905',
        description: 'Unfiltered Tabora forest honey',
        unit: 'jar',
        cost_price: 8000,
        selling_price: 15000,
        min_stock_level: 10,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: {
          id: 'cat-1',
          business_id: 'demo-biz-1',
          name: 'Beverages & Pantry',
          description: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      branch: INITIAL_DEMO_BRANCHES[0],
    },
  ];
}

function getInitialDemoSales(): Sale[] {
  const now = new Date();
  const todayStr = now.toISOString();

  // Create date variations (today, yesterday, earlier this month)
  const earlierToday1 = new Date(now.getTime() - 1000 * 60 * 45).toISOString();
  const earlierToday2 = new Date(now.getTime() - 1000 * 60 * 120).toISOString();
  const earlierToday3 = new Date(now.getTime() - 1000 * 60 * 240).toISOString();
  const yesterday = new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString();
  const threeDaysAgo = new Date(now.getTime() - 1000 * 60 * 60 * 72).toISOString();
  const overdueDueDate = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0];
  const futureDueDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0];

  return [
    {
      id: 'sale-1',
      business_id: 'demo-biz-1',
      branch_id: 'branch-downtown',
      cashier_id: 'demo-user-1',
      customer_id: 'cust-1',
      receipt_number: 'REC-2026-0801',
      subtotal: 124000,
      tax_amount: 22320,
      discount_amount: 5000,
      total_amount: 141320,
      paid_amount: 141320,
      due_amount: 0,
      payment_method: 'mobile_money',
      payment_status: 'completed',
      due_date: null,
      notes: 'Customer paid via M-Pesa Till 582190',
      created_at: earlierToday1,
      updated_at: earlierToday1,
      branch: INITIAL_DEMO_BRANCHES[0],
      customer: {
        id: 'cust-1',
        business_id: 'demo-biz-1',
        name: 'Fatma Juma',
        email: 'fatma.juma@gmail.com',
        phone: '+255 754 112 233',
        address: 'Oysterbay, Dar es Salaam',
        credit_limit: 500000,
        current_balance: 0,
        created_at: todayStr,
        updated_at: todayStr,
      },
      cashier: {
        id: 'demo-user-1',
        business_id: 'demo-biz-1',
        branch_id: 'branch-downtown',
        full_name: 'Alex Rivera',
        phone: null,
        role_id: 'demo-role-owner',
        is_active: true,
        created_at: todayStr,
        updated_at: todayStr,
      },
      items: [
        {
          id: 'item-1',
          sale_id: 'sale-1',
          product_id: 'prod-1',
          product_name: 'Organic Arabica Coffee Beans (1kg)',
          sku: 'COF-ARA-001',
          quantity: 3,
          unit_price: 32000,
          cost_price: 18000,
          discount_amount: 0,
          tax_amount: 17280,
          total_price: 96000,
          created_at: earlierToday1,
        },
        {
          id: 'item-2',
          sale_id: 'sale-1',
          product_id: 'prod-5',
          product_name: 'Raw Pure Honey (500g Jar)',
          sku: 'HNY-RAW-005',
          quantity: 2,
          unit_price: 15000,
          cost_price: 8000,
          discount_amount: 0,
          tax_amount: 5400,
          total_price: 30000,
          created_at: earlierToday1,
        },
      ],
    },
    {
      id: 'sale-2',
      business_id: 'demo-biz-1',
      branch_id: 'branch-masaki',
      cashier_id: 'demo-user-1',
      customer_id: 'cust-2',
      receipt_number: 'REC-2026-0802',
      subtotal: 210000,
      tax_amount: 37800,
      discount_amount: 0,
      total_amount: 247800,
      paid_amount: 247800,
      due_amount: 0,
      payment_method: 'card',
      payment_status: 'completed',
      due_date: null,
      notes: 'Visa POS authorization #884102',
      created_at: earlierToday2,
      updated_at: earlierToday2,
      branch: INITIAL_DEMO_BRANCHES[1],
      customer: {
        id: 'cust-2',
        business_id: 'demo-biz-1',
        name: 'Baraka Mkapa',
        email: 'b.mkapa@serengeti.co.tz',
        phone: '+255 784 990 011',
        address: 'Masaki, Dar es Salaam',
        credit_limit: 1000000,
        current_balance: 0,
        created_at: todayStr,
        updated_at: todayStr,
      },
      cashier: {
        id: 'demo-user-1',
        business_id: 'demo-biz-1',
        branch_id: 'branch-downtown',
        full_name: 'Alex Rivera',
        phone: null,
        role_id: 'demo-role-owner',
        is_active: true,
        created_at: todayStr,
        updated_at: todayStr,
      },
      items: [
        {
          id: 'item-3',
          sale_id: 'sale-2',
          product_id: 'prod-4',
          product_name: 'Wireless 2D Barcode Scanner Bluetooth',
          sku: 'HDW-SCN-200',
          quantity: 1,
          unit_price: 210000,
          cost_price: 120000,
          discount_amount: 0,
          tax_amount: 37800,
          total_price: 210000,
          created_at: earlierToday2,
        },
      ],
    },
    {
      id: 'sale-3',
      business_id: 'demo-biz-1',
      branch_id: 'branch-downtown',
      cashier_id: 'demo-user-1',
      customer_id: 'cust-3',
      receipt_number: 'REC-2026-0803',
      subtotal: 450000,
      tax_amount: 81000,
      discount_amount: 15000,
      total_amount: 516000,
      paid_amount: 200000,
      due_amount: 316000,
      payment_method: 'credit',
      payment_status: 'partial',
      due_date: overdueDueDate,
      notes: 'Initial deposit of 200k paid. Balance due on Aug 23 (Overdue).',
      created_at: earlierToday3,
      updated_at: earlierToday3,
      branch: INITIAL_DEMO_BRANCHES[0],
      customer: {
        id: 'cust-3',
        business_id: 'demo-biz-1',
        name: 'Kibo Hospitality Ltd',
        email: 'procurement@kibohotel.com',
        phone: '+255 767 444 888',
        address: 'City Center, Dar es Salaam',
        credit_limit: 2000000,
        current_balance: 316000,
        created_at: todayStr,
        updated_at: todayStr,
      },
      cashier: {
        id: 'demo-user-1',
        business_id: 'demo-biz-1',
        branch_id: 'branch-downtown',
        full_name: 'Alex Rivera',
        phone: null,
        role_id: 'demo-role-owner',
        is_active: true,
        created_at: todayStr,
        updated_at: todayStr,
      },
      items: [
        {
          id: 'item-4',
          sale_id: 'sale-3',
          product_id: 'prod-3',
          product_name: 'Thermal Receipt Paper Roll 80x80mm (Box of 50)',
          sku: 'POS-PPR-080',
          quantity: 6,
          unit_price: 75000,
          cost_price: 45000,
          discount_amount: 15000,
          tax_amount: 81000,
          total_price: 450000,
          created_at: earlierToday3,
        },
      ],
    },
    {
      id: 'sale-4',
      business_id: 'demo-biz-1',
      branch_id: 'branch-arusha',
      cashier_id: 'demo-user-1',
      customer_id: null,
      receipt_number: 'REC-2026-0804',
      subtotal: 64000,
      tax_amount: 11520,
      discount_amount: 0,
      total_amount: 75520,
      paid_amount: 75520,
      due_amount: 0,
      payment_method: 'cash',
      payment_status: 'completed',
      due_date: null,
      notes: 'Walk-in cash counter sale',
      created_at: yesterday,
      updated_at: yesterday,
      branch: INITIAL_DEMO_BRANCHES[2],
      customer: null,
      cashier: {
        id: 'demo-user-1',
        business_id: 'demo-biz-1',
        branch_id: 'branch-downtown',
        full_name: 'Alex Rivera',
        phone: null,
        role_id: 'demo-role-owner',
        is_active: true,
        created_at: todayStr,
        updated_at: todayStr,
      },
      items: [
        {
          id: 'item-5',
          sale_id: 'sale-4',
          product_id: 'prod-1',
          product_name: 'Organic Arabica Coffee Beans (1kg)',
          sku: 'COF-ARA-001',
          quantity: 2,
          unit_price: 32000,
          cost_price: 18000,
          discount_amount: 0,
          tax_amount: 11520,
          total_price: 64000,
          created_at: yesterday,
        },
      ],
    },
    {
      id: 'sale-5',
      business_id: 'demo-biz-1',
      branch_id: 'branch-downtown',
      cashier_id: 'demo-user-1',
      customer_id: 'cust-4',
      receipt_number: 'REC-2026-0805',
      subtotal: 350000,
      tax_amount: 63000,
      discount_amount: 0,
      total_amount: 413000,
      paid_amount: 0,
      due_amount: 413000,
      payment_method: 'credit',
      payment_status: 'pending',
      due_date: futureDueDate,
      notes: 'Net 14 corporate terms invoice',
      created_at: threeDaysAgo,
      updated_at: threeDaysAgo,
      branch: INITIAL_DEMO_BRANCHES[0],
      customer: {
        id: 'cust-4',
        business_id: 'demo-biz-1',
        name: 'Victoria Logistics & Cargo',
        email: 'accounts@victoriacargo.co.tz',
        phone: '+255 713 555 666',
        address: 'Harbor Gate 4, Dar es Salaam',
        credit_limit: 3000000,
        current_balance: 413000,
        created_at: todayStr,
        updated_at: todayStr,
      },
      cashier: {
        id: 'demo-user-1',
        business_id: 'demo-biz-1',
        branch_id: 'branch-downtown',
        full_name: 'Alex Rivera',
        phone: null,
        role_id: 'demo-role-owner',
        is_active: true,
        created_at: todayStr,
        updated_at: todayStr,
      },
      items: [
        {
          id: 'item-6',
          sale_id: 'sale-5',
          product_id: 'prod-4',
          product_name: 'Wireless 2D Barcode Scanner Bluetooth',
          sku: 'HDW-SCN-200',
          quantity: 1,
          unit_price: 210000,
          cost_price: 120000,
          discount_amount: 0,
          tax_amount: 37800,
          total_price: 210000,
          created_at: threeDaysAgo,
        },
      ],
    },
  ];
}

function getStoredSales(): Sale[] {
  const raw = localStorage.getItem(DEMO_SALES_KEY);
  if (!raw) {
    const initial = getInitialDemoSales();
    localStorage.setItem(DEMO_SALES_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return getInitialDemoSales();
  }
}

function getStoredInventory(): InventoryItem[] {
  const raw = localStorage.getItem(DEMO_INVENTORY_KEY);
  let items: InventoryItem[] = [];
  if (!raw) {
    items = getInitialDemoInventory();
    localStorage.setItem(DEMO_INVENTORY_KEY, JSON.stringify(items));
  } else {
    try {
      items = JSON.parse(raw);
    } catch {
      items = getInitialDemoInventory();
    }
  }

  // Ensure products are attached if missing
  const rawProds = localStorage.getItem('verdant_demo_products_v3');
  if (rawProds) {
    try {
      const prods: Product[] = JSON.parse(rawProds);
      return items.map((item) => {
        if (!item.product) {
          const found = prods.find((p) => p.id === item.product_id);
          return { ...item, product: found || null };
        }
        return item;
      });
    } catch {
      // ignore
    }
  }

  return items;
}

// ----------------------------------------------------
// Public API Methods (Supabase + Local fallback)
// ----------------------------------------------------

export async function fetchBranches(businessId: string): Promise<Branch[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('name');
    if (!error && data && data.length > 0) return data as Branch[];
  }

  const raw = localStorage.getItem(DEMO_BRANCHES_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return INITIAL_DEMO_BRANCHES;
}

export async function fetchDashboardStats(
  businessId: string,
  branchId: string | null
): Promise<DashboardStatsResult> {
  if (isSupabaseConfigured) {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const todayISO = todayStart.toISOString();
      const monthISO = monthStart.toISOString();
      const nowYMD = new Date().toISOString().split('T')[0];

      // 1. Sales query
      let salesQuery = supabase
        .from('sales')
        .select('total_amount, due_amount, payment_status, due_date, created_at')
        .eq('business_id', businessId)
        .neq('payment_status', 'cancelled');

      if (branchId) {
        salesQuery = salesQuery.eq('branch_id', branchId);
      }

      const { data: salesData } = await salesQuery;
      const sales = salesData || [];

      let salesToday = 0;
      let transactionsToday = 0;
      let salesThisMonth = 0;
      let amountDue = 0;
      let overdueAmount = 0;

      for (const s of sales) {
        const createdAt = s.created_at;
        const total = Number(s.total_amount) || 0;
        const due = Number(s.due_amount) || 0;

        if (createdAt >= todayISO) {
          salesToday += total;
          transactionsToday += 1;
        }

        if (createdAt >= monthISO) {
          salesThisMonth += total;
        }

        if (due > 0 && s.payment_status !== 'refunded') {
          amountDue += due;
          if (s.due_date && s.due_date < nowYMD) {
            overdueAmount += due;
          }
        }
      }

      // 2. Inventory Query
      let invQuery = supabase
        .from('inventory')
        .select('quantity, min_quantity, product:products(cost_price, selling_price)')
        .eq('business_id', businessId);

      if (branchId) {
        invQuery = invQuery.eq('branch_id', branchId);
      }

      const { data: invData } = await invQuery;
      const invList = invData || [];

      let stockValue = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;

      for (const item of invList) {
        const qty = Number(item.quantity) || 0;
        const minQty = Number(item.min_quantity) || 5;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cost = Number((item.product as any)?.cost_price) || 0;

        stockValue += qty * cost;

        if (qty === 0) {
          outOfStockCount += 1;
        } else if (qty <= minQty) {
          lowStockCount += 1;
        }
      }

      return {
        salesToday,
        transactionsToday,
        salesThisMonth,
        stockValue,
        lowStockCount,
        outOfStockCount,
        amountDue,
        overdueAmount,
      };
    } catch (err) {
      console.warn('Supabase dashboard stats failed, using fallback:', err);
    }
  }

  // Demo Fallback
  const sales = getStoredSales().filter(
    (s) => !branchId || s.branch_id === branchId
  );
  const inventory = getStoredInventory().filter(
    (item) => !branchId || item.branch_id === branchId
  );

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const todayYMD = now.toISOString().split('T')[0];

  let salesToday = 0;
  let transactionsToday = 0;
  let salesThisMonth = 0;
  let amountDue = 0;
  let overdueAmount = 0;

  for (const s of sales) {
    if (s.payment_status === 'cancelled') continue;
    const saleTime = new Date(s.created_at).getTime();

    if (saleTime >= todayStart) {
      salesToday += s.total_amount;
      transactionsToday += 1;
    }

    if (saleTime >= monthStart) {
      salesThisMonth += s.total_amount;
    }

    if (s.due_amount > 0 && s.payment_status !== 'refunded') {
      amountDue += s.due_amount;
      if (s.due_date && s.due_date < todayYMD) {
        overdueAmount += s.due_amount;
      }
    }
  }

  let stockValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const item of inventory) {
    const qty = Number(item.quantity) || 0;
    const minQty = Number(item.min_quantity) || 5;
    const cost = Number(item.product?.cost_price) || 0;

    stockValue += qty * cost;

    if (qty <= 0) {
      outOfStockCount += 1;
    } else if (qty <= minQty) {
      lowStockCount += 1;
    }
  }

  return {
    salesToday,
    transactionsToday,
    salesThisMonth,
    stockValue,
    lowStockCount,
    outOfStockCount,
    amountDue,
    overdueAmount,
  };
}

export async function fetchRecentSales(
  businessId: string,
  filter: RecentSalesFilter = {}
): Promise<RecentSalesResponse> {
  const { branchId, search, paymentStatus, paymentMethod, page = 1, pageSize = 8 } = filter;

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('sales')
        .select('*, branch:branches(*), customer:customers(*), cashier:profiles(*), items:sale_items(*)', {
          count: 'exact',
        })
        .eq('business_id', businessId);

      if (branchId) query = query.eq('branch_id', branchId);
      if (paymentStatus && paymentStatus !== 'all') query = query.eq('payment_status', paymentStatus);
      if (paymentMethod && paymentMethod !== 'all') query = query.eq('payment_method', paymentMethod);
      if (search && search.trim()) {
        query = query.or(
          `receipt_number.ilike.%${search.trim()}%,notes.ilike.%${search.trim()}%`
        );
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!error && data) {
        return {
          sales: data as Sale[],
          totalCount: count || data.length,
        };
      }
    } catch (err) {
      console.warn('Supabase fetchRecentSales failed, using demo fallback:', err);
    }
  }

  // Demo Fallback
  let allSales = getStoredSales();

  if (branchId) {
    allSales = allSales.filter((s) => s.branch_id === branchId);
  }
  if (paymentStatus && paymentStatus !== 'all') {
    allSales = allSales.filter((s) => s.payment_status === paymentStatus);
  }
  if (paymentMethod && paymentMethod !== 'all') {
    allSales = allSales.filter((s) => s.payment_method === paymentMethod);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    allSales = allSales.filter(
      (s) =>
        s.receipt_number.toLowerCase().includes(q) ||
        (s.customer?.name && s.customer.name.toLowerCase().includes(q)) ||
        (s.cashier?.full_name && s.cashier.full_name.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q))
    );
  }

  // Sort descending
  allSales.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const totalCount = allSales.length;
  const from = (page - 1) * pageSize;
  const paginated = allSales.slice(from, from + pageSize);

  return {
    sales: paginated,
    totalCount,
  };
}

export async function fetchLowStockItems(
  businessId: string,
  branchId: string | null
): Promise<InventoryItem[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('inventory')
        .select('*, product:products(*, category:categories(*)), branch:branches(*)')
        .eq('business_id', businessId);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (!error && data) {
        const filtered = (data as InventoryItem[]).filter(
          (item) => item.quantity <= (item.min_quantity || 5)
        );
        return filtered.sort((a, b) => a.quantity - b.quantity);
      }
    } catch (err) {
      console.warn('Supabase fetchLowStockItems failed, using fallback:', err);
    }
  }

  // Demo Fallback
  const allInventory = getStoredInventory();
  const filtered = allInventory.filter((item) => {
    if (branchId && item.branch_id !== branchId) return false;
    return item.quantity <= (item.min_quantity || 5);
  });

  return filtered.sort((a, b) => a.quantity - b.quantity);
}

export async function fetchTodaySalesTarget(
  businessId: string,
  branchId: string | null
): Promise<SalesTarget> {
  const todayYMD = new Date().toISOString().split('T')[0];

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('sales_targets')
        .select('*')
        .eq('business_id', businessId)
        .eq('target_date', todayYMD);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      } else {
        query = query.is('branch_id', null);
      }

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        return data as SalesTarget;
      }
    } catch (err) {
      console.warn('Supabase fetchTodaySalesTarget failed:', err);
    }
  }

  // Demo Fallback
  const raw = localStorage.getItem(DEMO_TARGETS_KEY);
  let targets: Record<string, number> = {
    'all': 1500000,
    'branch-downtown': 900000,
    'branch-masaki': 400000,
    'branch-arusha': 200000,
  };
  if (raw) {
    try {
      targets = { ...targets, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
  }

  const key = branchId || 'all';
  const amount = targets[key] ?? 1500000;

  return {
    id: `target-${key}-${todayYMD}`,
    business_id: businessId,
    branch_id: branchId,
    target_date: todayYMD,
    target_amount: amount,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function updateTodaySalesTarget(
  businessId: string,
  branchId: string | null,
  amount: number,
  notes?: string
): Promise<SalesTarget> {
  const todayYMD = new Date().toISOString().split('T')[0];

  if (isSupabaseConfigured) {
    try {
      const payload = {
        business_id: businessId,
        branch_id: branchId,
        target_date: todayYMD,
        target_amount: amount,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('sales_targets')
        .upsert(payload, {
          onConflict: 'business_id,branch_id,target_date',
        })
        .select()
        .single();

      if (!error && data) {
        return data as SalesTarget;
      }
    } catch (err) {
      console.warn('Supabase updateTodaySalesTarget failed, updating local demo:', err);
    }
  }

  // Demo Fallback
  const key = branchId || 'all';
  const raw = localStorage.getItem(DEMO_TARGETS_KEY);
  let targets: Record<string, number> = {
    'all': 1500000,
    'branch-downtown': 900000,
    'branch-masaki': 400000,
    'branch-arusha': 200000,
  };
  if (raw) {
    try {
      targets = { ...targets, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
  }
  targets[key] = amount;
  localStorage.setItem(DEMO_TARGETS_KEY, JSON.stringify(targets));

  return {
    id: `target-${key}-${todayYMD}`,
    business_id: businessId,
    branch_id: branchId,
    target_date: todayYMD,
    target_amount: amount,
    notes: notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
