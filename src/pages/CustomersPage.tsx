import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  Download, 
  Tag as TagIcon, 
  Layers, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Customer, CustomerType, CustomerStatus, Tag, CustomerSegment, Branch, CustomerStats } from '@/types/database';
import { 
  fetchCustomers, 
  fetchCustomerStats, 
  fetchTags, 
  fetchSegments, 
  deleteCustomer, 
  updateCustomer 
} from '@/services/customerService';
import { fetchBranches } from '@/services/dashboardService';
import { CustomerStatsCards } from '@/components/customers/CustomerStatsCards';
import { CustomerFilterBar } from '@/components/customers/CustomerFilterBar';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { CustomerGrid } from '@/components/customers/CustomerGrid';
import { CustomerCreateEditModal } from '@/components/customers/CustomerCreateEditModal';
import { CustomerDetailDrawer } from '@/components/customers/CustomerDetailDrawer';
import { CustomerTagsModal } from '@/components/customers/CustomerTagsModal';
import { CustomerCreditPaymentModal } from '@/components/customers/CustomerCreditPaymentModal';
import { CustomerExportImportModal } from '@/components/customers/CustomerExportImportModal';

export function CustomersPage() {
  const navigate = useNavigate();
  const { business } = useAuth();
  const { addToast } = useToast();

  const businessId = business?.id || 'demo-biz-1';
  const currency = business?.currency || 'BIF';

  // Core Data States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    newThisMonth: 0,
    vipCustomers: 0,
    wholesaleCustomers: 0,
    totalRevenue: 0,
    averageCustomerSpend: 0,
    totalOutstandingBalance: 0,
    debtorsCount: 0,
  });
  const [tags, setTags] = useState<Tag[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Filter & Search & Pagination States
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<CustomerType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<CustomerStatus | 'all'>('all');
  const [selectedTagId, setSelectedTagId] = useState<string | 'all'>('all');
  const [hasDebtOnly, setHasDebtOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'total_spent' | 'current_balance' | 'last_purchase_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Modal States
  const [isCreateEditModalOpen, setIsCreateEditModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<Customer | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  
  const [isCreditPaymentModalOpen, setIsCreditPaymentModalOpen] = useState(false);
  const [customerForCreditPayment, setCustomerForCreditPayment] = useState<Customer | null>(null);

  const [isExportImportModalOpen, setIsExportImportModalOpen] = useState(false);
  const [exportImportMode, setExportImportMode] = useState<'export' | 'import'>('export');

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [customersRes, statsRes, tagsRes, segmentsRes, branchesRes] = await Promise.all([
        fetchCustomers({
          businessId,
          search: search.trim() || undefined,
          customerType: selectedType !== 'all' ? selectedType : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          hasBalance: hasDebtOnly ? true : undefined,
          tagId: selectedTagId !== 'all' ? selectedTagId : undefined,
          sortBy,
          sortOrder,
          page,
          pageSize,
        }),
        fetchCustomerStats(businessId),
        fetchTags(businessId),
        fetchSegments(businessId),
        fetchBranches(businessId),
      ]);

      setCustomers(customersRes.customers || []);
      setTotalCount(customersRes.totalCount || 0);
      setStats(statsRes);
      setTags(tagsRes || []);
      setSegments(segmentsRes || []);
      setBranches(branchesRes || []);
    } catch (err) {
      console.error('Error loading CRM customers:', err);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load customer list.',
      });
    } finally {
      setLoading(false);
    }
  }, [businessId, search, selectedType, selectedStatus, selectedTagId, hasDebtOnly, sortBy, sortOrder, page, pageSize, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actions
  const handleOpenCreateModal = () => {
    setCustomerToEdit(null);
    setIsCreateEditModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsCreateEditModalOpen(true);
  };

  const handleViewProfile = (customer: Customer) => {
    setSelectedCustomerForDetail(customer);
    setIsDetailDrawerOpen(true);
  };

  const handleNewSaleForCustomer = (customer: Customer) => {
    // Navigate to POS with pre-selected customer
    navigate('/pos', { state: { selectedCustomerId: customer.id, selectedCustomer: customer } });
  };

  const handleOpenCreditPayment = (customer: Customer) => {
    setCustomerForCreditPayment(customer);
    setIsCreditPaymentModalOpen(true);
  };

  const handleArchiveCustomer = async (customer: Customer) => {
    const nextStatus: CustomerStatus = customer.status === 'archived' ? 'active' : 'archived';
    try {
      await updateCustomer(customer.id, { status: nextStatus });
      addToast({
        type: 'success',
        title: nextStatus === 'archived' ? 'Customer Archived' : 'Customer Restored',
        message: `${customer.name} is now marked as ${nextStatus}.`,
      });
      loadData();
    } catch (err) {
      console.error('Error updating customer status:', err);
    }
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to permanently delete "${customer.name}"?`)) return;
    try {
      await deleteCustomer(customer.id);
      addToast({
        type: 'info',
        title: 'Customer Deleted',
        message: `${customer.name} removed from database.`,
      });
      loadData();
    } catch (err) {
      console.error('Error deleting customer:', err);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="min-h-screen space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
              Customer Management & CRM
            </h1>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-950/80 dark:text-brand-300">
              {totalCount} Total
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Maintain complete 360° customer profiles, track purchase history, manage store credit, and automate segmentation.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segments page shortcut */}
          <button
            type="button"
            onClick={() => navigate('/customers/segments')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:bg-navy-700"
          >
            <Layers className="h-4 w-4 text-brand-500" />
            <span>Segments ({segments.length})</span>
          </button>

          {/* Manage Tags */}
          <button
            type="button"
            onClick={() => setIsTagsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:bg-navy-700"
          >
            <TagIcon className="h-4 w-4 text-indigo-500" />
            <span>Tags ({tags.length})</span>
          </button>

          {/* Export / Import */}
          <button
            type="button"
            onClick={() => {
              setExportImportMode('export');
              setIsExportImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:bg-navy-700"
          >
            <Download className="h-4 w-4 text-gray-500" />
            <span>Export / Import</span>
          </button>

          {/* Add Customer Button */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-600 active:scale-95 transition"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <CustomerStatsCards
        stats={stats}
        currency={currency}
        onFilterPreset={(preset) => {
          if (preset === 'all') {
            setSelectedType('all');
            setHasDebtOnly(false);
          } else if (preset === 'vip') {
            setSelectedType('vip');
            setHasDebtOnly(false);
          } else if (preset === 'debtors') {
            setHasDebtOnly(true);
          }
          setPage(1);
        }}
      />

      {/* Filter and Search Bar */}
      <CustomerFilterBar
        search={search}
        selectedType={selectedType}
        selectedStatus={selectedStatus}
        selectedTagId={selectedTagId}
        hasDebtOnly={hasDebtOnly}
        sortBy={sortBy}
        sortOrder={sortOrder}
        viewMode={viewMode}
        tags={tags}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        onTypeChange={(v) => {
          setSelectedType(v);
          setPage(1);
        }}
        onStatusChange={(v) => {
          setSelectedStatus(v);
          setPage(1);
        }}
        onTagChange={(v) => {
          setSelectedTagId(v);
          setPage(1);
        }}
        onDebtOnlyChange={(v) => {
          setHasDebtOnly(v);
          setPage(1);
        }}
        onSortChange={(field, order) => {
          setSortBy(field);
          setSortOrder(order);
        }}
        onViewModeChange={setViewMode}
        onResetFilters={() => {
          setSearch('');
          setSelectedType('all');
          setSelectedStatus('all');
          setSelectedTagId('all');
          setHasDebtOnly(false);
          setSortBy('name');
          setSortOrder('asc');
          setPage(1);
        }}
      />

      {/* Customers List (Table or Grid) */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-100 bg-white dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <RefreshCw className="h-4 w-4 animate-spin text-brand-500" />
            <span>Loading customer directory...</span>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <CustomerTable
          customers={customers}
          currency={currency}
          onViewProfile={handleViewProfile}
          onEditCustomer={handleOpenEditModal}
          onNewSaleForCustomer={handleNewSaleForCustomer}
          onOpenCreditPayment={handleOpenCreditPayment}
          onArchiveCustomer={handleArchiveCustomer}
          onDeleteCustomer={handleDeleteCustomer}
          onAddNote={handleViewProfile}
        />
      ) : (
        <CustomerGrid
          customers={customers}
          currency={currency}
          onViewProfile={handleViewProfile}
          onEditCustomer={handleOpenEditModal}
          onNewSaleForCustomer={handleNewSaleForCustomer}
          onOpenCreditPayment={handleOpenCreditPayment}
        />
      )}

      {/* Pagination Bar */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 dark:border-navy-800 dark:bg-navy-900">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Showing <strong className="text-navy-900 dark:text-white">{(page - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-navy-900 dark:text-white">{Math.min(page * pageSize, totalCount)}</strong> of{' '}
            <strong className="text-navy-900 dark:text-white">{totalCount}</strong> customers
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <span className="px-3 text-xs font-bold text-navy-900 dark:text-white">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      <CustomerCreateEditModal
        isOpen={isCreateEditModalOpen}
        businessId={businessId}
        customerToEdit={customerToEdit}
        branches={branches}
        availableTags={tags}
        onSaved={loadData}
        onClose={() => {
          setIsCreateEditModalOpen(false);
          setCustomerToEdit(null);
        }}
        onRefreshTags={loadData}
      />

      <CustomerDetailDrawer
        customer={selectedCustomerForDetail}
        isOpen={isDetailDrawerOpen}
        businessId={businessId}
        currency={currency}
        segments={segments}
        onClose={() => {
          setIsDetailDrawerOpen(false);
          setSelectedCustomerForDetail(null);
        }}
        onEditCustomer={(c) => {
          setIsDetailDrawerOpen(false);
          handleOpenEditModal(c);
        }}
        onNewSale={handleNewSaleForCustomer}
        onOpenCreditPayment={(c) => {
          setIsDetailDrawerOpen(false);
          handleOpenCreditPayment(c);
        }}
        onArchiveCustomer={handleArchiveCustomer}
        onRefreshCustomerList={loadData}
      />

      <CustomerTagsModal
        isOpen={isTagsModalOpen}
        businessId={businessId}
        onClose={() => setIsTagsModalOpen(false)}
        onTagsUpdated={loadData}
      />

      <CustomerCreditPaymentModal
        isOpen={isCreditPaymentModalOpen}
        customer={customerForCreditPayment}
        businessId={businessId}
        currency={currency}
        onPaymentRecorded={loadData}
        onClose={() => {
          setIsCreditPaymentModalOpen(false);
          setCustomerForCreditPayment(null);
        }}
      />

      <CustomerExportImportModal
        isOpen={isExportImportModalOpen}
        mode={exportImportMode}
        businessId={businessId}
        customers={customers}
        currency={currency}
        onImportCompleted={loadData}
        onClose={() => setIsExportImportModalOpen(false)}
      />
    </div>
  );
}
