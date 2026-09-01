import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { SupplierStatsCards } from '@/components/suppliers/SupplierStatsCards';
import { SupplierList } from '@/components/suppliers/SupplierList';
import { SupplierFormModal } from '@/components/suppliers/SupplierFormModal';
import { SupplierDetailDrawer } from '@/components/suppliers/SupplierDetailDrawer';
import { RecordSupplierPaymentModal } from '@/components/suppliers/RecordSupplierPaymentModal';
import {
  fetchSuppliers,
  fetchSupplierStats,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  exportSuppliersToCSV,
  type CreateSupplierInput,
} from '@/services/supplierService';
import type { Supplier, SupplierStats, SupplierStatus, PaymentMethod } from '@/types/database';

export function SuppliersPage() {
  const { business, branch } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<SupplierStats>({
    totalSuppliers: 0,
    activeSuppliers: 0,
    totalPurchased: 0,
    totalOutstandingPayables: 0,
    overduePayablesCount: 0,
  });

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<SupplierStatus | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [hasBalanceOnly, setHasBalanceOnly] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState<Supplier | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedSupplierIdForDrawer, setSelectedSupplierIdForDrawer] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<Supplier | null>(null);

  const businessId = business?.id || 'demo-biz-1';
  const currency = business?.currency || 'BIF';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [suppliersRes, statsRes] = await Promise.all([
        fetchSuppliers(businessId, {
          search,
          status: selectedStatus,
          supplierType: selectedType,
          branchId: selectedBranch || null,
          hasBalance: hasBalanceOnly,
          page: currentPage,
          pageSize: 10,
        }),
        fetchSupplierStats(businessId, selectedBranch || null),
      ]);

      setSuppliers(suppliersRes.suppliers);
      setTotalCount(suppliersRes.totalCount);
      setStats(statsRes);
    } catch (err) {
      console.error('Error loading suppliers:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId, search, selectedStatus, selectedType, selectedBranch, hasBalanceOnly, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateOrUpdate = async (data: Partial<Supplier>) => {
    if (selectedSupplierForEdit) {
      await updateSupplier(selectedSupplierForEdit.id, data);
      addToast({
        type: 'success',
        title: 'Supplier Updated',
        message: `${data.name || 'Supplier'} has been updated successfully.`,
      });
    } else {
      await createSupplier(businessId, data as unknown as CreateSupplierInput);
      addToast({
        type: 'success',
        title: 'Supplier Added',
        message: `${data.name || 'New supplier'} created successfully.`,
      });
    }
    loadData();
  };

  const handleDelete = async (supplier: Supplier) => {
    if (window.confirm(`Are you sure you want to delete or archive supplier "${supplier.name}"?`)) {
      try {
        await deleteSupplier(supplier.id);
        addToast({
          type: 'success',
          title: 'Supplier Removed',
          message: `${supplier.name} was successfully removed.`,
        });
        loadData();
      } catch (err: unknown) {
        addToast({
          type: 'error',
          title: 'Error',
          message: err instanceof Error ? err.message : 'Failed to remove supplier.',
        });
      }
    }
  };

  const handleRecordSupplierPayment = async (data: {
    amount: number;
    paymentMethod: PaymentMethod;
    referenceNumber: string;
    notes: string;
  }) => {
    if (!selectedSupplierForPayment) return;

    // Update supplier balance
    await updateSupplier(selectedSupplierForPayment.id, {
      current_balance: Math.max(0, (selectedSupplierForPayment.current_balance || 0) - data.amount),
      total_paid_amount: (selectedSupplierForPayment.total_paid_amount || 0) + data.amount,
    });

    addToast({
      type: 'success',
      title: 'Payment Recorded',
      message: `Payment of ${currency} ${data.amount.toLocaleString()} recorded for ${selectedSupplierForPayment.name}.`,
    });
    loadData();
  };

  const handleOpenNewPO = (supplier: Supplier) => {
    navigate('/purchases', { state: { preselectedSupplierId: supplier.id } });
  };

  return (
    <div id="suppliers-page" className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
          Suppliers & Vendors
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Manage vendor accounts, commercial payment terms, procurement contracts, and account payables.
        </p>
      </div>

      {/* Stats Cards */}
      <SupplierStatsCards stats={stats} currency={currency} />

      {/* Main List */}
      <SupplierList
        suppliers={suppliers}
        totalCount={totalCount}
        branches={branch ? [branch] : []}
        currentPage={currentPage}
        pageSize={10}
        search={search}
        selectedStatus={selectedStatus}
        selectedType={selectedType}
        selectedBranch={selectedBranch}
        hasBalanceOnly={hasBalanceOnly}
        currency={currency}
        loading={loading}
        onSearchChange={(q) => {
          setSearch(q);
          setCurrentPage(1);
        }}
        onStatusChange={(st) => {
          setSelectedStatus(st);
          setCurrentPage(1);
        }}
        onTypeChange={(tp) => {
          setSelectedType(tp);
          setCurrentPage(1);
        }}
        onBranchChange={(br) => {
          setSelectedBranch(br);
          setCurrentPage(1);
        }}
        onHasBalanceToggle={(hb) => {
          setHasBalanceOnly(hb);
          setCurrentPage(1);
        }}
        onPageChange={setCurrentPage}
        onAddSupplier={() => {
          setSelectedSupplierForEdit(null);
          setFormModalOpen(true);
        }}
        onViewSupplier={(s) => {
          setSelectedSupplierIdForDrawer(s.id);
          setDetailDrawerOpen(true);
        }}
        onEditSupplier={(s) => {
          setSelectedSupplierForEdit(s);
          setFormModalOpen(true);
        }}
        onRecordPayment={(s) => {
          setSelectedSupplierForPayment(s);
          setPaymentModalOpen(true);
        }}
        onCreatePurchaseOrder={handleOpenNewPO}
        onDeleteSupplier={handleDelete}
        onExportCSV={() => exportSuppliersToCSV(suppliers)}
      />

      {/* Modals & Drawer */}
      <SupplierFormModal
        isOpen={formModalOpen}
        supplier={selectedSupplierForEdit}
        branches={branch ? [branch] : []}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedSupplierForEdit(null);
        }}
        onSubmit={handleCreateOrUpdate}
      />

      <SupplierDetailDrawer
        isOpen={detailDrawerOpen}
        supplierId={selectedSupplierIdForDrawer}
        currency={currency}
        onClose={() => {
          setDetailDrawerOpen(false);
          setSelectedSupplierIdForDrawer(null);
        }}
        onEdit={(s) => {
          setDetailDrawerOpen(false);
          setSelectedSupplierForEdit(s);
          setFormModalOpen(true);
        }}
        onRecordPayment={(s) => {
          setSelectedSupplierForPayment(s);
          setPaymentModalOpen(true);
        }}
        onCreatePurchaseOrder={handleOpenNewPO}
      />

      <RecordSupplierPaymentModal
        isOpen={paymentModalOpen}
        supplier={selectedSupplierForPayment}
        currency={currency}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedSupplierForPayment(null);
        }}
        onSubmit={handleRecordSupplierPayment}
      />
    </div>
  );
}
