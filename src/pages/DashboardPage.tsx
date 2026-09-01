import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Package,
  Boxes,
  Users,
  RotateCw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ROLE_LABELS } from '@/lib/constants';
import {
  fetchBranches,
  fetchDashboardStats,
  fetchRecentSales,
  fetchLowStockItems,
  fetchTodaySalesTarget,
  updateTodaySalesTarget,
  type DashboardStatsResult,
} from '@/services/dashboardService';
import { BranchScopeSelector } from '@/components/dashboard/BranchScopeSelector';
import { StatCardsGrid } from '@/components/dashboard/StatCardsGrid';
import { SalesTargetCard } from '@/components/dashboard/SalesTargetCard';
import { LowStockAlertCard } from '@/components/dashboard/LowStockAlertCard';
import { RecentSalesTable } from '@/components/dashboard/RecentSalesTable';
import { AdminAlertsBanner } from '@/components/notifications/AdminAlertsBanner';
import type { Branch, Sale, InventoryItem, SalesTarget } from '@/types/database';

export function DashboardPage() {
  const { profile, role, business, isDemoMode } = useAuth();
  const { toast } = useToast();

  const businessCurrency = business?.currency || 'BIF';
  const userRole = role?.name || 'staff';
  const canViewAllBranches = ['super_admin', 'business_owner', 'accountant', 'marketing_manager'].includes(userRole);
  const canEditTarget = ['super_admin', 'business_owner', 'branch_manager'].includes(userRole);

  // Branch Scope State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(
    canViewAllBranches ? null : profile?.branch_id ?? null
  );

  // Dashboard Data State
  const [stats, setStats] = useState<DashboardStatsResult>({
    salesToday: 0,
    transactionsToday: 0,
    salesThisMonth: 0,
    stockValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    amountDue: 0,
    overdueAmount: 0,
  });

  const [salesTarget, setSalesTarget] = useState<SalesTarget | null>(null);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  
  // Recent Sales Table State
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [totalSalesCount, setTotalSalesCount] = useState<number>(0);
  const [salesPage, setSalesPage] = useState<number>(1);
  const [salesPageSize, setSalesPageSize] = useState<number>(8);
  const [salesSearch, setSalesSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Loading States
  const [initialLoading, setInitialLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const businessId = business?.id || 'demo-biz-1';

  // 1. Fetch branches list once
  useEffect(() => {
    async function loadBranchesList() {
      try {
        const branchList = await fetchBranches(businessId);
        setBranches(branchList);
        // If user cannot view all branches, enforce their assigned branch
        if (!canViewAllBranches && profile?.branch_id) {
          setSelectedBranchId(profile.branch_id);
        }
      } catch (err) {
        console.error('Failed to load branches:', err);
      }
    }
    loadBranchesList();
  }, [businessId, canViewAllBranches, profile?.branch_id]);

  // 2. Fetch Dashboard Metrics & Target & Alerts
  const loadDashboardMetrics = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [statsData, targetData, lowStockData] = await Promise.all([
        fetchDashboardStats(businessId, selectedBranchId),
        fetchTodaySalesTarget(businessId, selectedBranchId),
        fetchLowStockItems(businessId, selectedBranchId),
      ]);

      setStats(statsData);
      setSalesTarget(targetData);
      setLowStockItems(lowStockData);
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
      toast('Failed to update dashboard metrics', 'error');
    } finally {
      setStatsLoading(false);
      setInitialLoading(false);
    }
  }, [businessId, selectedBranchId, toast]);

  // 3. Fetch Recent Sales with filters and pagination
  const loadRecentSales = useCallback(async () => {
    setSalesLoading(true);
    try {
      const result = await fetchRecentSales(businessId, {
        branchId: selectedBranchId,
        search: salesSearch,
        paymentStatus: statusFilter,
        paymentMethod: methodFilter,
        page: salesPage,
        pageSize: salesPageSize,
      });

      setRecentSales(result.sales);
      setTotalSalesCount(result.totalCount);
    } catch (err) {
      console.error('Error loading recent sales:', err);
    } finally {
      setSalesLoading(false);
    }
  }, [businessId, selectedBranchId, salesSearch, statusFilter, methodFilter, salesPage, salesPageSize]);

  // Reload stats whenever branch scope changes
  useEffect(() => {
    loadDashboardMetrics();
    setSalesPage(1); // Reset to first page
  }, [loadDashboardMetrics]);

  // Reload sales whenever filters or pagination change
  useEffect(() => {
    loadRecentSales();
  }, [loadRecentSales]);

  // Manual Refresh Handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadDashboardMetrics(), loadRecentSales()]);
    setRefreshing(false);
    toast('Dashboard refreshed with latest database data', 'success');
  };

  // Target update handler
  const handleUpdateTarget = async (amount: number, notes?: string) => {
    try {
      const updated = await updateTodaySalesTarget(businessId, selectedBranchId, amount, notes);
      setSalesTarget(updated);
      toast('Sales target successfully updated', 'success');
    } catch (err) {
      console.error('Failed to update sales target:', err);
      toast('Failed to update sales target', 'error');
      throw err;
    }
  };

  // Selected Scope Name
  const selectedBranchName = selectedBranchId
    ? branches.find((b) => b.id === selectedBranchId)?.name || 'Branch'
    : 'All Branches';

  const quickActionItems = [
    { label: 'New Sale POS', path: '/pos', icon: ShoppingBag, desc: 'Open checkout terminal' },
    { label: 'Products', path: '/products', icon: Package, desc: 'Manage catalog & prices' },
    { label: 'Inventory Stock', path: '/stock', icon: Boxes, desc: 'View & transfer stock' },
    { label: 'Customers CRM', path: '/customers', icon: Users, desc: 'Manage client accounts' },
    { label: 'Staff & Roles', path: '/employees', icon: Users, desc: 'Employees & access control' },
  ];

  return (
    <div className="space-y-6">
      {/* Real-time Admin & Manager Alerts Banner */}
      <AdminAlertsBanner />

      {/* 1. TOP HEADER & SCOPE BAR */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900 lg:flex-row lg:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-navy-950 dark:text-white sm:text-2xl">
              Administrator Dashboard
            </h1>
            {isDemoMode && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                <Sparkles className="h-3 w-3" /> Live Data Engine
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-navy-400">
            Real-time analytics, revenue targets, and stock control for{' '}
            <strong className="text-navy-900 dark:text-white">{business?.name ?? 'BABAS POS & Inventory'}</strong>
            {' · '}
            <span className="text-brand-600 dark:text-brand-400 font-medium">
              {role ? ROLE_LABELS[role.name] ?? role.name : 'Administrator'}
            </span>
          </p>
        </div>

        {/* Controls: Branch Scope & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          <BranchScopeSelector
            branches={branches}
            selectedBranchId={selectedBranchId}
            onSelectBranch={(id) => setSelectedBranchId(id)}
            userAssignedBranchId={profile?.branch_id}
            canViewAllBranches={canViewAllBranches}
            loading={statsLoading}
          />

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || statsLoading}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-navy-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-navy-800 dark:bg-navy-900 dark:text-navy-200 dark:hover:bg-navy-800"
            title="Refresh database metrics"
          >
            <RotateCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>
      </div>

      {/* 2. QUICK SHORTCUTS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {quickActionItems.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.path}
              to={action.path}
              className="card card-hover group flex flex-col justify-between p-4 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-950 dark:text-brand-400 dark:group-hover:bg-brand-500 dark:group-hover:text-navy-950">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-1 group-hover:text-brand-600 dark:text-navy-700 dark:group-hover:text-brand-400" />
              </div>
              <div className="mt-3">
                <p className="text-sm font-bold text-navy-900 dark:text-white">{action.label}</p>
                <p className="text-[11px] text-gray-400 dark:text-navy-400 truncate">{action.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 3. EIGHT REAL DATABASE STATISTICS CARDS */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-navy-400">
            Key Performance Indicators ({selectedBranchName})
          </h2>
          <span className="text-xs text-gray-400">
            Currency: <strong className="font-semibold text-navy-900 dark:text-white">{businessCurrency}</strong>
          </span>
        </div>

        <StatCardsGrid
          stats={stats}
          currency={businessCurrency}
          loading={initialLoading || statsLoading}
        />
      </div>

      {/* 4. MID SECTION: SALES TARGET & LOW STOCK ALERTS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales Target Card */}
        <SalesTargetCard
          target={salesTarget}
          currentSales={stats.salesToday}
          currency={businessCurrency}
          scopeName={selectedBranchName}
          canEditTarget={canEditTarget}
          onUpdateTarget={handleUpdateTarget}
          loading={initialLoading || statsLoading}
        />

        {/* Low Stock Alert Card */}
        <LowStockAlertCard
          items={lowStockItems}
          loading={initialLoading || statsLoading}
        />
      </div>

      {/* 5. RECENT SALES TRANSACTIONS TABLE */}
      <RecentSalesTable
        sales={recentSales}
        totalCount={totalSalesCount}
        currency={businessCurrency}
        currentPage={salesPage}
        pageSize={salesPageSize}
        searchQuery={salesSearch}
        paymentStatusFilter={statusFilter}
        paymentMethodFilter={methodFilter}
        loading={salesLoading}
        onPageChange={(page) => setSalesPage(page)}
        onSearchChange={(q) => {
          setSalesSearch(q);
          setSalesPage(1);
        }}
        onStatusFilterChange={(st) => {
          setStatusFilter(st);
          setSalesPage(1);
        }}
        onMethodFilterChange={(m) => {
          setMethodFilter(m);
          setSalesPage(1);
        }}
        onPageSizeChange={(size) => {
          setSalesPageSize(size);
          setSalesPage(1);
        }}
      />
    </div>
  );
}
