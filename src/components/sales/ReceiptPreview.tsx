import { useRef } from 'react';
import {
  Printer,
  Copy,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import type { Sale, ReceiptSettings } from '@/types/database';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { useToast } from '@/context/ToastContext';

interface ReceiptPreviewProps {
  sale: Sale;
  receiptSettings?: ReceiptSettings;
  businessName?: string;
  businessAddress?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
  businessTaxId?: string | null;
  currency?: string;
  format?: '80mm' | '58mm' | 'a4';
  onFormatChange?: (format: '80mm' | '58mm' | 'a4') => void;
  showFormatSelector?: boolean;
}

export function ReceiptPreview({
  sale,
  receiptSettings,
  businessName = 'Verdant Retail & Co.',
  businessAddress = '14 Kivukoni Front, Dar es Salaam',
  businessPhone = '+255 22 211 4300',
  businessEmail = 'contact@verdantpos.com',
  businessTaxId = 'TIN-992-108-441',
  currency = 'TZS',
  format = '80mm',
  onFormatChange,
  showFormatSelector = true,
}: ReceiptPreviewProps) {
  const { addToast } = useToast();
  const printContainerRef = useRef<HTMLDivElement>(null);

  const headerTitle = receiptSettings?.header_title || businessName;
  const subtitle = receiptSettings?.subtitle ?? 'Quality Retail & Fresh Goods';
  const footerMessage =
    receiptSettings?.footer_message ?? 'Thank you for your business. We appreciate your patronage!';
  const returnPolicy =
    receiptSettings?.return_policy ??
    'Goods can be exchanged or returned within 7 days with valid original receipt.';
  const showBarcode = receiptSettings?.show_barcode ?? true;
  const showTaxBreakdown = receiptSettings?.show_tax_breakdown ?? true;
  const showCashier = receiptSettings?.show_cashier ?? true;
  const showCustomerInfo = receiptSettings?.show_customer_info ?? true;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const lines = [
      `========================================`,
      `${headerTitle.toUpperCase()}`,
      subtitle ? `${subtitle}` : '',
      businessAddress || '',
      `Tel: ${businessPhone || ''}`,
      businessEmail ? `Email: ${businessEmail}` : '',
      businessTaxId ? `TIN / VAT ID: ${businessTaxId}` : '',
      `========================================`,
      `RECEIPT #: ${sale.receipt_number}`,
      `DATE: ${formatDateTime(sale.created_at)}`,
      `BRANCH: ${sale.branch?.name || 'Main Branch'}`,
      showCashier ? `CASHIER: ${sale.cashier?.full_name || 'Staff'}` : '',
      showCustomerInfo && sale.customer ? `CUSTOMER: ${sale.customer.name}` : '',
      `STATUS: ${sale.payment_status.toUpperCase()}`,
      `----------------------------------------`,
      `ITEMS:`,
      ...(sale.items?.map(
        (it) =>
          `• ${it.product_name}\n  ${it.quantity} x ${formatCurrency(it.unit_price, currency)} = ${formatCurrency(it.total_price, currency)}` +
          (it.returned_quantity && it.returned_quantity > 0 ? ` (Returned: ${it.returned_quantity})` : '')
      ) || []),
      `----------------------------------------`,
      `Subtotal: ${formatCurrency(sale.subtotal, currency)}`,
      sale.discount_amount > 0 ? `Discount: -${formatCurrency(sale.discount_amount, currency)}` : '',
      showTaxBreakdown ? `Tax / VAT (18%): ${formatCurrency(sale.tax_amount, currency)}` : '',
      `TOTAL: ${formatCurrency(sale.total_amount, currency)}`,
      `Paid (${sale.payment_method.toUpperCase()}): ${formatCurrency(sale.paid_amount, currency)}`,
      (sale.refunded_amount || 0) > 0
        ? `Refunded: -${formatCurrency(sale.refunded_amount || 0, currency)}`
        : '',
      sale.due_amount > 0 ? `Balance Due: ${formatCurrency(sale.due_amount, currency)}` : '',
      `========================================`,
      footerMessage,
      returnPolicy,
      `========================================`,
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    addToast({
      type: 'success',
      title: 'Receipt Copied',
      message: 'Plain text receipt has been copied to clipboard.',
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3 print:hidden dark:border-navy-800">
        {showFormatSelector && onFormatChange && (
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1 dark:bg-navy-800">
            <button
              type="button"
              id="btn-format-80mm"
              onClick={() => onFormatChange('80mm')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                format === '80mm'
                  ? 'bg-white text-navy-900 shadow-xs dark:bg-navy-900 dark:text-white'
                  : 'text-gray-600 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              80mm Thermal
            </button>
            <button
              type="button"
              id="btn-format-58mm"
              onClick={() => onFormatChange('58mm')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                format === '58mm'
                  ? 'bg-white text-navy-900 shadow-xs dark:bg-navy-900 dark:text-white'
                  : 'text-gray-600 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              58mm Mini
            </button>
            <button
              type="button"
              id="btn-format-a4"
              onClick={() => onFormatChange('a4')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                format === 'a4'
                  ? 'bg-white text-navy-900 shadow-xs dark:bg-navy-900 dark:text-white'
                  : 'text-gray-600 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              A4 Invoice
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-copy-receipt"
            onClick={handleCopyText}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:bg-navy-700"
          >
            <Copy className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            Copy Text
          </button>
          <button
            type="button"
            id="btn-print-receipt"
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 active:scale-95"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Receipt
          </button>
        </div>
      </div>

      {/* Printable Receipt Canvas */}
      <div className="flex justify-center overflow-x-auto p-2">
        {format === 'a4' ? (
          /* A4 Full Page Invoice Layout */
          <div
            ref={printContainerRef}
            id="printable-a4-receipt"
            className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 font-sans text-navy-950 shadow-sm print:m-0 print:w-full print:max-w-none print:border-none print:p-0 print:shadow-none dark:border-navy-800 dark:bg-navy-900 dark:text-gray-100"
          >
            {/* A4 Header */}
            <div className="flex items-start justify-between border-b border-gray-200 pb-6 dark:border-navy-700">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 font-bold text-white">
                    V
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-navy-900 dark:text-white">
                      {headerTitle}
                    </h1>
                    {subtitle && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                  <p>{businessAddress}</p>
                  <p>
                    Tel: {businessPhone} | Email: {businessEmail}
                  </p>
                  {businessTaxId && <p>Tax ID / TIN: {businessTaxId}</p>}
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block rounded-lg bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  Official Receipt
                </span>
                <p className="mt-2 text-base font-bold text-navy-900 dark:text-white">
                  #{sale.receipt_number}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Date: {formatDateTime(sale.created_at)}
                </p>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      sale.payment_status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : sale.payment_status === 'partially_refunded'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : sale.payment_status === 'refunded'
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {sale.payment_status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* A4 Info Grid */}
            <div className="grid grid-cols-2 gap-6 border-b border-gray-200 py-4 text-xs dark:border-navy-700">
              <div>
                <p className="font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Billed To
                </p>
                {showCustomerInfo && sale.customer ? (
                  <div className="mt-1 font-medium text-navy-900 dark:text-white">
                    <p className="font-bold">{sale.customer.name}</p>
                    {sale.customer.phone && <p>{sale.customer.phone}</p>}
                    {sale.customer.email && <p>{sale.customer.email}</p>}
                    {sale.customer.address && <p>{sale.customer.address}</p>}
                  </div>
                ) : (
                  <p className="mt-1 text-gray-600 dark:text-gray-300">Walk-in Customer</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Transaction Metadata
                </p>
                <p className="mt-1 text-gray-700 dark:text-gray-300">
                  Branch: <span className="font-semibold">{sale.branch?.name || 'Main Branch'}</span>
                </p>
                {showCashier && (
                  <p className="text-gray-700 dark:text-gray-300">
                    Served by:{' '}
                    <span className="font-semibold">{sale.cashier?.full_name || 'Staff'}</span>
                  </p>
                )}
                <p className="text-gray-700 dark:text-gray-300">
                  Payment Method:{' '}
                  <span className="font-semibold uppercase">{sale.payment_method.replace('_', ' ')}</span>
                </p>
              </div>
            </div>

            {/* A4 Item Table */}
            <div className="mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 font-bold text-gray-700 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-300">
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Discount</th>
                    <th className="py-2.5 px-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
                  {sale.items?.map((it) => (
                    <tr key={it.id} className="text-gray-800 dark:text-gray-200">
                      <td className="py-2.5 px-3 font-medium">
                        {it.product_name}
                        {it.returned_quantity && it.returned_quantity > 0 ? (
                          <span className="ml-2 inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                            {it.returned_quantity} Returned
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500 dark:text-gray-400">
                        {it.sku || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {formatCurrency(it.unit_price, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                        {it.discount_amount > 0 ? `-${formatCurrency(it.discount_amount, currency)}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-navy-900 dark:text-white">
                        {formatCurrency(it.total_price, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* A4 Summary Block */}
            <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-navy-700">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(sale.subtotal, currency)}</span>
                </div>
                {sale.discount_amount > 0 && (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400">
                    <span>Discount:</span>
                    <span className="font-mono">-{formatCurrency(sale.discount_amount, currency)}</span>
                  </div>
                )}
                {showTaxBreakdown && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Tax / VAT (18%):</span>
                    <span className="font-mono">{formatCurrency(sale.tax_amount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-bold text-navy-900 dark:border-navy-700 dark:text-white">
                  <span>Grand Total:</span>
                  <span className="font-mono text-base text-brand-600 dark:text-brand-400">
                    {formatCurrency(sale.total_amount, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Paid ({sale.payment_method.toUpperCase()}):</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(sale.paid_amount, currency)}
                  </span>
                </div>
                {(sale.refunded_amount || 0) > 0 && (
                  <div className="flex justify-between text-purple-600 font-semibold dark:text-purple-400">
                    <span>Total Refunded:</span>
                    <span className="font-mono">
                      -{formatCurrency(sale.refunded_amount || 0, currency)}
                    </span>
                  </div>
                )}
                {sale.due_amount > 0 && (
                  <div className="flex justify-between font-bold text-amber-600 dark:text-amber-400">
                    <span>Balance Due:</span>
                    <span className="font-mono">{formatCurrency(sale.due_amount, currency)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* A4 Returns / Refunds breakdown if any */}
            {sale.returns && sale.returns.length > 0 && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-xs dark:border-amber-900/50 dark:bg-amber-950/20">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                  <RotateCcw className="h-4 w-4" />
                  <span>Returns & Refunds Applied</span>
                </div>
                <div className="mt-2 space-y-2">
                  {sale.returns.map((ret) => (
                    <div
                      key={ret.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-200/60 pt-2 text-amber-900 dark:border-amber-900/40 dark:text-amber-200"
                    >
                      <div>
                        <span className="font-bold">#{ret.return_number}</span> — {ret.reason} (
                        {formatDateTime(ret.created_at)})
                      </div>
                      <div className="font-mono font-bold">
                        Refund: {formatCurrency(ret.refund_amount, currency)} via{' '}
                        {ret.refund_method.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* A4 Footer */}
            <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-500 dark:border-navy-700 dark:text-gray-400">
              <p className="font-semibold text-navy-800 dark:text-gray-200">{footerMessage}</p>
              <p className="mt-1 text-[11px] text-gray-500">{returnPolicy}</p>
              <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-gray-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Verified Point of Sale Transaction Record</span>
              </div>
            </div>
          </div>
        ) : (
          /* Thermal POS Receipt Layout (80mm or 58mm) */
          <div
            ref={printContainerRef}
            id="printable-thermal-receipt"
            className={`${
              format === '58mm' ? 'w-[280px]' : 'w-[360px]'
            } rounded-2xl border border-gray-200 bg-white p-6 font-mono text-[11px] leading-relaxed text-gray-900 shadow-sm print:m-0 print:w-full print:max-w-none print:border-none print:p-0 print:shadow-none dark:border-navy-800 dark:bg-navy-900 dark:text-gray-100`}
          >
            {/* Thermal Header */}
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-navy-900 text-xs font-bold text-white dark:bg-white dark:text-navy-900">
                V
              </div>
              <h2 className="text-sm font-bold tracking-tight text-navy-950 dark:text-white">
                {headerTitle}
              </h2>
              {subtitle && <p className="text-[10px] text-gray-500 dark:text-gray-400">{subtitle}</p>}
              <p className="mt-1 text-[10px] text-gray-600 dark:text-gray-400">{businessAddress}</p>
              <p className="text-[10px] text-gray-600 dark:text-gray-400">Tel: {businessPhone}</p>
              {businessTaxId && (
                <p className="text-[10px] text-gray-600 dark:text-gray-400">TIN: {businessTaxId}</p>
              )}
            </div>

            <div className="my-3 border-b border-dashed border-gray-300 dark:border-navy-700" />

            {/* Receipt Metadata */}
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Receipt #:</span>
                <span className="font-bold text-navy-900 dark:text-white">{sale.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date/Time:</span>
                <span>{formatDateTime(sale.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Branch:</span>
                <span>{sale.branch?.name || 'Main Branch'}</span>
              </div>
              {showCashier && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Cashier:</span>
                  <span>{sale.cashier?.full_name || 'Staff'}</span>
                </div>
              )}
              {showCustomerInfo && sale.customer && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer:</span>
                  <span className="font-semibold">{sale.customer.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span
                  className={`font-bold uppercase ${
                    sale.payment_status === 'completed'
                      ? 'text-emerald-600'
                      : sale.payment_status === 'partially_refunded'
                      ? 'text-amber-600'
                      : sale.payment_status === 'refunded'
                      ? 'text-purple-600'
                      : 'text-rose-600'
                  }`}
                >
                  {sale.payment_status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="my-3 border-b border-dashed border-gray-300 dark:border-navy-700" />

            {/* Thermal Items List */}
            <div className="space-y-2 text-[10px]">
              {sale.items?.map((it) => (
                <div key={it.id} className="space-y-0.5">
                  <div className="flex justify-between font-semibold">
                    <span className="line-clamp-1 pr-2">{it.product_name}</span>
                    <span>{formatCurrency(it.total_price, currency)}</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-500 dark:text-gray-400">
                    <span>
                      {it.quantity} x {formatCurrency(it.unit_price, currency)}
                      {it.discount_amount > 0 && ` (-${formatCurrency(it.discount_amount, currency)})`}
                    </span>
                    {it.returned_quantity && it.returned_quantity > 0 ? (
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {it.returned_quantity} Ret.
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="my-3 border-b border-dashed border-gray-300 dark:border-navy-700" />

            {/* Thermal Totals */}
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{formatCurrency(sale.subtotal, currency)}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>Discount</span>
                  <span>-{formatCurrency(sale.discount_amount, currency)}</span>
                </div>
              )}
              {showTaxBreakdown && (
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>VAT / Tax (18%)</span>
                  <span>{formatCurrency(sale.tax_amount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-900 pt-1 text-xs font-bold text-navy-950 dark:border-white dark:text-white">
                <span>TOTAL</span>
                <span className="text-sm">{formatCurrency(sale.total_amount, currency)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Paid ({sale.payment_method.toUpperCase()})</span>
                <span className="font-semibold">{formatCurrency(sale.paid_amount, currency)}</span>
              </div>
              {(sale.refunded_amount || 0) > 0 && (
                <div className="flex justify-between font-bold text-purple-600 dark:text-purple-400">
                  <span>Total Refunded</span>
                  <span>-{formatCurrency(sale.refunded_amount || 0, currency)}</span>
                </div>
              )}
              {sale.due_amount > 0 && (
                <div className="flex justify-between font-bold text-amber-600 dark:text-amber-400">
                  <span>Balance Due</span>
                  <span>{formatCurrency(sale.due_amount, currency)}</span>
                </div>
              )}
            </div>

            {/* Barcode representation */}
            {showBarcode && (
              <div className="mt-4 flex flex-col items-center justify-center pt-2">
                <div className="flex h-10 w-44 items-center justify-center space-x-1 rounded bg-gray-100 px-2 dark:bg-navy-800">
                  {/* Visual Barcode pattern */}
                  <div className="h-7 w-0.5 bg-gray-900 dark:bg-white" />
                  <div className="h-7 w-1 bg-gray-900 dark:bg-white" />
                  <div className="h-7 w-0.5 bg-transparent" />
                  <div className="h-7 w-1.5 bg-gray-900 dark:bg-white" />
                  <div className="h-7 w-0.5 bg-gray-900 dark:bg-white" />
                  <div className="h-7 w-1 bg-gray-900 dark:bg-white" />
                  <div className="h-7 w-0.5 bg-transparent" />
                  <div className="h-7 w-2 bg-gray-900 dark:bg-white" />
                  <div className="h-7 w-0.5 bg-gray-900 dark:bg-white" />
                  <div className="h-7 w-1 bg-gray-900 dark:bg-white" />
                  <div className="h-7 w-0.5 bg-gray-900 dark:bg-white" />
                  <div className="h-7 w-1.5 bg-gray-900 dark:bg-white" />
                  <div className="h-7 w-0.5 bg-transparent" />
                  <div className="h-7 w-1 bg-gray-900 dark:bg-white" />
                  <div className="h-7 w-2 bg-gray-900 dark:bg-white" />
                  <div className="h-7 w-0.5 bg-gray-900 dark:bg-white" />
                  <div className="h-7 w-1 bg-gray-900 dark:bg-white" />
                </div>
                <span className="mt-1 font-mono text-[9px] tracking-widest text-gray-500">
                  *{sale.receipt_number}*
                </span>
              </div>
            )}

            {/* Thermal Footer */}
            <div className="mt-4 border-t border-dashed border-gray-300 pt-3 text-center text-[9px] text-gray-600 dark:border-navy-700 dark:text-gray-400">
              <p className="font-bold text-gray-800 dark:text-gray-200">{footerMessage}</p>
              <p className="mt-1 text-[8px] text-gray-500">{returnPolicy}</p>
              <p className="mt-2 text-[8px] text-gray-400">Powered by Verdant Cloud POS</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
