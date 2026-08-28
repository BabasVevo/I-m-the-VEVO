import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { InventoryItem, StockMovement, StockMovementType } from '@/types/database';
import {
  getStoredInventory,
  saveStoredInventory,
  getStoredProducts,
  getStoredMovements,
  saveStoredMovements,
} from './productService';
import { INITIAL_DEMO_BRANCHES } from './dashboardService';
import { INITIAL_DEMO_CATEGORIES } from './categoryService';

export interface FetchInventoryFilter {
  branchId?: string | null;
  categoryId?: string;
  search?: string;
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  page?: number;
  pageSize?: number;
}

export interface InventoryOverviewStats {
  totalItems: number;
  totalStockUnits: number;
  totalCostValue: number;
  totalRetailValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export async function fetchInventory(
  businessId: string,
  filter: FetchInventoryFilter = {}
): Promise<{
  items: InventoryItem[];
  totalCount: number;
  stats: InventoryOverviewStats;
}> {
  const {
    branchId,
    categoryId,
    search,
    stockStatus = 'all',
    page = 1,
    pageSize = 10,
  } = filter;

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
        let allItems = data as InventoryItem[];

        if (categoryId && categoryId !== 'all') {
          allItems = allItems.filter((i) => i.product?.category_id === categoryId);
        }

        if (search && search.trim()) {
          const q = search.trim().toLowerCase();
          allItems = allItems.filter(
            (i) =>
              i.product?.name.toLowerCase().includes(q) ||
              (i.product?.sku && i.product.sku.toLowerCase().includes(q)) ||
              (i.product?.barcode && i.product.barcode.toLowerCase().includes(q)) ||
              (i.location_in_store && i.location_in_store.toLowerCase().includes(q))
          );
        }

        // Calculate stats on the full filtered branch set
        const totalItems = allItems.length;
        let totalStockUnits = 0;
        let totalCostValue = 0;
        let totalRetailValue = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;

        allItems.forEach((item) => {
          const qty = Number(item.quantity) || 0;
          const minQty = Number(item.min_quantity) || 5;
          const cost = Number(item.product?.cost_price) || 0;
          const retail = Number(item.product?.selling_price) || 0;

          totalStockUnits += qty;
          totalCostValue += qty * cost;
          totalRetailValue += qty * retail;

          if (qty <= 0) {
            outOfStockCount += 1;
          } else if (qty <= minQty) {
            lowStockCount += 1;
          }
        });

        // Apply stock status filter for the displayed list
        let filteredItems = allItems;
        if (stockStatus === 'out_of_stock') {
          filteredItems = filteredItems.filter((i) => (Number(i.quantity) || 0) <= 0);
        } else if (stockStatus === 'low_stock') {
          filteredItems = filteredItems.filter(
            (i) =>
              (Number(i.quantity) || 0) > 0 &&
              (Number(i.quantity) || 0) <= (Number(i.min_quantity) || 5)
          );
        } else if (stockStatus === 'in_stock') {
          filteredItems = filteredItems.filter(
            (i) => (Number(i.quantity) || 0) > (Number(i.min_quantity) || 5)
          );
        }

        const totalCount = filteredItems.length;
        const from = (page - 1) * pageSize;
        const paginated = filteredItems.slice(from, from + pageSize);

        return {
          items: paginated,
          totalCount,
          stats: {
            totalItems,
            totalStockUnits,
            totalCostValue,
            totalRetailValue,
            lowStockCount,
            outOfStockCount,
          },
        };
      }
    } catch (err) {
      console.warn('Supabase fetchInventory failed, using fallback:', err);
    }
  }

  // Local fallback
  const rawInv = getStoredInventory();
  const rawProds = getStoredProducts();
  const categories = INITIAL_DEMO_CATEGORIES;
  const branches = INITIAL_DEMO_BRANCHES;

  let allItems: InventoryItem[] = rawInv.map((item) => {
    const prod = rawProds.find((p) => p.id === item.product_id) || null;
    const prodWithCat = prod
      ? { ...prod, category: categories.find((c) => c.id === prod.category_id) || null }
      : null;
    const branch = branches.find((b) => b.id === item.branch_id) || null;

    return {
      ...item,
      product: prodWithCat,
      branch,
    };
  });

  if (branchId) {
    allItems = allItems.filter((i) => i.branch_id === branchId);
  }

  if (categoryId && categoryId !== 'all') {
    allItems = allItems.filter((i) => i.product?.category_id === categoryId);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    allItems = allItems.filter(
      (i) =>
        i.product?.name.toLowerCase().includes(q) ||
        (i.product?.sku && i.product.sku.toLowerCase().includes(q)) ||
        (i.product?.barcode && i.product.barcode.toLowerCase().includes(q)) ||
        (i.location_in_store && i.location_in_store.toLowerCase().includes(q))
    );
  }

  const totalItems = allItems.length;
  let totalStockUnits = 0;
  let totalCostValue = 0;
  let totalRetailValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  allItems.forEach((item) => {
    const qty = Number(item.quantity) || 0;
    const minQty = Number(item.min_quantity) || 5;
    const cost = Number(item.product?.cost_price) || 0;
    const retail = Number(item.product?.selling_price) || 0;

    totalStockUnits += qty;
    totalCostValue += qty * cost;
    totalRetailValue += qty * retail;

    if (qty <= 0) {
      outOfStockCount += 1;
    } else if (qty <= minQty) {
      lowStockCount += 1;
    }
  });

  let filteredItems = allItems;
  if (stockStatus === 'out_of_stock') {
    filteredItems = filteredItems.filter((i) => (Number(i.quantity) || 0) <= 0);
  } else if (stockStatus === 'low_stock') {
    filteredItems = filteredItems.filter(
      (i) =>
        (Number(i.quantity) || 0) > 0 &&
        (Number(i.quantity) || 0) <= (Number(i.min_quantity) || 5)
    );
  } else if (stockStatus === 'in_stock') {
    filteredItems = filteredItems.filter(
      (i) => (Number(i.quantity) || 0) > (Number(i.min_quantity) || 5)
    );
  }

  const totalCount = filteredItems.length;
  const from = (page - 1) * pageSize;
  const paginated = filteredItems.slice(from, from + pageSize);

  return {
    items: paginated,
    totalCount,
    stats: {
      totalItems,
      totalStockUnits,
      totalCostValue,
      totalRetailValue,
      lowStockCount,
      outOfStockCount,
    },
  };
}

