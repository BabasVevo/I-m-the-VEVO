import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search,
  Scan,
  Maximize2,
  Minimize2,
  Clock,
  LayoutGrid,
  List,
  ChevronDown,
  Building2,
  ShoppingCart,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/context/ToastContext';
import type { Product, Category, Customer, Branch, Sale } from '@/types/database';
import type { CartItem, SaleDiscount, HeldSale } from '@/services/saleService';
import { fetchProducts } from '@/services/productService';
import { fetchCategories } from '@/services/categoryService';
import { fetchBranches } from '@/services/dashboardService';
import {
  getHeldSales,
  saveHeldSale,
  removeHeldSale,
  playPosBeep,
} from '@/services/saleService';
import { formatCurrency } from '@/lib/format';

// Subcomponents
import { ProductGrid } from '@/components/pos/ProductGrid';
import { PosCart } from '@/components/pos/PosCart';
import { CustomerSelectModal } from '@/components/pos/CustomerSelectModal';
import { CustomerCreateModal } from '@/components/pos/CustomerCreateModal';
import { DiscountModal } from '@/components/pos/DiscountModal';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { HeldSalesModal } from '@/components/pos/HeldSalesModal';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';

export function PosPage() {
  const { business, profile, branch: authBranch, role } = useAuth();
  const { hasPermission } = usePermissions();
  const { addToast } = useToast();

  const businessId = business?.id || 'demo-biz-1';
  const currency = business?.currency || 'TZS';
  const taxRate = business?.tax_rate ?? 18.0;

  // Branch Selection
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    authBranch?.id || profile?.branch_id || 'branch-downtown'
  );

  // Products & Categories State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saleDiscount, setSaleDiscount] = useState<SaleDiscount>({
    type: 'percentage',
    value: 0,
    amount: 0,
  });

  // Held Orders State
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);

  // Modals
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false);
  const [isCustomerCreateOpen, setIsCustomerCreateOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Discount Modal State
  const [discountModalConfig, setDiscountModalConfig] = useState<{
    isOpen: boolean;
    mode: 'item' | 'sale';
    targetItem?: CartItem;
  }>({
    isOpen: false,
    mode: 'sale',
  });

  // Fullscreen state & Mobile cart view
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Permissions check
  const isManagerOrOwner =
    role?.name === 'super_admin' ||
    role?.name === 'business_owner' ||
    role?.name === 'branch_manager';
  const canOverrideStock = isManagerOrOwner || hasPermission('stock.override');
  const canApplyDiscount = isManagerOrOwner || hasPermission('pos.discount') || true;

  // Load branches, categories, products
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedBranches, fetchedCategories, fetchedProducts] = await Promise.all([
        fetchBranches(businessId),
        fetchCategories(businessId),
        fetchProducts({ businessId, branchId: selectedBranchId, pageSize: 200 }),
      ]);

      setBranches(fetchedBranches);
      setCategories(fetchedCategories);
      setProducts(fetchedProducts.products);
      setHeldSales(getHeldSales(businessId, selectedBranchId));
    } catch (err) {
      console.error('Error initializing POS data:', err);
      addToast({
        type: 'error',
        title: 'Error loading POS',
        message: 'Could not fetch catalog records. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [businessId, selectedBranchId, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cart helper map for rapid quantity lookups
  const cartMap = useMemo(() => {
    const map: Record<string, number> = {};
    cartItems.forEach((it) => {
      map[it.productId] = (map[it.productId] || 0) + it.quantity;
    });
    return map;
  }, [cartItems]);

  // Active branch object
  const activeBranch = useMemo(() => {
    return branches.find((b) => b.id === selectedBranchId) || authBranch || null;
  }, [branches, selectedBranchId, authBranch]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategoryId !== 'all' && p.category_id !== selectedCategoryId) {
        return false;
      }

      // Branch stock check
      const branchInv = p.inventory?.find((i) => i.branch_id === selectedBranchId);
      const available = branchInv ? Number(branchInv.quantity) || 0 : (p.total_stock ?? 0);

      // Stock status filter
      if (stockStatusFilter === 'in_stock' && available <= 0) {
        return false;
      }

      // Search query filter (name, SKU, Barcode, Brand)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        const matchBarcode = p.barcode?.toLowerCase().includes(q);
        const matchBrand = p.brand?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchBarcode && !matchBrand) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedCategoryId, selectedBranchId, stockStatusFilter, searchQuery]);

  // Add Product to Cart
  const handleAddToCart = useCallback(
    (product: Product, quantityToAdd = 1) => {
      const branchInv = product.inventory?.find((i) => i.branch_id === selectedBranchId);
      const stockAvailable = branchInv ? Number(branchInv.quantity) || 0 : (product.total_stock ?? 0);

      if (stockAvailable <= 0 && !canOverrideStock) {
        addToast({
          type: 'warning',
          title: 'Out of Stock',
          message: `${product.name} is out of stock in this branch.`,
        });
        playPosBeep('warning');
        return;
      }

      setCartItems((prev) => {
        const existingIdx = prev.findIndex((i) => i.productId === product.id);
        if (existingIdx >= 0) {
          const currentItem = prev[existingIdx];
          const newQty = currentItem.quantity + quantityToAdd;

          if (newQty > stockAvailable && !canOverrideStock) {
            addToast({
              type: 'warning',
              title: 'Stock Limit Reached',
              message: `Only ${stockAvailable} units available in stock.`,
            });
            playPosBeep('warning');
            return prev;
          }

          const lineSubtotal = newQty * currentItem.unitPrice;
          const lineDiscount = newQty * currentItem.discountAmount;
          const lineTotal = lineSubtotal - lineDiscount;

          const updated = [...prev];
          updated[existingIdx] = {
            ...currentItem,
            quantity: newQty,
            lineSubtotal,
            lineDiscount,
            lineTotal,
          };
          playPosBeep('success');
          return updated;
        }

        // New item in cart
        const unitPrice = Number(product.selling_price) || 0;
        const costPrice = Number(product.cost_price) || 0;
        const lineSubtotal = quantityToAdd * unitPrice;

        const newItem: CartItem = {
          id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          product,
          quantity: quantityToAdd,
          unitPrice,
          costPrice,
          discountType: 'percentage',
          discountValue: 0,
          discountAmount: 0,
          lineSubtotal,
          lineDiscount: 0,
          lineTotal: lineSubtotal,
          stockAvailable,
        };

        playPosBeep('success');
        return [newItem, ...prev];
      });
    },
    [selectedBranchId, canOverrideStock, addToast]
  );

  // Barcode Handler (from scanner or manual scan)
  const handleBarcodeScan = useCallback(
    (barcode: string) => {
      const code = barcode.trim().toLowerCase();
      if (!code) return;

      const found = products.find(
        (p) =>
          p.barcode?.toLowerCase() === code ||
          p.sku?.toLowerCase() === code ||
          p.name.toLowerCase() === code
      );

      if (found) {
        handleAddToCart(found, 1);
        addToast({
          type: 'success',
          title: 'Product Scanned',
          message: `${found.name} added to cart.`,
        });
        setSearchQuery('');
      } else {
        addToast({
          type: 'error',
          title: 'Barcode Not Found',
          message: `No product matches barcode or SKU "${barcode}".`,
        });
        playPosBeep('error');
      }
    },
    [products, handleAddToCart, addToast]
  );

  // Cart Actions
  const handleUpdateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    setCartItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const lineSubtotal = newQty * it.unitPrice;
        const lineDiscount = newQty * it.discountAmount;
        const lineTotal = lineSubtotal - lineDiscount;
        return {
          ...it,
          quantity: newQty,
          lineSubtotal,
          lineDiscount,
          lineTotal,
        };
      })
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((it) => it.id !== itemId));
    playPosBeep('warning');
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    if (window.confirm('Are you sure you want to clear the entire cart?')) {
      setCartItems([]);
      setSelectedCustomer(null);
      setSaleDiscount({ type: 'percentage', value: 0, amount: 0 });
      playPosBeep('warning');
    }
  };

  // Hold / Park current sale
  const handleHoldSale = useCallback(() => {
    if (cartItems.length === 0) return;

    const note = window.prompt('Enter an optional label or note for this held order:', '');
    const rawSubtotal = cartItems.reduce((sum, i) => sum + i.lineTotal, 0);
    const overallDisc =
      saleDiscount.type === 'percentage'
        ? (rawSubtotal * saleDiscount.value) / 100
        : saleDiscount.value;
    const discounted = Math.max(0, rawSubtotal - overallDisc);
    const tax = (discounted * taxRate) / 100;
    const total = discounted + tax;

    const heldObj: HeldSale = {
      id: `held-${Date.now()}`,
      businessId,
      branchId: selectedBranchId,
      heldAt: new Date().toISOString(),
      note: note || undefined,
      customer: selectedCustomer,
      items: cartItems,
      saleDiscount,
      taxRate,
      subtotal: rawSubtotal,
      totalAmount: total,
    };

    saveHeldSale(heldObj);
    setHeldSales(getHeldSales(businessId, selectedBranchId));
    setCartItems([]);
    setSelectedCustomer(null);
    setSaleDiscount({ type: 'percentage', value: 0, amount: 0 });

    addToast({
      type: 'info',
      title: 'Order Parked',
      message: 'Cart saved to Held Orders. You can recall it anytime.',
    });
    playPosBeep('success');
  }, [cartItems, saleDiscount, taxRate, businessId, selectedBranchId, selectedCustomer, addToast]);

  // Recall Held Sale
  const handleRecallSale = (heldSale: HeldSale) => {
    if (cartItems.length > 0) {
      if (!window.confirm('Current cart has items. Replace with the held order?')) {
        return;
      }
    }

    setCartItems(heldSale.items);
    setSelectedCustomer(heldSale.customer);
    setSaleDiscount(heldSale.saleDiscount);
    removeHeldSale(heldSale.id);
    setHeldSales(getHeldSales(businessId, selectedBranchId));

    addToast({
      type: 'success',
      title: 'Order Resumed',
      message: 'Held order restored to active cart.',
    });
    playPosBeep('success');
  };

  const handleDiscardHeldSale = (heldSaleId: string) => {
    removeHeldSale(heldSaleId);
    setHeldSales(getHeldSales(businessId, selectedBranchId));
    addToast({
      type: 'info',
      title: 'Held Order Removed',
      message: 'The parked order was discarded.',
    });
  };

  // Discount Modals
  const handleOpenItemDiscountModal = (item: CartItem) => {
    setDiscountModalConfig({
      isOpen: true,
      mode: 'item',
      targetItem: item,
    });
  };

  const handleOpenSaleDiscountModal = () => {
    setDiscountModalConfig({
      isOpen: true,
      mode: 'sale',
    });
  };

  const handleApplyDiscount = (discount: {
    type: 'percentage' | 'fixed';
    value: number;
    amount: number;
    reason?: string;
  }) => {
    if (discountModalConfig.mode === 'item' && discountModalConfig.targetItem) {
      const targetId = discountModalConfig.targetItem.id;
      setCartItems((prev) =>
        prev.map((it) => {
          if (it.id !== targetId) return it;
          const discAmountPerUnit =
            discount.type === 'percentage'
              ? (it.unitPrice * discount.value) / 100
              : Math.min(it.unitPrice, discount.value);

          const lineDiscount = it.quantity * discAmountPerUnit;
          const lineTotal = it.lineSubtotal - lineDiscount;

          return {
            ...it,
            discountType: discount.type,
            discountValue: discount.value,
            discountAmount: discAmountPerUnit,
            lineDiscount,
            lineTotal,
          };
        })
      );
    } else {
      // Entire Sale Discount
      setSaleDiscount(discount);
    }
  };

  // Sale Completed Trigger
  const handleSaleCompleted = (sale: Sale) => {
    setCompletedSale(sale);
    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);
    setCartItems([]);
    setSelectedCustomer(null);
    setSaleDiscount({ type: 'percentage', value: 0, amount: 0 });
    // Refresh products stock
    loadData();
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard Shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when focused inside an input or textarea
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT';

      if (e.key === 'F2' || (e.key === '/' && !isInput)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F4' && !isInput) {
        e.preventDefault();
        setIsCustomerSelectOpen(true);
      } else if (e.key === 'F8' && !isInput) {
        e.preventDefault();
        if (cartItems.length > 0) setIsPaymentModalOpen(true);
      } else if (e.key === 'F9' && !isInput) {
        e.preventDefault();
        if (cartItems.length > 0) handleHoldSale();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, handleHoldSale]);

  // Cart Calculations for Payment Modal
  const rawSubtotal = cartItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const overallDiscountAmount =
    saleDiscount.type === 'percentage'
      ? (rawSubtotal * saleDiscount.value) / 100
      : Math.min(rawSubtotal, saleDiscount.value);
  const discountedSubtotal = Math.max(0, rawSubtotal - overallDiscountAmount);
  const calculatedTax = (discountedSubtotal * taxRate) / 100;
  const grandTotal = discountedSubtotal + calculatedTax;
  const totalItemsCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-gray-100 dark:bg-navy-950">
      {/* 1. TOP POS TOOLBAR */}
      <div className="z-10 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5 shadow-2xs dark:border-navy-800 dark:bg-navy-900">
        {/* Left: Brand & Branch selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 font-black text-white shadow-xs">
              POS
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-navy-900 dark:text-white">
                Cash Register
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                <span>Online</span>
                <span>•</span>
                <span>{profile?.full_name || 'Cashier'}</span>
              </div>
            </div>
          </div>

          {/* Branch Switcher */}
          {branches.length > 1 && (
            <div className="relative ml-2 hidden sm:block">
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="appearance-none rounded-xl border border-gray-200 bg-gray-50 py-1.5 pr-8 pl-8 text-xs font-bold text-navy-900 outline-hidden transition focus:border-brand-500 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <Building2 className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3 w-3 -translate-y-1/2 text-gray-400" />
            </div>
          )}
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2">
          {/* Barcode Scanner Button */}
          <button
            type="button"
            id="pos-btn-scanner"
            onClick={() => setIsBarcodeScannerOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-navy-900 shadow-2xs hover:border-brand-500 hover:bg-brand-50 dark:border-navy-700 dark:bg-navy-900 dark:text-white dark:hover:bg-navy-800"
            title="Scan Barcode using Camera or Manual Input"
          >
            <Scan className="h-3.5 w-3.5 text-brand-500" />
            <span className="hidden md:inline">Scan Barcode</span>
          </button>

          {/* Held Orders Drawer Button */}
          <button
            type="button"
            id="pos-btn-held-orders"
            onClick={() => setIsHeldModalOpen(true)}
            className={`relative flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              heldSales.length > 0
                ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300'
            }`}
            title="View Held / Parked Orders"
          >
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span>Held</span>
            {heldSales.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-white">
                {heldSales.length}
              </span>
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-400 dark:hover:bg-navy-800"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. MAIN LAYOUT: CATALOG (LEFT) & CART (RIGHT) */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT / MAIN CATALOG AREA */}
        <div className="flex flex-1 flex-col overflow-hidden p-3 sm:p-4">
          {/* Search, Categories, & Filters */}
          <div className="mb-3 space-y-2.5">
            {/* Top Search Bar with Barcode auto-add on Enter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      handleBarcodeScan(searchQuery.trim());
                    }
                  }}
                  placeholder="Search products by name, SKU, or press Enter for exact barcode... [/]"
                  className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pr-4 pl-10 text-xs font-semibold text-navy-900 shadow-2xs outline-hidden transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex rounded-2xl border border-gray-200 bg-white p-1 shadow-2xs dark:border-navy-700 dark:bg-navy-900">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`rounded-xl p-1.5 transition ${
                    viewMode === 'grid'
                      ? 'bg-brand-500 text-white'
                      : 'text-gray-400 hover:text-navy-900 dark:hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`rounded-xl p-1.5 transition ${
                    viewMode === 'list'
                      ? 'bg-brand-500 text-white'
                      : 'text-gray-400 hover:text-navy-900 dark:hover:text-white'
                  }`}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Category Chips Bar & In-Stock filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategoryId('all')}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  selectedCategoryId === 'all'
                    ? 'bg-navy-900 text-white shadow-xs dark:bg-white dark:text-navy-900'
                    : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300'
                }`}
              >
                All ({products.length})
              </button>

              <button
                type="button"
                onClick={() => setStockStatusFilter(stockStatusFilter === 'all' ? 'in_stock' : 'all')}
                className={`shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${
                  stockStatusFilter === 'in_stock'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300'
                }`}
              >
                {stockStatusFilter === 'in_stock' ? '✓ In-Stock Only' : 'In-Stock Only'}
              </button>

              {categories.map((cat) => {
                const count = products.filter((p) => p.category_id === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      selectedCategoryId === cat.id
                        ? 'bg-navy-900 text-white shadow-xs dark:bg-white dark:text-navy-900'
                        : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300'
                    }`}
                  >
                    {cat.name} {count > 0 && `(${count})`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catalog Product Grid / List container */}
          <div className="flex-1 overflow-y-auto pr-1">
            <ProductGrid
              products={filteredProducts}
              branchId={selectedBranchId}
              loading={loading}
              cartMap={cartMap}
              onAddToCart={handleAddToCart}
              currency={currency}
              viewMode={viewMode}
              canOverrideStock={canOverrideStock}
            />
          </div>
        </div>

        {/* RIGHT / CART AREA (Desktop: Split Panel / Mobile: Hidden or Drawer) */}
        <div className="hidden w-80 shrink-0 border-l border-gray-200 p-3 lg:block xl:w-96 dark:border-navy-800">
          <PosCart
            items={cartItems}
            customer={selectedCustomer}
            saleDiscount={saleDiscount}
            taxRate={taxRate}
            currency={currency}
            canOverrideStock={canOverrideStock}
            canApplyDiscount={canApplyDiscount}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onOpenCustomerSelect={() => setIsCustomerSelectOpen(true)}
            onOpenCustomerCreate={() => setIsCustomerCreateOpen(true)}
            onOpenItemDiscountModal={handleOpenItemDiscountModal}
            onOpenSaleDiscountModal={handleOpenSaleDiscountModal}
            onHoldSale={handleHoldSale}
            onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
          />
        </div>
      </div>

      {/* 3. MOBILE FLOATING CART BAR (Bottom on small screens) */}
      <div className="block border-t border-gray-200 bg-white p-3 lg:hidden dark:border-navy-800 dark:bg-navy-900">
        <button
          type="button"
          onClick={() => setMobileCartOpen(true)}
          className="flex w-full items-center justify-between rounded-2xl bg-brand-500 px-4 py-3 text-sm font-extrabold text-white shadow-md active:scale-98"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <span>View Cart ({totalItemsCount} items)</span>
          </div>
          <span>{formatCurrency(grandTotal, currency)}</span>
        </button>
      </div>

      {/* MOBILE CART DRAWER */}
      {mobileCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-navy-950/60 backdrop-blur-xs lg:hidden">
          <div className="mt-12 flex flex-1 flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-navy-900">
            <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-navy-800">
              <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                Current Sale Cart ({totalItemsCount} items)
              </h3>
              <button
                type="button"
                onClick={() => setMobileCartOpen(false)}
                className="rounded-xl p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-3">
              <PosCart
                items={cartItems}
                customer={selectedCustomer}
                saleDiscount={saleDiscount}
                taxRate={taxRate}
                currency={currency}
                canOverrideStock={canOverrideStock}
                canApplyDiscount={canApplyDiscount}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                onOpenCustomerSelect={() => setIsCustomerSelectOpen(true)}
                onOpenCustomerCreate={() => setIsCustomerCreateOpen(true)}
                onOpenItemDiscountModal={handleOpenItemDiscountModal}
                onOpenSaleDiscountModal={handleOpenSaleDiscountModal}
                onHoldSale={() => {
                  handleHoldSale();
                  setMobileCartOpen(false);
                }}
                onOpenPaymentModal={() => {
                  setMobileCartOpen(false);
                  setIsPaymentModalOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. MODALS */}
      <CustomerSelectModal
        isOpen={isCustomerSelectOpen}
        businessId={businessId}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={(c) => setSelectedCustomer(c)}
        onOpenCreateCustomer={() => setIsCustomerCreateOpen(true)}
        onClose={() => setIsCustomerSelectOpen(false)}
        currency={currency}
      />

      <CustomerCreateModal
        isOpen={isCustomerCreateOpen}
        businessId={businessId}
        onCreated={(newCust) => setSelectedCustomer(newCust)}
        onClose={() => setIsCustomerCreateOpen(false)}
      />

      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onScan={handleBarcodeScan}
        onClose={() => setIsBarcodeScannerOpen(false)}
      />

      <DiscountModal
        isOpen={discountModalConfig.isOpen}
        title={
          discountModalConfig.mode === 'item'
            ? `Discount for ${discountModalConfig.targetItem?.product.name}`
            : 'Discount for Entire Sale'
        }
        originalAmount={
          discountModalConfig.mode === 'item'
            ? discountModalConfig.targetItem?.lineSubtotal || 0
            : rawSubtotal
        }
        initialType={
          discountModalConfig.mode === 'item'
            ? discountModalConfig.targetItem?.discountType
            : saleDiscount.type
        }
        initialValue={
          discountModalConfig.mode === 'item'
            ? discountModalConfig.targetItem?.discountValue
            : saleDiscount.value
        }
        currency={currency}
        isManagerOrOwner={isManagerOrOwner}
        onApply={handleApplyDiscount}
        onClose={() => setDiscountModalConfig({ isOpen: false, mode: 'sale' })}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        businessId={businessId}
        branchId={selectedBranchId}
        cashierProfile={profile}
        branch={activeBranch}
        customer={selectedCustomer}
        items={cartItems}
        subtotal={rawSubtotal}
        discountAmount={overallDiscountAmount}
        saleDiscount={saleDiscount}
        taxRate={taxRate}
        taxAmount={calculatedTax}
        totalAmount={grandTotal}
        currency={currency}
        onSaleCompleted={handleSaleCompleted}
        onClose={() => setIsPaymentModalOpen(false)}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        sale={completedSale}
        businessName={business?.name}
        businessAddress={business?.address}
        businessPhone={business?.phone}
        businessEmail={business?.email}
        currency={currency}
        onNewSale={() => {
          setIsReceiptModalOpen(false);
          setCompletedSale(null);
        }}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setCompletedSale(null);
        }}
      />

      <HeldSalesModal
        isOpen={isHeldModalOpen}
        heldSales={heldSales}
        currency={currency}
        onRecallSale={handleRecallSale}
        onDiscardSale={handleDiscardHeldSale}
        onClose={() => setIsHeldModalOpen(false)}
      />
    </div>
  );
}
