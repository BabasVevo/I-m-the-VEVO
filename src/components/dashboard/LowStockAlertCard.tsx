import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  PackageX,
  ArrowRight,
  CheckCircle2,
  PlusCircle,
  Building2,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import type { InventoryItem } from '@/types/database';

interface LowStockAlertCardProps {
  items: InventoryItem[];
  loading?: boolean;
}

export function LowStockAlertCard({ items, loading = false }: LowStockAlertCardProps) {
  const { toast } = useToast();
  const [reorderedIds, setReorderedIds] = useState<Record<string, boolean>>({});

  const handleQuickReorder = (item: InventoryItem) => {
    setReorderedIds((prev) => ({ ...prev, [item.id]: true }));
    toast(
      `Reorder purchase order drafted for ${item.product?.name ?? 'item'} (${item.branch?.name ?? 'Branch'})`,
      'success'
    );
  };

  if (loading) {
    return (
      <div className="card animate-pulse p-6">
        <div className="flex items-center justify-between">
          <div className="h-5 w-44 rounded bg-gray-200 dark:bg-navy-800" />
          <div className="h-4 w-20 rounded bg-gray-200 dark:bg-navy-800" />
        </div>
        <div className="mt-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-navy-800" />
          ))}
        </div>
      </div>
    );
  }

  const outOfStockCount = items.filter((i) => Number(i.quantity) <= 0).length;
  const lowStockCount = items.filter((i) => Number(i.quantity) > 0).length;

  return (
    <div
      id="low-stock-alert-card"
      className="card relative flex flex-col justify-between overflow-hidden p-6 shadow-sm"
    >
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Low Stock Alerts
              </h3>
              <p className="text-xs text-gray-500 dark:text-navy-400">
                {items.length === 0
                  ? 'All inventory items are well-stocked'
                  : `${items.length} items at or below minimum threshold`}
              </p>
            </div>
          </div>

          <Link
            to="/stock"
            className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Manage Stock <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Badges Summary */}
        {items.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            {outOfStockCount > 0 && (
              <span className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                <PackageX className="h-3.5 w-3.5 text-rose-500" />
                {outOfStockCount} Out of Stock
              </span>
            )}
            {lowStockCount > 0 && (
              <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                {lowStockCount} Low Stock
              </span>
            )}
          </div>
        )}

        {/* Items List */}
        <div className="mt-4 space-y-2.5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-navy-900 dark:text-white">
                Inventory Levels Healthy
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-navy-400 max-w-xs">
                No items have reached minimum replenishment thresholds in the selected branch scope.
              </p>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1">
              {items.map((item) => {
                const isOutOfStock = Number(item.quantity) <= 0;
                const isReordered = !!reorderedIds[item.id];
                const unit = item.product?.unit || 'pcs';

                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3 transition hover:border-gray-200 dark:border-navy-800 dark:bg-navy-950/40 dark:hover:border-navy-700 sm:flex-row sm:items-center"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">
                          {item.product?.name ?? 'Unknown Product'}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {isOutOfStock ? 'OUT OF STOCK' : 'LOW STOCK'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 text-xs text-gray-500 dark:text-navy-400">
                        {item.product?.sku && (
                          <span>SKU: <strong className="font-mono text-gray-700 dark:text-gray-300">{item.product.sku}</strong></span>
                        )}
                        {item.branch && (
                          <span className="flex items-center gap-1 text-gray-500 dark:text-navy-400">
                            <Building2 className="h-3 w-3" />
                            {item.branch.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="text-right">
                        <p className="text-sm font-bold text-navy-900 dark:text-white">
                          {item.quantity} <span className="text-xs font-normal text-gray-500">{unit}</span>
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-navy-400">
                          Min: {item.min_quantity} {unit}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQuickReorder(item)}
                        disabled={isReordered}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                          isReordered
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'border border-gray-200 bg-white text-navy-700 hover:bg-gray-100 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200 dark:hover:bg-navy-700'
                        }`}
                        title="Create Purchase Order Draft"
                      >
                        {isReordered ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Drafted</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span>Reorder</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
