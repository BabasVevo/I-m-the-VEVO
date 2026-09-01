import { useState, useEffect } from 'react';
import {
  X,
  Package,
  Barcode,
  Layers,
  Building2,
  History,
  Edit,
  Sliders,
  Printer,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import type { Product, StockMovement, Branch } from '@/types/database';
import { fetchStockMovements } from '@/services/inventoryService';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  branches: Branch[];
  currencySymbol?: string;
  onEdit: (product: Product) => void;
  onAdjustStock: (product: Product, branchId?: string) => void;
  onPrintBarcode: (product: Product) => void;
}

export function ProductDetailModal({
  isOpen,
  onClose,
  product,
  branches,
  currencySymbol = 'BIF',
  onEdit,
  onAdjustStock,
  onPrintBarcode,
}: ProductDetailModalProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      setLoadingMovements(true);
      fetchStockMovements(product.business_id, {
        productId: product.id,
        pageSize: 8,
      })
        .then((res) => setMovements(res.movements))
        .finally(() => setLoadingMovements(false));
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const cost = Number(product.cost_price) || 0;
  const selling = Number(product.selling_price) || 0;
  const unitProfit = selling - cost;
  const marginPct = selling > 0 ? (unitProfit / selling) * 100 : 0;
  const totalStock = product.total_stock ?? 0;
  const totalCostValuation = totalStock * cost;
  const totalRetailValuation = totalStock * selling;

  const invList = product.inventory || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-navy-800 dark:bg-navy-900"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-6 dark:border-navy-800">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center dark:border-navy-700 dark:bg-navy-800">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package className="h-7 w-7 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-navy-900 dark:text-white">
                  {product.name}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    product.is_active
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-navy-800 dark:text-gray-400'
                  }`}
                >
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3 mt-1">
                {product.brand && <span>Brand: <strong className="text-navy-900 dark:text-white">{product.brand}</strong></span>}
                {product.category && <span>Category: <strong className="text-navy-900 dark:text-white">{product.category.name}</strong></span>}
                <span>Unit: <strong className="text-navy-900 dark:text-white">{product.unit}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintBarcode(product)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800"
              title="Print Barcode Label"
            >
              <Printer className="h-4 w-4" /> Barcode
            </button>
            <button
              onClick={() => onAdjustStock(product)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:bg-brand-950/60 dark:text-brand-300 dark:hover:bg-brand-900/60"
            >
              <Sliders className="h-4 w-4" /> Adjust Stock
            </button>
            <button
              onClick={() => onEdit(product)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-800 dark:bg-brand-600 dark:hover:bg-brand-500"
            >
              <Edit className="h-4 w-4" /> Edit
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-navy-800 dark:hover:text-gray-300 ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-navy-800 dark:bg-navy-950/40">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Selling Price</p>
              <p className="mt-1 text-lg font-bold text-navy-900 dark:text-white">
                {currencySymbol} {selling.toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] text-gray-400">Cost: {currencySymbol} {cost.toLocaleString()}</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-navy-800 dark:bg-navy-950/40">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Gross Margin</p>
              <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {marginPct.toFixed(1)}%
              </p>
              <p className="mt-1 text-[11px] text-gray-400">Profit: +{currencySymbol} {unitProfit.toLocaleString()}</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-navy-800 dark:bg-navy-950/40">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Stock on Hand</p>
              <p className="mt-1 text-lg font-bold text-navy-900 dark:text-white">
                {totalStock} {product.unit}
              </p>
              <p className="mt-1 text-[11px] text-gray-400">Min Alert: {product.min_stock_level} {product.unit}</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-navy-800 dark:bg-navy-950/40">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Stock Valuation (Cost)</p>
              <p className="mt-1 text-lg font-bold text-brand-600 dark:text-brand-400">
                {currencySymbol} {totalCostValuation.toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] text-gray-400">Retail: {currencySymbol} {totalRetailValuation.toLocaleString()}</p>
            </div>
          </div>

          {/* Barcode & SKU Card */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/40 p-4 dark:border-navy-700 dark:bg-navy-950/30">
            <div className="flex items-center gap-3">
              <Barcode className="h-6 w-6 text-gray-400" />
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Barcode</p>
                <p className="font-mono text-sm font-bold text-navy-900 dark:text-white">
                  {product.barcode || 'None assigned'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Layers className="h-6 w-6 text-gray-400" />
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">SKU Code</p>
                <p className="font-mono text-sm font-bold text-navy-900 dark:text-white">
                  {product.sku || 'None assigned'}
                </p>
              </div>
            </div>

            {product.description && (
              <div className="w-full text-xs text-gray-600 dark:text-gray-300 border-t border-gray-200 pt-3 dark:border-navy-800">
                <span className="font-semibold text-navy-900 dark:text-white">Description: </span>
                {product.description}
              </div>
            )}
          </div>

          {/* Multi-Branch Inventory Breakdown Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <h4 className="text-sm font-bold text-navy-900 dark:text-white">
                  Branch Inventory Breakdown
                </h4>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-navy-800">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-100 bg-gray-50/80 text-gray-500 dark:border-navy-800 dark:bg-navy-950/60 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Branch Location</th>
                    <th className="px-4 py-3 font-semibold">Location in Store</th>
                    <th className="px-4 py-3 font-semibold text-right">Quantity</th>
                    <th className="px-4 py-3 font-semibold text-right">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Valuation (Cost)</th>
                    <th className="px-4 py-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
                  {branches.map((branch) => {
                    const inv = invList.find((i) => i.branch_id === branch.id);
                    const qty = inv ? Number(inv.quantity) || 0 : 0;
                    const minQ = inv ? Number(inv.min_quantity) || 5 : product.min_stock_level;
                    const val = qty * cost;

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
                      <tr key={branch.id} className="hover:bg-gray-50/50 dark:hover:bg-navy-950/30">
                        <td className="px-4 py-3 font-medium text-navy-900 dark:text-white">
                          {branch.name}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          {inv?.location_in_store || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-navy-900 dark:text-white">
                          {qty} {product.unit}
                        </td>
                        <td className="px-4 py-3 text-right">{statusBadge}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">
                          {currencySymbol} {val.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => onAdjustStock(product, branch.id)}
                            className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400"
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Stock Movement Audit History */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <h4 className="text-sm font-bold text-navy-900 dark:text-white">
                Recent Stock Movements
              </h4>
            </div>

            {loadingMovements ? (
              <div className="py-6 text-center text-xs text-gray-500">Loading audit history...</div>
            ) : movements.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6 text-center text-xs text-gray-500 dark:border-navy-800 dark:bg-navy-950/40">
                No recent stock movements recorded for this product yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-navy-800">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-gray-100 bg-gray-50/80 text-gray-500 dark:border-navy-800 dark:bg-navy-950/60 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Date / Time</th>
                      <th className="px-4 py-2.5 font-semibold">Branch</th>
                      <th className="px-4 py-2.5 font-semibold">Type</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Change</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Balance</th>
                      <th className="px-4 py-2.5 font-semibold">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
                    {movements.map((m) => {
                      const isPositive = Number(m.quantity) > 0;
                      return (
                        <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-navy-950/30">
                          <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                            {new Date(m.created_at).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-2.5 text-navy-900 dark:text-white font-medium">
                            {m.branch?.name || 'Downtown Branch'}
                          </td>
                          <td className="px-4 py-2.5 capitalize">
                            <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-navy-800 dark:text-gray-300">
                              {m.movement_type.replace('_', ' ')}
                            </span>
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right font-bold ${
                              isPositive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {isPositive ? `+${m.quantity}` : m.quantity}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-gray-500 dark:text-gray-400">
                            {m.previous_stock} → <strong className="text-navy-900 dark:text-white">{m.new_stock}</strong>
                          </td>
                          <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300 truncate max-w-xs">
                            {m.reason || 'Manual adjustment'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end border-t border-gray-100 p-4 dark:border-navy-800">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
