import { useState, useEffect } from 'react';
import {
  X,
  Receipt,
  Repeat,
} from 'lucide-react';
import type {
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  PaymentMethod,
  Branch,
  Supplier,
  RecurrenceInterval,
} from '@/types/database';

interface ExpenseFormModalProps {
  isOpen: boolean;
  expense: Expense | null;
  categories: ExpenseCategory[];
  branches: Branch[];
  suppliers: Supplier[];
  currency?: string;
  onClose: () => void;
  onSubmit: (data: Partial<Expense>) => Promise<void>;
}

export function ExpenseFormModal({
  isOpen,
  expense,
  categories,
  branches,
  suppliers,
  currency = 'BIF',
  onClose,
  onSubmit,
}: ExpenseFormModalProps) {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [amount, setAmount] = useState<number | string>('');
  const [taxAmount, setTaxAmount] = useState<number | string>(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [vendorName, setVendorName] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [status, setStatus] = useState<ExpenseStatus>('paid');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState('monthly');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expense) {
      setTitle(expense.description || '');
      setCategoryId(expense.category_id || '');
      setBranchId(expense.branch_id || '');
      setAmount(expense.amount || '');
      setTaxAmount(expense.tax_amount || 0);
      setExpenseDate(expense.expense_date ? expense.expense_date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setPaymentMethod(expense.payment_method || 'mobile_money');
      setVendorName(expense.payee || '');
      setSupplierId(expense.supplier_id || '');
      setReferenceNumber(expense.reference_number || '');
      setStatus(expense.status || 'paid');
      setIsRecurring(expense.is_recurring || false);
      setRecurrenceInterval(expense.recurrence_interval || 'monthly');
      setNotes(expense.notes || '');
    } else {
      setTitle('');
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setBranchId(branches.length > 0 ? branches[0].id : '');
      setAmount('');
      setTaxAmount(0);
      setExpenseDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod('mobile_money');
      setVendorName('');
      setSupplierId('');
      setReferenceNumber('');
      setStatus('paid');
      setIsRecurring(false);
      setRecurrenceInterval('monthly');
      setNotes('');
    }
    setError(null);
  }, [expense, isOpen, categories, branches]);

  const handleSupplierSelect = (supId: string) => {
    setSupplierId(supId);
    if (supId) {
      const sup = suppliers.find((s) => s.id === supId);
      if (sup) {
        setVendorName(sup.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Expense title / description is required.');
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid expense amount greater than 0.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        description: title.trim(),
        category_id: categoryId,
        branch_id: branchId,
        amount: numAmount,
        tax_amount: Number(taxAmount) || 0,
        expense_date: expenseDate,
        payment_method: paymentMethod,
        payee: vendorName.trim() || null,
        supplier_id: supplierId || null,
        reference_number: referenceNumber.trim() || null,
        status,
        is_recurring: isRecurring,
        recurrence_interval: isRecurring ? (recurrenceInterval as RecurrenceInterval) : null,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save expense voucher.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs">
      <div
        id="expense-form-modal"
        className="relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all dark:border-navy-800 dark:bg-navy-900 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {expense ? 'Edit Expense Voucher' : 'Record New Expense'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Log operational overheads, utilities, salaries, and maintenance bills
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-navy-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Expense Title / Purpose <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. TANESCO Electricity Bill - Main Floor"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Branch Location
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              >
                <option value="">All Branches / Central</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Expense Amount ({currency}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tax / VAT Included ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Expense Date
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              >
                <option value="mobile_money">Mobile Money (M-Pesa / TigoPesa)</option>
                <option value="bank_transfer">Bank Transfer (BCB / SOGEB)</option>
                <option value="cash">Petty Cash</option>
                <option value="card">Company Debit/Credit Card</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Vendor / Payee / Beneficiary
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g. TANESCO or Landlord Name"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Link to Supplier Account (Optional)
              </label>
              <select
                value={supplierId}
                onChange={(e) => handleSupplierSelect(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              >
                <option value="">None / External Vendor</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Receipt / Tax Invoice / Voucher #
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. REC-2026-9902"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Approval & Payment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ExpenseStatus)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              >
                <option value="paid">Paid Immediately</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="draft">Draft Voucher</option>
              </select>
            </div>
          </div>

          {/* Recurring Option */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5 dark:border-navy-800 dark:bg-navy-950/40">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <Repeat className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <span>Repeat as Recurring Expense</span>
              </label>

              {isRecurring && (
                <select
                  value={recurrenceInterval}
                  onChange={(e) => setRecurrenceInterval(e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Internal Notes & Justification
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Monthly internet subscription renewed via M-Pesa."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-navy-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="rounded-lg bg-brand-600 px-5 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            {loading ? 'Saving...' : expense ? 'Update Voucher' : 'Record Expense'}
          </button>
        </div>
      </div>
    </div>
  );
}
