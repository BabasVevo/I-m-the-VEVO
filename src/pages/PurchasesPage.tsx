import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PurchaseStatsCards } from '@/components/purchases/PurchaseStatsCards';
import { PurchaseOrderList } from '@/components/purchases/PurchaseOrderList';
import { CreatePurchaseOrderModal } from '@/components/purchases/CreatePurchaseOrderModal';
import { PurchaseOrderDetailModal } from '@/components/purchases/PurchaseOrderDetailModal';
import { ReceiveGoodsModal } from '@/components/purchases/ReceiveGoodsModal';
import { RecordPoPaymentModal } from '@/components/purchases/RecordPoPaymentModal';
import { PurchaseReturnModal } from '@/components/purchases/PurchaseReturnModal';
import {
  fetchPurchaseOrders,
  fetchPurchasingStats,
  createPurchaseOrder,
  receivePurchaseStock,
  recordPurchasePayment,
  createPurchaseReturn,
  updatePurchaseOrderStatus,
  exportPurchasesToCSV,
} from '@/services/purchaseService';
import { fetchSuppliers } from '@/services/supplierService';
import type {
  PurchaseOrder,
  PurchasingStats,
  PurchaseOrderStatus,
  PaymentStatus,
  Supplier,
  ReceivePurchaseStockParams,
  PaymentMethod,
} from '@/types/database';

