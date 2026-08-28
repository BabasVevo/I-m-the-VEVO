import { X, Printer, Barcode } from 'lucide-react';
import type { Product } from '@/types/database';

interface BarcodePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  currencySymbol?: string;
}

export function BarcodePreviewModal({
  isOpen,
  onClose,
  product,
  currencySymbol = 'TZS',
}: BarcodePreviewModalProps) {
  if (!isOpen || !product) return null;

  const handlePrint = () => {
    window.print();
  };

  const code = product.barcode || product.sku || '616400018901';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-navy-800 dark:bg-navy-900"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-navy-800">
          <div className="flex items-center gap-2">
            <Barcode className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              Print Barcode Label
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-navy-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Barcode Label Card */}
        <div className="mt-5 rounded-2xl border-2 border-dashed border-gray-300 bg-white p-5 text-center shadow-xs dark:border-navy-700 dark:bg-navy-950">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Verdant Retail
          </p>
          <h4 className="mt-1 text-sm font-bold text-navy-900 dark:text-white truncate">
            {product.name}
          </h4>

          {/* Barcode Graphic Representation */}
          <div className="my-4 flex flex-col items-center justify-center">
            <div className="flex h-14 w-48 items-center justify-center gap-[3px] bg-white px-2 py-1 dark:bg-white rounded-sm">
              {Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-full ${
                    i % 4 === 0
                      ? 'w-[3px] bg-black'
                      : i % 3 === 0
                      ? 'w-[1px] bg-black'
                      : i % 2 === 0
                      ? 'w-[2px] bg-black'
                      : 'w-[1px] bg-white'
                  }`}
                />
              ))}
            </div>
            <p className="mt-1.5 font-mono text-xs font-bold tracking-widest text-navy-900 dark:text-gray-300">
              {code}
            </p>
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 dark:border-navy-800 text-xs">
            <span className="font-mono text-gray-500">{product.sku}</span>
            <span className="font-bold text-navy-900 dark:text-white text-sm">
              {currencySymbol} {Number(product.selling_price).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            <Printer className="h-4 w-4" /> Print Label
          </button>
        </div>
      </div>
    </div>
  );
}
