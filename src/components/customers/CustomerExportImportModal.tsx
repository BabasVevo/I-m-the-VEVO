import { useState } from 'react';
import { Download, Upload, X, RefreshCw } from 'lucide-react';
import type { Customer, CustomerType } from '@/types/database';
import { exportCustomersToCSV, createCustomer } from '@/services/customerService';
import { useToast } from '@/context/ToastContext';

interface CustomerExportImportModalProps {
  isOpen: boolean;
  mode: 'export' | 'import';
  businessId: string;
  customers: Customer[];
  currency?: string;
  onImportCompleted: () => void;
  onClose: () => void;
}

export function CustomerExportImportModal({
  isOpen,
  mode,
  businessId,
  customers,
  currency = 'TZS',
  onImportCompleted,
  onClose,
}: CustomerExportImportModalProps) {
  const { addToast } = useToast();
  const [currentMode, setCurrentMode] = useState<'export' | 'import'>(mode);

  // Import State
  const [csvContent, setCsvContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);

  if (!isOpen) return null;

  const handleExportCSV = () => {
    try {
      const csvData = exportCustomersToCSV(customers, currency);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `customers_export_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast({
        type: 'success',
        title: 'Export Complete',
        message: `Successfully exported ${customers.length} customer records to CSV.`,
      });
      onClose();
    } catch (err) {
      console.error('Error exporting customers:', err);
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Could not export customer records.',
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text || '');
    };
    reader.readAsText(file);
  };

  const handleProcessImport = async () => {
    if (!csvContent.trim()) return;

    setImporting(true);
    setImportResult(null);

    const lines = csvContent
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      setImportResult({ imported: 0, errors: ['CSV must have a header row and at least one data row.'] });
      setImporting(false);
      return;
    }

    let count = 0;
    const errors: string[] = [];

    // Parse header
    const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
    const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('customer'));
    const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile'));
    const emailIdx = headers.findIndex((h) => h.includes('email'));
    const cityIdx = headers.findIndex((h) => h.includes('city'));
    const addressIdx = headers.findIndex((h) => h.includes('address'));
    const typeIdx = headers.findIndex((h) => h.includes('type'));
    const notesIdx = headers.findIndex((h) => h.includes('note'));

    for (let i = 1; i < lines.length; i++) {
      try {
        const row = lines[i].split(',').map((val) => val.replace(/^["']|["']$/g, '').trim());
        const customerName = nameIdx !== -1 ? row[nameIdx] : row[0];
        if (!customerName) continue;

        const phone = phoneIdx !== -1 ? row[phoneIdx] : null;
        const email = emailIdx !== -1 ? row[emailIdx] : null;
        const city = cityIdx !== -1 ? row[cityIdx] : 'Dar es Salaam';
        const address = addressIdx !== -1 ? row[addressIdx] : null;
        const typeRaw = typeIdx !== -1 ? row[typeIdx]?.toLowerCase() : 'regular';
        const validTypes: CustomerType[] = ['regular', 'vip', 'wholesale', 'business', 'walk_in'];
        const customerType: CustomerType = validTypes.includes(typeRaw as CustomerType) ? (typeRaw as CustomerType) : 'regular';
        const notes = notesIdx !== -1 ? row[notesIdx] : null;

        await createCustomer({
          business_id: businessId,
          name: customerName,
          phone,
          email,
          city,
          address,
          customer_type: customerType,
          notes,
        });

        count++;
      } catch (err: unknown) {
        errors.push(`Row ${i + 1}: ${(err as Error).message || 'Failed to import'}`);
      }
    }

    setImporting(false);
    setImportResult({ imported: count, errors });

    if (count > 0) {
      addToast({
        type: 'success',
        title: 'Import Completed',
        message: `Successfully imported ${count} customers.`,
      });
      onImportCompleted();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all dark:bg-navy-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              {currentMode === 'export' ? <Download className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                {currentMode === 'export' ? 'Export Customers to CSV' : 'Import Customers from CSV'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentMode === 'export'
                  ? 'Download customer profiles, contact info, tags, and stats'
                  : 'Bulk upload customer records into your database'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:hover:bg-navy-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toggle Mode */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 px-6 dark:border-navy-800 dark:bg-navy-950/40">
          <button
            type="button"
            onClick={() => setCurrentMode('export')}
            className={`border-b-2 py-3 px-4 text-xs font-bold transition ${
              currentMode === 'export'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Export to CSV
          </button>
          <button
            type="button"
            onClick={() => setCurrentMode('import')}
            className={`border-b-2 py-3 px-4 text-xs font-bold transition ${
              currentMode === 'import'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Import from CSV
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {currentMode === 'export' ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-navy-800 dark:bg-navy-950/40">
                <div className="text-xs font-bold text-navy-900 dark:text-white">Export Scope</div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Ready to export <strong className="text-navy-900 dark:text-white">{customers.length}</strong> currently filtered customer records.
                </p>
                <div className="mt-3 text-[11px] text-gray-500 space-y-1">
                  <div>• Full contact info (Name, Phone, Email, Address, City)</div>
                  <div>• Financial stats (Total spent, Order count, Outstanding debt)</div>
                  <div>• Segmentation info (Customer type, Status, Tags)</div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-600 active:scale-95"
                >
                  <Download className="h-4 w-4" />
                  <span>Download CSV File</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Drag and Drop or Input */}
              <div className="rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center dark:border-navy-700">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-xs font-bold text-navy-900 dark:text-white">
                  Upload CSV Document
                </p>
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  Header format: Name, Phone, Email, City, Address, Type, Notes
                </p>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="mt-3 block w-full text-xs text-gray-500 file:mr-4 file:rounded-xl file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-950 dark:file:text-brand-300"
                />
              </div>

              {/* CSV Raw Text Area */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Or Paste CSV Data Directly:
                </label>
                <textarea
                  rows={4}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder="Name,Phone,Email,City,Type&#10;Amina Salim,+255712334455,amina@example.com,Dar es Salaam,vip&#10;David Kimaro,+255788990011,david@example.com,Arusha,regular"
                  className="mt-1 font-mono text-xs w-full rounded-xl border border-gray-200 bg-white p-3 text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              {/* Import Results Box */}
              {importResult && (
                <div className={`rounded-2xl p-4 text-xs ${
                  importResult.imported > 0 ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                }`}>
                  <div className="font-bold">
                    {importResult.imported > 0
                      ? `Import Finished: ${importResult.imported} customers created.`
                      : 'Import Failed.'}
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2 space-y-1 text-[11px]">
                      {importResult.errors.slice(0, 5).map((e, idx) => (
                        <div key={idx}>• {e}</div>
                      ))}
                      {importResult.errors.length > 5 && (
                        <div>...and {importResult.errors.length - 5} more issues.</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={importing || !csvContent.trim()}
                  onClick={handleProcessImport}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-600 active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${importing ? 'animate-spin' : ''}`} />
                  <span>{importing ? 'Importing...' : 'Start Import'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
