import { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import type { PurchaseOrder } from '@/types/database';
import { formatCurrency } from '@/lib/format';

interface PurchaseReturnModalProps {
  isOpen: boolean;
  purchaseOrder: PurchaseOrder | null;
  currency?: string;
  onClose: () => void;
  onSubmit: (data: {
    purchase_id: string;
    supplier_id: string;
    branch_id: string;
    reason: string;
    notes?: string;
    items: Array<{
      purchase_item_id?: string;
      product_id?: string | null;
      product_name: string;
      unit: string;
      quantity_returned: number;
      unit_cost: number;
      reason?: string;
    }>;
  }) => Promise<void>;
}

export function PurchaseReturnModal({
  isOpen,
  purchaseOrder,
  currency = 'BIF',
  onClose,
  onSubmit,
}: PurchaseReturnModalProps) {
  const [reason, setReason] = useState('damaged');
  const [notes, setNotes] = useState('');
  const [returnItems, setReturnItems] = useState<
    Array<{
      purchase_item_id: string;
      product_id?: string | null;
      product_name: string;
      unit: string;
      quantity_received: number;
      quantity_returned: number;
      unit_cost: number;
      item_reason: string;
    }>
  >(() => {
    if (!purchaseOrder?.items) return [];
    return purchaseOrder.items.map((i) => ({
      purchase_item_id: i.id,
      product_id: i.product_id,
      product_name: i.product_name,
      unit: i.unit,
      quantity_received: i.quantity_received || 0,
      quantity_returned: 0,
      unit_cost: i.unit_cost,
      item_reason: 'Damaged in transit / defective',
    }));
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !purchaseOrder) return null;

  const handleQtyChange = (idx: number, val: number) => {
    const next = [...returnItems];
    next[idx].quantity_returned = Math.max(0, val);
    setReturnItems(next);
  };

  const totalRefundValue = returnItems.reduce(
    (sum, item) => sum + (Number(item.quantity_returned) || 0) * (Number(item.unit_cost) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toReturn = returnItems.filter((i) => i.quantity_returned > 0);
    if (toReturn.length === 0) {
      setError('Please enter return quantity > 0 for at least one received item.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        purchase_id: purchaseOrder.id,
        supplier_id: purchaseOrder.supplier_id,
        branch_id: purchaseOrder.branch_id,
        reason,
        notes: notes.trim() || undefined,
        items: toReturn.map((i) => ({
          purchase_item_id: i.purchase_item_id,
          product_id: i.product_id,
          product_name: i.product_name,
          unit: i.unit,
          quantity_returned: Number(i.quantity_returned),
          unit_cost: Number(i.unit_cost),
          reason: i.item_reason,
        })),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to process purchase return.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs">
      <div
        id="purchase-return-modal"
        className="relative w-full max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all dark:border-navy-800 dark:bg-navy-900 max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Debit Note / Return to Supplier
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PO #{purchaseOrder.po_number} · {purchaseOrder.supplier?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-navy-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Primary Reason for Return
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              >
                <option value="damaged">Damaged or Broken on Delivery</option>
                <option value="defective">Defective / Quality Not as Agreed</option>
                <option value="wrong_item">Incorrect Item / Specification Mismatch</option>
                <option value="expired">Expired or Near Expiry Date</option>
                <option value="over_shipped">Excess / Over-shipped Quantity</option>
                <option value="other">Other / Commercial Agreement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Return Memo / Reference
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Returned to driver during unloading."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-navy-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 dark:bg-navy-950 dark:text-gray-400 border-b border-gray-200 dark:border-navy-800 font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Product</th>
                  <th className="px-3 py-2.5 text-center">Qty Received</th>
                  <th className="px-3 py-2.5 text-center w-28">Return Qty</th>
                  <th className="px-3 py-2.5 text-right">Unit Cost</th>
                  <th className="px-3 py-2.5 text-right">Refund Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-navy-800 bg-white dark:bg-navy-900">
                {returnItems.map((item, idx) => (
                  <tr key={item.purchase_item_id} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/50">
                    <td className="p-3 font-semibold text-gray-900 dark:text-white">
                      {item.product_name}
                      <span className="text-2xs font-normal text-gray-500 block">Unit: {item.unit}</span>
                    </td>
                    <td className="p-3 text-center text-gray-600 dark:text-gray-300">
                      {item.quantity_received}
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        max={item.quantity_received || item.quantity_received}
                        step="1"
                        value={item.quantity_returned}
                        onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-center font-bold text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                      />
                    </td>
                    <td className="p-3 text-right text-gray-600 dark:text-gray-300">
                      {formatCurrency(item.unit_cost, currency)}
                    </td>
                    <td className="p-3 text-right font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(item.quantity_returned * item.unit_cost, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center bg-gray-50 dark:bg-navy-950 p-4 rounded-xl border border-gray-200 dark:border-navy-800">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Total Debit Note Value (Deducted from PO & Payables):
            </span>
            <span className="text-base font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(totalRefundValue, currency)}
            </span>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-navy-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="rounded-lg bg-amber-600 px-5 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
          >
            {loading ? 'Processing...' : 'Confirm Return & Issue Debit Note'}
          </button>
        </div>
      </div>
    </div>
  );
}
