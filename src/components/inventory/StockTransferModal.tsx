import { useState, useEffect } from 'react';
import {
  X,
  ArrowRightLeft,
  Loader2,
} from 'lucide-react';
import type { Product, Branch } from '@/types/database';
import { transferStockBetweenBranches } from '@/services/inventoryService';
import { useAuth } from '@/context/AuthContext';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: Product[];
  branches: Branch[];
  selectedBranchId?: string | null;
}

export function StockTransferModal({
  isOpen,
  onClose,
  onSuccess,
  products = [],
  branches = [],
  selectedBranchId,
}: StockTransferModalProps) {
  const { profile } = useAuth();

  const [fromBranchId, setFromBranchId] = useState('');
  const [toBranchId, setToBranchId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState('Store replenishment transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const src = selectedBranchId || (branches.length > 0 ? branches[0].id : '');
      setFromBranchId(src);
      const dest = branches.find((b) => b.id !== src)?.id || (branches.length > 1 ? branches[1].id : '');
      setToBranchId(dest);
      setProductId(products.length > 0 ? products[0].id : '');
      setQuantity('');
      setReason('Store replenishment transfer');
      setError(null);
    }
  }, [isOpen, selectedBranchId, branches, products]);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === productId);
  const sourceInv = currentProduct?.inventory?.find((i) => i.branch_id === fromBranchId);
  const sourceQty = sourceInv ? Number(sourceInv.quantity) || 0 : 0;

  const numQty = Number(quantity) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromBranchId || !toBranchId || !productId) {
      setError('Please select both branches and a product');
      return;
    }
    if (fromBranchId === toBranchId) {
      setError('Source and Destination branch cannot be the same');
      return;
    }
    if (numQty <= 0) {
      setError('Please enter a quantity greater than zero');
      return;
    }
    if (numQty > sourceQty) {
      setError(`Cannot transfer ${numQty} units. Source branch only has ${sourceQty} ${currentProduct?.unit || 'units'}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await transferStockBetweenBranches({
        businessId: profile?.business_id || 'demo-biz-1',
        fromBranchId,
        toBranchId,
        productId,
        quantity: numQty,
        reason,
        userId: profile?.id || null,
      });

      if (!result.success) {
        throw new Error(result.message || 'Transfer failed');
      }

      onSuccess();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete stock transfer';
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
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-900 dark:text-white">
                Inter-Branch Stock Transfer
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Move inventory seamlessly between branches with verified deduction and intake
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
          {/* Branch Source & Destination Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Transfer FROM (Source) <span className="text-red-500">*</span>
              </label>
              <select
                value={fromBranchId}
                onChange={(e) => setFromBranchId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-medium text-navy-900 outline-hidden focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Transfer TO (Destination) <span className="text-red-500">*</span>
              </label>
              <select
                value={toBranchId}
                onChange={(e) => setToBranchId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-medium text-navy-900 outline-hidden focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} disabled={b.id === fromBranchId}>
                    {b.name} {b.id === fromBranchId ? '(Source)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Picker */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Select Product <span className="text-red-500">*</span>
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-navy-900 outline-hidden focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Source On-Hand stock banner */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300 flex items-center justify-between">
            <span>Available at Source Branch:</span>
            <span className="font-bold text-sm">
              {sourceQty} {currentProduct?.unit || 'units'}
            </span>
          </div>

          {/* Transfer Quantity */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Quantity to Transfer ({currentProduct?.unit || 'units'}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={sourceQty}
              step="any"
              required
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))
              }
              placeholder="e.g. 25"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-bold text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          {/* Transfer Note */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Transfer Note / Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Weekly restock for weekend rush"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-navy-900 outline-hidden focus:border-brand-500 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          {/* Actions */}
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
              disabled={isSubmitting || quantity === '' || numQty <= 0 || numQty > sourceQty}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Transfer Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
