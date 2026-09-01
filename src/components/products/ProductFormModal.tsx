import { useState, useEffect } from 'react';
import {
  X,
  Package,
  Sparkles,
  Barcode,
  Image as ImageIcon,
  Building2,
  Loader2,
  Plus,
} from 'lucide-react';
import type { Product, Category, Branch } from '@/types/database';
import { generateSku, generateBarcode, CreateProductInput } from '@/services/productService';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateProductInput) => Promise<void>;
  product?: Product | null;
  categories: Category[];
  branches: Branch[];
  currencySymbol?: string;
  onQuickAddCategory?: () => void;
}

const UNIT_OPTIONS = [
  'pcs',
  'kg',
  'g',
  'box',
  'pack',
  'bottle',
  'jar',
  'can',
  'bundle',
  'meter',
  'liter',
];

export function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  product,
  categories,
  branches,
  currencySymbol = 'BIF',
  onQuickAddCategory,
}: ProductFormModalProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [minStockLevel, setMinStockLevel] = useState<number>(5);
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [branchStock, setBranchStock] = useState<Record<string, number>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategoryId(product.category_id || '');
      setSku(product.sku || '');
      setBarcode(product.barcode || '');
      setBrand(product.brand || '');
      setDescription(product.description || '');
      setUnit(product.unit || 'pcs');
      setCostPrice(product.cost_price);
      setSellingPrice(product.selling_price);
      setMinStockLevel(product.min_stock_level || 5);
      setImageUrl(product.image_url || '');
      setIsActive(product.is_active);
      setBranchStock({});
    } else {
      setName('');
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setSku('');
      setBarcode('');
      setBrand('');
      setDescription('');
      setUnit('pcs');
      setCostPrice('');
      setSellingPrice('');
      setMinStockLevel(5);
      setImageUrl('');
      setIsActive(true);
      // Initialize branch initial stock map with 0
      const initialMap: Record<string, number> = {};
      branches.forEach((b) => {
        initialMap[b.id] = 0;
      });
      setBranchStock(initialMap);
    }
    setError(null);
  }, [product, isOpen, categories, branches]);

  if (!isOpen) return null;

  // Real-time Margin calculation
  const numCost = Number(costPrice) || 0;
  const numSelling = Number(sellingPrice) || 0;
  const grossProfit = numSelling - numCost;
  const marginPercent = numSelling > 0 ? (grossProfit / numSelling) * 100 : 0;
  const markupPercent = numCost > 0 ? (grossProfit / numCost) * 100 : 0;

  const handleGenerateSku = () => {
    const selectedCat = categories.find((c) => c.id === categoryId);
    setSku(generateSku(name || 'PRD', selectedCat?.name));
  };

  const handleGenerateBarcode = () => {
    setBarcode(generateBarcode());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product name is required');
      return;
    }
    if (numSelling <= 0) {
      setError('Selling price must be greater than 0');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await onSave({
        name: name.trim(),
        category_id: categoryId || null,
        sku: sku.trim() || generateSku(name),
        barcode: barcode.trim() || generateBarcode(),
        brand: brand.trim() || null,
        description: description.trim() || null,
        unit,
        cost_price: numCost,
        selling_price: numSelling,
        min_stock_level: minStockLevel,
        image_url: imageUrl.trim() || null,
        is_active: isActive,
        initialStockByBranch: !product ? branchStock : undefined,
      });

      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save product';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-navy-800 dark:bg-navy-900"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-6 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-900 dark:text-white">
                {product ? 'Edit Product' : 'Add New Product'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {product
                  ? 'Update SKU, prices, catalog specifications and settings'
                  : 'Add product catalog entry with barcodes, pricing, and initial stock'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-navy-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Basic Information
            </h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Organic Arabica Coffee Beans (1kg)"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  {onQuickAddCategory && (
                    <button
                      type="button"
                      onClick={onQuickAddCategory}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                      <Plus className="h-3 w-3" /> New Category
                    </button>
                  )}
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                >
                  <option value="">-- No Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Brand / Manufacturer
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Kibira Estate"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    SKU (Stock Keeping Unit)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline dark:text-brand-400"
                  >
                    <Sparkles className="h-3 w-3" /> Auto-generate
                  </button>
                </div>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. COF-ARA-001"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 font-mono text-sm text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Barcode (EAN / UPC / Code128)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline dark:text-brand-400"
                  >
                    <Barcode className="h-3 w-3" /> Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="e.g. 616400018901"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 font-mono text-sm text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Unit of Measure
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Minimum Stock Alert Level
                </label>
                <input
                  type="number"
                  min="0"
                  value={minStockLevel}
                  onChange={(e) => setMinStockLevel(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product characteristics, storage instructions, ingredients..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              />
            </div>
          </div>

          {/* Section 2: Pricing & Profit Margins */}
          <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-navy-800 dark:bg-navy-950/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Pricing & Profit Analysis
            </h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Cost Price ({currencySymbol}) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs text-gray-400 font-mono">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={costPrice}
                    onChange={(e) =>
                      setCostPrice(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-200 bg-white pl-14 pr-3.5 py-2.5 font-medium text-sm text-navy-900 outline-hidden transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Selling Price ({currencySymbol}) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs text-gray-400 font-mono">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={sellingPrice}
                    onChange={(e) =>
                      setSellingPrice(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-200 bg-white pl-14 pr-3.5 py-2.5 font-medium text-sm text-navy-900 outline-hidden transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Margin & Profit Preview Badge */}
            <div className="grid grid-cols-3 gap-3 rounded-xl border border-brand-100 bg-brand-50/50 p-3 text-center dark:border-brand-900/30 dark:bg-brand-950/20">
              <div>
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Gross Profit / Unit</p>
                <p
                  className={`mt-0.5 text-sm font-bold ${
                    grossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {currencySymbol} {grossProfit.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Profit Margin</p>
                <p
                  className={`mt-0.5 text-sm font-bold ${
                    marginPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {marginPercent.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Cost Markup</p>
                <p
                  className={`mt-0.5 text-sm font-bold ${
                    markupPercent >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {markupPercent.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Initial Branch Stock Intake (Only for New Products) */}
          {!product && branches.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-navy-800 dark:bg-navy-950/40">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Initial Stock Intake by Branch
                </h4>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Specify on-hand inventory across your active locations. Automatically logs initial stock movement records.
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {branches.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-xl border border-gray-200 bg-white p-3 dark:border-navy-700 dark:bg-navy-900"
                  >
                    <p className="text-xs font-semibold text-navy-900 dark:text-white truncate">
                      {b.name}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={branchStock[b.id] ?? 0}
                        onChange={(e) =>
                          setBranchStock({
                            ...branchStock,
                            [b.id]: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm font-semibold text-navy-900 outline-hidden focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                      />
                      <span className="text-xs text-gray-500">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Image & Status */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Image URL (Optional)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ImageIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3.5 py-2.5 text-sm text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                  />
                </div>
                {imageUrl && (
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-navy-700">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3.5 dark:border-navy-800 dark:bg-navy-950/60">
              <div>
                <p className="text-sm font-medium text-navy-900 dark:text-white">Active for Sales</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Visible in POS terminal and catalog
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-hidden dark:bg-navy-800"></div>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 p-6 dark:border-navy-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {product ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </div>
    </div>
  );
}
