import { useState, useEffect } from 'react';
import {
  Banknote,
  CreditCard,
  Smartphone,
  Building2,
  Users,
  Layers,
  X,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import type { Customer, PaymentMethod, PaymentStatus, Profile, Branch, Sale } from '@/types/database';
import type { CartItem, SaleDiscount, ProcessSaleInput } from '@/services/saleService';
import { processSale } from '@/services/saleService';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/context/ToastContext';

interface PaymentModalProps {
  isOpen: boolean;
  businessId: string;
  branchId: string;
  cashierProfile?: Profile | null;
  branch?: Branch | null;
  customer: Customer | null;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  saleDiscount: SaleDiscount;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  currency?: string;
  onSaleCompleted: (sale: Sale) => void;
  onClose: () => void;
}

export function PaymentModal({
  isOpen,
  businessId,
  branchId,
  cashierProfile,
  branch,
  customer,
  items,
  subtotal,
  discountAmount,
  saleDiscount,
  taxRate,
  taxAmount,
  totalAmount,
  currency = 'BIF',
  onSaleCompleted,
  onClose,
}: PaymentModalProps) {
  const { addToast } = useToast();
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>(totalAmount.toString());
  
  // Mobile Money fields
  const [momoProvider, setMomoProvider] = useState<'lumicash' | 'ecocash' | 'airtel' | 'other'>('lumicash');
  const [momoPhone, setMomoPhone] = useState(customer?.phone || '');
  const [momoRef, setMomoRef] = useState('');

  // Card fields
  const [cardRef, setCardRef] = useState('');
  const [cardLast4, setCardLast4] = useState('');

  // Bank Transfer fields
  const [bankName, setBankName] = useState('Interbank Burundi (IBB)');
  const [bankRef, setBankRef] = useState('');

  // Split payment fields
  const [splitCash, setSplitCash] = useState<string>((Math.floor(totalAmount / 2)).toString());
  const [splitSecondMethod, setSplitSecondMethod] = useState<PaymentMethod>('mobile_money');
  const [splitSecondAmount, setSplitSecondAmount] = useState<string>((totalAmount - Math.floor(totalAmount / 2)).toString());

  // Notes & Due Date (for Credit)
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize cash tendered when totalAmount changes
  useEffect(() => {
    if (isOpen) {
      setCashTendered(totalAmount.toString());
      setSplitCash((Math.floor(totalAmount / 2)).toString());
      setSplitSecondAmount((totalAmount - Math.floor(totalAmount / 2)).toString());
      setError(null);
    }
  }, [isOpen, totalAmount]);

  if (!isOpen) return null;

  // Numerical calculations
  const parsedTendered = parseFloat(cashTendered) || 0;
  const changeAmount = method === 'cash' ? Math.max(0, parsedTendered - totalAmount) : 0;
  
  // Credit calculations
  const isCredit = method === 'credit';
  const availableCredit = customer ? (customer.credit_limit || 0) - (customer.current_balance || 0) : 0;
  const exceedsCreditLimit = isCredit && customer && totalAmount > availableCredit && customer.credit_limit > 0;

  // Split calculations
  const numSplit1 = parseFloat(splitCash) || 0;
  const numSplit2 = parseFloat(splitSecondAmount) || 0;
  const totalSplitTendered = numSplit1 + numSplit2;
  const splitBalanceDiff = totalAmount - totalSplitTendered;

  // Denominations for quick cash buttons
  const cashNotes = [
    { label: 'Exact', value: totalAmount },
    { label: '5,000', value: 5000 },
    { label: '10,000', value: 10000 },
    { label: '20,000', value: 20000 },
    { label: '50,000', value: 50000 },
    { label: '100,000', value: 100000 },
  ].filter((n) => n.value >= totalAmount || n.label === 'Exact');

  // Handle finalize sale
  const handleFinalize = async () => {
    setError(null);

    // Validations
    if (method === 'cash') {
      if (parsedTendered < totalAmount) {
        setError(`Amount tendered is less than the total payable ${formatCurrency(totalAmount, currency)}.`);
        return;
      }
    } else if (method === 'credit') {
      if (!customer) {
        setError('A registered customer must be selected to allow credit / account sales.');
        return;
      }
      if (exceedsCreditLimit) {
        setError(`Sale total exceeds customer available credit limit (${formatCurrency(availableCredit, currency)}).`);
        return;
      }
    } else if (method === 'split') {
      if (Math.abs(splitBalanceDiff) > 1) {
        setError(`Split amounts must equal total (${formatCurrency(totalAmount, currency)}). Difference: ${formatCurrency(splitBalanceDiff, currency)}.`);
        return;
      }
    }

    try {
      setProcessing(true);

      let paidAmt = totalAmount;
      let dueAmt = 0;
      let payStatus: PaymentStatus = 'completed';
      let saleNotes = notes.trim();

      if (method === 'credit') {
        paidAmt = 0;
        dueAmt = totalAmount;
        payStatus = 'pending';
        saleNotes = `Credit Sale. Due: ${dueDate}. ${saleNotes}`;
      } else if (method === 'mobile_money') {
        saleNotes = `M-Pesa/Momo [${momoProvider.toUpperCase()}] Ref: ${momoRef || 'N/A'}. Phone: ${momoPhone || 'N/A'}. ${saleNotes}`;
      } else if (method === 'card') {
        saleNotes = `Card Payment. Ref: ${cardRef || 'N/A'}. Last4: ${cardLast4 || 'N/A'}. ${saleNotes}`;
      } else if (method === 'bank_transfer') {
        saleNotes = `Bank: ${bankName}. Ref: ${bankRef || 'N/A'}. ${saleNotes}`;
      } else if (method === 'split') {
        saleNotes = `Split: Cash ${formatCurrency(numSplit1, currency)} + ${splitSecondMethod.toUpperCase()} ${formatCurrency(numSplit2, currency)}. ${saleNotes}`;
      }

      const payload: ProcessSaleInput = {
        businessId,
        branchId,
        cashierId: cashierProfile?.id,
        cashierProfile,
        branch,
        customerId: customer?.id,
        customer,
        items,
        subtotal,
        discountAmount,
        saleDiscount,
        taxRate,
        taxAmount,
        totalAmount,
        paidAmount: paidAmt,
        changeAmount,
        dueAmount: dueAmt,
        paymentMethod: method,
        paymentStatus: payStatus,
        dueDate: method === 'credit' ? dueDate : null,
        notes: saleNotes.trim() || null,
      };

      const result = await processSale(payload);

      addToast({
        type: 'success',
        title: 'Sale Completed',
        message: `Receipt #${result.receipt_number} generated successfully.`,
      });

      onSaleCompleted(result);
    } catch (err) {
      console.error('Failed to process sale:', err);
      setError('An error occurred while recording the sale. Please verify details and retry.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-xs">
      <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all dark:bg-navy-900">
        {/* Modal Top Banner */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-4 text-white dark:border-navy-800">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase opacity-90">
              Checkout & Payment
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-black">
                {formatCurrency(totalAmount, currency)}
              </span>
              <span className="text-xs opacity-80">
                ({items.reduce((sum, i) => sum + i.quantity, 0)} items)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Payment Methods Tabs */}
        <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-2.5 dark:border-navy-800 dark:bg-navy-950/60">
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {[
              { id: 'cash', label: 'Cash', icon: Banknote },
              { id: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
              { id: 'card', label: 'Card / POS', icon: CreditCard },
              { id: 'bank_transfer', label: 'Bank', icon: Building2 },
              { id: 'credit', label: 'Pay Later', icon: Users },
              { id: 'split', label: 'Split', icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const isCurrent = method === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setMethod(tab.id as PaymentMethod);
                    setError(null);
                  }}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2 text-xs font-bold transition ${
                    isCurrent
                      ? 'bg-brand-500 text-white shadow-xs'
                      : 'bg-white text-gray-700 hover:bg-gray-200 dark:bg-navy-900 dark:text-gray-300 dark:hover:bg-navy-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[11px] truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2 rounded-2xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer info preview */}
          <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-3 text-xs dark:border-navy-800 dark:bg-navy-950">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-500">Customer:</span>
              <span className="font-bold text-navy-900 dark:text-white">
                {customer ? customer.name : 'Walk-in Customer'}
              </span>
            </div>
            {customer && (
              <div className="text-[11px] text-gray-500">
                Limit: {formatCurrency(customer.credit_limit, currency)} | Balance: {formatCurrency(customer.current_balance, currency)}
              </div>
            )}
          </div>

          {/* 1. CASH PAYMENT VIEW */}
          {method === 'cash' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Cash Amount Tendered ({currency})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    autoFocus
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-2xl font-black text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setCashTendered(totalAmount.toString())}
                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded-xl bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-600 hover:bg-brand-100 dark:bg-brand-950/60 dark:text-brand-300"
                  >
                    Exact
                  </button>
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div>
                <span className="mb-1.5 block text-[11px] font-semibold text-gray-500">
                  Quick Cash Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  {cashNotes.map((note) => (
                    <button
                      key={note.label}
                      type="button"
                      onClick={() => setCashTendered(note.value.toString())}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-navy-900 shadow-2xs hover:border-brand-500 hover:bg-brand-50 dark:border-navy-700 dark:bg-navy-900 dark:text-white dark:hover:bg-navy-800"
                    >
                      {note.label} {note.label !== 'Exact' && currency}
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Change calculation */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 dark:border-emerald-950/50 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      Change Due to Customer:
                    </span>
                    <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(changeAmount, currency)}
                    </span>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-emerald-500/80" />
                </div>
              </div>
            </div>
          )}

          {/* 2. MOBILE MONEY VIEW */}
          {method === 'mobile_money' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Select Mobile Money Provider
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { id: 'lumicash', name: 'Lumicash' },
                    { id: 'ecocash', name: 'EcoCash' },
                    { id: 'airtel', name: 'Airtel Money' },
                    { id: 'other', name: 'Other Wallet' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setMomoProvider(p.id as 'lumicash' | 'ecocash' | 'airtel' | 'other')}
                      className={`rounded-xl border p-2.5 text-center text-xs font-bold transition ${
                        momoProvider === p.id
                          ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-300'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Customer Phone Number
                  </label>
                  <input
                    type="tel"
                    value={momoPhone}
                    onChange={(e) => setMomoPhone(e.target.value)}
                    placeholder="+257 7X XX XX XX"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Transaction / Reference ID
                  </label>
                  <input
                    type="text"
                    value={momoRef}
                    onChange={(e) => setMomoRef(e.target.value)}
                    placeholder="e.g. 9841289410 or SMS code"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-mono text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. CARD VIEW */}
          {method === 'card' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    POS Terminal Approval / Auth Code
                  </label>
                  <input
                    type="text"
                    value={cardRef}
                    onChange={(e) => setCardRef(e.target.value)}
                    placeholder="e.g. AUTH-88219"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-mono text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Card Last 4 Digits (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={cardLast4}
                    onChange={(e) => setCardLast4(e.target.value)}
                    placeholder="e.g. 4082"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-mono text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. BANK TRANSFER VIEW */}
          {method === 'bank_transfer' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Bank Name
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                  >
                    <option value="Interbank Burundi (IBB)">Interbank Burundi (IBB)</option>
                    <option value="BANCOBU">BANCOBU</option>
                    <option value="BCB (Banque Commerciale du Burundi)">BCB (Banque Commerciale du Burundi)</option>
                    <option value="Ecobank Burundi">Ecobank Burundi</option>
                    <option value="CRDB Bank Burundi">CRDB Bank Burundi</option>
                    <option value="FinBank Burundi">FinBank Burundi</option>
                    <option value="KCB Bank Burundi">KCB Bank Burundi</option>
                    <option value="Other Bank">Other Bank</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Bank Reference / Slip #
                  </label>
                  <input
                    type="text"
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value)}
                    placeholder="e.g. REF-2026-99182"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-mono text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. CREDIT / PAY LATER VIEW */}
          {method === 'credit' && (
            <div className="space-y-4">
              {!customer ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                  <p className="font-bold">No registered customer selected.</p>
                  <p className="mt-1">
                    To record a Pay Later / Credit sale, you must select a customer before finalizing.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-950/50 dark:bg-blue-950/20 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Customer Name:</span>
                    <span className="font-bold text-navy-900 dark:text-white">{customer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Credit Limit:</span>
                    <span className="font-bold text-navy-900 dark:text-white">
                      {formatCurrency(customer.credit_limit, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Available Credit:</span>
                    <span className={`font-bold ${availableCredit >= totalAmount ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(availableCredit, currency)}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Payment Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* 6. SPLIT PAYMENT VIEW */}
          {method === 'split' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3.5 dark:border-navy-800 dark:bg-navy-950 space-y-3">
                {/* Tender 1: Cash */}
                <div className="flex items-center justify-between gap-3">
                  <div className="w-1/3 text-xs font-bold text-navy-900 dark:text-white">
                    1. Cash Tender
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={splitCash}
                    onChange={(e) => setSplitCash(e.target.value)}
                    className="w-2/3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-navy-900 outline-hidden focus:border-brand-500 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                    placeholder="Cash portion"
                  />
                </div>

                {/* Tender 2: Second method */}
                <div className="flex items-center justify-between gap-3">
                  <select
                    value={splitSecondMethod}
                    onChange={(e) => setSplitSecondMethod(e.target.value as PaymentMethod)}
                    className="w-1/3 rounded-xl border border-gray-200 bg-white px-2 py-2 text-xs font-bold text-navy-900 outline-hidden focus:border-brand-500 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                  >
                    <option value="mobile_money">2. Mobile Money</option>
                    <option value="card">2. Card</option>
                    <option value="bank_transfer">2. Bank</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={splitSecondAmount}
                    onChange={(e) => setSplitSecondAmount(e.target.value)}
                    className="w-2/3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-navy-900 outline-hidden focus:border-brand-500 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                    placeholder="Remaining portion"
                  />
                </div>
              </div>

              {/* Split calculation status */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-gray-500">Tendered Total:</span>
                <span className={Math.abs(splitBalanceDiff) < 1 ? 'text-emerald-600' : 'text-rose-600'}>
                  {formatCurrency(totalSplitTendered, currency)} / {formatCurrency(totalAmount, currency)}
                </span>
              </div>
            </div>
          )}

          {/* Optional Sale Notes */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              Order Reference / Sale Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Counter sale, Gift wrap requested, special note"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 dark:border-navy-800 dark:bg-navy-950">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300"
            >
              Back to Cart
            </button>

            <button
              type="button"
              disabled={processing || (method === 'credit' && !customer)}
              onClick={handleFinalize}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-extrabold text-white shadow-md hover:bg-brand-600 active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? (
                <>
                  <RotateCcw className="h-4 w-4 animate-spin" />
                  <span>Processing Sale...</span>
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4" />
                  <span>Complete Sale & Print</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
