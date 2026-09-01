import { useState, useRef } from 'react';
import {
  Printer,
  X,
  CheckCircle2,
  Copy,
  PlusCircle,
} from 'lucide-react';
import type { Sale } from '@/types/database';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { useToast } from '@/context/ToastContext';

interface ReceiptModalProps {
  isOpen: boolean;
  sale: Sale | null;
  businessName?: string;
  businessAddress?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
  currency?: string;
  onNewSale: () => void;
  onClose: () => void;
}

export function ReceiptModal({
  isOpen,
  sale,
  businessName = 'BABAS POS & Inventory',
  businessAddress = 'Boulevard du 1er Novembre, Rohero, Bujumbura',
  businessPhone = '+257 22 25 1200',
  businessEmail = 'contact@babaspos.bi',
  currency = 'BIF',
  onNewSale,
  onClose,
}: ReceiptModalProps) {
  const { addToast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [receiptFormat, setReceiptFormat] = useState<'80mm' | 'a4'>('80mm');

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const lines = [
      `=== ${businessName.toUpperCase()} ===`,
      businessAddress || '',
      `Tel: ${businessPhone || ''}`,
      businessEmail ? `Email: ${businessEmail}` : '',
      '--------------------------------',
      `Receipt #: ${sale.receipt_number}`,
      `Date: ${formatDateTime(sale.created_at)}`,
      `Branch: ${sale.branch?.name || 'Main Branch'}`,
      `Cashier: ${sale.cashier?.full_name || 'Staff'}`,
      `Customer: ${sale.customer?.name || 'Walk-in'}`,
      '--------------------------------',
      ...(sale.items?.map(
        (it) =>
          `${it.product_name}\n  ${it.quantity}x @ ${formatCurrency(it.unit_price, currency)} = ${formatCurrency(it.total_price, currency)}`
      ) || []),
      '--------------------------------',
      `Subtotal: ${formatCurrency(sale.subtotal, currency)}`,
      sale.discount_amount > 0 ? `Discount: -${formatCurrency(sale.discount_amount, currency)}` : '',
      `Tax/VAT: ${formatCurrency(sale.tax_amount, currency)}`,
      `TOTAL: ${formatCurrency(sale.total_amount, currency)}`,
      `Paid (${sale.payment_method.toUpperCase()}): ${formatCurrency(sale.paid_amount, currency)}`,
      sale.due_amount > 0 ? `Balance Due: ${formatCurrency(sale.due_amount, currency)}` : '',
      '--------------------------------',
      'Thank you for shopping with us!',
      'Goods once sold are not returnable without receipt.',
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    addToast({
      type: 'success',
      title: 'Receipt Copied',
      message: 'Receipt text summary copied to clipboard.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-xs">
      <div className="flex max-h-[95vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all dark:bg-navy-900">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                Receipt #{sale.receipt_number}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Transaction recorded and stock adjusted
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle */}
            <div className="flex rounded-xl bg-gray-100 p-0.5 dark:bg-navy-950">
              <button
                type="button"
                onClick={() => setReceiptFormat('80mm')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  receiptFormat === '80mm'
                    ? 'bg-white text-navy-900 shadow-2xs dark:bg-navy-800 dark:text-white'
                    : 'text-gray-500'
                }`}
              >
                Thermal (80mm)
              </button>
              <button
                type="button"
                onClick={() => setReceiptFormat('a4')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  receiptFormat === 'a4'
                    ? 'bg-white text-navy-900 shadow-2xs dark:bg-navy-800 dark:text-white'
                    : 'text-gray-500'
                }`}
              >
                Invoice A4
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:hover:bg-navy-800 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Receipt Visual Body (Optimized for Screen & Print) */}
        <div className="flex-1 overflow-y-auto bg-gray-50/70 p-6 dark:bg-navy-950/40">
          <div
            ref={receiptRef}
            id="printable-receipt"
            className={`mx-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-navy-800 dark:bg-navy-900 ${
              receiptFormat === '80mm' ? 'max-w-[340px] font-mono text-xs' : 'max-w-md text-xs'
            }`}
          >
            {/* Business Header */}
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 font-black text-white">
                V
              </div>
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-navy-900 dark:text-white">
                {businessName}
              </h2>
              {businessAddress && (
                <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                  {businessAddress}
                </p>
              )}
              {businessPhone && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Tel: {businessPhone}
                </p>
              )}
            </div>

            {/* Separator */}
            <div className="my-3 border-b border-dashed border-gray-300 dark:border-navy-700" />

            {/* Metadata info */}
            <div className="space-y-1 text-[11px] text-gray-600 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Receipt:</span>
                <span className="font-bold">{sale.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formatDateTime(sale.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Branch:</span>
                <span>{sale.branch?.name || 'Downtown'}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{sale.cashier?.full_name || 'Counter Staff'}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-semibold">{sale.customer?.name || 'Walk-in Customer'}</span>
              </div>
            </div>

            {/* Separator */}
            <div className="my-3 border-b border-dashed border-gray-300 dark:border-navy-700" />

            {/* Items Table */}
            <div className="space-y-2.5">
              <div className="flex justify-between font-bold text-gray-400 uppercase text-[10px]">
                <span>Item / Qty</span>
                <span>Total</span>
              </div>

              {sale.items?.map((it) => (
                <div key={it.id} className="text-xs">
                  <div className="flex justify-between">
                    <span className="font-bold text-navy-900 dark:text-white">
                      {it.product_name}
                    </span>
                    <span className="font-bold text-navy-900 dark:text-white">
                      {formatCurrency(it.total_price, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
                    <span>
                      {it.quantity} x {formatCurrency(it.unit_price, currency)}
                    </span>
                    {it.discount_amount > 0 && (
                      <span className="text-rose-500">
                        (-{formatCurrency(it.discount_amount, currency)})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Separator */}
            <div className="my-3 border-b border-dashed border-gray-300 dark:border-navy-700" />

            {/* Totals */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Subtotal:</span>
                <span>{formatCurrency(sale.subtotal, currency)}</span>
              </div>

              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>Total Discount:</span>
                  <span>- {formatCurrency(sale.discount_amount, currency)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Tax / VAT:</span>
                <span>{formatCurrency(sale.tax_amount, currency)}</span>
              </div>

              <div className="flex justify-between border-t border-gray-200 pt-1.5 text-sm font-black text-navy-900 dark:border-navy-700 dark:text-white">
                <span>TOTAL:</span>
                <span>{formatCurrency(sale.total_amount, currency)}</span>
              </div>

              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Paid ({sale.payment_method.toUpperCase()}):</span>
                <span>{formatCurrency(sale.paid_amount, currency)}</span>
              </div>

              {sale.due_amount > 0 && (
                <div className="flex justify-between font-bold text-rose-600 dark:text-rose-400">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(sale.due_amount, currency)}</span>
                </div>
              )}
            </div>

            {/* Notes if any */}
            {sale.notes && (
              <div className="mt-3 rounded-lg bg-gray-50 p-2 text-[10px] text-gray-500 dark:bg-navy-950">
                Note: {sale.notes}
              </div>
            )}

            {/* Barcode & Footer note */}
            <div className="mt-4 pt-2 text-center text-[10px] text-gray-400">
              <div className="mx-auto my-2 flex h-8 w-44 items-center justify-center rounded-sm bg-gray-900 px-2 text-white">
                <span className="font-mono tracking-widest text-[9px]">{sale.receipt_number}</span>
              </div>
              <p className="font-semibold text-gray-600 dark:text-gray-300">
                Thank you for your business!
              </p>
              <p>Items may be returned within 7 days with valid receipt.</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-3.5 dark:border-navy-800 dark:bg-navy-950">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-navy-900 shadow-2xs hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-navy-900 shadow-2xs hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                title="Copy receipt text"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onNewSale();
              }}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-600 active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Next Sale</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
