import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Search,
  Download,
  PlusCircle,
  Printer,
  RotateCcw,
  Eye,
  Sliders,
  RefreshCw,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  Wallet,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  ArrowUpDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type {
  Sale,
  Branch,
  Customer,
  PaymentMethod,
  PaymentStatus,
  ReceiptSettings,
} from '@/types/database';
import {
  fetchSales,
  exportSalesToCsv,
  cancelSale,
  getReceiptSettings,
  saveReceiptSettings,
  type SalesDatePreset,
  type SalesStats,
} from '@/services/saleService';
import { fetchBranches } from '@/services/dashboardService';
import { fetchCustomers } from '@/services/customerService';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { SaleDetailsModal } from '@/components/sales/SaleDetailsModal';
import { PrintReceiptModal } from '@/components/sales/PrintReceiptModal';
import { ReturnRefundModal } from '@/components/sales/ReturnRefundModal';
import { ReceiptSettingsModal } from '@/components/sales/ReceiptSettingsModal';

export function SalesPage() {
  const navigate = useNavigate();
  const { profile, business } = useAuth();
  const { addToast } = useToast();

  const businessId = profile?.business_id || business?.id || 'demo-biz-1';
  const currency = business?.currency || 'BIF';

  // Master Data State
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<SalesStats>({
    totalGrossSales: 0,
    totalNetSales: 0,
    totalRefunds: 0,
    totalTransactions: 0,
    completedCount: 0,
    partiallyRefundedCount: 0,
    refundedCount: 0,
    cancelledCount: 0,
    averageOrderValue: 0,
  });
  const [totalCount, setTotalCount] = useState<number>(0);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>(() =>
    getReceiptSettings(businessId)
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters State
  const [search, setSearch] = useState<string>('');
  const [datePreset, setDatePreset] = useState<SalesDatePreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [selectedCashierId, setSelectedCashierId] = useState<string>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus | 'all'>('all');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [sortBy, setSortBy] = useState<'created_at' | 'total_amount' | 'receipt_number'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal States
  const [activeSaleForDetails, setActiveSaleForDetails] = useState<Sale | null>(null);
  const [activeSaleForPrint, setActiveSaleForPrint] = useState<Sale | null>(null);
  const [activeSaleForReturn, setActiveSaleForReturn] = useState<Sale | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Load auxiliary data (Branches, Customers)
  useEffect(() => {
    async function loadAux() {
      try {
        const [branchList, customerList] = await Promise.all([
          fetchBranches(businessId),
          fetchCustomers(businessId),
        ]);
        setBranches(branchList);
        setCustomers(customerList);
      } catch (err) {
        console.warn('Error loading auxiliary sales filters data:', err);
      }
    }
    loadAux();
  }, [businessId]);

  // Fetch Sales Data
  const loadSalesData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchSales({
        businessId,
        search,
        datePreset,
        startDate: datePreset === 'custom' ? startDate : undefined,
        endDate: datePreset === 'custom' ? endDate : undefined,
        branchId: selectedBranchId !== 'all' ? selectedBranchId : undefined,
        cashierId: selectedCashierId !== 'all' ? selectedCashierId : undefined,
        customerId: selectedCustomerId !== 'all' ? selectedCustomerId : undefined,
        paymentMethod: selectedPaymentMethod,
        status: selectedStatus,
        page,
        pageSize,
        sortBy,
        sortOrder,
      });

      setSales(res.sales);
      setStats(res.stats);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error('Error fetching sales list:', err);
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: 'Could not load sales records.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    businessId,
    search,
    datePreset,
    startDate,
    endDate,
    selectedBranchId,
    selectedCashierId,
    selectedCustomerId,
    selectedPaymentMethod,
    selectedStatus,
    page,
    pageSize,
    sortBy,
    sortOrder,
    addToast,
  ]);

  useEffect(() => {
    loadSalesData();
  }, [loadSalesData]);

  // Calculate unique cashiers present across data for filter
  const uniqueCashiers = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sales) {
      if (s.cashier?.id && s.cashier?.full_name) {
        map.set(s.cashier.id, s.cashier.full_name);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [sales]);

  // Export to CSV
  const handleExportCsv = () => {
    if (sales.length === 0) {
      addToast({
        type: 'warning',
        title: 'No Data',
        message: 'No sales records match the current filters to export.',
      });
      return;
    }

    const csvContent = exportSalesToCsv(sales, currency);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BABAS_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Export Complete',
      message: `Exported ${sales.length} sale transactions to CSV.`,
    });
  };

  // Void / Cancel Sale
  const handleCancelSale = async (saleToCancel: Sale) => {
    try {
      await cancelSale(saleToCancel.id, profile?.id, 'Voided from Sales History');
      addToast({
        type: 'success',
        title: 'Sale Cancelled',
        message: `Sale #${saleToCancel.receipt_number} voided and stock restored.`,
      });
      loadSalesData();
      if (activeSaleForDetails?.id === saleToCancel.id) {
        setActiveSaleForDetails(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error cancelling sale';
      addToast({
        type: 'error',
        title: 'Cancellation Failed',
        message: msg,
      });
    }
  };

  // Save updated receipt settings
  const handleSaveReceiptSettings = (newSettings: ReceiptSettings) => {
    setReceiptSettings(newSettings);
    saveReceiptSettings(newSettings, businessId);
  };

  // Clear all filters
  const handleResetFilters = () => {
    setSearch('');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setSelectedBranchId('all');
    setSelectedCashierId('all');
    setSelectedCustomerId('all');
    setSelectedPaymentMethod('all');
    setSelectedStatus('all');
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(search) ||
    datePreset !== 'all' ||
    selectedBranchId !== 'all' ||
    selectedCashierId !== 'all' ||
    selectedCustomerId !== 'all' ||
    selectedPaymentMethod !== 'all' ||
    selectedStatus !== 'all';

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-navy-900 dark:text-white sm:text-2xl">
              Sales & Receipts
            </h1>
            <span className="rounded-xl bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {totalCount} Total
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Real-time transaction register, receipt reprinting, customer invoices, and returns
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            id="btn-open-receipt-settings"
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:bg-navy-700"
          >
            <Sliders className="h-4 w-4 text-gray-500" />
            <span>Receipt Template</span>
          </button>

          <button
            type="button"
            id="btn-export-sales-csv"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:bg-navy-700"
          >
            <Download className="h-4 w-4 text-gray-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            id="btn-refresh-sales"
            onClick={loadSalesData}
            title="Refresh Sales"
            className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-300 dark:hover:bg-navy-700"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            id="btn-new-pos-sale"
            onClick={() => navigate('/pos')}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Sale (POS)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Gross Revenue */}
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Gross Revenue
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-lg font-bold font-mono text-navy-900 dark:text-white sm:text-xl">
            {formatCurrency(stats.totalGrossSales, currency)}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
            <span>{stats.totalTransactions} total transactions</span>
          </div>
        </div>

        {/* Net Sales */}
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Net Sales (After Returns)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 sm:text-xl">
            {formatCurrency(stats.totalNetSales, currency)}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
            <span>{stats.completedCount} completed orders</span>
          </div>
        </div>

        {/* Total Refunds */}
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Disbursed Refunds
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <RotateCcw className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-lg font-bold font-mono text-purple-600 dark:text-purple-400 sm:text-xl">
            {formatCurrency(stats.totalRefunds, currency)}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400">
            <span>
              {stats.partiallyRefundedCount + stats.refundedCount} returned sales
            </span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Average Order Value
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-lg font-bold font-mono text-navy-900 dark:text-white sm:text-xl">
            {formatCurrency(stats.averageOrderValue, currency)}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
            <span>Per active checkout</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs dark:border-navy-800 dark:bg-navy-900 space-y-4">
        {/* Search Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              id="input-search-sales"
              placeholder="Search by receipt #, customer name/phone, cashier, or product/SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-10 text-xs text-navy-900 placeholder-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-navy-800 dark:bg-navy-950 dark:text-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              id="btn-clear-filters"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-navy-700 dark:bg-navy-800 dark:text-rose-400"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 text-xs">
          {/* Date Preset */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              Date Period
            </label>
            <select
              id="select-date-preset"
              value={datePreset}
              onChange={(e) => {
                setDatePreset(e.target.value as SalesDatePreset);
                setPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs text-navy-900 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="this_month">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              Branch
            </label>
            <select
              id="select-branch-filter"
              value={selectedBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs text-navy-900 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cashier Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              Cashier
            </label>
            <select
              id="select-cashier-filter"
              value={selectedCashierId}
              onChange={(e) => {
                setSelectedCashierId(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs text-navy-900 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
            >
              <option value="all">All Staff</option>
              {uniqueCashiers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              Customer
            </label>
            <select
              id="select-customer-filter"
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs text-navy-900 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
            >
              <option value="all">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              Payment Method
            </label>
            <select
              id="select-payment-method-filter"
              value={selectedPaymentMethod}
              onChange={(e) => {
                setSelectedPaymentMethod(e.target.value as PaymentMethod | 'all');
                setPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs text-navy-900 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Credit/Debit Card</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit">Store Credit / Invoice</option>
              <option value="split">Split Payment</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              Status
            </label>
            <select
              id="select-status-filter"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as PaymentStatus | 'all');
                setPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs text-navy-900 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="partially_refunded">Partially Refunded</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled / Void</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers (Shown only when datePreset === 'custom') */}
        {datePreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-navy-800/40">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-navy-900 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-navy-900 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Sales Table Card */}
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xs dark:border-navy-800 dark:bg-navy-900">
        {isLoading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-brand-600" />
            <p className="mt-3 text-xs font-medium text-gray-500">Loading sales records...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-navy-800">
              <Receipt className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-navy-900 dark:text-white">
              No Sales Transactions Found
            </h3>
            <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
              {hasActiveFilters
                ? 'Try broadening your search query or clearing some active filters.'
                : 'No sales recorded yet. Process your first transaction using the POS register.'}
            </p>
            <div className="mt-4 flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200"
                >
                  Clear Filters
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/pos')}
                className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700"
              >
                Go to POS Register
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/60 font-semibold text-gray-600 dark:border-navy-800 dark:bg-navy-800/50 dark:text-gray-300">
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-navy-900 dark:hover:text-white select-none"
                    onClick={() => {
                      if (sortBy === 'receipt_number') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('receipt_number');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Receipt #</span>
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-navy-900 dark:hover:text-white select-none"
                    onClick={() => {
                      if (sortBy === 'created_at') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('created_at');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Date & Time</span>
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Branch & Staff</th>
                  <th className="py-3.5 px-4 text-center">Items</th>
                  <th className="py-3.5 px-4 text-right">Subtotal</th>
                  <th className="py-3.5 px-4 text-right">Discount</th>
                  <th
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-navy-900 dark:hover:text-white select-none"
                    onClick={() => {
                      if (sortBy === 'total_amount') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('total_amount');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Total Amount</span>
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
                {sales.map((sale) => {
                  const totalItemsCount = (sale.items || []).reduce(
                    (acc, it) => acc + it.quantity,
                    0
                  );

                  return (
                    <tr
                      key={sale.id}
                      className="group transition-colors hover:bg-gray-50/60 dark:hover:bg-navy-800/40"
                    >
                      {/* Receipt # */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveSaleForDetails(sale)}
                            className="font-mono text-xs font-bold text-brand-600 hover:underline dark:text-brand-400"
                          >
                            {sale.receipt_number}
                          </button>
                        </div>
                      </td>

                      {/* Date / Time */}
                      <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                        {formatDateTime(sale.created_at)}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        {sale.customer ? (
                          <div>
                            <p className="font-semibold text-navy-900 dark:text-white">
                              {sale.customer.name}
                            </p>
                            {sale.customer.phone && (
                              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                {sale.customer.phone}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-navy-800 dark:text-gray-400">
                            Walk-in
                          </span>
                        )}
                      </td>

                      {/* Branch & Staff */}
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-navy-900 dark:text-white">
                          {sale.branch?.name || 'Main Branch'}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {sale.cashier?.full_name || 'Staff'}
                        </p>
                      </td>

                      {/* Items Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-navy-900 dark:bg-navy-800 dark:text-white">
                          {totalItemsCount}
                        </span>
                      </td>

                      {/* Subtotal */}
                      <td className="py-3.5 px-4 text-right font-mono text-gray-600 dark:text-gray-400">
                        {formatCurrency(sale.subtotal, currency)}
                      </td>

                      {/* Discount */}
                      <td className="py-3.5 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                        {sale.discount_amount > 0
                          ? `-${formatCurrency(sale.discount_amount, currency)}`
                          : '—'}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 text-right">
                        <p className="font-mono font-bold text-navy-900 dark:text-white">
                          {formatCurrency(sale.total_amount, currency)}
                        </p>
                        {(sale.refunded_amount || 0) > 0 && (
                          <p className="text-[10px] font-mono text-purple-600 dark:text-purple-400">
                            Ref: -{formatCurrency(sale.refunded_amount || 0, currency)}
                          </p>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                          {sale.payment_method === 'cash' ? (
                            <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                          ) : sale.payment_method === 'card' ? (
                            <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                          ) : sale.payment_method === 'mobile_money' ? (
                            <Smartphone className="h-3.5 w-3.5 text-amber-600" />
                          ) : sale.payment_method === 'credit' ? (
                            <Wallet className="h-3.5 w-3.5 text-indigo-600" />
                          ) : (
                            <Building className="h-3.5 w-3.5 text-gray-600" />
                          )}
                          <span className="uppercase text-[11px]">
                            {sale.payment_method.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${
                            sale.payment_status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : sale.payment_status === 'partially_refunded'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : sale.payment_status === 'refunded'
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {sale.payment_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Details */}
                          <button
                            type="button"
                            title="View Full Sale Details"
                            onClick={() => setActiveSaleForDetails(sale)}
                            className="rounded-xl p-1.5 text-gray-500 hover:bg-gray-100 hover:text-navy-900 dark:text-gray-400 dark:hover:bg-navy-800 dark:hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Print Receipt */}
                          <button
                            type="button"
                            title="Reprint Receipt"
                            onClick={() => setActiveSaleForPrint(sale)}
                            className="rounded-xl p-1.5 text-gray-500 hover:bg-gray-100 hover:text-navy-900 dark:text-gray-400 dark:hover:bg-navy-800 dark:hover:text-white"
                          >
                            <Printer className="h-4 w-4 text-brand-600" />
                          </button>

                          {/* Return / Refund (if eligible) */}
                          {(sale.payment_status === 'completed' ||
                            sale.payment_status === 'partially_refunded') && (
                            <button
                              type="button"
                              title="Process Return & Refund"
                              onClick={() => setActiveSaleForReturn(sale)}
                              className="rounded-xl p-1.5 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination & Page Size Toolbar */}
        {!isLoading && sales.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-navy-800">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Showing {sales.length} of {totalCount} transactions</span>
              <span>&bull;</span>
              <div className="flex items-center gap-1.5">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-navy-900 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-prev-page"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-30 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>

              <span className="text-xs font-semibold text-navy-900 dark:text-white">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                id="btn-next-page"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-30 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sale Details Modal */}
      {activeSaleForDetails && (
        <SaleDetailsModal
          isOpen={Boolean(activeSaleForDetails)}
          sale={activeSaleForDetails}
          currency={currency}
          onClose={() => setActiveSaleForDetails(null)}
          onPrint={(s) => {
            setActiveSaleForDetails(null);
            setActiveSaleForPrint(s);
          }}
          onOpenReturn={(s) => {
            setActiveSaleForDetails(null);
            setActiveSaleForReturn(s);
          }}
          onCancelSale={handleCancelSale}
        />
      )}

      {/* Print Receipt Modal */}
      {activeSaleForPrint && (
        <PrintReceiptModal
          isOpen={Boolean(activeSaleForPrint)}
          sale={activeSaleForPrint}
          receiptSettings={receiptSettings}
          businessName={business?.name || "BABAS POS & Inventory"}
          businessAddress={business?.address || "Boulevard du 1er Novembre, Rohero, Bujumbura"}
          businessPhone={business?.phone || "+257 22 25 1200"}
          businessEmail={business?.email || "contact@babaspos.bi"}
          businessTaxId="NIF-400-019-823"
          currency={currency}
          onClose={() => setActiveSaleForPrint(null)}
          onOpenSettings={() => {
            setActiveSaleForPrint(null);
            setIsSettingsOpen(true);
          }}
        />
      )}

      {/* Return & Refund Modal */}
      {activeSaleForReturn && (
        <ReturnRefundModal
          isOpen={Boolean(activeSaleForReturn)}
          sale={activeSaleForReturn}
          currentUser={profile}
          currency={currency}
          onClose={() => setActiveSaleForReturn(null)}
          onSuccess={() => {
            setActiveSaleForReturn(null);
            loadSalesData();
          }}
        />
      )}

      {/* Receipt Settings Modal */}
      {isSettingsOpen && (
        <ReceiptSettingsModal
          isOpen={isSettingsOpen}
          settings={receiptSettings}
          businessId={businessId}
          onSave={handleSaveReceiptSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
