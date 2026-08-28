import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  Sliders,
  Eye,
  Edit,
  Trash2,
  Printer,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Boxes,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/context/ToastContext';
import type { Product, Category, Branch } from '@/types/database';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  CreateProductInput,
} from '@/services/productService';
import { fetchCategories, createCategory } from '@/services/categoryService';
import { fetchBranches } from '@/services/dashboardService';

import { ProductFormModal } from '@/components/products/ProductFormModal';
import { ProductDetailModal } from '@/components/products/ProductDetailModal';
import { BarcodePreviewModal } from '@/components/products/BarcodePreviewModal';
import { ProductDeleteConfirmModal } from '@/components/products/ProductDeleteConfirmModal';
import { CategoryFormModal } from '@/components/categories/CategoryFormModal';
import { StockAdjustmentModal } from '@/components/inventory/StockAdjustmentModal';

export function ProductsPage() {
  const { profile } = useAuth();
  const { hasPermission } = usePermissions();
  const { addToast } = useToast();

  const businessId = profile?.business_id || 'demo-biz-1';
  const currencySymbol = 'TZS';

  const canManageProducts = hasPermission('products.create') || hasPermission('products.edit');
  const canDeleteProducts = hasPermission('products.delete');
  const canManageStock = hasPermission('stock.adjust');

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const [isQuickCategoryOpen, setIsQuickCategoryOpen] = useState(false);

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustBranchId, setAdjustBranchId] = useState<string | null>(null);

  // Load initial dropdowns
  useEffect(() => {
    async function loadMeta() {
      try {
        const [cats, brs] = await Promise.all([
          fetchCategories(businessId),
          fetchBranches(businessId),
        ]);
        setCategories(cats);
        setBranches(brs);
      } catch (err) {
        console.error('Failed to load categories/branches:', err);
      }
    }
    loadMeta();
  }, [businessId]);

  // Load products query
  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetchProducts(businessId, {
        branchId: selectedBranchId !== 'all' ? selectedBranchId : null,
        categoryId: selectedCategoryId,
        search: searchTerm,
        stockStatus: stockStatusFilter,
        page: currentPage,
        pageSize,
      });

      let items = res.products;
      if (statusFilter === 'active') {
        items = items.filter((p) => p.is_active);
      } else if (statusFilter === 'inactive') {
        items = items.filter((p) => !p.is_active);
      }

      setProducts(items);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      addToast('error', 'Could not load products. Please check connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    businessId,
    selectedBranchId,
    selectedCategoryId,
    searchTerm,
    stockStatusFilter,
    statusFilter,
    currentPage,
    pageSize,
    addToast,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Save Product (Create or Update)
  const handleSaveProduct = async (data: CreateProductInput) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, {
        name: data.name,
        category_id: data.category_id,
        sku: data.sku,
        barcode: data.barcode,
        brand: data.brand,
        description: data.description,
        unit: data.unit,
        cost_price: data.cost_price,
        selling_price: data.selling_price,
        min_stock_level: data.min_stock_level,
        image_url: data.image_url,
        is_active: data.is_active,
      });
      addToast('success', `Product "${data.name}" updated successfully.`);
    } else {
      await createProduct({
        ...data,
        business_id: businessId,
      });
      addToast('success', `Product "${data.name}" added to catalog.`);
    }
    loadData();
  };

  // Handle Quick Add Category
  const handleQuickAddCategory = async (catData: { name: string; description: string; is_active: boolean }) => {
    const newCat = await createCategory({
      business_id: businessId,
      ...catData,
    });
    setCategories((prev) => [...prev, newCat]);
    addToast('success', `Category "${newCat.name}" created.`);
  };

  // Handle Delete Product
  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    await deleteProduct(deletingProduct.id);
    addToast('success', `Product "${deletingProduct.name}" removed.`);
    loadData();
  };

  // Export CSV
  const handleExportCSV = () => {
    if (products.length === 0) {
      addToast('info', 'No products to export.');
      return;
    }

    const headers = ['Name', 'SKU', 'Barcode', 'Category', 'Cost Price', 'Selling Price', 'Margin %', 'Stock Level', 'Unit', 'Status'];
    const rows = products.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.sku || ''}"`,
      `"${p.barcode || ''}"`,
      `"${p.category?.name || 'Uncategorized'}"`,
      p.cost_price,
      p.selling_price,
      p.selling_price > 0 ? (((p.selling_price - p.cost_price) / p.selling_price) * 100).toFixed(1) : '0.0',
      p.total_stock ?? 0,
      p.unit,
      p.is_active ? 'Active' : 'Inactive',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Verdant_Products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Products exported to CSV.');
  };

  // Top Metrics Calculation
  const metrics = useMemo(() => {
    let totalStockUnits = 0;
    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      const stock = p.total_stock ?? 0;
      totalStockUnits += stock;
      totalStockValue += stock * (Number(p.cost_price) || 0);
      if (stock <= 0) {
        outOfStockCount += 1;
      } else if (stock <= (p.min_stock_level || 5)) {
        lowStockCount += 1;
      }
    });

    return {
      totalProducts: totalCount,
      totalStockUnits,
      totalStockValue,
      lowStockCount,
      outOfStockCount,
    };
  }, [products, totalCount]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
            Products Management
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Maintain product catalog, pricing, multi-branch inventory, and SKU barcodes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadData()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300 dark:hover:bg-navy-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300 dark:hover:bg-navy-800"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>

          {canManageProducts && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Summary Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Products</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-navy-900 dark:text-white">
            {metrics.totalProducts}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Units in Stock</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-navy-900 dark:text-white">
            {metrics.totalStockUnits.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Stock Valuation (Cost)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
            {currencySymbol} {metrics.totalStockValue.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Low / Out of Stock</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {metrics.lowStockCount + metrics.outOfStockCount}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, SKU, barcode, brand..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-xs text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-navy-900 outline-hidden focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={selectedBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-navy-900 outline-hidden focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div>
            <select
              value={stockStatusFilter}
              onChange={(e) => {
                setStockStatusFilter(
                  e.target.value as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
                );
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-navy-900 outline-hidden focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">In Stock (&gt; Min)</option>
              <option value="low_stock">Low Stock (≤ Min)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>
          </div>

          {/* Active Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-navy-900 outline-hidden focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs dark:border-navy-800 dark:bg-navy-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/80 text-gray-500 dark:border-navy-800 dark:bg-navy-950/60 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3.5 font-semibold">Product</th>
                <th className="px-4 py-3.5 font-semibold">SKU & Barcode</th>
                <th className="px-4 py-3.5 font-semibold">Category</th>
                <th className="px-4 py-3.5 font-semibold text-right">Cost</th>
                <th className="px-4 py-3.5 font-semibold text-right">Selling Price</th>
                <th className="px-4 py-3.5 font-semibold text-right">Margin</th>
                <th className="px-4 py-3.5 font-semibold text-right">Stock Level</th>
                <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                <th className="px-4 py-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-brand-600" />
                      Loading catalog items...
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-gray-500">
                    No products found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const stock = p.total_stock ?? 0;
                  const minLevel = p.min_stock_level || 5;
                  const cost = Number(p.cost_price) || 0;
                  const selling = Number(p.selling_price) || 0;
                  const profit = selling - cost;
                  const margin = selling > 0 ? ((profit / selling) * 100).toFixed(1) : '0';

                  let stockBadge = (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> {stock} {p.unit}
                    </span>
                  );
                  if (stock <= 0) {
                    stockBadge = (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-400">
                        <XCircle className="h-3 w-3" /> 0 {p.unit} (Out)
                      </span>
                    );
                  } else if (stock <= minLevel) {
                    stockBadge = (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                        <AlertCircle className="h-3 w-3" /> {stock} {p.unit} (Low)
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={p.id}
                      className="transition hover:bg-gray-50/60 dark:hover:bg-navy-950/40"
                    >
                      {/* Product Thumbnail & Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center dark:border-navy-700 dark:bg-navy-800">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Package className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <button
                              onClick={() => {
                                setDetailProduct(p);
                                setIsDetailOpen(true);
                              }}
                              className="font-semibold text-navy-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400 text-left line-clamp-1"
                            >
                              {p.name}
                            </button>
                            {p.brand && (
                              <p className="text-[11px] text-gray-400">{p.brand}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU & Barcode */}
                      <td className="px-4 py-3 font-mono">
                        <div className="flex flex-col">
                          <span className="text-gray-900 dark:text-gray-200 font-medium">
                            {p.sku || '—'}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {p.barcode || 'No barcode'}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-lg bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-navy-800 dark:text-gray-300">
                          {p.category?.name || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="px-4 py-3 text-right font-mono text-gray-500 dark:text-gray-400">
                        {cost.toLocaleString()}
                      </td>

                      {/* Selling Price */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-navy-900 dark:text-white">
                        {selling.toLocaleString()}
                      </td>

                      {/* Margin % */}
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-semibold ${
                            Number(margin) >= 20
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {margin}%
                        </span>
                      </td>

                      {/* Stock Level Badge */}
                      <td className="px-4 py-3 text-right">{stockBadge}</td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            p.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                          title={p.is_active ? 'Active' : 'Inactive'}
                        />
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              setDetailProduct(p);
                              setIsDetailOpen(true);
                            }}
                            title="View Product Details"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:hover:bg-navy-800 dark:hover:text-white"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {canManageStock && (
                            <button
                              onClick={() => {
                                setAdjustingProduct(p);
                                setAdjustBranchId(selectedBranchId !== 'all' ? selectedBranchId : null);
                                setIsAdjustOpen(true);
                              }}
                              title="Adjust Stock"
                              className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/50"
                            >
                              <Sliders className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setBarcodeProduct(p);
                              setIsBarcodeOpen(true);
                            }}
                            title="Print Barcode"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:hover:bg-navy-800 dark:hover:text-white"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>

                          {canManageProducts && (
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setIsFormOpen(true);
                              }}
                              title="Edit Product"
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:hover:bg-navy-800 dark:hover:text-white"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {canDeleteProducts && (
                            <button
                              onClick={() => {
                                setDeletingProduct(p);
                                setIsDeleteOpen(true);
                              }}
                              title="Delete Product"
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row dark:border-navy-800">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs dark:border-navy-700 dark:bg-navy-950"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>of {totalCount} items</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <div className="inline-flex rounded-xl border border-gray-200 bg-white shadow-xs dark:border-navy-700 dark:bg-navy-950">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30 dark:hover:bg-navy-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30 dark:hover:bg-navy-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        product={editingProduct}
        categories={categories}
        branches={branches}
        currencySymbol={currencySymbol}
        onQuickAddCategory={() => setIsQuickCategoryOpen(true)}
      />

      <ProductDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailProduct(null);
        }}
        product={detailProduct}
        branches={branches}
        currencySymbol={currencySymbol}
        onEdit={(prod) => {
          setIsDetailOpen(false);
          setEditingProduct(prod);
          setIsFormOpen(true);
        }}
        onAdjustStock={(prod, bId) => {
          setIsDetailOpen(false);
          setAdjustingProduct(prod);
          setAdjustBranchId(bId || null);
          setIsAdjustOpen(true);
        }}
        onPrintBarcode={(prod) => {
          setBarcodeProduct(prod);
          setIsBarcodeOpen(true);
        }}
      />

      <BarcodePreviewModal
        isOpen={isBarcodeOpen}
        onClose={() => {
          setIsBarcodeOpen(false);
          setBarcodeProduct(null);
        }}
        product={barcodeProduct}
        currencySymbol={currencySymbol}
      />

      <ProductDeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingProduct(null);
        }}
        onConfirm={handleDeleteProduct}
        product={deletingProduct}
      />

      <CategoryFormModal
        isOpen={isQuickCategoryOpen}
        onClose={() => setIsQuickCategoryOpen(false)}
        onSave={handleQuickAddCategory}
      />

      <StockAdjustmentModal
        isOpen={isAdjustOpen}
        onClose={() => {
          setIsAdjustOpen(false);
          setAdjustingProduct(null);
        }}
        onSuccess={() => {
          loadData();
          addToast('success', 'Stock adjustment logged successfully.');
        }}
        product={adjustingProduct}
        products={products}
        branches={branches}
        initialBranchId={adjustBranchId}
      />
    </div>
  );
}