export interface AdjustStockInput {
  businessId: string;
  branchId: string;
  productId: string;
  adjustmentType: 'add' | 'remove' | 'set';
  quantity: number;
  reason: string;
  movementType?: StockMovementType;
  referenceId?: string | null;
  userId?: string | null;
  locationInStore?: string | null;
}

export async function adjustStock(
  input: AdjustStockInput
): Promise<{ inventory: InventoryItem; movement: StockMovement }> {
  const now = new Date().toISOString();
  const qtyInput = Math.max(0, Number(input.quantity) || 0);

  if (isSupabaseConfigured) {
    try {
      // 1. Get current inventory record
      const { data: existingInv } = await supabase
        .from('inventory')
        .select('*')
        .eq('business_id', input.businessId)
        .eq('branch_id', input.branchId)
        .eq('product_id', input.productId)
        .maybeSingle();

      const previousStock = existingInv ? Number(existingInv.quantity) || 0 : 0;
      let newStock = 0;
      let delta = 0;

      if (input.adjustmentType === 'add') {
        newStock = previousStock + qtyInput;
        delta = qtyInput;
      } else if (input.adjustmentType === 'remove') {
        newStock = Math.max(0, previousStock - qtyInput);
        delta = -Math.min(previousStock, qtyInput);
      } else {
        newStock = qtyInput;
        delta = qtyInput - previousStock;
      }

      // 2. Upsert inventory
      const { data: savedInv, error: invErr } = await supabase
        .from('inventory')
        .upsert(
          {
            business_id: input.businessId,
            branch_id: input.branchId,
            product_id: input.productId,
            quantity: newStock,
            location_in_store: input.locationInStore || existingInv?.location_in_store || null,
            updated_at: now,
          },
          { onConflict: 'branch_id,product_id' }
        )
        .select('*, product:products(*), branch:branches(*)')
        .single();

      if (!invErr && savedInv) {
        // 3. Create movement log
        const movementType: StockMovementType =
          input.movementType ||
          (input.adjustmentType === 'add'
            ? 'adjustment'
            : input.adjustmentType === 'remove'
            ? 'damaged'
            : 'adjustment');

        const { data: savedMov } = await supabase
          .from('stock_movements')
          .insert({
            business_id: input.businessId,
            branch_id: input.branchId,
            product_id: input.productId,
            movement_type: movementType,
            quantity: delta,
            previous_stock: previousStock,
            new_stock: newStock,
            reason: input.reason,
            reference_id: input.referenceId || null,
            created_by: input.userId || null,
          })
          .select('*, product:products(*), branch:branches(*)')
          .single();

        return {
          inventory: savedInv as InventoryItem,
          movement: savedMov as StockMovement,
        };
      }
    } catch (err) {
      console.warn('Supabase adjustStock failed, falling back:', err);
    }
  }

  // Local fallback
  const inventoryList = getStoredInventory();
  const products = getStoredProducts();
  const branches = INITIAL_DEMO_BRANCHES;
  const movements = getStoredMovements();

  const existingIndex = inventoryList.findIndex(
    (inv) => inv.branch_id === input.branchId && inv.product_id === input.productId
  );

  let previousStock = 0;
  if (existingIndex >= 0) {
    previousStock = Number(inventoryList[existingIndex].quantity) || 0;
  }

  let newStock = 0;
  let delta = 0;

  if (input.adjustmentType === 'add') {
    newStock = previousStock + qtyInput;
    delta = qtyInput;
  } else if (input.adjustmentType === 'remove') {
    newStock = Math.max(0, previousStock - qtyInput);
    delta = -Math.min(previousStock, qtyInput);
  } else {
    newStock = qtyInput;
    delta = qtyInput - previousStock;
  }

  let updatedItem: InventoryItem;
  if (existingIndex >= 0) {
    inventoryList[existingIndex] = {
      ...inventoryList[existingIndex],
      quantity: newStock,
      location_in_store: input.locationInStore || inventoryList[existingIndex].location_in_store,
      updated_at: now,
    };
    updatedItem = inventoryList[existingIndex];
  } else {
    const prod = products.find((p) => p.id === input.productId);
    updatedItem = {
      id: `inv-${Date.now()}`,
      business_id: input.businessId,
      branch_id: input.branchId,
      product_id: input.productId,
      quantity: newStock,
      min_quantity: prod?.min_stock_level || 5,
      reorder_point: (prod?.min_stock_level || 5) * 2,
      location_in_store: input.locationInStore || 'Main Floor',
      created_at: now,
      updated_at: now,
    };
    inventoryList.push(updatedItem);
  }
  saveStoredInventory(inventoryList);

  const movementType: StockMovementType =
    input.movementType ||
    (input.adjustmentType === 'add'
      ? 'adjustment'
      : input.adjustmentType === 'remove'
      ? 'damaged'
      : 'adjustment');

  const newMovement: StockMovement = {
    id: `mov-${Date.now()}`,
    business_id: input.businessId,
    branch_id: input.branchId,
    product_id: input.productId,
    movement_type: movementType,
    quantity: delta,
    previous_stock: previousStock,
    new_stock: newStock,
    reason: input.reason,
    reference_id: input.referenceId || null,
    created_by: input.userId || 'demo-user-1',
    created_at: now,
    product: products.find((p) => p.id === input.productId) || null,
    branch: branches.find((b) => b.id === input.branchId) || null,
  };

  movements.unshift(newMovement);
  saveStoredMovements(movements);

  return {
    inventory: {
      ...updatedItem,
      product: products.find((p) => p.id === input.productId) || null,
      branch: branches.find((b) => b.id === input.branchId) || null,
    },
    movement: newMovement,
  };
}

