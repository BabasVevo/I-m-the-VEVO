import { useState } from 'react';
import {
  X,
  RotateCcw,
  Package,
  Banknote,
  CreditCard,
  Smartphone,
  Wallet,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import type {
  Sale,
  ReturnReason,
  PaymentMethod,
  Profile,
} from '@/types/database';
import { processSaleReturn, type ProcessReturnInput, type ReturnItemInput } from '@/services/saleService';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { useToast } from '@/context/ToastContext';

interface ReturnRefundModalProps {
  isOpen: boolean;
  sale: Sale | null;
  currentUser?: Profile | null;
  currency?: string;
  onClose: () => void;
  onSuccess: (returnId: string) => void;
}

interface ItemReturnState {
  saleItemId: string;
  productId: string | null;
  productName: string;
  sku: string | null;
  unitPrice: number;
  originalQty: number;
  alreadyReturnedQty: number;
  remainingQty: number;
  returnQty: number;
  restock: boolean;
  reason: ReturnReason;
  notes: string;
}

export function ReturnRefundModal({
  isOpen,
  sale,
  currentUser,
  currency = 'BIF',
  onClose,
  onSuccess,
}: ReturnRefundModalProps) {
  const { addToast } = useToast();

  const [itemStates, setItemStates] = useState<ItemReturnState[]>(() => {
    if (!sale || !sale.items) return [];
    return sale.items.map((it) => {
      const alreadyRet = it.returned_quantity || 0;
      const remaining = Math.max(0, it.quantity - alreadyRet);
      return {
        saleItemId: it.id,
        productId: it.product_id,
        productName: it.product_name,
        sku: it.sku,
        unitPrice: it.unit_price,
        originalQty: it.quantity,
        alreadyReturnedQty: alreadyRet,
        remainingQty: remaining,
        returnQty: 0,
        restock: true,
        reason: 'customer_change',
        notes: '',
      };
    });
  });

  const [refundMethod, setRefundMethod] = useState<PaymentMethod | 'store_credit'>(
    (sale?.payment_method as PaymentMethod) || 'cash'
  );
  const [generalReason, setGeneralReason] = useState<string>('');
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen || !sale) return null;

  const handleQtyChange = (itemId: string, newQty: number) => {
    setItemStates((prev) =>
      prev.map((it) => {
        if (it.saleItemId === itemId) {
          const clamped = Math.max(0, Math.min(it.remainingQty, newQty));
          return { ...it, returnQty: clamped };
        }
        return it;
      })
    );
  };

  const handleRestockChange = (itemId: string, restock: boolean) => {
    setItemStates((prev) =>
      prev.map((it) => (it.saleItemId === itemId ? { ...it, restock } : it))
    );
  };

  const handleReasonChange = (itemId: string, reason: ReturnReason) => {
    setItemStates((prev) =>
      prev.map((it) => {
        if (it.saleItemId === itemId) {
          // If defective or damaged or expired, default restock to false
          const shouldRestock = !['defective', 'damaged', 'expired'].includes(reason);
          return { ...it, reason, restock: shouldRestock };
        }
        return it;
      })
    );
  };

  const handleItemNotesChange = (itemId: string, notes: string) => {
    setItemStates((prev) =>
      prev.map((it) => (it.saleItemId === itemId ? { ...it, notes } : it))
    );
  };

  // Calculate proportional refund amount per line
  const returningItems = itemStates.filter((it) => it.returnQty > 0);
  const totalReturningQty = returningItems.reduce((acc, it) => acc + it.returnQty, 0);

  // Line item refund calculator
  const calculateLineRefund = (it: ItemReturnState): number => {
    if (it.returnQty <= 0) return 0;
    const saleItem = sale.items?.find((si) => si.id === it.saleItemId);
    const unitDiscount =
      saleItem && saleItem.quantity > 0 ? (saleItem.discount_amount || 0) / saleItem.quantity : 0;
    const netUnitPrice = Math.max(0, it.unitPrice - unitDiscount);
    const lineNet = netUnitPrice * it.returnQty;
    const lineTax = sale.tax_amount > 0 ? lineNet * 0.18 : 0;
    return Math.round(lineNet + lineTax);
  };

  const totalCalculatedRefund = returningItems.reduce(
    (acc, it) => acc + calculateLineRefund(it),
    0
  );

  const handleSubmit = async () => {
    if (totalReturningQty <= 0) {
      addToast({
        type: 'warning',
        title: 'No Items Selected',
        message: 'Please set a return quantity of at least 1 item to proceed.',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const returnPayloadItems: ReturnItemInput[] = returningItems.map((it) => ({
        saleItemId: it.saleItemId,
        productId: it.productId,
        productName: it.productName,
        sku: it.sku,
        quantity: it.returnQty,
        unitPrice: it.unitPrice,
        refundAmount: calculateLineRefund(it),
        restock: it.restock,
        reason: it.reason,
        notes: it.notes || null,
      }));

      const payload: ProcessReturnInput = {
        saleId: sale.id,
        businessId: sale.business_id,
        branchId: sale.branch_id,
        processedById: currentUser?.id || null,
        processedByProfile: currentUser || null,
        refundMethod,
        reason: generalReason || `Return for ${sale.receipt_number}`,
        notes: generalNotes || null,
        items: returnPayloadItems,
      };

      const result = await processSaleReturn(payload);

      addToast({
        type: 'success',
        title: 'Return Processed',
        message: `Return #${result.return_number} successfully registered. Refund: ${formatCurrency(result.refund_amount, currency)}`,
      });

      onSuccess(result.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process return';
      addToast({
        type: 'error',
        title: 'Return Failed',
        message: msg,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-xs">
      <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all dark:bg-navy-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Process Return & Refund
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Original Sale #{sale.receipt_number} &bull; {formatDateTime(sale.created_at)}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-return-modal"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-navy-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Sale Summary Banner */}
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-4 sm:grid-cols-4 dark:border-navy-800 dark:bg-navy-800/40">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Customer
              </p>
              <p className="mt-0.5 text-xs font-bold text-navy-900 dark:text-white">
                {sale.customer?.name || 'Walk-in Customer'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Original Total
              </p>
              <p className="mt-0.5 text-xs font-bold text-navy-900 dark:text-white font-mono">
                {formatCurrency(sale.total_amount, currency)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Original Method
              </p>
              <p className="mt-0.5 text-xs font-bold text-navy-900 dark:text-white uppercase">
                {sale.payment_method.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Already Refunded
              </p>
              <p className="mt-0.5 text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">
                {formatCurrency(sale.refunded_amount || 0, currency)}
              </p>
            </div>
          </div>

          {/* Items Return Table */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider dark:text-white">
                Select Items To Return
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {returningItems.length} item(s) selected
              </span>
            </div>

            <div className="space-y-3">
              {itemStates.map((it) => {
                const lineRefund = calculateLineRefund(it);
                const isReturning = it.returnQty > 0;

                return (
                  <div
                    key={it.saleItemId}
                    className={`rounded-2xl border p-4 transition-all ${
                      isReturning
                        ? 'border-amber-300 bg-amber-50/20 dark:border-amber-900/60 dark:bg-amber-950/10'
                        : 'border-gray-200 bg-white dark:border-navy-800 dark:bg-navy-900'
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <p className="text-sm font-bold text-navy-900 dark:text-white">
                            {it.productName}
                          </p>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>SKU: {it.sku || '—'}</span>
                          <span>&bull;</span>
                          <span>Price: {formatCurrency(it.unitPrice, currency)}</span>
                          <span>&bull;</span>
                          <span>Purchased: {it.originalQty}</span>
                          {it.alreadyReturnedQty > 0 && (
                            <>
                              <span>&bull;</span>
                              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                Already returned: {it.alreadyReturnedQty}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Return Qty:
                          </label>
                          <div className="flex items-center rounded-xl border border-gray-200 bg-white dark:border-navy-700 dark:bg-navy-800">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(it.saleItemId, it.returnQty - 1)}
                              disabled={it.returnQty <= 0}
                              className="px-2.5 py-1 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-30 dark:text-gray-300 dark:hover:bg-navy-700"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={it.remainingQty}
                              value={it.returnQty}
                              onChange={(e) =>
                                handleQtyChange(it.saleItemId, parseInt(e.target.value) || 0)
                              }
                              className="w-12 text-center text-xs font-bold text-navy-900 focus:outline-none dark:bg-navy-800 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleQtyChange(it.saleItemId, it.returnQty + 1)}
                              disabled={it.returnQty >= it.remainingQty}
                              className="px-2.5 py-1 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-30 dark:text-gray-300 dark:hover:bg-navy-700"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-[11px] text-gray-400">/ {it.remainingQty} max</span>
                        </div>

                        {/* Calculated refund amount for this line */}
                        <div className="min-w-[90px] text-right">
                          <p className="text-[11px] text-gray-400">Refund</p>
                          <p className="text-xs font-bold font-mono text-navy-900 dark:text-white">
                            {formatCurrency(lineRefund, currency)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Per-item controls (Only active when returning > 0) */}
                    {isReturning && (
                      <div className="mt-3 grid grid-cols-1 gap-3 border-t border-amber-200/50 pt-3 sm:grid-cols-3 dark:border-amber-900/40">
                        {/* Reason */}
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                            Reason
                          </label>
                          <select
                            value={it.reason}
                            onChange={(e) =>
                              handleReasonChange(it.saleItemId, e.target.value as ReturnReason)
                            }
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-2.5 py-1 text-xs text-navy-900 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                          >
                            <option value="customer_change">Customer Changed Mind</option>
                            <option value="wrong_item">Wrong Item Delivered / Picked</option>
                            <option value="defective">Defective / Malfunctioning</option>
                            <option value="damaged">Damaged in Transit / Store</option>
                            <option value="expired">Expired Goods</option>
                            <option value="other">Other Reason</option>
                          </select>
                        </div>

                        {/* Restock Toggle */}
                        <div className="flex items-center">
                          <label className="mt-4 flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              checked={it.restock}
                              onChange={(e) =>
                                handleRestockChange(it.saleItemId, e.target.checked)
                              }
                              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-navy-700 dark:bg-navy-800"
                            />
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Restock to Inventory (+{it.returnQty})
                            </span>
                          </label>
                        </div>

                        {/* Item Note */}
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                            Item Condition Note
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Unopened box"
                            value={it.notes}
                            onChange={(e) => handleItemNotesChange(it.saleItemId, e.target.value)}
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-2.5 py-1 text-xs text-navy-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Refund Details Form */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 dark:border-navy-800 dark:bg-navy-900">
            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider dark:text-white">
              Refund & Disbursement Details
            </h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Refund Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Refund Method
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRefundMethod('cash')}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                      refundMethod === 'cash'
                        ? 'border-brand-500 bg-brand-50/50 text-brand-700 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-300'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200'
                    }`}
                  >
                    <Banknote className="h-4 w-4" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefundMethod('mobile_money')}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                      refundMethod === 'mobile_money'
                        ? 'border-brand-500 bg-brand-50/50 text-brand-700 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-300'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200'
                    }`}
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Mobile Money</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefundMethod('card')}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                      refundMethod === 'card'
                        ? 'border-brand-500 bg-brand-50/50 text-brand-700 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-300'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200'
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Card Reversal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefundMethod('store_credit')}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                      refundMethod === 'store_credit'
                        ? 'border-brand-500 bg-brand-50/50 text-brand-700 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-300'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200'
                    }`}
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Store Credit</span>
                  </button>
                </div>
              </div>

              {/* General Return Reason */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Overall Return Reason / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Defective seal or customer request"
                  value={generalReason}
                  onChange={(e) => setGeneralReason(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-navy-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                />

                <label className="mt-3 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Staff Notes
                </label>
                <input
                  type="text"
                  placeholder="Internal notes for audit ledger"
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-navy-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Refund Calculation & Impact Callout */}
          <div className="flex flex-col gap-3 rounded-2xl bg-amber-500/10 p-5 sm:flex-row sm:items-center sm:justify-between dark:bg-amber-500/5">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-300">
                <ShieldAlert className="h-4 w-4" />
                <span>Total Refund Amount to Disburse</span>
              </div>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                {totalReturningQty} item(s) being returned. Restocked items will immediately reflect in
                branch inventory.
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-2xl font-bold text-amber-800 dark:text-amber-300">
                {formatCurrency(totalCalculatedRefund, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-navy-800 dark:bg-navy-900/50">
          <button
            type="button"
            id="btn-cancel-return"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:bg-navy-700"
          >
            Cancel
          </button>

          <button
            type="button"
            id="btn-confirm-return"
            onClick={handleSubmit}
            disabled={isProcessing || totalReturningQty <= 0}
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing Return...</span>
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                <span>Confirm & Disburse {formatCurrency(totalCalculatedRefund, currency)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
