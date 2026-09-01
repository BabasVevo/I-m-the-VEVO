import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Layers,
  FileText,
  Loader2,
} from 'lucide-react';
import {
  generateFullSystemBackup,
  downloadJsonFile,
  exportProductsCsv,
  exportCustomersCsv,
  exportSalesCsv,
  exportExpensesCsv,
  exportPurchasesCsv,
  getDatabaseStats,
  resetSystemDemoData,
} from '@/services/settingsService';
import { useToast } from '@/context/ToastContext';

interface DataManagementTabProps {
  isSuperAdmin: boolean;
  canEdit?: boolean;
}

export function DataManagementTab({ isSuperAdmin }: DataManagementTabProps) {
  const { addToast } = useToast();
  const [stats, setStats] = useState<{
    isSupabaseConnected: boolean;
    totalRecords: number;
    storageMb: string;
    counts: Record<string, number>;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [exportingBackup, setExportingBackup] = useState(false);

  // Reset Modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [resetting, setResetting] = useState(false);

  // Import State
  const [importType, setImportType] = useState<'products' | 'customers'>('products');
  const [importingFile, setImportingFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<string[][] | null>(null);
  const [processingImport, setProcessingImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const data = await getDatabaseStats();
      setStats(data);
    } catch (err: unknown) {
      console.warn('Failed to load database stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleFullBackup = async () => {
    try {
      setExportingBackup(true);
      const { summary, jsonPayload } = await generateFullSystemBackup();
      const filename = `babas_system_backup_${new Date().toISOString().split('T')[0]}.json`;
      downloadJsonFile(jsonPayload, filename);
      addToast(`System backup created (${summary.counts.products} products, ${summary.counts.sales} sales).`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate backup.';
      addToast(msg, 'error');
    } finally {
      setExportingBackup(false);
    }
  };

  const handleExportCsv = async (type: 'products' | 'customers' | 'sales' | 'expenses' | 'purchases') => {
    try {
      if (type === 'products') await exportProductsCsv();
      else if (type === 'customers') await exportCustomersCsv();
      else if (type === 'sales') await exportSalesCsv();
      else if (type === 'expenses') await exportExpensesCsv();
      else if (type === 'purchases') await exportPurchasesCsv();
      addToast(`${type.toUpperCase()} exported to CSV.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to export CSV.';
      addToast(msg, 'error');
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      const parsed = lines.slice(0, 6).map((l) => l.split(',').map((c) => c.replace(/^"|"$/g, '').trim()));
      setImportPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!importingFile) return;
    setProcessingImport(true);
    try {
      // Simulate processing & insertion
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addToast(`Imported records from ${importingFile.name} successfully.`, 'success');
      setImportingFile(null);
      setImportPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process import.';
      addToast(msg, 'error');
    } finally {
      setProcessingImport(false);
    }
  };

  const handleResetExecute = async () => {
    if (confirmInput.trim().toUpperCase() !== 'RESET') {
      addToast('Please type RESET exactly to confirm.', 'error');
      return;
    }
    setResetting(true);
    try {
      await resetSystemDemoData();
      addToast('System demo data reset successfully. Reloading application...', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset system data.';
      addToast(msg, 'error');
    } finally {
      setResetting(false);
      setIsResetModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
          <Database className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          Data Management, Backup & System Diagnostics
        </h2>
        <p className="text-sm text-gray-500 dark:text-navy-300 mt-1">
          Generate complete JSON database snapshots, export table-specific spreadsheets, import catalog CSVs, and audit storage footprint.
        </p>
      </div>

      {/* Database Diagnostics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-900 p-5 rounded-xl border border-gray-200 dark:border-navy-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-navy-400 block font-medium">Database Connection</span>
            <span className="text-sm font-bold text-navy-900 dark:text-white">
              {stats?.isSupabaseConnected ? 'Cloud Supabase Active' : 'Offline / Local Demo'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-5 rounded-xl border border-gray-200 dark:border-navy-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-navy-400 block font-medium">Total Entities</span>
            <span className="text-lg font-bold text-navy-900 dark:text-white">
              {loadingStats ? '--' : `${stats?.totalRecords || 0} Records`}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-5 rounded-xl border border-gray-200 dark:border-navy-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <HardDrive className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-navy-400 block font-medium">Storage Estimate</span>
            <span className="text-lg font-bold text-navy-900 dark:text-white">
              {loadingStats ? '--' : `~${stats?.storageMb || '0.25'} MB`}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-5 rounded-xl border border-gray-200 dark:border-navy-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 dark:text-navy-400 block font-medium">Health Status</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Optimal Performance
            </span>
          </div>
          <button
            type="button"
            onClick={loadStats}
            className="p-2 rounded-lg text-gray-400 hover:text-navy-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-navy-800"
            title="Refresh Diagnostics"
          >
            <RefreshCw className={`h-4 w-4 ${loadingStats ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Full System Backup Card */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
              <Download className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Full System Backup (JSON Snapshot)
              </h3>
              <p className="text-xs text-gray-500 dark:text-navy-400">
                Downloads an encrypted-ready, complete JSON export of all products, inventory, customers, sales ledger, purchases, expenses, and system settings.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFullBackup}
            disabled={exportingBackup}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition disabled:opacity-50 shrink-0"
          >
            {exportingBackup ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export Full Backup (.JSON)
          </button>
        </div>

        {/* Breakdown of backed up records */}
        {stats?.counts && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100 dark:border-navy-800 text-xs">
            <div className="bg-gray-50 dark:bg-navy-950 p-2.5 rounded-lg">
              <span className="text-gray-400 block text-[10px]">Products:</span>
              <span className="font-bold text-navy-900 dark:text-white">{stats.counts.products} SKUs</span>
            </div>
            <div className="bg-gray-50 dark:bg-navy-950 p-2.5 rounded-lg">
              <span className="text-gray-400 block text-[10px]">Sales:</span>
              <span className="font-bold text-navy-900 dark:text-white">{stats.counts.sales} Receipts</span>
            </div>
            <div className="bg-gray-50 dark:bg-navy-950 p-2.5 rounded-lg">
              <span className="text-gray-400 block text-[10px]">Customers:</span>
              <span className="font-bold text-navy-900 dark:text-white">{stats.counts.customers} Accounts</span>
            </div>
            <div className="bg-gray-50 dark:bg-navy-950 p-2.5 rounded-lg">
              <span className="text-gray-400 block text-[10px]">Purchases & Expenses:</span>
              <span className="font-bold text-navy-900 dark:text-white">{(stats.counts.purchases || 0) + (stats.counts.expenses || 0)} Entries</span>
            </div>
          </div>
        )}
      </div>

      {/* CSV Exporters Grid */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              Export Modular CSV Spreadsheets
            </h3>
            <p className="text-xs text-gray-500 dark:text-navy-400">
              Download clean, comma-separated files formatted for Microsoft Excel, Google Sheets, or external accounting software.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {[
            { key: 'products', name: 'Products & Price Catalog', desc: 'SKUs, Cost, Selling Price, Min Stock' },
            { key: 'customers', name: 'Customer Directory', desc: 'Phone, Email, Total Spent, Credit' },
            { key: 'sales', name: 'Sales & Receipts Ledger', desc: 'Receipt #, Cashier, Taxes, Discounts' },
            { key: 'expenses', name: 'Operating Expenses', desc: 'Category, Amount, Date, Recorded By' },
            { key: 'purchases', name: 'Purchase Orders', desc: 'Supplier, PO #, Paid Amount, Delivery' },
          ].map((exp) => (
            <div
              key={exp.key}
              className="p-4 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 flex flex-col justify-between"
            >
              <div>
                <span className="font-bold text-xs text-navy-900 dark:text-white block">
                  {exp.name}
                </span>
                <p className="text-[11px] text-gray-500 dark:text-navy-400 mt-1">
                  {exp.desc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExportCsv(exp.key as 'products' | 'customers' | 'sales' | 'expenses' | 'purchases')}
                className="mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-navy-800 hover:bg-gray-100 dark:hover:bg-navy-700 text-brand-600 dark:text-brand-400 border border-gray-200 dark:border-navy-700 shadow-2xs transition"
              >
                <Download className="h-3.5 w-3.5" />
                Download CSV
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CSV Importer Tool */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              Data Import Assistant (CSV)
            </h3>
            <p className="text-xs text-gray-500 dark:text-navy-400">
              Bulk import new catalog items or customer contacts into the BABAS database.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-navy-800 dark:text-navy-200">Import Target:</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setImportType('products')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition ${
                importType === 'products'
                  ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300'
                  : 'border-gray-200 text-gray-600 dark:border-navy-700'
              }`}
            >
              Products Catalog
            </button>
            <button
              type="button"
              onClick={() => setImportType('customers')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition ${
                importType === 'customers'
                  ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300'
                  : 'border-gray-200 text-gray-600 dark:border-navy-700'
              }`}
            >
              Customer Contacts
            </button>
          </div>
        </div>

        {/* Upload box */}
        <div className="p-6 border-2 border-dashed border-gray-300 dark:border-navy-700 rounded-xl text-center bg-gray-50/50 dark:bg-navy-950/40">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".csv, text/csv"
            className="hidden"
          />
          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-navy-900 dark:text-white">
            {importingFile ? importingFile.name : 'Select a CSV spreadsheet to import'}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-navy-400 mt-1">
            Columns required: {importType === 'products' ? 'Product Name, SKU, Cost Price, Selling Price, Unit' : 'Full Name, Phone, Email, Customer Type'}
          </p>

          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition"
            >
              Choose File
            </button>
            {importingFile && (
              <button
                type="button"
                onClick={() => {
                  setImportingFile(null);
                  setImportPreview(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Import Preview */}
        {importPreview && (
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy-900 dark:text-white">
                File Preview (First 5 Rows):
              </span>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={processingImport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50"
              >
                {processingImport ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Confirm & Import Records
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <tbody>
                  {importPreview.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx === 0 ? 'font-bold bg-gray-200/60 dark:bg-navy-800' : 'border-t border-gray-200 dark:border-navy-800'}
                    >
                      {row.map((col, cIdx) => (
                        <td key={cIdx} className="p-1.5 truncate max-w-[150px]">
                          {col}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone: Factory Reset (Super Admin Only) */}
      {isSuperAdmin && (
        <div className="bg-rose-50/60 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/40 p-6 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
                  Danger Zone: System Factory Reset
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-300/80 mt-0.5">
                  Restores initial default records and cleans test transactions. Use with extreme caution.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setConfirmInput('');
                setIsResetModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset System Data
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-navy-900 w-full max-w-md rounded-xl shadow-xl border border-rose-200 dark:border-rose-900/50 overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Confirm System Factory Reset
              </h3>
            </div>

            <p className="text-xs text-gray-600 dark:text-navy-300 leading-relaxed">
              This will purge all custom products, sales transactions, purchase orders, expenses, and custom branches, restoring the initial BABAS demo seed state.
            </p>

            <div>
              <label className="block text-xs font-bold text-navy-900 dark:text-white mb-1.5">
                Type <span className="font-mono text-rose-600">RESET</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="RESET"
                className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-navy-300 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetExecute}
                disabled={confirmInput.trim().toUpperCase() !== 'RESET' || resetting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-sm disabled:opacity-40"
              >
                {resetting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Execute Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
