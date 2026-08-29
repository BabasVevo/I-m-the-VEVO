import { useState } from 'react';
import { X, PackageCheck } from 'lucide-react';
import type { PurchaseOrder, ReceivePurchaseStockParams } from '@/types/database';

interface ReceiveGoodsModalProps {
  isOpen: boolean;
  purchaseOrder: PurchaseOrder | null;
  onClose: () => void;
  onSubmit: (params: ReceivePurchaseStockParams) => Promise<void>;
}

export function ReceiveGoodsModal({
  isOpen,
  purchaseOrder,
  onClose,
  onSubmit,
}: ReceiveGoodsModalProps) {
  const [items, setItems] = useState<
    Array<{
      purchase_item_id: string;
      product_name: string;
      unit: string;
      quantity_ordered: number;
      quantity_already_received: number;
      quantity_remaining: number;
      quantity_receiving_now: number;
      batch_number: string;
      expiry_date: string;
    }>
  >(() => {
    if (!purchaseOrder?.items) return [];
    return purchaseOrder.items.map((item) => {
      const remaining = Math.max(0, item.quantity_ordered - item.quantity_received);
      return {
        purchase_item_id: item.id,
        product_name: item.product_name,
        unit: item.unit,
        quantity_ordered: item.quantity_ordered,
        quantity_already_received: item.quantity_received,
        quantity_remaining: remaining,
        quantity_receiving_now: remaining, // default to receive all remaining
        batch_number: '',
        expiry_date: '',
      };
    });
  });

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !purchaseOrder) return null;

  const handleQtyChange = (idx: number, val: number) => {
    const newItems = [...items];
    newItems[idx].quantity_receiving_now = Math.max(0, val);
    setItems(newItems);
  };

  const handleFieldChange = (idx: number, field: 'batch_number' | 'expiry_date', val: string) => {
    const newItems = [...items];
    newItems[idx][field] = val;
    setItems(newItems);
  };

  const handleReceiveAll = () => {
    setItems(
      items.map((i) => ({
        ...i,
        quantity_receiving_now: i.quantity_remaining,
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toReceive = items.filter((i) => i.quantity_receiving_now > 0);
    if (toReceive.length === 0) {
      setError('Please specify at least one item quantity to receive into stock.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        purchase_id: purchaseOrder.id,
        branch_id: purchaseOrder.branch_id,
        notes: notes.trim() || undefined,
        items: toReceive.map((i) => ({
          purchase_item_id: i.purchase_item_id,
          quantity_received: Number(i.quantity_receiving_now),
          batch_number: i.batch_number.trim() || undefined,
          expiry_date: i.expiry_date || undefined,
        })),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to receive goods.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs">
      <div
        id="receive-goods-modal"
        className="relative w-full max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all dark:border-navy-800 dark:bg-navy-900 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Receive Goods & Stock Inflow
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Check physical quantities arrived against the purchase order:
            </p>
            <button
              type="button"
              onClick={handleReceiveAll}
              className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              Fill All Remaining
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-navy-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 dark:bg-navy-950 dark:text-gray-400 border-b border-gray-200 dark:border-navy-800 font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Product Name</th>
                  <th className="px-3 py-2.5 text-center">Ordered</th>
                  <th className="px-3 py-2.5 text-center">Received</th>
                  <th className="px-3 py-2.5 text-center w-28">Receiving Now</th>
                  <th className="px-3 py-2.5 w-28">Batch / Lot #</th>
                  <th className="px-3 py-2.5 w-32">Expiry Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-navy-800 bg-white dark:bg-navy-900">
                {items.map((item, idx) => (
                  <tr key={item.purchase_item_id} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/50">
                    <td className="p-3 font-semibold text-gray-900 dark:text-white">
                      {item.product_name}
                      <span className="text-2xs font-normal text-gray-500 block">
                        Unit: {item.unit}
                      </span>
                    </td>
                    <td className="p-3 text-center text-gray-600 dark:text-gray-300">
                      {item.quantity_ordered}
                    </td>
                    <td className="p-3 text-center font-medium text-emerald-600 dark:text-emerald-400">
                      {item.quantity_already_received}
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        max={item.quantity_remaining}
                        step="1"
                        value={item.quantity_receiving_now}
                        onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-center font-bold text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="LOT-001"
                        value={item.batch_number}
                        onChange={(e) => handleFieldChange(idx, 'batch_number', e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        value={item.expiry_date}
                        onChange={(e) => handleFieldChange(idx, 'expiry_date', e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Receiving Delivery Notes & Inspection Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Delivery arrived in good condition. Inspected by warehouse supervisor."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>
        </form>

        {/* Footer */}
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
            className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            {loading ? 'Receiving Stock...' : 'Confirm Goods Received'}
          </button>
        </div>
      </div>
    </div>
  );
}