export interface FetchStockMovementsFilter {
  branchId?: string | null;
  productId?: string;
  movementType?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchStockMovements(
  businessId: string,
  filter: FetchStockMovementsFilter = {}
): Promise<{ movements: StockMovement[]; totalCount: number }> {
  const { branchId, productId, movementType, page = 1, pageSize = 12 } = filter;

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('stock_movements')
        .select('*, product:products(*), branch:branches(*), creator:profiles(*)', {
          count: 'exact',
        })
        .eq('business_id', businessId);

      if (branchId) query = query.eq('branch_id', branchId);
      if (productId) query = query.eq('product_id', productId);
      if (movementType && movementType !== 'all') query = query.eq('movement_type', movementType);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!error && data) {
        return {
          movements: data as StockMovement[],
          totalCount: count || data.length,
        };
      }
    } catch (err) {
      console.warn('Supabase fetchStockMovements failed, using fallback:', err);
    }
  }

  // Local fallback
  const rawMovs = getStoredMovements();
  const products = getStoredProducts();
  const branches = INITIAL_DEMO_BRANCHES;

  let enriched = rawMovs.map((m) => ({
    ...m,
    product: products.find((p) => p.id === m.product_id) || m.product || null,
    branch: branches.find((b) => b.id === m.branch_id) || m.branch || null,
  }));

  if (branchId) enriched = enriched.filter((m) => m.branch_id === branchId);
  if (productId) enriched = enriched.filter((m) => m.product_id === productId);
  if (movementType && movementType !== 'all') {
    enriched = enriched.filter((m) => m.movement_type === movementType);
  }

  enriched.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const totalCount = enriched.length;
  const from = (page - 1) * pageSize;
  const paginated = enriched.slice(from, from + pageSize);

  return { movements: paginated, totalCount };
}

export async function transferStockBetweenBranches(params: {
  businessId: string;
  fromBranchId: string;
  toBranchId: string;
  productId: string;
  quantity: number;
  reason?: string;
  userId?: string | null;
}): Promise<{ success: boolean; message?: string }> {
  if (params.fromBranchId === params.toBranchId) {
    return { success: false, message: 'Source and destination branch cannot be the same.' };
  }

  const qty = Number(params.quantity);
  if (!qty || qty <= 0) {
    return { success: false, message: 'Please provide a valid transfer quantity.' };
  }

  // 1. Deduct from source
  await adjustStock({
    businessId: params.businessId,
    branchId: params.fromBranchId,
    productId: params.productId,
    adjustmentType: 'remove',
    quantity: qty,
    movementType: 'transfer',
    reason: `Inter-branch transfer OUT to ${params.toBranchId}. ${params.reason || ''}`,
    userId: params.userId,
  });

  // 2. Add to destination
  await adjustStock({
    businessId: params.businessId,
    branchId: params.toBranchId,
    productId: params.productId,
    adjustmentType: 'add',
    quantity: qty,
    movementType: 'transfer',
    reason: `Inter-branch transfer IN from ${params.fromBranchId}. ${params.reason || ''}`,
    userId: params.userId,
  });

  return { success: true };
}
