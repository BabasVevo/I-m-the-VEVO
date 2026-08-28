import { Clock, Play, Trash2, X, ShoppingCart } from 'lucide-react';
import type { HeldSale } from '@/services/saleService';
import { formatCurrency, formatDateTime } from '@/lib/format';

interface HeldSalesModalProps {
  isOpen: boolean;
  heldSales: HeldSale[];
  currency?: string;
  onRecallSale: (heldSale: HeldSale) => void;
  onDiscardSale: (heldSaleId: string) => void;
  onClose: () => void;
}

export function HeldSalesModal({
  isOpen,
  heldSales,
  currency = 'TZS',
  onRecallSale,
  onDiscardSale,
  onClose,
}: HeldSalesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all dark:bg-navy-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Parked / Held Orders
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Resume paused checkouts or release reserved items
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:hover:bg-navy-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {heldSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <ShoppingCart className="h-10 w-10 text-gray-300 dark:text-navy-600" />
              <p className="mt-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                No orders currently on hold.
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                Use the "Hold Sale" button in the cart when a customer steps away.
              </p>
            </div>
          ) : (
            heldSales.map((h) => {
              const totalItems = h.items.reduce((acc, i) => acc + i.quantity, 0);
              return (
                <div
                  key={h.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 transition hover:border-brand-500/50 dark:border-navy-800 dark:bg-navy-950/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-navy-900 dark:text-white">
                          {h.customer ? h.customer.name : 'Walk-in Customer'}
                        </span>
                        <span className="rounded-md bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700 dark:bg-navy-800 dark:text-gray-300">
                          {totalItems} items
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                        Held at {formatDateTime(h.heldAt)}
                      </div>
                      {h.note && (
                        <div className="mt-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                          Note: {h.note}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-extrabold text-navy-900 dark:text-white">
                        {formatCurrency(h.totalAmount, currency)}
                      </div>
                    </div>
                  </div>

                  {/* Item preview tags */}
                  <div className="mt-3 flex flex-wrap gap-1 border-t border-gray-200/60 pt-2.5 dark:border-navy-800">
                    {h.items.slice(0, 3).map((it) => (
                      <span
                        key={it.id}
                        className="rounded-md bg-white px-2 py-0.5 text-[10px] text-gray-600 shadow-2xs dark:bg-navy-900 dark:text-gray-300"
                      >
                        {it.quantity}x {it.product.name}
                      </span>
                    ))}
                    {h.items.length > 3 && (
                      <span className="rounded-md bg-white px-2 py-0.5 text-[10px] text-gray-400 dark:bg-navy-900">
                        +{h.items.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => onDiscardSale(h.id)}
                      className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Discard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onRecallSale(h);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-brand-600 active:scale-95"
                    >
                      <Play className="h-3.5 w-3.5 fill-white" />
                      <span>Resume Sale</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 text-right dark:border-navy-800 dark:bg-navy-950">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
