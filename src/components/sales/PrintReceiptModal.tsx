import { useState } from 'react';
import { X, Printer, Settings } from 'lucide-react';
import type { Sale, ReceiptSettings } from '@/types/database';
import { ReceiptPreview } from './ReceiptPreview';

interface PrintReceiptModalProps {
  isOpen: boolean;
  sale: Sale | null;
  receiptSettings?: ReceiptSettings;
  businessName?: string;
  businessAddress?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
  businessTaxId?: string | null;
  currency?: string;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export function PrintReceiptModal({
  isOpen,
  sale,
  receiptSettings,
  businessName,
  businessAddress,
  businessPhone,
  businessEmail,
  businessTaxId,
  currency = 'TZS',
  onClose,
  onOpenSettings,
}: PrintReceiptModalProps) {
  const defaultFmt = receiptSettings?.default_format || '80mm';
  const [format, setFormat] = useState<'80mm' | '58mm' | 'a4'>(defaultFmt);

  if (!isOpen || !sale) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-xs">
      <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all dark:bg-navy-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Receipt #{sale.receipt_number}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Print preview, format switcher, and receipt reproduction
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSettings && (
              <button
                type="button"
                id="btn-receipt-settings"
                onClick={onOpenSettings}
                title="Customize receipt template"
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:bg-navy-700"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Template</span>
              </button>
            )}
            <button
              type="button"
              id="btn-close-print-modal"
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-navy-800 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <ReceiptPreview
            sale={sale}
            receiptSettings={receiptSettings}
            businessName={businessName}
            businessAddress={businessAddress}
            businessPhone={businessPhone}
            businessEmail={businessEmail}
            businessTaxId={businessTaxId}
            currency={currency}
            format={format}
            onFormatChange={setFormat}
            showFormatSelector={true}
          />
        </div>
      </div>
    </div>
  );
}
