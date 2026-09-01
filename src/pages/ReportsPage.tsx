import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getReportsSummary,
  getSalesReportData,
  getProfitLossData,
  getInventoryReportData,
  getExpenseReportData,
  getPurchaseReportData,
  getCustomerReportData,
  getDateRangeInterval,
  generateReportCsv,
  downloadCsvFile,
  type ReportFilterOptions,
  type ReportsSummary,
  type SalesReportData,
  type ProfitLossReportData,
  type InventoryReportData,
  type ExpenseReportData,
  type PurchaseReportData,
  type CustomerReportData,
} from '@/services/reportService';
import { getStoredBranches } from '@/services/employeeService';
import { ReportFilterBar } from '@/components/reports/ReportFilterBar';
import { ReportSummaryCards } from '@/components/reports/ReportSummaryCards';
import { SalesReportTab } from '@/components/reports/SalesReportTab';
import { ProfitLossReportTab } from '@/components/reports/ProfitLossReportTab';
import { InventoryReportTab } from '@/components/reports/InventoryReportTab';
import { ExpenseReportTab } from '@/components/reports/ExpenseReportTab';
import { PurchaseReportTab } from '@/components/reports/PurchaseReportTab';
import { CustomerReportTab } from '@/components/reports/CustomerReportTab';
import { PrintableReportView } from '@/components/reports/PrintableReportView';
import type { Branch } from '@/types/database';
import {
  BarChart3,
  TrendingUp,
  Boxes,
  CreditCard,
  Truck,
  Users,
  LayoutDashboard,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

type ReportTabType = 'overview' | 'sales' | 'pnl' | 'inventory' | 'expenses' | 'purchases' | 'customers';

export function ReportsPage() {
  const { currentBusiness, currentBranch, isSuperAdmin } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<ReportTabType>('overview');
  const [filters, setFilters] = useState<ReportFilterOptions>({
    datePreset: 'this_month',
    branchId: isSuperAdmin ? null : (currentBranch?.id || null),
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Report Data States
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [salesData, setSalesData] = useState<SalesReportData | null>(null);
  const [pnlData, setPnlData] = useState<ProfitLossReportData | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryReportData | null>(null);
  const [expenseData, setExpenseData] = useState<ExpenseReportData | null>(null);
  const [purchaseData, setPurchaseData] = useState<PurchaseReportData | null>(null);
  const [customerData, setCustomerData] = useState<CustomerReportData | null>(null);

  const currency = currentBusiness?.currency || 'BIF';

  // Load Branches
  useEffect(() => {
    try {
      const bList = getStoredBranches();
      setBranches(bList);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch all report data
  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const bizId = currentBusiness?.id;
      const [
        sumRes,
        salesRes,
        pnlRes,
        invRes,
        expRes,
        purRes,
        custRes,
      ] = await Promise.all([
        getReportsSummary(filters, bizId),
        getSalesReportData(filters, bizId),
        getProfitLossData(filters, bizId),
        getInventoryReportData(filters, bizId),
        getExpenseReportData(filters, bizId),
        getPurchaseReportData(filters, bizId),
        getCustomerReportData(filters, bizId),
      ]);

      setSummary(sumRes);
      setSalesData(salesRes);
      setPnlData(pnlRes);
      setInventoryData(invRes);
      setExpenseData(expRes);
      setPurchaseData(purRes);
      setCustomerData(custRes);
    } catch (err) {
      console.error('Failed to load reports:', err);
      addToast({
        title: 'Error loading analytics',
        description: 'Could not fetch current reporting calculations.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, currentBusiness?.id, addToast]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // CSV Export Handler
  const handleExportCsv = () => {
    try {
      let csvContent = '';
      let filename = `babas_report_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;

      if (activeTab === 'overview' || activeTab === 'sales') {
        csvContent = generateReportCsv('sales', salesData, currency);
        filename = `babas_sales_report_${filters.datePreset}.csv`;
      } else if (activeTab === 'pnl') {
        csvContent = generateReportCsv('pnl', pnlData, currency);
        filename = `babas_pnl_statement_${filters.datePreset}.csv`;
      } else if (activeTab === 'inventory') {
        csvContent = generateReportCsv('inventory', inventoryData, currency);
        filename = `babas_inventory_valuation.csv`;
      } else if (activeTab === 'expenses') {
        csvContent = generateReportCsv('expenses', expenseData, currency);
        filename = `babas_expense_report_${filters.datePreset}.csv`;
      } else if (activeTab === 'purchases') {
        csvContent = generateReportCsv('purchases', purchaseData, currency);
        filename = `babas_purchases_report_${filters.datePreset}.csv`;
      } else if (activeTab === 'customers') {
        csvContent = generateReportCsv('customers', customerData, currency);
        filename = `babas_customers_crm_report.csv`;
      }

      if (csvContent) {
        downloadCsvFile(filename, csvContent);
        addToast({
          title: 'Export Downloaded',
          description: `Generated CSV file: ${filename}`,
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Export error:', err);
      addToast({
        title: 'Export Failed',
        description: 'Could not generate CSV dataset.',
        type: 'error',
      });
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  const currentBranchName = filters.branchId
    ? branches.find((b) => b.id === filters.branchId)?.name || 'Branch'
    : 'All Branches (Consolidated)';

  const interval = getDateRangeInterval(filters.datePreset, filters.startDate, filters.endDate);

  const tabs: { id: ReportTabType; label: string; icon: LucideIcon }[] = [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'sales', label: 'Sales Reports', icon: BarChart3 },
    { id: 'pnl', label: 'Profit & Loss (P&L)', icon: TrendingUp },
    { id: 'inventory', label: 'Inventory Valuation', icon: Boxes },
    { id: 'expenses', label: 'Expense Reports', icon: CreditCard },
    { id: 'purchases', label: 'Purchase Reports', icon: Truck },
    { id: 'customers', label: 'Customer Intelligence', icon: Users },
  ];

  return (
    <div className="min-h-screen space-y-6 p-4 sm:p-6 lg:p-8 print:p-0 print:bg-white">
      {/* Print View Component (Rendered strictly when window.print() is fired) */}
      {summary && (
        <PrintableReportView
          reportType={activeTab === 'overview' ? 'dashboard' : activeTab}
          periodLabel={interval.label}
          branchName={currentBranchName}
          summary={summary}
          salesData={salesData || undefined}
          pnlData={pnlData || undefined}
          inventoryData={inventoryData || undefined}
          expenseData={expenseData || undefined}
          purchaseData={purchaseData || undefined}
          customerData={customerData || undefined}
          currency={currency}
        />
      )}

      {/* Screen Interface */}
      <div className="print:hidden space-y-6">
        {/* Page Title & Subtitle */}
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-navy-900 dark:text-white sm:text-3xl">
              Reports & Business Intelligence
            </h1>
            <p className="text-xs text-gray-500 dark:text-navy-400 sm:text-sm">
              Comprehensive analytics, Profit & Loss statements, inventory valuations, and financial metrics.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-navy-400">
            <Building2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <span>{currentBranchName}</span>
          </div>
        </div>

        {/* Global Filter Bar */}
        <ReportFilterBar
          filters={filters}
          branches={branches}
          activeTab={activeTab}
          isSuperAdmin={isSuperAdmin}
          userBranchId={currentBranch?.id}
          loading={loading}
          onFilterChange={setFilters}
          onRefresh={loadReports}
          onExportCsv={handleExportCsv}
          onPrint={handlePrint}
        />

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-200 no-scrollbar dark:border-navy-800">
          <div className="flex gap-2 pb-px">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-navy-900 dark:text-navy-400 dark:hover:border-navy-700 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {summary && (
              <ReportSummaryCards summary={summary} currency={currency} loading={loading} />
            )}
            {salesData && (
              <SalesReportTab data={salesData} currency={currency} loading={loading} />
            )}
          </div>
        )}

        {activeTab === 'sales' && salesData && (
          <SalesReportTab data={salesData} currency={currency} loading={loading} />
        )}

        {activeTab === 'pnl' && pnlData && (
          <ProfitLossReportTab data={pnlData} currency={currency} loading={loading} />
        )}

        {activeTab === 'inventory' && inventoryData && (
          <InventoryReportTab data={inventoryData} currency={currency} loading={loading} />
        )}

        {activeTab === 'expenses' && expenseData && (
          <ExpenseReportTab data={expenseData} currency={currency} loading={loading} />
        )}

        {activeTab === 'purchases' && purchaseData && (
          <PurchaseReportTab data={purchaseData} currency={currency} loading={loading} />
        )}

        {activeTab === 'customers' && customerData && (
          <CustomerReportTab data={customerData} currency={currency} loading={loading} />
        )}
      </div>
    </div>
  );
}
export default ReportsPage;