export function PurchasesPage() {
  const { business, branch, user } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();

  const businessId = business?.id || 'demo-biz-1';
  const currency = business?.currency || 'BIF';

  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<PurchasingStats>({
    totalOrders: 0,
    totalPurchasesAmount: 0,
    totalPaid: 0,
    totalPayablesDue: 0,
    pendingDeliveriesCount: 0,
  });

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<PurchaseOrderStatus | 'all'>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus | 'all'>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [preselectedSupplierId, setPreselectedSupplierId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [selectedPOForDetail, setSelectedPOForDetail] = useState<PurchaseOrder | null>(null);
  const [receiveModalOpen, setReceiveModalOpen] = useState<boolean>(false);
  const [selectedPOForReceive, setSelectedPOForReceive] = useState<PurchaseOrder | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [selectedPOForPayment, setSelectedPOForPayment] = useState<PurchaseOrder | null>(null);
  const [returnModalOpen, setReturnModalOpen] = useState<boolean>(false);
  const [selectedPOForReturn, setSelectedPOForReturn] = useState<PurchaseOrder | null>(null);

  // Check if routed with preselected supplier from Suppliers page
  useEffect(() => {
    const locState = location.state as { preselectedSupplierId?: string } | null;
    if (locState && locState.preselectedSupplierId) {
      setPreselectedSupplierId(locState.preselectedSupplierId);
      setCreateModalOpen(true);
    }
  }, [location.state]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [poRes, statsRes, supRes] = await Promise.all([
        fetchPurchaseOrders(businessId, {
          search,
          status: selectedStatus,
          paymentStatus: selectedPaymentStatus,
          supplierId: selectedSupplier || null,
          branchId: selectedBranch || null,
          page: currentPage,
          pageSize: 10,
        }),
        fetchPurchasingStats(businessId, selectedBranch || null),
        fetchSuppliers(businessId, { pageSize: 200 }),
      ]);

      setPurchases(poRes.purchases);
      setTotalCount(poRes.totalCount);
      setStats(statsRes);
      setSuppliers(supRes.suppliers);
    } catch (err) {
      console.error('Error loading purchase orders:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId, search, selectedStatus, selectedPaymentStatus, selectedSupplier, selectedBranch, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePO = async (data: {
    supplier_id: string;
    branch_id: string;
    order_date: string;
    expected_delivery_date?: string;
    payment_terms?: string;
    tax_rate?: number;
    shipping_cost?: number;
    discount_amount?: number;
    notes?: string;
    items: Array<{
      product_id?: string | null;
      product_name: string;
      sku?: string | null;
      unit: string;
      quantity_ordered: number;
      unit_cost: number;
      tax_rate?: number;
    }>;
  }) => {
    await createPurchaseOrder(businessId, {
      ...data,
      created_by: user?.id || null,
    });
    addToast({
      type: 'success',
      title: 'Purchase Order Created',
      message: 'New purchase order has been placed successfully.',
    });
    loadData();
  };

  const handleReceiveStock = async (params: ReceivePurchaseStockParams) => {
    await receivePurchaseStock(params, user?.id || null);
    addToast({
      type: 'success',
      title: 'Goods Received',
      message: 'Stock has been received and inventory updated with audit movements.',
    });
    setReceiveModalOpen(false);
    setDetailModalOpen(false);
    loadData();
  };

  const handleRecordPayment = async (data: {
    purchase_id: string;
    amount: number;
    payment_method: PaymentMethod;
    reference_number?: string;
    notes?: string;
  }) => {
    await recordPurchasePayment({
      ...data,
      created_by: user?.id || null,
    });
    addToast({
      type: 'success',
      title: 'Payment Recorded',
      message: 'Payment has been allocated to the purchase order and supplier ledger.',
    });
    setPaymentModalOpen(false);
    setDetailModalOpen(false);
    loadData();
  };

  const handleReturnGoods = async (data: {
    purchase_id: string;
    supplier_id: string;
    branch_id: string;
    reason: string;
    notes?: string;
    items: Array<{
      purchase_item_id?: string;
      product_id?: string | null;
      product_name: string;
      unit: string;
      quantity_returned: number;
      unit_cost: number;
      reason?: string;
    }>;
  }) => {
    await createPurchaseReturn(businessId, {
      ...data,
      created_by: user?.id || null,
    });
    addToast({
      type: 'success',
      title: 'Debit Note Issued',
      message: 'Purchase return registered, items deducted from inventory, and supplier credited.',
    });
    setReturnModalOpen(false);
    setDetailModalOpen(false);
    loadData();
  };

  const handleCancelPO = async (po: PurchaseOrder) => {
    if (window.confirm(`Are you sure you want to cancel Purchase Order "${po.po_number}"?`)) {
      try {
        await updatePurchaseOrderStatus(po.id, 'cancelled');
        addToast({
          type: 'success',
          title: 'Order Cancelled',
          message: `PO ${po.po_number} was marked as cancelled.`,
        });
        setDetailModalOpen(false);
        loadData();
      } catch (err: unknown) {
        addToast({
          type: 'error',
          title: 'Error',
          message: err instanceof Error ? err.message : 'Failed to cancel PO.',
        });
      }
    }
  };

  return (
    <div id="purchases-page" className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
          Purchasing & Orders
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Manage purchase orders, stock arrivals, vendor bill payments, and supplier debit returns.
        </p>
      </div>

      {/* Stats Cards */}
      <PurchaseStatsCards stats={stats} currency={currency} />

      {/* List */}
      <PurchaseOrderList
        purchases={purchases}
        totalCount={totalCount}
        suppliers={suppliers}
        branches={branch ? [branch] : []}
        currentPage={currentPage}
        pageSize={10}
        search={search}
        selectedStatus={selectedStatus}
        selectedPaymentStatus={selectedPaymentStatus}
        selectedSupplier={selectedSupplier}
        selectedBranch={selectedBranch}
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
        onPaymentStatusChange={(pst) => {
          setSelectedPaymentStatus(pst);
          setCurrentPage(1);
        }}
        onSupplierChange={(s) => {
          setSelectedSupplier(s);
          setCurrentPage(1);
        }}
        onBranchChange={(b) => {
          setSelectedBranch(b);
          setCurrentPage(1);
        }}
        onPageChange={setCurrentPage}
        onCreatePO={() => {
          setPreselectedSupplierId(null);
          setCreateModalOpen(true);
        }}
        onViewPO={(po) => {
          setSelectedPOForDetail(po);
          setDetailModalOpen(true);
        }}
        onReceiveStock={(po) => {
          setSelectedPOForReceive(po);
          setReceiveModalOpen(true);
        }}
        onRecordPayment={(po) => {
          setSelectedPOForPayment(po);
          setPaymentModalOpen(true);
        }}
        onReturnGoods={(po) => {
          setSelectedPOForReturn(po);
          setReturnModalOpen(true);
        }}
        onCancelPO={handleCancelPO}
        onExportCSV={() => exportPurchasesToCSV(purchases)}
      />

      {/* Modals */}
      <CreatePurchaseOrderModal
        isOpen={createModalOpen}
        preselectedSupplierId={preselectedSupplierId}
        currency={currency}
        onClose={() => {
          setCreateModalOpen(false);
          setPreselectedSupplierId(null);
        }}
        onSubmit={handleCreatePO}
      />

      <PurchaseOrderDetailModal
        isOpen={detailModalOpen}
        purchaseOrder={selectedPOForDetail}
        currency={currency}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedPOForDetail(null);
        }}
        onReceiveStock={(po) => {
          setSelectedPOForReceive(po);
          setReceiveModalOpen(true);
        }}
        onRecordPayment={(po) => {
          setSelectedPOForPayment(po);
          setPaymentModalOpen(true);
        }}
        onReturnGoods={(po) => {
          setSelectedPOForReturn(po);
          setReturnModalOpen(true);
        }}
        onCancelPO={handleCancelPO}
      />

      <ReceiveGoodsModal
        isOpen={receiveModalOpen}
        purchaseOrder={selectedPOForReceive}
        onClose={() => {
          setReceiveModalOpen(false);
          setSelectedPOForReceive(null);
        }}
        onSubmit={handleReceiveStock}
      />

      <RecordPoPaymentModal
        isOpen={paymentModalOpen}
        purchaseOrder={selectedPOForPayment}
        currency={currency}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedPOForPayment(null);
        }}
        onSubmit={handleRecordPayment}
      />

      <PurchaseReturnModal
        isOpen={returnModalOpen}
        purchaseOrder={selectedPOForReturn}
        currency={currency}
        onClose={() => {
          setReturnModalOpen(false);
          setSelectedPOForReturn(null);
        }}
        onSubmit={handleReturnGoods}
      />
    </div>
  );
}
