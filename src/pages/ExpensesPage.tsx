import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ExpenseStatsCards } from '@/components/expenses/ExpenseStatsCards';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { ExpenseFormModal } from '@/components/expenses/ExpenseFormModal';
import { ExpenseCategoriesModal } from '@/components/expenses/ExpenseCategoriesModal';
import { RecurringExpensesModal } from '@/components/expenses/RecurringExpensesModal';
import { ApprovalActionModal } from '@/components/approvals/ApprovalActionModal';
import {
  fetchExpenses,
  fetchExpenseStats,
  fetchExpenseCategories,
  createExpense,
  updateExpense,
  deleteExpense,
  exportExpensesToCSV,
} from '@/services/expenseService';
import {
  approveExpenseWorkflow,
  rejectExpenseWorkflow,
} from '@/services/approvalService';
import { fetchSuppliers } from '@/services/supplierService';
import type {
  Expense,
  ExpenseCategory,
  ExpenseStats,
  ExpenseStatus,
  Supplier,
} from '@/types/database';

export function ExpensesPage() {
  const { business, branch, user } = useAuth();
  const { addToast } = useToast();

  const businessId = business?.id || 'demo-biz-1';
  const currency = business?.currency || 'BIF';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<ExpenseStats>({
    totalExpenses: 0,
    thisMonthExpenses: 0,
    expensesCount: 0,
    pendingApprovalCount: 0,
    activeRecurringCount: 0,
    byCategory: [],
  });

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ExpenseStatus | 'all'>('all');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedExpenseForEdit, setSelectedExpenseForEdit] = useState<Expense | null>(null);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalActionType, setApprovalActionType] = useState<'approve' | 'reject'>('approve');
  const [targetApprovalExpense, setTargetApprovalExpense] = useState<Expense | null>(null);

  const currentUser = {
    id: user?.id || 'emp-user-1',
    full_name: user?.email || 'Authorized User',
    role_name: 'Manager',
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [expRes, statsRes, catRes, supRes] = await Promise.all([
        fetchExpenses(businessId, {
          search,
          categoryId: selectedCategory || null,
          status: selectedStatus,
          branchId: selectedBranch || null,
          startDate: startDate || null,
          endDate: endDate || null,
          page: currentPage,
          pageSize: 10,
        }),
        fetchExpenseStats(businessId, selectedBranch || null),
        fetchExpenseCategories(businessId),
        fetchSuppliers(businessId, { pageSize: 200 }),
      ]);

      setExpenses(expRes.expenses);
      setTotalCount(expRes.totalCount);
      setStats(statsRes);
      setCategories(catRes);
      setSuppliers(supRes.suppliers);
    } catch (err) {
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId, search, selectedCategory, selectedStatus, selectedBranch, startDate, endDate, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateOrUpdate = async (data: Partial<Expense>) => {
    if (selectedExpenseForEdit) {
      await updateExpense(selectedExpenseForEdit.id, data);
      addToast({
        type: 'success',
        title: 'Expense Updated',
        message: 'Expense voucher updated successfully.',
      });
    } else {
      await createExpense(businessId, {
        ...data,
        recorded_by: user?.id || null,
      });
      addToast({
        type: 'success',
        title: 'Expense Recorded',
        message: 'New expense voucher registered successfully.',
      });
    }
    loadData();
  };

  const handleApprove = (expense: Expense) => {
    setTargetApprovalExpense(expense);
    setApprovalActionType('approve');
    setApprovalModalOpen(true);
  };

  const handleReject = (expense: Expense) => {
    setTargetApprovalExpense(expense);
    setApprovalActionType('reject');
    setApprovalModalOpen(true);
  };

  const handleConfirmApprovalAction = async (notes: string) => {
    if (!targetApprovalExpense) return;
    try {
      if (approvalActionType === 'approve') {
        await approveExpenseWorkflow(targetApprovalExpense.id, currentUser, notes);
        addToast({
          type: 'success',
          title: 'Voucher Approved',
          message: `Expense "${targetApprovalExpense.title}" has been approved.`,
        });
      } else {
        await rejectExpenseWorkflow(targetApprovalExpense.id, currentUser, notes);
        addToast({
          type: 'success',
          title: 'Voucher Rejected',
          message: `Expense "${targetApprovalExpense.title}" marked as rejected.`,
        });
      }
      loadData();
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Approval action failed.',
      });
    }
  };

  const handleDelete = async (expense: Expense) => {
    if (window.confirm(`Delete expense "${expense.title}"?`)) {
      try {
        await deleteExpense(expense.id);
        addToast({
          type: 'success',
          title: 'Expense Deleted',
          message: 'Voucher removed successfully.',
        });
        loadData();
      } catch (err: unknown) {
        addToast({
          type: 'error',
          title: 'Error',
          message: err instanceof Error ? err.message : 'Failed to delete expense.',
        });
      }
    }
  };

  return (
    <div id="expenses-page" className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
          Expense Management
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Track operating costs, utility bills, facility rentals, staff payments, and recurring overheads.
        </p>
      </div>

      {/* Stats Cards */}
      <ExpenseStatsCards stats={stats} currency={currency} />

      {/* List */}
      <ExpenseList
        expenses={expenses}
        totalCount={totalCount}
        categories={categories}
        branches={branch ? [branch] : []}
        currentPage={currentPage}
        pageSize={10}
        search={search}
        selectedCategory={selectedCategory}
        selectedStatus={selectedStatus}
        selectedBranch={selectedBranch}
        startDate={startDate}
        endDate={endDate}
        currency={currency}
        loading={loading}
        onSearchChange={(q) => {
          setSearch(q);
          setCurrentPage(1);
        }}
        onCategoryChange={(c) => {
          setSelectedCategory(c);
          setCurrentPage(1);
        }}
        onStatusChange={(st) => {
          setSelectedStatus(st);
          setCurrentPage(1);
        }}
        onBranchChange={(b) => {
          setSelectedBranch(b);
          setCurrentPage(1);
        }}
        onStartDateChange={(d) => {
          setStartDate(d);
          setCurrentPage(1);
        }}
        onEndDateChange={(d) => {
          setEndDate(d);
          setCurrentPage(1);
        }}
        onPageChange={setCurrentPage}
        onAddExpense={() => {
          setSelectedExpenseForEdit(null);
          setFormModalOpen(true);
        }}
        onOpenCategories={() => setCategoriesModalOpen(true)}
        onOpenRecurring={() => setRecurringModalOpen(true)}
        onEditExpense={(exp) => {
          setSelectedExpenseForEdit(exp);
          setFormModalOpen(true);
        }}
        onApproveExpense={handleApprove}
        onRejectExpense={handleReject}
        onDeleteExpense={handleDelete}
        onExportCSV={() => exportExpensesToCSV(expenses)}
      />

      {/* Modals */}
      <ExpenseFormModal
        isOpen={formModalOpen}
        expense={selectedExpenseForEdit}
        categories={categories}
        branches={branch ? [branch] : []}
        suppliers={suppliers}
        currency={currency}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedExpenseForEdit(null);
        }}
        onSubmit={handleCreateOrUpdate}
      />

      <ExpenseCategoriesModal
        isOpen={categoriesModalOpen}
        categories={categories}
        onClose={() => setCategoriesModalOpen(false)}
        onRefresh={loadData}
      />

      <RecurringExpensesModal
        isOpen={recurringModalOpen}
        currency={currency}
        onClose={() => setRecurringModalOpen(false)}
        onRefresh={loadData}
      />

      <ApprovalActionModal
        isOpen={approvalModalOpen}
        actionType={approvalActionType}
        item={
          targetApprovalExpense
            ? {
                id: targetApprovalExpense.id,
                entity_type: 'expense',
                code: targetApprovalExpense.voucher_number || 'EXP-VOUCHER',
                title: targetApprovalExpense.title,
                amount: Number(targetApprovalExpense.amount),
                currency: targetApprovalExpense.currency || currency,
                status: targetApprovalExpense.status,
                requester_name: 'Staff Requester',
                requester_role: 'Operations',
                branch_name: branch?.name || 'Main Branch',
                created_at: targetApprovalExpense.date,
                date: targetApprovalExpense.date,
                category_or_supplier: targetApprovalExpense.category?.name || 'Expense',
                description: targetApprovalExpense.notes || '',
                attachment_count: targetApprovalExpense.receipt_url ? 1 : 0,
              }
            : null
        }
        onClose={() => {
          setApprovalModalOpen(false);
          setTargetApprovalExpense(null);
        }}
        onConfirm={handleConfirmApprovalAction}
      />
    </div>
  );
}
