import { useState } from 'react';
import {
  ShoppingCart,
  User,
  Trash2,
  Tag,
  Receipt,
  Pause,
  ChevronDown,
} from 'lucide-react';
import type { Customer } from '@/types/database';
import type { CartItem, SaleDiscount } from '@/services/saleService';
import { CartItemRow } from './CartItemRow';
import { formatCurrency } from '@/lib/format';

interface PosCartProps {
  items: CartItem[];
  customer: Customer | null;
  saleDiscount: SaleDiscount;
  taxRate: number; // e.g. 18
  currency?: string;
  canOverrideStock?: boolean;
  canApplyDiscount?: boolean;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onOpenCustomerSelect: () => void;
  onOpenCustomerCreate?: () => void;
  onOpenItemDiscountModal: (item: CartItem) => void;
  onOpenSaleDiscountModal: () => void;
  onHoldSale: () => void;
  onOpenPaymentModal: () => void;
}

export function PosCart({
  items,
  customer,
  saleDiscount,
  taxRate,
  currency = 'TZS',
  canOverrideStock = false,
  canApplyDiscount = true,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenCustomerSelect,
  onOpenItemDiscountModal,
  onOpenSaleDiscountModal,
  onHoldSale,
  onOpenPaymentModal,
}: PosCartProps) {
  const [taxExempt, setTaxExempt] = useState(false);

  // Calculations
  const totalItemsCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const rawSubtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

  // Overall sale discount calculation
  let overallDiscountAmount = 0;
  if (saleDiscount.type === 'percentage') {
    overallDiscountAmount = (rawSubtotal * saleDiscount.value) / 100;
  } else {
    overallDiscountAmount = Math.min(rawSubtotal, saleDiscount.value);
  }

  const discountedSubtotal = Math.max(0, rawSubtotal - overallDiscountAmount);
  
  // Tax calculations (business tax_rate or 0 if exempt)
  const effectiveTaxRate = taxExempt ? 0 : taxRate;
  const calculatedTax = (discountedSubtotal * effectiveTaxRate) / 100;
  const grandTotal = discountedSubtotal + calculatedTax;

  const totalDiscount = items.reduce((sum, i) => sum + i.lineDiscount, 0) + overallDiscountAmount;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xs dark:border-navy-800 dark:bg-navy-900">
      {/* 1. Header: Customer Selection & Quick Actions */}
      <div className="border-b border-gray-100 bg-gray-50/80 p-3.5 dark:border-navy-800 dark:bg-navy-950/60">
        <div className="flex items-center justify-between gap-2">
          {/* Customer button */}
          <button
            type="button"
            id="pos-customer-selector"
            onClick={onOpenCustomerSelect}
            className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-xs font-bold text-navy-900 shadow-2xs hover:border-brand-500 hover:bg-brand-50/40 dark:border-navy-700 dark:bg-navy-900 dark:text-white dark:hover:bg-navy-800"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              <User className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold">
                {customer ? customer.name : 'Walk-in Customer'}
              </div>
              <div className="text-[10px] font-normal text-gray-500">
                {customer ? customer.phone || 'Account client' : 'Click to select / register'}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>

          {/* Quick Clear & Hold */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              id="pos-btn-hold"
              disabled={items.length === 0}
              onClick={onHoldSale}
              className="flex h-9 items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300 dark:hover:bg-navy-800"
              title="Park / Hold current cart"
            >
              <Pause className="h-3.5 w-3.5 text-amber-500" />
              <span className="hidden sm:inline">Park</span>
            </button>

            <button
              type="button"
              id="pos-btn-clear"
              disabled={items.length === 0}
              onClick={onClearCart}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 shadow-2xs hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-navy-700 dark:bg-navy-900 dark:hover:bg-navy-800"
              title="Clear active cart"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Scrollable Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-300 dark:bg-navy-950 dark:text-navy-700">
              <ShoppingCart className="h-7 w-7" />
            </div>
            <h4 className="mt-3 text-xs font-bold text-navy-900 dark:text-white">
              Cart is currently empty
            </h4>
            <p className="mt-1 max-w-[200px] text-[11px] text-gray-400">
              Scan a barcode or click any product from the catalog to add.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              currency={currency}
              canOverrideStock={canOverrideStock}
              onUpdateQuantity={onUpdateQuantity}
              onOpenDiscountModal={onOpenItemDiscountModal}
              onRemoveItem={onRemoveItem}
            />
          ))
        )}
      </div>

      {/* 3. Totals & Checkout Panel */}
      <div className="border-t border-gray-100 bg-gray-50/90 p-4 dark:border-navy-800 dark:bg-navy-950/80 space-y-3">
        {/* Breakdown table */}
        <div className="space-y-1.5 text-xs">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
            <span>Subtotal ({totalItemsCount} items)</span>
            <span className="font-bold text-navy-900 dark:text-white">
              {formatCurrency(rawSubtotal, currency)}
            </span>
          </div>

          {/* Sale Discount */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={!canApplyDiscount || items.length === 0}
              onClick={onOpenSaleDiscountModal}
              className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-400"
            >
              <Tag className="h-3 w-3" />
              <span>
                {overallDiscountAmount > 0
                  ? `Sale Discount (${saleDiscount.type === 'percentage' ? `${saleDiscount.value}%` : 'Fixed'})`
                  : '+ Add Sale Discount'}
              </span>
            </button>
            {overallDiscountAmount > 0 && (
              <span className="font-bold text-rose-600 dark:text-rose-400">
                - {formatCurrency(overallDiscountAmount, currency)}
              </span>
            )}
          </div>

          {/* Tax / VAT row */}
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-1.5">
              <span>Tax / VAT ({effectiveTaxRate}%)</span>
              <button
                type="button"
                onClick={() => setTaxExempt(!taxExempt)}
                className={`rounded-sm px-1 py-0.2 text-[9px] font-bold ${
                  taxExempt
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-navy-800 dark:text-gray-400'
                }`}
                title="Toggle tax exempt"
              >
                {taxExempt ? 'Exempt' : 'Standard'}
              </button>
            </div>
            <span className="font-bold text-navy-900 dark:text-white">
              {formatCurrency(calculatedTax, currency)}
            </span>
          </div>

          {/* Total Savings badge if any discount applied */}
          {totalDiscount > 0 && (
            <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span>Total Savings:</span>
              <span>{formatCurrency(totalDiscount, currency)}</span>
            </div>
          )}
        </div>

        {/* Grand Total Display */}
        <div className="flex items-baseline justify-between border-t border-gray-200/80 pt-2.5 dark:border-navy-800">
          <div>
            <span className="block text-[11px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400">
              Total Payable
            </span>
            <span className="text-2xl font-black text-navy-900 dark:text-white">
              {formatCurrency(grandTotal, currency)}
            </span>
          </div>
        </div>

        {/* Main Pay Action */}
        <button
          type="button"
          id="pos-btn-pay"
          disabled={items.length === 0}
          onClick={onOpenPaymentModal}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-brand-600 active:scale-98 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Receipt className="h-5 w-5" />
          <span>Charge {items.length > 0 ? formatCurrency(grandTotal, currency) : ''}</span>
        </button>
      </div>
    </div>
  );
}
