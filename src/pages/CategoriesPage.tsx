import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Tags,
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/context/ToastContext';
import type { Category } from '@/types/database';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/services/categoryService';

import { CategoryFormModal } from '@/components/categories/CategoryFormModal';
import { CategoryDeleteConfirmModal } from '@/components/categories/CategoryDeleteConfirmModal';

export function CategoriesPage() {
  const { profile } = useAuth();
  const { hasPermission } = usePermissions();
  const { addToast } = useToast();

  const businessId = profile?.business_id || 'demo-biz-1';
  const canManageCategories = hasPermission('categories.manage');

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await fetchCategories(businessId);
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      addToast('error', 'Could not load categories.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (data: {
    name: string;
    description: string;
    is_active: boolean;
  }) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, data);
      addToast('success', `Category "${data.name}" updated.`);
    } else {
      await createCategory(businessId, data);
      addToast('success', `Category "${data.name}" created.`);
    }
    loadData();
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    const res = await deleteCategory(deletingCategory.id);
    if (res.success) {
      addToast('success', `Category "${deletingCategory.name}" deleted.`);
      loadData();
    } else {
      throw new Error(res.message || 'Cannot delete category');
    }
  };

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const q = searchTerm.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchTerm]);

  // Overall metrics
  const totalProductsAssigned = useMemo(() => {
    return categories.reduce((sum, c) => sum + (c.product_count ?? 0), 0);
  }, [categories]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
            Category Management
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Structure your inventory taxonomy, organize products, and optimize POS grouping
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300 dark:hover:bg-navy-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {canManageCategories && (
            <button
              onClick={() => {
                setEditingCategory(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Categories</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
              <Tags className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-navy-900 dark:text-white">
            {categories.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Categorized Products</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-navy-900 dark:text-white">
            {totalProductsAssigned}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Active Status</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {categories.filter((c) => c.is_active !== false).length} / {categories.length}
          </p>
        </div>
      </div>

      {/* Search Header */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search categories by name or description..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-xs text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
          Showing {filteredCategories.length} categories
        </p>
      </div>

      {/* Categories Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs dark:border-navy-800 dark:bg-navy-900">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-100 bg-gray-50/80 text-gray-500 dark:border-navy-800 dark:bg-navy-950/60 dark:text-gray-400">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Category</th>
              <th className="px-5 py-3.5 font-semibold">Description</th>
              <th className="px-5 py-3.5 font-semibold text-center">Products Count</th>
              <th className="px-5 py-3.5 font-semibold text-center">Status</th>
              <th className="px-5 py-3.5 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-gray-500">
                  <div className="inline-flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-brand-600" />
                    Loading categories...
                  </div>
                </td>
              </tr>
            ) : filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-gray-500">
                  No categories found.
                </td>
              </tr>
            ) : (
              filteredCategories.map((c) => (
                <tr
                  key={c.id}
                  className="transition hover:bg-gray-50/60 dark:hover:bg-navy-950/40"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                        <Tags className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-navy-900 dark:text-white">
                        {c.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-gray-500 dark:text-gray-400 max-w-md">
                    {c.description || <span className="italic text-gray-400">No description provided</span>}
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                      <Package className="h-3 w-3" /> {c.product_count ?? 0}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        c.is_active !== false
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-navy-800 dark:text-gray-400'
                      }`}
                    >
                      {c.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <div className="inline-flex items-center gap-1">
                      {canManageCategories && (
                        <>
                          <button
                            onClick={() => {
                              setEditingCategory(c);
                              setIsFormOpen(true);
                            }}
                            title="Edit Category"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:hover:bg-navy-800 dark:hover:text-white"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingCategory(c);
                              setIsDeleteOpen(true);
                            }}
                            title="Delete Category"
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSave}
        category={editingCategory}
      />

      <CategoryDeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingCategory(null);
        }}
        onConfirm={handleDelete}
        category={deletingCategory}
      />
    </div>
  );
}
