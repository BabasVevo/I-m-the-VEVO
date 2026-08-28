import { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Plus,
  Minus,
  Package,
  Loader2,
} from 'lucide-react';
import type { Product, Branch } from '@/types/database';
import { adjustStock, AdjustStockInput } from '@/services/inventoryService';
import { useAuth } from '@/context/AuthContext';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product | null;
  products?: Product[];
  branches: Branch[];
  initialBranchId?: string | null;
}

const COMMON_REASONS = [
  'Physical Inventory Audit Count',
  'Supplier Restock / Delivery',
  'Damaged in Store / Broken',
  'Expired / Past Shelf Life',
  'Inventory Shrinkage / Discrepancy',
  'Internal Store Usage',
  'Customer Return to Stock',
  'Correction of Past Entry',
  'Other / Custom Reason',
];

export function StockAdjustmentModal({
  isOpen,
  onClose,
  onSuccess,
  product: initialProduct,
  products = [],
  branches,
  initialBranchId,
}: StockAdjustmentModalProps) {
  const { profile } = useAuth();

  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [locationInStore, setLocationInStore] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const prodId = initialProduct?.id || (products.length > 0 ? products[0].id : '');
      setSelectedProductId(prodId);

      const branchId = initialBranchId || (branches.length > 0 ? branches[0].id : '');
      setSelectedBranchId(branchId);

      setAdjustmentType('add');
      setQuantity('');
      setReason(COMMON_REASONS[0]);
      setCustomReason('');
      setReferenceId('');
      setError(null);
    }
  }, [isOpen, initialProduct, products, branches, initialBranchId]);

  if (!isOpen) return null;

  const currentProduct =
    initialProduct?.id === selectedProductId
      ? initialProduct
      : products.find((p) => p.id === selectedProductId) || initialProduct;

  // Find existing branch inventory quantity
  const branchInv = currentProduct?.inventory?.find((i) => i.branch_id === selectedBranchId);
  const currentQuantity = branchInv ? Number(branchInv.quantity) || 0 : 0;

  const numInput = Number(quantity) || 0;
  let calculatedNewStock = currentQuantity;
  if (adjustmentType === 'add') {
    calculatedNewStock = currentQuantity + numInput;
  } else if (adjustmentType === 'remove') {
    calculatedNewStock = Math.max(0, currentQuantity - numInput);
  } else if (adjustmentType === 'set') {
    calculatedNewStock = numInput;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedBranchId) {
      setError('Please select both product and branch');
      return;
    }
    if (quantity === '' || numInput < 0) {
      setError('Please enter a valid quantity');
      return;
    }
    if (adjustmentType === 'remove' && numInput > currentQuantity) {
      setError(`Cannot remove ${numInput} units. Current stock is only ${currentQuantity} ${currentProduct?.unit || 'units'}.`);
      return;
    }

    const finalReason = reason === 'Other / Custom Reason' ? customReason.trim() : reason;
    if (!finalReason) {
      setError('Please provide a reason for this stock adjustment');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const input: AdjustStockInput = {
        businessId: profile?.business_id || 'demo-biz-1',
        branchId: selectedBranchId,
        productId: selectedProductId,
        adjustmentType,
        quantity: numInput,
        reason: finalReason,
        referenceId: referenceId.trim() || undefined,
        userId: profile?.id || null,
        locationInStore: locationInStore.trim() || undefined,
      };

      await adjustStock(input);
      onSuccess();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to adjust stock';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-navy-800 dark:bg-navy-900"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-900 dark:text-white">
                Adjust Stock Level
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Correct on-hand quantity and log an immutable audit movement
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

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Product Picker */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Product
            </label>
            {initialProduct ? (
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-2.5 dark:border-navy-700 dark:bg-navy-950">
                <Package className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <span className="text-sm font-semibold text-navy-900 dark:text-white">
                  {initialProduct.name}
                </span>
                <span className="ml-auto font-mono text-xs text-gray-500">
                  {initialProduct.sku}
                </span>
              </div>
            ) : (
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Branch Picker */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Branch Location
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Adjustment Mode Selector Buttons */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Adjustment Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('add')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition ${
                  adjustmentType === 'add'
                    ? 'border-brand-600 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-950/60 dark:text-brand-300'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800'
                }`}
              >
                <Plus className="h-3.5 w-3.5" /> Add Stock (+)
              </button>

              <button
                type="button"
                onClick={() => setAdjustmentType('remove')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition ${
                  adjustmentType === 'remove'
                    ? 'border-red-600 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-950/60 dark:text-red-300'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800'
                }`}
              >
                <Minus className="h-3.5 w-3.5" /> Remove (-)
              </button>

              <button
                type="button"
                onClick={() => setAdjustmentType('set')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition ${
                  adjustmentType === 'set'
                    ? 'border-navy-900 bg-navy-50 text-navy-900 dark:border-navy-600 dark:bg-navy-800 dark:text-white'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800'
                }`}
              >
                Set Exact (=)
              </button>
            </div>
          </div>

          {/* Current vs New Stock Visual Card */}
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 text-center dark:border-navy-800 dark:bg-navy-950/50">
            <div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Current Stock</p>
              <p className="mt-0.5 text-sm font-bold text-navy-900 dark:text-white">
                {currentQuantity} {currentProduct?.unit || 'pcs'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {adjustmentType === 'set' ? 'New Target' : 'Quantity Delta'}
              </p>
              <p className="mt-0.5 text-sm font-bold text-brand-600 dark:text-brand-400">
                {adjustmentType === 'add' && '+'}
                {adjustmentType === 'remove' && '-'}
                {numInput} {currentProduct?.unit || 'pcs'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">New Balance</p>
              <p className="mt-0.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {calculatedNewStock} {currentProduct?.unit || 'pcs'}
              </p>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              {adjustmentType === 'set' ? 'New Exact Quantity' : 'Quantity to Adjust'} (
              {currentProduct?.unit || 'pcs'}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))
              }
              placeholder="e.g. 10"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-bold text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          {/* Reason Selection */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Reason for Adjustment <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              {COMMON_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {reason === 'Other / Custom Reason' && (
              <input
                type="text"
                required
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Specify reason in detail..."
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm text-navy-900 outline-hidden transition focus:border-brand-500 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
              />
            )}
          </div>

          {/* Optional Location in Store & Reference ID */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                In-Store Spot / Shelf (Optional)
              </label>
              <input
                type="text"
                value={locationInStore}
                onChange={(e) => setLocationInStore(e.target.value)}
                placeholder="e.g. Aisle 3, Shelf B"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Audit Ref / PO # (Optional)
              </label>
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. AUDIT-2026-Q3"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || quantity === ''}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
