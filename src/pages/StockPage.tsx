import { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  Sliders,
  ArrowRightLeft,
  Search,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  History,
  TrendingUp,
  DollarSign,
  Package,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/context/ToastContext';
import type { InventoryItem, StockMovement, Branch, Product, Category } from '@/types/database';
import {
  fetchInventory,
  fetchStockMovements,
  InventoryOverviewStats,
} from '@/services/inventoryService';
import { fetchProducts } from '@/services/productService';
import { fetchBranches } from '@/services/dashboardService';
import { fetchCategories } from '@/services/categoryService';

import { StockAdjustmentModal } from '@/components/inventory/StockAdjustmentModal';
import { StockTransferModal } from '@/components/inventory/StockTransferModal';
import { ProductDetailModal } from '@/components/products/ProductDetailModal';
import { BarcodePreviewModal } from '@/components/products/BarcodePreviewModal';

export function StockPage() {
  const { profile } = useAuth();
  const { hasPermission } = usePermissions();
  const { addToast } = useToast();

  const businessId = profile?.business_id || 'demo-biz-1';
  const currencySymbol = 'TZS';

  const canAdjustStock = hasPermission('stock.adjust');

  // Navigation tab: 'inventory' | 'movements'
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements'>('inventory');

  // Metadata
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Inventory Table State
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryStats, setInventoryStats] = useState<InventoryOverviewStats>({
    totalItems: 0,
    totalStockUnits: 0,
    totalCostValue: 0,
    totalRetailValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [invTotalCount, setInvTotalCount] = useState(0);
  const [invLoading, setInvLoading] = useState(true);

  // Filters for Inventory
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [invSearch, setInvSearch] = useState('');
  const [invPage, setInvPage] = useState(1);
  const [invPageSize, setInvPageSize] = useState(10);

  // Movement Log State
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movTotalCount, setMovTotalCount] = useState(0);
  const [movLoading, setMovLoading] = useState(false);
  const [movTypeFilter, setMovTypeFilter] = useState('all');
  const [movPage, setMovPage] = useState(1);

  // Modals
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustBranchId, setAdjustBranchId] = useState<string | null>(null);

  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);

  // Load Meta
  useEffect(() => {
    async function loadMeta() {
      try {
        const [brs, cats, prodsRes] = await Promise.all([
          fetchBranches(businessId),
          fetchCategories(businessId),
          fetchProducts(businessId, { pageSize: 100 }),
        ]);
        setBranches(brs);
        setCategories(cats);
        setAllProducts(prodsRes.products);
      } catch (err) {
        console.error('Failed to load stock page meta:', err);
      }
    }
    loadMeta();
  }, [businessId]);

  // Fetch Inventory List
  const loadInventory = useCallback(async () => {
    try {
      setInvLoading(true);
      const res = await fetchInventory(businessId, {
        branchId: selectedBranchId !== 'all' ? selectedBranchId : null,
        categoryId: selectedCategoryId,
        search: invSearch,
        stockStatus: stockStatusFilter,
        page: invPage,
        pageSize: invPageSize,
      });
      setInventoryItems(res.items);
      setInvTotalCount(res.totalCount);
      setInventoryStats(res.stats);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
      addToast('error', 'Could not load inventory items.');
    } finally {
      setInvLoading(false);
    }
  }, [
    businessId,
    selectedBranchId,
    selectedCategoryId,
    invSearch,
    stockStatusFilter,
    invPage,
    invPageSize,
    addToast,
  ]);

  // Fetch Stock Movements Log
  const loadMovements = useCallback(async () => {
    try {
      setMovLoading(true);
      const res = await fetchStockMovements(businessId, {
        branchId: selectedBranchId !== 'all' ? selectedBranchId : null,
        movementType: movTypeFilter,
        page: movPage,
        pageSize: 15,
      });
      setMovements(res.movements);
      setMovTotalCount(res.totalCount);
    } catch (err) {
      console.error('Failed to load stock movements:', err);
      addToast('error', 'Could not load movement logs.');
    } finally {
      setMovLoading(false);
    }
  }, [businessId, selectedBranchId, movTypeFilter, movPage, addToast]);

  useEffect(() => {
    if (activeTab === 'inventory') {
      loadInventory();
    } else {
      loadMovements();
    }
  }, [activeTab, loadInventory, loadMovements]);

  // Export CSV
  const handleExportCSV = () => {
    if (inventoryItems.length === 0) {
      addToast('info', 'No items to export.');
      return;
    }
    const headers = ['Product', 'SKU', 'Barcode', 'Branch', 'Location In Store', 'Quantity', 'Unit', 'Cost Price', 'Stock Cost Valuation', 'Retail Valuation', 'Status'];
    const rows = inventoryItems.map((i) => {
      const p = i.product;
      const qty = Number(i.quantity) || 0;
      const cost = Number(p?.cost_price) || 0;
      const retail = Number(p?.selling_price) || 0;
      return [
        `"${p?.name.replace(/"/g, '""') || ''}"`,
        `"${p?.sku || ''}"`,
        `"${p?.barcode || ''}"`,
        `"${i.branch?.name || ''}"`,
        `"${i.location_in_store || ''}"`,
        qty,
        p?.unit || 'pcs',
        cost,
        qty * cost,
        qty * retail,
        qty <= 0 ? 'Out of Stock' : qty <= (i.min_quantity || 5) ? 'Low Stock' : 'In Stock',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Verdant_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Inventory exported to CSV.');
  };

  const totalInvPages = Math.ceil(invTotalCount / invPageSize) || 1;
  const totalMovPages = Math.ceil(movTotalCount / 15) || 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
            Inventory &amp; Stock Tracking
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Real-time branch inventory levels, physical adjustments, and immutable movement logs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => (activeTab === 'inventory' ? loadInventory() : loadMovements())}
            disabled={invLoading || movLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300 dark:hover:bg-navy-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${invLoading || movLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300 dark:hover:bg-navy-800"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>

          {canAdjustStock && (
            <>
              <button
                onClick={() => setIsTransferOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-xs hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/50"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Transfer Stock
              </button>

              <button
                onClick={() => {
                  setAdjustProduct(null);
                  setAdjustBranchId(selectedBranchId !== 'all' ? selectedBranchId : null);
                  setIsAdjustOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
              >
                <Sliders className="h-3.5 w-3.5" />
                Adjust Stock
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Overview Summary Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Stock Units</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-navy-900 dark:text-white">
            {inventoryStats.totalStockUnits.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">{inventoryStats.totalItems} distinct items</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Stock Valuation (Cost)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold text-brand-600 dark:text-brand-400 truncate">
            {currencySymbol} {inventoryStats.totalCostValue.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">Asset inventory balance</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Retail Potential</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
            {currencySymbol} {inventoryStats.totalRetailValue.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            Est. Gross Margin: {currencySymbol} {(inventoryStats.totalRetailValue - inventoryStats.totalCostValue).toLocaleString()}
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
            {inventoryStats.lowStockCount + inventoryStats.outOfStockCount}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            {inventoryStats.outOfStockCount} out of stock, {inventoryStats.lowStockCount} low
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-navy-800">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
            activeTab === 'inventory'
              ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-navy-900 dark:hover:text-white'
          }`}
        >
          <Boxes className="h-4 w-4" />
          Stock Levels ({invTotalCount})
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
            activeTab === 'movements'
              ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-navy-900 dark:hover:text-white'
          }`}
        >
          <History className="h-4 w-4" />
          Audit Movements Log ({movTotalCount})
        </button>
      </div>

      {/* TAB 1: Stock Inventory Levels */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
              {/* Search Box */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={invSearch}
                  onChange={(e) => {
                    setInvSearch(e.target.value);
                    setInvPage(1);
                  }}
                  placeholder="Search item, SKU, location..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-xs text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              {/* Branch Filter */}
              <div>
                <select
                  value={selectedBranchId}
                  onChange={(e) => {
                    setSelectedBranchId(e.target.value);
                    setInvPage(1);
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

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value);
                    setInvPage(1);
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

              {/* Stock Status Filter */}
              <div>
                <select
                  value={stockStatusFilter}
                  onChange={(e) => {
                    setStockStatusFilter(
                      e.target.value as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
                    );
                    setInvPage(1);
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-navy-900 outline-hidden focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                >
                  <option value="all">All Stock Statuses</option>
                  <option value="in_stock">In Stock (&gt; Min)</option>
                  <option value="low_stock">Low Stock (≤ Min)</option>
                  <option value="out_of_stock">Out of Stock (0)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs dark:border-navy-800 dark:bg-navy-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-100 bg-gray-50/80 text-gray-500 dark:border-navy-800 dark:bg-navy-950/60 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3.5 font-semibold">Product</th>
                    <th className="px-4 py-3.5 font-semibold">Branch Location</th>
                    <th className="px-4 py-3.5 font-semibold">In-Store Spot</th>
                    <th className="px-4 py-3.5 font-semibold text-right">Cost Price</th>
                    <th className="px-4 py-3.5 font-semibold text-right">On Hand</th>
                    <th className="px-4 py-3.5 font-semibold text-right">Min / Reorder</th>
                    <th className="px-4 py-3.5 font-semibold text-right">Valuation (Cost)</th>
                    <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                    <th className="px-4 py-3.5 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
                  {invLoading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-xs text-gray-500">
                        <div className="inline-flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-brand-600" />
                          Loading inventory balances...
                        </div>
                      </td>
                    </tr>
                  ) : inventoryItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-xs text-gray-500">
                        No inventory items found matching filters.
                      </td>
                    </tr>
                  ) : (
                    inventoryItems.map((item) => {
                      const prod = item.product;
                      const qty = Number(item.quantity) || 0;
                      const minQ = Number(item.min_quantity) || 5;
                      const cost = Number(prod?.cost_price) || 0;
                      const valuation = qty * cost;

                      let statusBadge = (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> In Stock
                        </span>
                      );
                      if (qty <= 0) {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-400">
                            <XCircle className="h-3 w-3" /> Out of Stock
                          </span>
                        );
                      } else if (qty <= minQ) {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                            <AlertCircle className="h-3 w-3" /> Low Stock
                          </span>
                        );
                      }

                      return (
                        <tr
                          key={item.id}
                          className="transition hover:bg-gray-50/60 dark:hover:bg-navy-950/40"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center dark:border-navy-700 dark:bg-navy-800">
                                {prod?.image_url ? (
                                  <img
                                    src={prod.image_url}
                                    alt={prod.name}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <Package className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-navy-900 dark:text-white line-clamp-1">
                                  {prod?.name || 'Unknown Product'}
                                </p>
                                <p className="font-mono text-[11px] text-gray-400">
                                  SKU: {prod?.sku || '—'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 font-medium text-navy-900 dark:text-white">
                            {item.branch?.name || 'Downtown Branch'}
                          </td>

                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                            {item.location_in_store || 'Main Floor'}
                          </td>

                          <td className="px-4 py-3 text-right font-mono text-gray-500 dark:text-gray-400">
                            {cost.toLocaleString()}
                          </td>

                          <td className="px-4 py-3 text-right font-bold text-sm text-navy-900 dark:text-white">
                            {qty} <span className="text-xs font-normal text-gray-400">{prod?.unit || 'pcs'}</span>
                          </td>

                          <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                            {minQ} / {item.reorder_point || minQ * 2}
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-bold text-navy-900 dark:text-white">
                            {currencySymbol} {valuation.toLocaleString()}
                          </td>

                          <td className="px-4 py-3 text-center">{statusBadge}</td>

                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => {
                                  if (prod) {
                                    setDetailProduct(prod);
                                    setIsDetailOpen(true);
                                  }
                                }}
                                title="View Product Details"
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:hover:bg-navy-800 dark:hover:text-white"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              {canAdjustStock && (
                                <button
                                  onClick={() => {
                                    setAdjustProduct(prod || null);
                                    setAdjustBranchId(item.branch_id);
                                    setIsAdjustOpen(true);
                                  }}
                                  title="Adjust Stock"
                                  className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/50"
                                >
                                  <Sliders className="h-3.5 w-3.5" />
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
                  value={invPageSize}
                  onChange={(e) => {
                    setInvPageSize(Number(e.target.value));
                    setInvPage(1);
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs dark:border-navy-700 dark:bg-navy-950"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>of {invTotalCount} inventory records</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Page {invPage} of {totalInvPages}
                </span>
                <div className="inline-flex rounded-xl border border-gray-200 bg-white shadow-xs dark:border-navy-700 dark:bg-navy-950">
                  <button
                    onClick={() => setInvPage((p) => Math.max(1, p - 1))}
                    disabled={invPage === 1}
                    className="p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30 dark:hover:bg-navy-800"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setInvPage((p) => Math.min(totalInvPages, p + 1))}
                    disabled={invPage >= totalInvPages}
                    className="p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30 dark:hover:bg-navy-800"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Audit Stock Movements Log */}
      {activeTab === 'movements' && (
        <div className="space-y-4">
          {/* Movements Filter Bar */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Branch Location
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => {
                    setSelectedBranchId(e.target.value);
                    setMovPage(1);
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

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Movement Activity Type
                </label>
                <select
                  value={movTypeFilter}
                  onChange={(e) => {
                    setMovTypeFilter(e.target.value);
                    setMovPage(1);
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-navy-900 outline-hidden focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                >
                  <option value="all">All Activity Types</option>
                  <option value="adjustment">Stock Adjustment</option>
                  <option value="transfer">Inter-Branch Transfer</option>
                  <option value="purchase">Purchase Intake</option>
                  <option value="sale">POS Sale Deduction</option>
                  <option value="damaged">Damaged / Expired Waste</option>
                  <option value="return">Customer Return</option>
                  <option value="initial">Initial Catalog Stock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Movements Log Table */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs dark:border-navy-800 dark:bg-navy-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-100 bg-gray-50/80 text-gray-500 dark:border-navy-800 dark:bg-navy-950/60 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3.5 font-semibold">Timestamp</th>
                    <th className="px-4 py-3.5 font-semibold">Branch</th>
                    <th className="px-4 py-3.5 font-semibold">Product</th>
                    <th className="px-4 py-3.5 font-semibold">Event Type</th>
                    <th className="px-4 py-3.5 font-semibold text-right">Quantity Delta</th>
                    <th className="px-4 py-3.5 font-semibold text-right">Stock (Before → After)</th>
                    <th className="px-4 py-3.5 font-semibold">Reason / Audit Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
                  {movLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-gray-500">
                        <div className="inline-flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-brand-600" />
                          Loading audit movements...
                        </div>
                      </td>
                    </tr>
                  ) : movements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-gray-500">
                        No movement audit logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => {
                      const delta = Number(m.quantity) || 0;
                      const isPositive = delta > 0;

                      return (
                        <tr
                          key={m.id}
                          className="transition hover:bg-gray-50/60 dark:hover:bg-navy-950/40"
                        >
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {new Date(m.created_at).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>

                          <td className="px-4 py-3 font-medium text-navy-900 dark:text-white">
                            {m.branch?.name || 'Downtown Branch'}
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-semibold text-navy-900 dark:text-white">
                              {m.product?.name || 'Product'}
                            </span>
                            {m.product?.sku && (
                              <span className="ml-1.5 font-mono text-[11px] text-gray-400">
                                ({m.product.sku})
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 capitalize">
                            <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-navy-800 dark:text-gray-300">
                              {m.movement_type.replace('_', ' ')}
                            </span>
                          </td>

                          <td
                            className={`px-4 py-3 text-right font-bold text-sm ${
                              isPositive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {isPositive ? `+${delta}` : delta}
                          </td>

                          <td className="px-4 py-3 text-right font-mono text-gray-500 dark:text-gray-400">
                            {m.previous_stock} → <strong className="text-navy-900 dark:text-white">{m.new_stock}</strong>
                          </td>

                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-sm">
                            <p className="truncate">{m.reason || 'Audit log'}</p>
                            {m.reference_id && (
                              <p className="font-mono text-[10px] text-gray-400">
                                Ref: {m.reference_id}
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Movements Pagination Bar */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row dark:border-navy-800">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Showing {movements.length} of {movTotalCount} audit events
              </span>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Page {movPage} of {totalMovPages}
                </span>
                <div className="inline-flex rounded-xl border border-gray-200 bg-white shadow-xs dark:border-navy-700 dark:bg-navy-950">
                  <button
                    onClick={() => setMovPage((p) => Math.max(1, p - 1))}
                    disabled={movPage === 1}
                    className="p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30 dark:hover:bg-navy-800"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setMovPage((p) => Math.min(totalMovPages, p + 1))}
                    disabled={movPage >= totalMovPages}
                    className="p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30 dark:hover:bg-navy-800"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <StockAdjustmentModal
        isOpen={isAdjustOpen}
        onClose={() => {
          setIsAdjustOpen(false);
          setAdjustProduct(null);
        }}
        onSuccess={() => {
          loadInventory();
          if (activeTab === 'movements') loadMovements();
          addToast('success', 'Stock adjustment recorded.');
        }}
        product={adjustProduct}
        products={allProducts}
        branches={branches}
        initialBranchId={adjustBranchId}
      />

      <StockTransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onSuccess={() => {
          loadInventory();
          if (activeTab === 'movements') loadMovements();
          addToast('success', 'Inter-branch stock transfer completed.');
        }}
        products={allProducts}
        branches={branches}
        selectedBranchId={selectedBranchId !== 'all' ? selectedBranchId : null}
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
        onEdit={() => {}}
        onAdjustStock={(prod, bId) => {
          setIsDetailOpen(false);
          setAdjustProduct(prod);
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
    </div>
  );
}
