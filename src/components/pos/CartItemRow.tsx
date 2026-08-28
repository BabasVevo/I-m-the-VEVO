import { useState } from 'react';
import { Minus, Plus, Trash2, Tag, AlertTriangle, Package } from 'lucide-react';
import type { CartItem } from '@/services/saleService';
import { formatCurrency } from '@/lib/format';

interface CartItemRowProps {
  item: CartItem;
  currency?: string;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onOpenDiscountModal: (item: CartItem) => void;
  onRemoveItem: (itemId: string) => void;
  canOverrideStock?: boolean;
}

export function CartItemRow({
  item,
  currency = 'TZS',
  onUpdateQuantity,
  onOpenDiscountModal,
  onRemoveItem,
  canOverrideStock = false,
}: CartItemRowProps) {
  const [isEditingQty, setIsEditingQty] = useState(false);
  const [tempQty, setTempQty] = useState(item.quantity.toString());

  const hasItemDiscount = item.discountAmount > 0;
  const isOverStock = item.quantity > item.stockAvailable && item.stockAvailable >= 0;

  const handleQtyBlur = () => {
    setIsEditingQty(false);
    const parsed = parseInt(tempQty, 10);
    if (isNaN(parsed) || parsed <= 0) {
      setTempQty(item.quantity.toString());
      return;
    }
    if (parsed > item.stockAvailable && !canOverrideStock && item.stockAvailable > 0) {
      onUpdateQuantity(item.id, item.stockAvailable);
      setTempQty(item.stockAvailable.toString());
    } else {
      onUpdateQuantity(item.id, parsed);
    }
  };

  return (
    <div
      id={`cart-row-${item.id}`}
      className={`group relative rounded-xl border p-2.5 transition ${
        isOverStock && !canOverrideStock
          ? 'border-rose-300 bg-rose-50/40 dark:border-rose-900/60 dark:bg-rose-950/20'
          : 'border-gray-100 bg-white hover:border-gray-200 dark:border-navy-800 dark:bg-navy-900 dark:hover:border-navy-700'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Thumbnail */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 dark:bg-navy-950">
          {item.product.image_url ? (
            <img
              src={item.product.image_url}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <Package className="h-5 w-5 text-gray-400 dark:text-navy-600" />
          )}
        </div>

        {/* Item Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <h5 className="line-clamp-1 text-xs font-bold text-navy-900 dark:text-white" title={item.product.name}>
              {item.product.name}
            </h5>
            <button
              type="button"
              onClick={() => onRemoveItem(item.id)}
              className="shrink-0 p-0.5 text-gray-400 hover:text-rose-600 dark:text-navy-500 dark:hover:text-rose-400"
              title="Remove item"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
            <span>{formatCurrency(item.unitPrice, currency)} each</span>
            {hasItemDiscount && (
              <span className="inline-flex items-center gap-0.5 rounded-sm bg-brand-50 px-1 py-0.2 text-[10px] font-bold text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                <Tag className="h-2.5 w-2.5" />-
                {item.discountType === 'percentage'
                  ? `${item.discountValue}%`
                  : formatCurrency(item.discountAmount, currency)}
              </span>
            )}
          </div>

          {/* Stock warning if exceeding available */}
          {isOverStock && (
            <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>
                Requested {item.quantity} exceeds available stock ({item.stockAvailable})
              </span>
            </div>
          )}

          {/* Stepper + Discount + Line Total */}
          <div className="mt-2 flex items-center justify-between gap-2">
            {/* Quantity Controller */}
            <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 dark:border-navy-700 dark:bg-navy-950">
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                className="flex h-7 w-7 items-center justify-center text-gray-600 hover:bg-gray-200 active:scale-95 dark:text-gray-300 dark:hover:bg-navy-800"
                title="Decrease"
              >
                <Minus className="h-3 w-3 stroke-[2.5]" />
              </button>

              {isEditingQty ? (
                <input
                  type="number"
                  min="1"
                  autoFocus
                  value={tempQty}
                  onChange={(e) => setTempQty(e.target.value)}
                  onBlur={handleQtyBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQtyBlur();
                  }}
                  className="h-7 w-10 text-center text-xs font-bold text-navy-900 outline-hidden dark:text-white"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTempQty(item.quantity.toString());
                    setIsEditingQty(true);
                  }}
                  className="h-7 min-w-8 px-1 text-center text-xs font-bold text-navy-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                  title="Click to enter quantity manually"
                >
                  {item.quantity}
                </button>
              )}

              <button
                type="button"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                disabled={
                  item.quantity >= item.stockAvailable && !canOverrideStock && item.stockAvailable > 0
                }
                className="flex h-7 w-7 items-center justify-center text-gray-600 hover:bg-gray-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-navy-800"
                title="Increase"
              >
                <Plus className="h-3 w-3 stroke-[2.5]" />
              </button>
            </div>

            {/* Discount trigger */}
            <button
              type="button"
              onClick={() => onOpenDiscountModal(item)}
              className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold transition ${
                hasItemDiscount
                  ? 'bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-950/60 dark:text-brand-400'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-navy-800 dark:hover:text-gray-300'
              }`}
              title="Add or edit item discount"
            >
              <Tag className="h-3 w-3" />
              <span>{hasItemDiscount ? 'Discounted' : 'Discount'}</span>
            </button>

            {/* Line Total */}
            <div className="text-right">
              {hasItemDiscount && (
                <div className="text-[10px] text-gray-400 line-through">
                  {formatCurrency(item.lineSubtotal, currency)}
                </div>
              )}
              <div className="text-xs font-extrabold text-navy-900 dark:text-white">
                {formatCurrency(item.lineTotal, currency)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
