import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Product, InventoryItem, StockMovement } from '@/types/database';
import { INITIAL_DEMO_CATEGORIES } from './categoryService';

export const DEMO_PRODUCTS_KEY = 'verdant_demo_products_v3';
export const DEMO_INVENTORY_KEY = 'verdant_demo_inventory_v3';
export const DEMO_MOVEMENTS_KEY = 'verdant_demo_stock_movements_v3';

export const INITIAL_DEMO_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    business_id: 'demo-biz-1',
    category_id: 'cat-1',
    name: 'Organic Arabica Coffee Beans (1kg)',
    sku: 'COF-ARA-001',
    barcode: '616400018901',
    brand: 'Kilimanjaro Estate',
    description: 'Single-origin washed medium roast coffee beans from Mount Kilimanjaro volcanic soil.',
    unit: 'kg',
    cost_price: 18000,
    selling_price: 32000,
    min_stock_level: 10,
    image_url: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=400&q=80',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'prod-2',
    business_id: 'demo-biz-1',
    category_id: 'cat-1',
    name: 'African Spiced Chai Tea (500g)',
    sku: 'TEA-CHAI-002',
    barcode: '616400018902',
    brand: 'Zanzibar Spice Co.',
    description: 'Aromatic loose leaf black tea blended with cardamom, cinnamon, clove, and ginger.',
    unit: 'box',
    cost_price: 9500,
    selling_price: 18500,
    min_stock_level: 8,
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
    is_active: true,
    created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'prod-3',
    business_id: 'demo-biz-1',
    category_id: 'cat-2',
    name: 'Thermal Receipt Paper Roll 80x80mm (Box of 50)',
    sku: 'POS-PPR-080',
    barcode: '616400018903',
    brand: 'Verdant POS',
    description: 'Premium BPA-free crisp black print thermal rolls compatible with standard 80mm printers.',
    unit: 'box',
    cost_price: 45000,
    selling_price: 75000,
    min_stock_level: 12,
    image_url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=400&q=80',
    is_active: true,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'prod-4',
    business_id: 'demo-biz-1',
    category_id: 'cat-3',
    name: 'Wireless 2D Barcode Scanner Bluetooth',
    sku: 'HDW-SCN-200',
    barcode: '616400018904',
    brand: 'ScanMaster Pro',
    description: 'High-precision QR and 1D/2D barcode reader with charging cradle and 100m wireless range.',
    unit: 'pcs',
    cost_price: 120000,
    selling_price: 210000,
    min_stock_level: 6,
    image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80',
    is_active: true,
    created_at: new Date(Date.now() - 22 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'prod-5',
    business_id: 'demo-biz-1',
    category_id: 'cat-1',
    name: 'Raw Pure Honey (500g Jar)',
    sku: 'HNY-RAW-005',
    barcode: '616400018905',
    brand: 'Miombo Wild',
    description: 'Cold-extracted unpasteurized organic wildflower honey from Tabora nature reserve.',
    unit: 'jar',
    cost_price: 8000,
    selling_price: 15000,
    min_stock_level: 10,
    image_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80',
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'prod-6',
    business_id: 'demo-biz-1',
    category_id: 'cat-4',
    name: 'Artisan Sourdough Loaf (800g)',
    sku: 'BAK-SRD-006',
    barcode: '616400018906',
    brand: 'Verdant Bakery',
    description: 'Slow-fermented 36hr sourdough with crispy golden crust and open airy crumb.',
    unit: 'pcs',
    cost_price: 3500,
    selling_price: 7000,
    min_stock_level: 15,
    image_url: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=400&q=80',
    is_active: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'prod-7',
    business_id: 'demo-biz-1',
    category_id: 'cat-4',
    name: 'Butter Croissant (Pack of 4)',
    sku: 'BAK-CRS-007',
    barcode: '616400018907',
    brand: 'Verdant Bakery',
    description: 'French laminated pastry made with 100% Normandy cultured butter.',
    unit: 'pack',
    cost_price: 6000,
    selling_price: 12000,
    min_stock_level: 10,
    image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
    is_active: true,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'prod-8',
    business_id: 'demo-biz-1',
    category_id: 'cat-3',
    name: 'Heavy Duty Cash Drawer 410mm',
    sku: 'HDW-DRW-300',
    barcode: '616400018908',
    brand: 'SafePoint POS',
    description: 'Reinforced steel cash drawer with RJ12 printer trigger connection and 5 bill / 8 coin slots.',
    unit: 'pcs',
    cost_price: 85000,
    selling_price: 145000,
    min_stock_level: 4,
    image_url: 'https://images.unsplash.com/photo-1556742049-0a67e557224f?auto=format&fit=crop&w=400&q=80',
    is_active: true,
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'prod-9',
    business_id: 'demo-biz-1',
    category_id: 'cat-5',
    name: 'Kraft Eco Shopping Bag Medium (Bundle 100)',
    sku: 'PKG-BAG-009',
    barcode: '616400018909',
    brand: 'EcoWrap',
    description: 'Durable 120gsm recycled brown kraft paper bags with twisted handles.',
    unit: 'bundle',
    cost_price: 22000,
    selling_price: 38000,
    min_stock_level: 8,
    image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80',
    is_active: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'prod-10',
    business_id: 'demo-biz-1',
    category_id: 'cat-1',
    name: 'Dark Chocolate Madagascar 70% (100g)',
    sku: 'CHO-MAD-010',
    barcode: '616400018910',
    brand: 'Sambirano Bean',
    description: 'Bean-to-bar single origin craft dark chocolate with notes of citrus and red berries.',
    unit: 'bar',
    cost_price: 4200,
    selling_price: 8500,
    min_stock_level: 20,
    image_url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80',
    is_active: true,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export function getInitialDemoInventoryList(): InventoryItem[] {
  return [
    // prod-1 (Coffee)
    { id: 'inv-1-1', business_id: 'demo-biz-1', branch_id: 'branch-downtown', product_id: 'prod-1', quantity: 3, min_quantity: 10, reorder_point: 15, location_in_store: 'Aisle 2 - Shelf B', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-1-2', business_id: 'demo-biz-1', branch_id: 'branch-masaki', product_id: 'prod-1', quantity: 18, min_quantity: 10, reorder_point: 15, location_in_store: 'Display Rack 1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-1-3', business_id: 'demo-biz-1', branch_id: 'branch-arusha', product_id: 'prod-1', quantity: 24, min_quantity: 10, reorder_point: 15, location_in_store: 'Storage Bay 3', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

    // prod-2 (Chai Tea) - Low / Out
    { id: 'inv-2-1', business_id: 'demo-biz-1', branch_id: 'branch-downtown', product_id: 'prod-2', quantity: 0, min_quantity: 8, reorder_point: 12, location_in_store: 'Aisle 1 - Top Rack', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-2-2', business_id: 'demo-biz-1', branch_id: 'branch-masaki', product_id: 'prod-2', quantity: 2, min_quantity: 8, reorder_point: 12, location_in_store: 'Shelf A', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-2-3', business_id: 'demo-biz-1', branch_id: 'branch-arusha', product_id: 'prod-2', quantity: 14, min_quantity: 8, reorder_point: 12, location_in_store: 'Pantry Section', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

    // prod-3 (Receipt Paper)
    { id: 'inv-3-1', business_id: 'demo-biz-1', branch_id: 'branch-downtown', product_id: 'prod-3', quantity: 16, min_quantity: 12, reorder_point: 20, location_in_store: 'Counter Storage', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-3-2', business_id: 'demo-biz-1', branch_id: 'branch-masaki', product_id: 'prod-3', quantity: 4, min_quantity: 12, reorder_point: 20, location_in_store: 'Counter Display 3', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-3-3', business_id: 'demo-biz-1', branch_id: 'branch-arusha', product_id: 'prod-3', quantity: 8, min_quantity: 12, reorder_point: 20, location_in_store: 'Backroom Shelf 4', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

    // prod-4 (Scanner)
    { id: 'inv-4-1', business_id: 'demo-biz-1', branch_id: 'branch-downtown', product_id: 'prod-4', quantity: 8, min_quantity: 6, reorder_point: 10, location_in_store: 'Tech Cabinet A', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-4-2', business_id: 'demo-biz-1', branch_id: 'branch-masaki', product_id: 'prod-4', quantity: 5, min_quantity: 6, reorder_point: 10, location_in_store: 'Tech Shelf', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-4-3', business_id: 'demo-biz-1', branch_id: 'branch-arusha', product_id: 'prod-4', quantity: 2, min_quantity: 6, reorder_point: 10, location_in_store: 'Secure Cabinet B', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

    // prod-5 (Honey)
    { id: 'inv-5-1', business_id: 'demo-biz-1', branch_id: 'branch-downtown', product_id: 'prod-5', quantity: 45, min_quantity: 10, reorder_point: 20, location_in_store: 'Main Shelf 4', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-5-2', business_id: 'demo-biz-1', branch_id: 'branch-masaki', product_id: 'prod-5', quantity: 30, min_quantity: 10, reorder_point: 20, location_in_store: 'Main Shelf 2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-5-3', business_id: 'demo-biz-1', branch_id: 'branch-arusha', product_id: 'prod-5', quantity: 12, min_quantity: 10, reorder_point: 20, location_in_store: 'Honey Stand', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

    // prod-6 (Sourdough)
    { id: 'inv-6-1', business_id: 'demo-biz-1', branch_id: 'branch-downtown', product_id: 'prod-6', quantity: 25, min_quantity: 15, reorder_point: 30, location_in_store: 'Bakery Counter', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-6-2', business_id: 'demo-biz-1', branch_id: 'branch-masaki', product_id: 'prod-6', quantity: 18, min_quantity: 15, reorder_point: 25, location_in_store: 'Bakery Stand', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-6-3', business_id: 'demo-biz-1', branch_id: 'branch-arusha', product_id: 'prod-6', quantity: 0, min_quantity: 15, reorder_point: 20, location_in_store: 'Bakery Case', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

    // prod-7 (Croissants)
    { id: 'inv-7-1', business_id: 'demo-biz-1', branch_id: 'branch-downtown', product_id: 'prod-7', quantity: 12, min_quantity: 10, reorder_point: 20, location_in_store: 'Pastry Case 1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-7-2', business_id: 'demo-biz-1', branch_id: 'branch-masaki', product_id: 'prod-7', quantity: 7, min_quantity: 10, reorder_point: 15, location_in_store: 'Pastry Case 2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-7-3', business_id: 'demo-biz-1', branch_id: 'branch-arusha', product_id: 'prod-7', quantity: 9, min_quantity: 10, reorder_point: 15, location_in_store: 'Pastry Case 1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

    // prod-8 (Cash Drawer)
    { id: 'inv-8-1', business_id: 'demo-biz-1', branch_id: 'branch-downtown', product_id: 'prod-8', quantity: 6, min_quantity: 4, reorder_point: 8, location_in_store: 'Hardware Bay 1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-8-2', business_id: 'demo-biz-1', branch_id: 'branch-masaki', product_id: 'prod-8', quantity: 3, min_quantity: 4, reorder_point: 6, location_in_store: 'Hardware Bay 2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-8-3', business_id: 'demo-biz-1', branch_id: 'branch-arusha', product_id: 'prod-8', quantity: 4, min_quantity: 4, reorder_point: 6, location_in_store: 'Hardware Bay 1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

    // prod-9 (Kraft Bags)
    { id: 'inv-9-1', business_id: 'demo-biz-1', branch_id: 'branch-downtown', product_id: 'prod-9', quantity: 15, min_quantity: 8, reorder_point: 20, location_in_store: 'Under Counter', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-9-2', business_id: 'demo-biz-1', branch_id: 'branch-masaki', product_id: 'prod-9', quantity: 22, min_quantity: 8, reorder_point: 20, location_in_store: 'Storage Room B', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-9-3', business_id: 'demo-biz-1', branch_id: 'branch-arusha', product_id: 'prod-9', quantity: 5, min_quantity: 8, reorder_point: 15, location_in_store: 'Packing Station', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

    // prod-10 (Dark Chocolate)
    { id: 'inv-10-1', business_id: 'demo-biz-1', branch_id: 'branch-downtown', product_id: 'prod-10', quantity: 50, min_quantity: 20, reorder_point: 40, location_in_store: 'Checkout Impulse Rack', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-10-2', business_id: 'demo-biz-1', branch_id: 'branch-masaki', product_id: 'prod-10', quantity: 42, min_quantity: 20, reorder_point: 35, location_in_store: 'Checkout Impulse Rack', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv-10-3', business_id: 'demo-biz-1', branch_id: 'branch-arusha', product_id: 'prod-10', quantity: 18, min_quantity: 20, reorder_point: 30, location_in_store: 'Candy Display', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];
}

export function getInitialDemoStockMovements(): StockMovement[] {
  const now = Date.now();
  return [
    {
      id: 'mov-1',
      business_id: 'demo-biz-1',
      branch_id: 'branch-downtown',
      product_id: 'prod-1',
      movement_type: 'sale',
      quantity: -3,
      previous_stock: 6,
      new_stock: 3,
      reason: 'POS Sale REC-2026-0801',
      reference_id: 'REC-2026-0801',
      created_by: 'demo-user-1',
      created_at: new Date(now - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'mov-2',
      business_id: 'demo-biz-1',
      branch_id: 'branch-masaki',
      product_id: 'prod-4',
      movement_type: 'sale',
      quantity: -1,
      previous_stock: 6,
      new_stock: 5,
      reason: 'POS Sale REC-2026-0802',
      reference_id: 'REC-2026-0802',
      created_by: 'demo-user-1',
      created_at: new Date(now - 1000 * 60 * 120).toISOString(),
    },
    {
      id: 'mov-3',
      business_id: 'demo-biz-1',
      branch_id: 'branch-downtown',
      product_id: 'prod-3',
      movement_type: 'sale',
      quantity: -6,
      previous_stock: 22,
      new_stock: 16,
      reason: 'POS Sale REC-2026-0803',
      reference_id: 'REC-2026-0803',
      created_by: 'demo-user-1',
      created_at: new Date(now - 1000 * 60 * 240).toISOString(),
    },
    {
      id: 'mov-4',
      business_id: 'demo-biz-1',
      branch_id: 'branch-downtown',
      product_id: 'prod-2',
      movement_type: 'damaged',
      quantity: -4,
      previous_stock: 4,
      new_stock: 0,
      reason: 'Water damage during roof inspection - discarded',
      reference_id: 'ADJ-DMG-0824',
      created_by: 'demo-user-1',
      created_at: new Date(now - 1000 * 60 * 60 * 18).toISOString(),
    },
    {
      id: 'mov-5',
      business_id: 'demo-biz-1',
      branch_id: 'branch-downtown',
      product_id: 'prod-5',
      movement_type: 'purchase',
      quantity: 50,
      previous_stock: 0,
      new_stock: 50,
      reason: 'Supplier Batch Delivery PO #TB-4890',
      reference_id: 'PO-TB-4890',
      created_by: 'demo-user-1',
      created_at: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
    },
    {
      id: 'mov-6',
      business_id: 'demo-biz-1',
      branch_id: 'branch-arusha',
      product_id: 'prod-1',
      movement_type: 'initial_stock',
      quantity: 24,
      previous_stock: 0,
      new_stock: 24,
      reason: 'Initial branch stock assignment',
      reference_id: null,
      created_by: 'demo-user-1',
      created_at: new Date(now - 1000 * 60 * 60 * 72).toISOString(),
    },
  ];
}

export function getStoredProducts(): Product[] {
  const raw = localStorage.getItem(DEMO_PRODUCTS_KEY);
  if (!raw) {
    localStorage.setItem(DEMO_PRODUCTS_KEY, JSON.stringify(INITIAL_DEMO_PRODUCTS));
    return INITIAL_DEMO_PRODUCTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_PRODUCTS;
  }
}

export function saveStoredProducts(products: Product[]) {
  localStorage.setItem(DEMO_PRODUCTS_KEY, JSON.stringify(products));
}

export function getStoredInventory(): InventoryItem[] {
  const raw = localStorage.getItem(DEMO_INVENTORY_KEY);
  if (!raw) {
    const list = getInitialDemoInventoryList();
    localStorage.setItem(DEMO_INVENTORY_KEY, JSON.stringify(list));
    return list;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return getInitialDemoInventoryList();
  }
}

export function saveStoredInventory(items: InventoryItem[]) {
  localStorage.setItem(DEMO_INVENTORY_KEY, JSON.stringify(items));
}

export function getStoredMovements(): StockMovement[] {
  const raw = localStorage.getItem(DEMO_MOVEMENTS_KEY);
  if (!raw) {
    const list = getInitialDemoStockMovements();
    localStorage.setItem(DEMO_MOVEMENTS_KEY, JSON.stringify(list));
    return list;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return getInitialDemoStockMovements();
  }
}

export function saveStoredMovements(movements: StockMovement[]) {
  localStorage.setItem(DEMO_MOVEMENTS_KEY, JSON.stringify(movements));
}

// ----------------------------------------------------
// Public API Methods
// ----------------------------------------------------

export interface FetchProductsFilter {
  branchId?: string | null;
  categoryId?: string;
  search?: string;
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  pageSize?: number;
}

export async function fetchProducts(
  businessId: string,
  filter: FetchProductsFilter = {}
): Promise<{ products: Product[]; totalCount: number }> {
  const {
    branchId,
    categoryId,
    search,
    stockStatus = 'all',
    status = 'all',
    page = 1,
    pageSize = 10,
  } = filter;

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('products')
        .select('*, category:categories(*), inventory:inventory(*, branch:branches(*))')
        .eq('business_id', businessId);

      if (categoryId && categoryId !== 'all') {
        query = query.eq('category_id', categoryId);
      }
      if (status === 'active') {
        query = query.eq('is_active', true);
      } else if (status === 'inactive') {
        query = query.eq('is_active', false);
      }

      if (search && search.trim()) {
        const q = search.trim();
        query = query.or(
          `name.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%,brand.ilike.%${q}%`
        );
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && data) {
        const typedData = data as unknown as Product[];
        let list: Product[] = typedData.map((p) => {
          const invList: InventoryItem[] = p.inventory || [];
          let currentStock = 0;
          if (branchId) {
            const branchInv = invList.find((i) => i.branch_id === branchId);
            currentStock = branchInv ? Number(branchInv.quantity) || 0 : 0;
          } else {
            currentStock = invList.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
          }

          return {
            ...p,
            total_stock: currentStock,
            inventory: invList,
          };
        });

        // Apply stockStatus filter in memory
        if (stockStatus === 'out_of_stock') {
          list = list.filter((p) => (p.total_stock ?? 0) <= 0);
        } else if (stockStatus === 'low_stock') {
          list = list.filter(
            (p) => (p.total_stock ?? 0) > 0 && (p.total_stock ?? 0) <= p.min_stock_level
          );
        } else if (stockStatus === 'in_stock') {
          list = list.filter((p) => (p.total_stock ?? 0) > p.min_stock_level);
        }

        const totalCount = list.length;
        const from = (page - 1) * pageSize;
        const paginated = list.slice(from, from + pageSize);

        return { products: paginated, totalCount };
      }
    } catch (err) {
      console.warn('Supabase fetchProducts failed, using fallback:', err);
    }
  }

  // Fallback
  const products = getStoredProducts();
  const categories = INITIAL_DEMO_CATEGORIES;
  const inventory = getStoredInventory();

  // Attach category and inventory to product
  let enriched: Product[] = products.map((p) => {
    const cat = categories.find((c) => c.id === p.category_id) || null;
    const invList = inventory.filter((inv) => inv.product_id === p.id);
    let currentStock = 0;
    if (branchId) {
      const branchInv = invList.find((i) => i.branch_id === branchId);
      currentStock = branchInv ? Number(branchInv.quantity) || 0 : 0;
    } else {
      currentStock = invList.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    }

    return {
      ...p,
      category: cat,
      inventory: invList,
      total_stock: currentStock,
    };
  });

  if (categoryId && categoryId !== 'all') {
    enriched = enriched.filter((p) => p.category_id === categoryId);
  }
  if (status === 'active') {
    enriched = enriched.filter((p) => p.is_active);
  } else if (status === 'inactive') {
    enriched = enriched.filter((p) => !p.is_active);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    enriched = enriched.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
    );
  }

  if (stockStatus === 'out_of_stock') {
    enriched = enriched.filter((p) => (p.total_stock ?? 0) <= 0);
  } else if (stockStatus === 'low_stock') {
    enriched = enriched.filter(
      (p) => (p.total_stock ?? 0) > 0 && (p.total_stock ?? 0) <= p.min_stock_level
    );
  } else if (stockStatus === 'in_stock') {
    enriched = enriched.filter((p) => (p.total_stock ?? 0) > p.min_stock_level);
  }

  const totalCount = enriched.length;
  const from = (page - 1) * pageSize;
  const paginated = enriched.slice(from, from + pageSize);

  return { products: paginated, totalCount };
}

export async function fetchProductById(productId: string): Promise<Product | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*), inventory:inventory(*, branch:branches(*))')
        .eq('id', productId)
        .single();

      if (!error && data) {
        const invList: InventoryItem[] = data.inventory || [];
        const totalStock = invList.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
        return {
          ...data,
          total_stock: totalStock,
          inventory: invList,
        };
      }
    } catch (err) {
      console.warn('Supabase fetchProductById failed:', err);
    }
  }

  const products = getStoredProducts();
  const p = products.find((prod) => prod.id === productId);
  if (!p) return null;

  const categories = INITIAL_DEMO_CATEGORIES;
  const inventory = getStoredInventory().filter((inv) => inv.product_id === productId);
  const totalStock = inventory.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

  return {
    ...p,
    category: categories.find((c) => c.id === p.category_id) || null,
    inventory,
    total_stock: totalStock,
  };
}

export interface CreateProductInput {
  name: string;
  category_id?: string | null;
  sku?: string | null;
  barcode?: string | null;
  brand?: string | null;
  description?: string | null;
  unit: string;
  cost_price: number;
  selling_price: number;
  min_stock_level: number;
  image_url?: string | null;
  is_active?: boolean;
  initialStockByBranch?: Record<string, number>;
  userId?: string | null;
}

export async function createProduct(
  businessId: string,
  input: CreateProductInput
): Promise<Product> {
  const newProductId = `prod-${Date.now()}`;
  const now = new Date().toISOString();

  const productPayload: Product = {
    id: newProductId,
    business_id: businessId,
    category_id: input.category_id || null,
    name: input.name.trim(),
    sku: input.sku?.trim() || generateSku(input.name),
    barcode: input.barcode?.trim() || generateBarcode(),
    brand: input.brand?.trim() || null,
    description: input.description?.trim() || null,
    unit: input.unit || 'pcs',
    cost_price: Number(input.cost_price) || 0,
    selling_price: Number(input.selling_price) || 0,
    min_stock_level: Number(input.min_stock_level) || 5,
    image_url: input.image_url?.trim() || null,
    is_active: input.is_active ?? true,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    try {
      const { data: insertedProduct, error: prodErr } = await supabase
        .from('products')
        .insert({
          business_id: businessId,
          category_id: productPayload.category_id,
          name: productPayload.name,
          sku: productPayload.sku,
          barcode: productPayload.barcode,
          brand: productPayload.brand,
          description: productPayload.description,
          unit: productPayload.unit,
          cost_price: productPayload.cost_price,
          selling_price: productPayload.selling_price,
          min_stock_level: productPayload.min_stock_level,
          image_url: productPayload.image_url,
          is_active: productPayload.is_active,
        })
        .select('*, category:categories(*)')
        .single();

      if (!prodErr && insertedProduct) {
        const prodId = insertedProduct.id;

        // If initial stock provided for branches, insert into inventory & movements
        if (input.initialStockByBranch) {
          const invInserts = Object.entries(input.initialStockByBranch).map(([branchId, qty]) => ({
            business_id: businessId,
            branch_id: branchId,
            product_id: prodId,
            quantity: Number(qty) || 0,
            min_quantity: productPayload.min_stock_level,
            reorder_point: productPayload.min_stock_level * 2,
          }));

          if (invInserts.length > 0) {
            await supabase.from('inventory').insert(invInserts);

            // Log initial stock movements
            const movementInserts = Object.entries(input.initialStockByBranch)
              .filter(([, qty]) => Number(qty) > 0)
              .map(([branchId, qty]) => ({
                business_id: businessId,
                branch_id: branchId,
                product_id: prodId,
                movement_type: 'initial_stock',
                quantity: Number(qty),
                previous_stock: 0,
                new_stock: Number(qty),
                reason: 'Initial stock intake on product creation',
                created_by: input.userId || null,
              }));

            if (movementInserts.length > 0) {
              await supabase.from('stock_movements').insert(movementInserts);
            }
          }
        }

        return insertedProduct as Product;
      }
    } catch (err) {
      console.warn('Supabase createProduct failed, falling back:', err);
    }
  }

  // Local fallback
  const products = getStoredProducts();
  products.unshift(productPayload);
  saveStoredProducts(products);

  const inventory = getStoredInventory();
  const movements = getStoredMovements();

  if (input.initialStockByBranch) {
    Object.entries(input.initialStockByBranch).forEach(([branchId, qty]) => {
      const quantity = Number(qty) || 0;
      inventory.push({
        id: `inv-${Date.now()}-${branchId.slice(0, 4)}`,
        business_id: businessId,
        branch_id: branchId,
        product_id: newProductId,
        quantity,
        min_quantity: productPayload.min_stock_level,
        reorder_point: productPayload.min_stock_level * 2,
        location_in_store: 'Main Store',
        created_at: now,
        updated_at: now,
      });

      if (quantity > 0) {
        movements.unshift({
          id: `mov-${Date.now()}-${branchId.slice(0, 4)}`,
          business_id: businessId,
          branch_id: branchId,
          product_id: newProductId,
          movement_type: 'initial_stock',
          quantity,
          previous_stock: 0,
          new_stock: quantity,
          reason: 'Initial stock intake on product creation',
          reference_id: null,
          created_by: input.userId || 'demo-user-1',
          created_at: now,
        });
      }
    });

    saveStoredInventory(inventory);
    saveStoredMovements(movements);
  }

  return productPayload;
}

export async function updateProduct(
  productId: string,
  data: Partial<Product>
): Promise<Product> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      const { data: updated, error } = await supabase
        .from('products')
        .update({
          ...(data.name !== undefined ? { name: data.name.trim() } : {}),
          ...(data.category_id !== undefined ? { category_id: data.category_id } : {}),
          ...(data.sku !== undefined ? { sku: data.sku?.trim() || null } : {}),
          ...(data.barcode !== undefined ? { barcode: data.barcode?.trim() || null } : {}),
          ...(data.brand !== undefined ? { brand: data.brand?.trim() || null } : {}),
          ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
          ...(data.unit !== undefined ? { unit: data.unit } : {}),
          ...(data.cost_price !== undefined ? { cost_price: Number(data.cost_price) } : {}),
          ...(data.selling_price !== undefined ? { selling_price: Number(data.selling_price) } : {}),
          ...(data.min_stock_level !== undefined ? { min_stock_level: Number(data.min_stock_level) } : {}),
          ...(data.image_url !== undefined ? { image_url: data.image_url?.trim() || null } : {}),
          ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
          updated_at: now,
        })
        .eq('id', productId)
        .select('*, category:categories(*)')
        .single();

      if (!error && updated) {
        return updated as Product;
      }
    } catch (err) {
      console.warn('Supabase updateProduct failed:', err);
    }
  }

  const products = getStoredProducts();
  const index = products.findIndex((p) => p.id === productId);
  if (index === -1) throw new Error('Product not found');

  products[index] = {
    ...products[index],
    ...data,
    updated_at: now,
  };

  saveStoredProducts(products);
  return products[index];
}

export async function deleteProduct(
  productId: string
): Promise<{ success: boolean; message?: string }> {
  if (isSupabaseConfigured) {
    try {
      // Check sales
      const { count: saleCount } = await supabase
        .from('sale_items')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId);

      if (saleCount && saleCount > 0) {
        // Soft delete / deactivate to preserve sales records integrity
        await supabase
          .from('products')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', productId);

        return {
          success: true,
          message: `Product was archived (marked inactive) because it is linked to ${saleCount} existing sale transactions.`,
        };
      }

      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (!error) return { success: true };
    } catch (err) {
      console.warn('Supabase deleteProduct failed:', err);
    }
  }

  // Local fallback
  const products = getStoredProducts();
  const p = products.find((x) => x.id === productId);
  if (!p) return { success: false, message: 'Product not found' };

  // Remove from products and clean up inventory
  const updated = products.filter((x) => x.id !== productId);
  saveStoredProducts(updated);

  const inventory = getStoredInventory().filter((inv) => inv.product_id !== productId);
  saveStoredInventory(inventory);

  return { success: true };
}

// ----------------------------------------------------
// Helpers for auto-generating SKU & Barcode
// ----------------------------------------------------

export function generateSku(productName: string, categoryPrefix?: string): string {
  const cleanName = productName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 3)
    .padEnd(3, 'PRD');
  const prefix = categoryPrefix ? categoryPrefix.toUpperCase().slice(0, 3) : 'GEN';
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${cleanName}-${randomSuffix}`;
}

export function generateBarcode(): string {
  // Generate 12-digit standard EAN/UPC-like barcode starting with country code 616 (Tanzania/East Africa prefix)
  const prefix = '6164000';
  const random = Math.floor(10000 + Math.random() * 90000).toString();
  return `${prefix}${random}`;
}
