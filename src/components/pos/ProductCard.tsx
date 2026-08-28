import { Plus, Package, AlertCircle } from 'lucide-react';
import type { Product } from '@/types/database';
import { formatCurrency } from '@/lib/format';

interface ProductCardProps {
  product: Product;
  branchId: string;
  cartQuantity?: number;
  onAddToCart: (product: Product) => void;
  currency?: string;
  canOverrideStock?: boolean;
}

export function ProductCard({
  product,
  branchId,
  cartQuantity = 0,
  onAddToCart,
  currency = 'TZS',
  canOverrideStock = false,
}: ProductCardProps) {
  // Find current branch stock
  const branchInv = product.inventory?.find((i) => i.branch_id === branchId);
  const stockAvailable = branchInv ? Number(branchInv.quantity) || 0 : (product.total_stock ?? 0);
  const remainingStock = Math.max(0, stockAvailable - cartQuantity);

  const isOutOfStock = stockAvailable <= 0;
  const isLowStock = stockAvailable > 0 && stockAvailable <= (product.min_stock_level || 5);
  const isBlocked = isOutOfStock && !canOverrideStock;

  return (
    <div
      id={`pos-product-${product.id}`}
      onClick={() => {
        if (!isBlocked) {
          onAddToCart(product);
        }
      }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-3.5 shadow-xs transition-all duration-200 hover:shadow-md dark:bg-navy-900 ${
        isBlocked
          ? 'cursor-not-allowed border-gray-200 opacity-60 dark:border-navy-800'
          : 'cursor-pointer border-gray-200 hover:-translate-y-0.5 hover:border-brand-500/50 dark:border-navy-700/80 dark:hover:border-brand-400/50'
      }`}
    >
      {/* Active in-cart indicator */}
      {cartQuantity > 0 && (
        <span className="absolute top-2.5 right-2.5 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-bold text-white shadow-sm ring-2 ring-white dark:ring-navy-900">
          {cartQuantity}
        </span>
      )}

      {/* Top Image & Badge */}
      <div>
        <div className="relative mb-3 flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-gray-50 dark:bg-navy-950">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400 dark:text-navy-600">
              <Package className="h-10 w-10 stroke-[1.5]" />
            </div>
          )}

          {/* Category Tag overlay */}
          {product.category?.name && (
            <span className="absolute bottom-1.5 left-1.5 max-w-[85%] truncate rounded-md bg-navy-900/80 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
              {product.category.name}
            </span>
          )}
        </div>

        {/* Product Details */}
        <div className="mb-2">
          <h4
            className="line-clamp-2 text-sm font-bold text-navy-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400"
            title={product.name}
          >
            {product.name}
          </h4>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            {product.sku && <span className="font-mono">{product.sku}</span>}
            {product.sku && product.barcode && <span>•</span>}
            {product.barcode && (
              <span className="truncate font-mono text-[11px] text-gray-400">
                {product.barcode}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing & Stock Bottom Bar */}
      <div className="mt-2 border-t border-gray-100 pt-2.5 dark:border-navy-800">
        <div className="flex items-end justify-between">
          <div>
            <span className="block text-[11px] font-medium text-gray-500 dark:text-gray-400">
              Price
            </span>
            <span className="text-base font-extrabold text-navy-900 dark:text-white">
              {formatCurrency(product.selling_price, currency)}
            </span>
          </div>

          <div className="flex flex-col items-end">
            {/* Stock status badge */}
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
                <AlertCircle className="h-3 w-3" />
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                Low: {remainingStock} left
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                Stock: {remainingStock}
              </span>
            )}
          </div>
        </div>

        {/* Quick Add Button */}
        <button
          type="button"
          id={`btn-add-${product.id}`}
          disabled={isBlocked}
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className={`mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
            isBlocked
              ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-navy-800 dark:text-navy-500'
              : 'bg-brand-500 text-white shadow-xs hover:bg-brand-600 active:scale-[0.98]'
          }`}
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          {cartQuantity > 0 ? 'Add More' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
