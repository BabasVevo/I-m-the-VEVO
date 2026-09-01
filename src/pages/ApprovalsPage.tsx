import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Truck,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  User,
  Calendar,
  DollarSign,
  ArrowRight,
  CheckSquare,
  Square,
  Paperclip,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  fetchAllPendingApprovals,
  approveExpenseWorkflow,
  rejectExpenseWorkflow,
  approvePurchaseOrderWorkflow,
  rejectPurchaseOrderWorkflow,
  type UnifiedPendingApproval,
} from '@/services/approvalService';
import { ApprovalActionModal } from '@/components/approvals/ApprovalActionModal';
import { ApprovalHistoryTimeline } from '@/components/approvals/ApprovalHistoryTimeline';
import { formatCurrency } from '@/lib/format';

export function ApprovalsPage() {
  const { business, branch, user, profile, role } = useAuth();
  const { showToast } = useToast();

  const businessId = business?.id || 'demo-biz-1';
  const branchId = branch?.id || null;

  const [activeTab, setActiveTab] = useState<'all' | 'expenses' | 'purchases'>('all');
  const [items, setItems] = useState<UnifiedPendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected items for batch actions
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Action modal states
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [modalActionType, setModalActionType] = useState<'approve' | 'reject'>('approve');
  const [targetItem, setTargetItem] = useState<UnifiedPendingApproval | null>(null);

  // Detail drawer / inspection
  const [inspectingItem, setInspectingItem] = useState<UnifiedPendingApproval | null>(null);
  const [timelineRefreshTrigger, setTimelineRefreshTrigger] = useState(0);

  const currentUser = {
    id: profile?.id || user?.id || 'emp-mgr-1',
    full_name: profile?.full_name || 'Branch Manager',
    role_name: role?.name || 'branch_manager',
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAllPendingApprovals(businessId, branchId);
      setItems(res.items);
      setSelectedItemIds([]);
    } catch (err) {
      console.error('Error loading pending approvals:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId, branchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered list
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeTab === 'expenses' && item.entity_type !== 'expense') return false;
      if (activeTab === 'purchases' && item.entity_type !== 'purchase_order') return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchCode = item.code.toLowerCase().includes(q);
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchRequester = item.requester_name.toLowerCase().includes(q);
        const matchSupplier = item.category_or_supplier.toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchRequester && !matchSupplier) return false;
      }

      return true;
    });
  }, [items, activeTab, searchTerm]);

  // Metrics
  const stats = useMemo(() => {
    const expenseItems = items.filter((i) => i.entity_type === 'expense');
    const purchaseItems = items.filter((i) => i.entity_type === 'purchase_order');

    const totalExpenseAmount = expenseItems.reduce((sum, i) => sum + i.amount, 0);
    const totalPurchaseAmount = purchaseItems.reduce((sum, i) => sum + i.amount, 0);

    return {
      totalCount: items.length,
      totalAmount: totalExpenseAmount + totalPurchaseAmount,
      expenseCount: expenseItems.length,
      expenseAmount: totalExpenseAmount,
      purchaseCount: purchaseItems.length,
      purchaseAmount: totalPurchaseAmount,
    };
  }, [items]);

  const handleOpenActionModal = (
    item: UnifiedPendingApproval,
    action: 'approve' | 'reject'
  ) => {
    setTargetItem(item);
    setModalActionType(action);
    setActionModalOpen(true);
  };

  const handleConfirmAction = async (notes: string) => {
    if (!targetItem) return;

    try {
      if (targetItem.entity_type === 'expense') {
        if (modalActionType === 'approve') {
          await approveExpenseWorkflow(targetItem.id, currentUser, notes);
          showToast(`Expense ${targetItem.code} approved successfully`, 'success');
        } else {
          await rejectExpenseWorkflow(targetItem.id, currentUser, notes);
          showToast(`Expense ${targetItem.code} rejected`, 'info');
        }
      } else {
        if (modalActionType === 'approve') {
          await approvePurchaseOrderWorkflow(targetItem.id, currentUser, notes);
          showToast(`Purchase Order ${targetItem.code} approved`, 'success');
        } else {
          await rejectPurchaseOrderWorkflow(targetItem.id, currentUser, notes);
          showToast(`Purchase Order ${targetItem.code} rejected`, 'info');
        }
      }

      setTimelineRefreshTrigger((prev) => prev + 1);
      if (inspectingItem?.id === targetItem.id) {
        setInspectingItem(null);
      }
      await loadData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Action failed', 'error');
    }
  };

  // Batch action handlers
  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.length === filteredItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredItems.map((i) => i.id));
    }
  };

  const handleBatchApprove = async () => {
    if (selectedItemIds.length === 0) return;
    try {
      for (const id of selectedItemIds) {
        const item = items.find((i) => i.id === id);
        if (!item) continue;
        if (item.entity_type === 'expense') {
          await approveExpenseWorkflow(item.id, currentUser, 'Batch approved by management');
        } else {
          await approvePurchaseOrderWorkflow(item.id, currentUser, 'Batch approved by management');
        }
      }
      showToast(`Successfully approved ${selectedItemIds.length} item(s)`, 'success');
      await loadData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Batch approval failed', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-navy-900 dark:text-white">
              Approvals Management Hub
            </h1>
            {stats.totalCount > 0 && (
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                {stats.totalCount} Pending Review
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-navy-400 mt-1">
            Centralized authorization center for operational expense vouchers and supplier purchase orders.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {selectedItemIds.length > 0 && (
            <button
              type="button"
              onClick={handleBatchApprove}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Approve Selected ({selectedItemIds.length})</span>
            </button>
          )}

          <Link
            to="/notifications"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-navy-700 shadow-2xs hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200"
          >
            <span>All Notifications →</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-navy-400">
              Total Pending Value
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-navy-900 dark:text-white">
            {formatCurrency(stats.totalAmount, 'BIF')}
          </p>
          <span className="text-[11px] text-gray-400">
            {stats.totalCount} items across all categories
          </span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-navy-400">
              Pending Expenses
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(stats.expenseAmount, 'BIF')}
          </p>
          <span className="text-[11px] text-gray-400">{stats.expenseCount} expense vouchers</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-navy-400">
              Pending Purchase Orders
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
            {formatCurrency(stats.purchaseAmount, 'BIF')}
          </p>
          <span className="text-[11px] text-gray-400">{stats.purchaseCount} supplier orders</span>
        </div>
      </div>

      {/* Filter and Tab Navigation */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900 space-y-3.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl dark:bg-navy-800 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 sm:flex-none rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === 'all'
                  ? 'bg-white text-navy-900 shadow-xs dark:bg-navy-900 dark:text-white'
                  : 'text-gray-600 hover:text-navy-900 dark:text-navy-400 dark:hover:text-white'
              }`}
            >
              All Requests ({stats.totalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 sm:flex-none rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === 'expenses'
                  ? 'bg-white text-navy-900 shadow-xs dark:bg-navy-900 dark:text-white'
                  : 'text-gray-600 hover:text-navy-900 dark:text-navy-400 dark:hover:text-white'
              }`}
            >
              Expenses ({stats.expenseCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('purchases')}
              className={`flex-1 sm:flex-none rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === 'purchases'
                  ? 'bg-white text-navy-900 shadow-xs dark:bg-navy-900 dark:text-white'
                  : 'text-gray-600 hover:text-navy-900 dark:text-navy-400 dark:hover:text-white'
              }`}
            >
              Purchase Orders ({stats.purchaseCount})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, supplier, requester..."
              className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-4 py-1.5 text-xs text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Main Content: Pending Table & Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List Column */}
        <div className={`space-y-3 ${inspectingItem ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {/* Table Header Controls */}
          {filteredItems.length > 0 && (
            <div className="flex items-center justify-between px-2 text-xs font-semibold text-gray-500">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 hover:text-navy-900 dark:hover:text-white"
                >
                  {selectedItemIds.length === filteredItems.length ? (
                    <CheckSquare className="h-4 w-4 text-brand-600" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  <span>Select All ({filteredItems.length})</span>
                </button>
              </div>
              <span>Click any record to inspect audit history</span>
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-xs dark:border-navy-800 dark:bg-navy-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400 mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                No Pending Approvals!
              </h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                All submitted expenses and purchase orders have been processed and signed off.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              const isInspecting = inspectingItem?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setInspectingItem(item)}
                  className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 shadow-xs transition-all cursor-pointer ${
                    isInspecting
                      ? 'border-brand-500 bg-brand-50/20 dark:border-brand-500 dark:bg-brand-950/20 ring-1 ring-brand-500'
                      : 'border-gray-200 bg-white hover:border-gray-300 dark:border-navy-800 dark:bg-navy-900 dark:hover:border-navy-700'
                  }`}
                >
                  {/* Left info */}
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectItem(item.id);
                      }}
                      className="mt-0.5 text-gray-400 hover:text-brand-600"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-brand-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>

                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        item.entity_type === 'expense'
                          ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400'
                          : 'bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400'
                      }`}
                    >
                      {item.entity_type === 'expense' ? (
                        <CreditCard className="h-5 w-5" />
                      ) : (
                        <Truck className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-extrabold text-navy-900 dark:text-white">
                          {item.code}
                        </span>
                        <span
                          className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                            item.entity_type === 'expense'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {item.entity_type === 'expense' ? 'Expense Voucher' : 'Purchase Order'}
                        </span>
                        <span className="text-2xs text-gray-400">· {item.branch_name}</span>
                      </div>

                      <h4 className="text-xs font-bold text-navy-800 dark:text-navy-100 mt-0.5 truncate max-w-sm">
                        {item.title}
                      </h4>

                      <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500 dark:text-navy-400">
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" /> {item.requester_name}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {item.date}
                        </span>
                        {item.attachment_count > 0 && (
                          <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                            <Paperclip className="h-3 w-3" /> {item.attachment_count} attachment(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right actions & amount */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100 dark:border-navy-800">
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-black text-navy-900 dark:text-white">
                        {formatCurrency(item.amount, item.currency)}
                      </p>
                      <span className="text-2xs font-semibold text-amber-600 dark:text-amber-400">
                        Awaiting Review
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenActionModal(item, 'approve')}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenActionModal(item, 'reject')}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-300"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Audit Trail & Detail Column */}
        {inspectingItem && (
          <div className="lg:col-span-1 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-navy-800">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-gray-400">
                  Workflow Inspection
                </h3>
                <p className="text-sm font-bold text-navy-900 dark:text-white">
                  {inspectingItem.code}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInspectingItem(null)}
                className="text-xs text-gray-400 hover:text-navy-900 dark:hover:text-white"
              >
                Close
              </button>
            </div>

            {/* Description and metadata */}
            <div className="rounded-xl bg-gray-50 p-3 text-xs dark:bg-navy-950/60 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Category / Supplier:</span>
                <span className="font-bold text-navy-900 dark:text-white">
                  {inspectingItem.category_or_supplier}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Submitted By:</span>
                <span className="font-bold text-navy-900 dark:text-white">
                  {inspectingItem.requester_name} ({inspectingItem.requester_role})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Requested Amount:</span>
                <span className="font-black text-brand-600 dark:text-brand-400">
                  {formatCurrency(inspectingItem.amount, inspectingItem.currency)}
                </span>
              </div>
              {inspectingItem.description && (
                <div className="pt-1 text-2xs text-gray-600 dark:text-navy-300 border-t border-gray-200/60 dark:border-navy-800">
                  <span className="font-semibold text-gray-700 dark:text-navy-200">Notes: </span>
                  {inspectingItem.description}
                </div>
              )}
            </div>

            {/* History timeline */}
            <div>
              <h4 className="text-xs font-bold text-navy-900 dark:text-white mb-3">
                Approval Audit Trail
              </h4>
              <ApprovalHistoryTimeline
                entityType={inspectingItem.entity_type}
                entityId={inspectingItem.id}
                refreshTrigger={timelineRefreshTrigger}
              />
            </div>

            {/* Inspect Link */}
            <div className="pt-2">
              <Link
                to={
                  inspectingItem.entity_type === 'expense'
                    ? `/expenses`
                    : `/purchases?id=${inspectingItem.id}`
                }
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-bold text-navy-700 hover:bg-gray-50 dark:border-navy-700 dark:text-navy-200 dark:hover:bg-navy-800"
              >
                <span>Open Full Record in {inspectingItem.entity_type === 'expense' ? 'Expenses' : 'Purchases'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ApprovalActionModal
        isOpen={actionModalOpen}
        actionType={modalActionType}
        item={targetItem}
        onClose={() => setActionModalOpen(false)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
