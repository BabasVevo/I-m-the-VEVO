import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Category } from '@/types/database';

export const DEMO_CATEGORIES_KEY = 'verdant_demo_categories_v3';

export const INITIAL_DEMO_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    business_id: 'demo-biz-1',
    name: 'Beverages & Pantry',
    description: 'Specialty coffee, teas, juices, honey, and artisan packaged goods',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'cat-2',
    business_id: 'demo-biz-1',
    name: 'POS Supplies',
    description: 'Thermal paper rolls, receipt printing ribbons, and counter utilities',
    is_active: true,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'cat-3',
    business_id: 'demo-biz-1',
    name: 'Hardware & Accessories',
    description: 'Barcode scanners, cash drawers, receipt printers, and stands',
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'cat-4',
    business_id: 'demo-biz-1',
    name: 'Bakery & Fresh Food',
    description: 'Freshly baked pastries, sourdough loaves, and snack packs',
    is_active: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'cat-5',
    business_id: 'demo-biz-1',
    name: 'Packaging & Bags',
    description: 'Kraft shopping bags, eco-friendly food containers, and cup holders',
    is_active: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

export function getStoredCategories(): Category[] {
  const raw = localStorage.getItem(DEMO_CATEGORIES_KEY);
  if (!raw) {
    localStorage.setItem(DEMO_CATEGORIES_KEY, JSON.stringify(INITIAL_DEMO_CATEGORIES));
    return INITIAL_DEMO_CATEGORIES;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_CATEGORIES;
  }
}

export function saveStoredCategories(categories: Category[]) {
  localStorage.setItem(DEMO_CATEGORIES_KEY, JSON.stringify(categories));
}

interface SupabaseCategoryWithProducts {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
  products?: Array<{
    id: string;
    inventory?: Array<{ quantity: number }>;
  }>;
}

export async function fetchCategories(businessId: string): Promise<Category[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*, products(id, inventory(quantity))')
        .eq('business_id', businessId)
        .order('name');

      if (!error && data) {
        const typedData = data as unknown as SupabaseCategoryWithProducts[];
        return typedData.map((cat) => {
          const productList = cat.products || [];
          const productCount = productList.length;
          let totalStock = 0;
          productList.forEach((p) => {
            (p.inventory || []).forEach((inv) => {
              totalStock += Number(inv.quantity) || 0;
            });
          });
          return {
            id: cat.id,
            business_id: cat.business_id,
            name: cat.name,
            description: cat.description,
            is_active: cat.is_active ?? true,
            product_count: productCount,
            total_stock: totalStock,
            created_at: cat.created_at,
            updated_at: cat.updated_at,
          };
        });
      }
    } catch (err) {
      console.warn('Supabase fetchCategories error, falling back to local:', err);
    }
  }

  // Fallback demo categories
  const cats = getStoredCategories();
  // Get products to calculate counts
  const rawProds = localStorage.getItem('verdant_demo_products_v3');
  const rawInv = localStorage.getItem('verdant_demo_inventory_v3');
  let products: Product[] = [];
  let inventory: InventoryItem[] = [];
  try {
    if (rawProds) products = JSON.parse(rawProds);
    if (rawInv) inventory = JSON.parse(rawInv);
  } catch {
    // ignore
  }

  return cats.map((cat) => {
    const associatedProds = products.filter((p) => p.category_id === cat.id);
    const prodIds = new Set(associatedProds.map((p) => p.id));
    const totalStock = inventory
      .filter((inv) => prodIds.has(inv.product_id))
      .reduce((sum, inv) => sum + (Number(inv.quantity) || 0), 0);

    return {
      ...cat,
      product_count: associatedProds.length,
      total_stock: totalStock,
    };
  });
}

export async function createCategory(
  businessId: string,
  data: { name: string; description?: string | null; is_active?: boolean }
): Promise<Category> {
  const payload = {
    id: `cat-${Date.now()}`,
    business_id: businessId,
    name: data.name.trim(),
    description: data.description?.trim() || null,
    is_active: data.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const { data: created, error } = await supabase
        .from('categories')
        .insert({
          business_id: businessId,
          name: payload.name,
          description: payload.description,
          is_active: payload.is_active,
        })
        .select()
        .single();

      if (!error && created) {
        return {
          ...created,
          product_count: 0,
          total_stock: 0,
        };
      }
    } catch (err) {
      console.warn('Supabase createCategory failed, falling back:', err);
    }
  }

  const list = getStoredCategories();
  list.push(payload);
  saveStoredCategories(list);
  return { ...payload, product_count: 0, total_stock: 0 };
}

export async function updateCategory(
  categoryId: string,
  data: { name?: string; description?: string | null; is_active?: boolean }
): Promise<Category> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      const { data: updated, error } = await supabase
        .from('categories')
        .update({
          ...(data.name !== undefined ? { name: data.name.trim() } : {}),
          ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
          ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
          updated_at: now,
        })
        .eq('id', categoryId)
        .select()
        .single();

      if (!error && updated) {
        return updated as Category;
      }
    } catch (err) {
      console.warn('Supabase updateCategory error:', err);
    }
  }

  const list = getStoredCategories();
  const index = list.findIndex((c) => c.id === categoryId);
  if (index === -1) throw new Error('Category not found');

  list[index] = {
    ...list[index],
    ...(data.name !== undefined ? { name: data.name.trim() } : {}),
    ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
    ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
    updated_at: now,
  };

  saveStoredCategories(list);
  return list[index];
}

export async function deleteCategory(
  categoryId: string
): Promise<{ success: boolean; message?: string }> {
  // Check if products exist in category
  if (isSupabaseConfigured) {
    try {
      const { count, error: countErr } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);

      if (!countErr && count && count > 0) {
        return {
          success: false,
          message: `Cannot delete: ${count} product${count > 1 ? 's are' : ' is'} currently assigned to this category. Please reassign or delete the products first.`,
        };
      }

      const { error } = await supabase.from('categories').delete().eq('id', categoryId);
      if (!error) return { success: true };
    } catch (err) {
      console.warn('Supabase deleteCategory failed, falling back:', err);
    }
  }

  // Local fallback check
  const rawProds = localStorage.getItem('verdant_demo_products_v3');
  let products: Product[] = [];
  try {
    if (rawProds) products = JSON.parse(rawProds);
  } catch {
    // ignore
  }

  const assigned = products.filter((p) => p.category_id === categoryId);
  if (assigned.length > 0) {
    return {
      success: false,
      message: `Cannot delete: ${assigned.length} product${assigned.length > 1 ? 's are' : ' is'} currently assigned to this category. Please reassign or delete the products first.`,
    };
  }

  const list = getStoredCategories().filter((c) => c.id !== categoryId);
  saveStoredCategories(list);
  return { success: true };
}
