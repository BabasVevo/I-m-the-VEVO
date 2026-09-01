import { Package, Search, Plus } from 'lucide-react';
import type { Product } from '@/types/database';
import { ProductCard } from './ProductCard';
import { formatCurrency } from '@/lib/format';

interface ProductGridProps {
  products: Product[];
  branchId: string;
  loading: boolean;
  cartMap: Record<string, number>;
  onAddToCart: (product: Product) => void;
  currency?: string;
  viewMode?: 'grid' | 'list';
  canOverrideStock?: boolean;
}

export function ProductGrid({
  products,
  branchId,
  loading,
  cartMap,
  onAddToCart,
  currency = 'BIF',
  viewMode = 'grid',
  canOverrideStock = false,
}: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-gray-100 bg-white p-3.5 dark:border-navy-800 dark:bg-navy-900"
          >
            <div className="h-28 w-full rounded-xl bg-gray-200 dark:bg-navy-800" />
            <div className="mt-3 h-4 w-3/4 rounded-sm bg-gray-200 dark:bg-navy-800" />
            <div className="mt-2 h-3 w-1/2 rounded-sm bg-gray-200 dark:bg-navy-800" />
            <div className="mt-4 flex items-center justify-between">
              <div className="h-5 w-1/3 rounded-sm bg-gray-200 dark:bg-navy-800" />
              <div className="h-5 w-1/4 rounded-sm bg-gray-200 dark:bg-navy-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/50 p-8 text-center dark:border-navy-800 dark:bg-navy-900/30">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-navy-800">
          <Search className="h-6 w-6 text-gray-400 dark:text-navy-400" />
        </div>
        <h3 className="mt-4 text-base font-bold text-navy-900 dark:text-white">
          No matching products found
        </h3>
        <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
          Try searching by different keywords, scanning a barcode, or changing the category filter.
        </p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-navy-800 dark:bg-navy-900">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-200 bg-gray-50/80 font-semibold text-gray-500 uppercase tracking-wider dark:border-navy-800 dark:bg-navy-950/60 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-3 py-3">SKU / Barcode</th>
              <th className="px-3 py-3">Stock (Branch)</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
            {products.map((prod) => {
              const branchInv = prod.inventory?.find((i) => i.branch_id === branchId);
              const stock = branchInv ? Number(branchInv.quantity) || 0 : (prod.total_stock ?? 0);
              const inCart = cartMap[prod.id] || 0;
              const isBlocked = stock <= 0 && !canOverrideStock;

              return (
                <tr
                  key={prod.id}
                  id={`list-prod-${prod.id}`}
                  onClick={() => !isBlocked && onAddToCart(prod)}
                  className={`transition ${
                    isBlocked
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-800/60'
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-navy-800">
                        {prod.image_url ? (
                          <img
                            src={prod.image_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-navy-900 dark:text-white">{prod.name}</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          {prod.category?.name || 'General'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-gray-600 dark:text-gray-300">
                    <div>{prod.sku || '—'}</div>
                    <div className="text-[10px] text-gray-400">{prod.barcode || ''}</div>
                  </td>
                  <td className="px-3 py-2.5 font-medium">
                    {stock <= 0 ? (
                      <span className="text-rose-600 dark:text-rose-400">Out of Stock</span>
                    ) : stock <= (prod.min_stock_level || 5) ? (
                      <span className="text-amber-600 dark:text-amber-400">Low ({stock})</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">{stock} in stock</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-extrabold text-navy-900 dark:text-white">
                    {formatCurrency(prod.selling_price, currency)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      disabled={isBlocked}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(prod);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
                    >
                      <Plus className="h-3 w-3" />
                      {inCart > 0 ? `In Cart (${inCart})` : 'Add'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((prod) => (
        <ProductCard
          key={prod.id}
          product={prod}
          branchId={branchId}
          cartQuantity={cartMap[prod.id] || 0}
          onAddToCart={onAddToCart}
          currency={currency}
          canOverrideStock={canOverrideStock}
        />
      ))}
    </div>
  );
}
