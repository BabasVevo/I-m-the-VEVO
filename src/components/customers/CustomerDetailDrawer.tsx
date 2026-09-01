import { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  ShoppingCart, 
  Edit3, 
  Plus, 
  Trash2, 
  MessageSquare,
  Receipt,
  Pin,
  Loader2
} from 'lucide-react';
import type { 
  Customer, 
  Sale, 
  CustomerActivity, 
  CustomerNote, 
  CustomerSegment, 
  ReceiptSettings 
} from '@/types/database';
import { 
  fetchCustomerById, 
  fetchCustomerNotes, 
  addCustomerNote, 
  deleteCustomerNote, 
  fetchCustomerActivity,
  evaluateCustomerForSegment
} from '@/services/customerService';
import { fetchSales } from '@/services/saleService';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { ReceiptModal } from '@/components/pos/ReceiptModal';

interface CustomerDetailDrawerProps {
  customer: Customer | null;
  isOpen: boolean;
  businessId: string;
  currency?: string;
  receiptSettings?: ReceiptSettings;
  segments?: CustomerSegment[];
  onClose: () => void;
  onEditCustomer: (customer: Customer) => void;
  onNewSale: (customer: Customer) => void;
  onOpenCreditPayment: (customer: Customer) => void;
  onArchiveCustomer: (customer: Customer) => void;
  onRefreshCustomerList?: () => void;
}

export function CustomerDetailDrawer({
  customer,
  isOpen,
  businessId,
  currency = 'BIF',
  receiptSettings,
  segments = [],
  onClose,
  onEditCustomer,
  onNewSale,
  onOpenCreditPayment,
}: CustomerDetailDrawerProps) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'timeline' | 'notes' | 'credit' | 'segments'>('overview');
  
  // Data state
  const [customerData, setCustomerData] = useState<Customer | null>(customer);
  const [sales, setSales] = useState<Sale[]>([]);
  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [loading, setLoading] = useState(false);

  // New Note state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNotePinned, setNewNotePinned] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);

  // View Receipt state
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);

  const loadAllCustomerData = useCallback(async (customerId: string) => {
    setLoading(true);
    try {
      const [freshCust, custNotes, custActivities, salesRes] = await Promise.all([
        fetchCustomerById(customerId),
        fetchCustomerNotes(customerId),
        fetchCustomerActivity(customerId),
        fetchSales({ businessId, customerId, pageSize: 100 }),
      ]);

      if (freshCust) setCustomerData(freshCust);
      setNotes(custNotes);
      setActivities(custActivities);
      setSales(salesRes.sales || []);
    } catch (err) {
      console.error('Error loading full customer details:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (!isOpen || !customer) return;
    setCustomerData(customer);
    loadAllCustomerData(customer.id);
  }, [isOpen, customer, loadAllCustomerData]);

  if (!isOpen || !customerData) return null;

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    try {
      setSubmittingNote(true);
      const createdNote = await addCustomerNote(
        customerData.id,
        businessId,
        null,
        newNoteContent.trim(),
        newNotePinned ? 'pinned' : 'general'
      );

      setNotes((prev) => [createdNote, ...prev]);
      setNewNoteContent('');
      setNewNotePinned(false);

      addToast({
        type: 'success',
        title: 'Note Added',
        message: 'Customer note saved successfully.',
      });

      // Refresh activity log
      const freshActivities = await fetchCustomerActivity(customerData.id);
      setActivities(freshActivities);
    } catch (err) {
      console.error('Error adding note:', err);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to save customer note.',
      });
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteCustomerNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      addToast({
        type: 'info',
        title: 'Note Removed',
        message: 'Customer note deleted.',
      });
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const initials = customerData.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'CU';

  const averageOrderValue = (customerData.total_orders || 0) > 0
    ? Math.round((customerData.total_spent || 0) / (customerData.total_orders || 1))
    : 0;

  const hasDebt = (customerData.current_balance || 0) > 0;
  const creditLimit = customerData.credit_limit || 0;
  const creditUtilization = creditLimit > 0
    ? Math.min(100, Math.round(((customerData.current_balance || 0) / creditLimit) * 100))
    : 0;

  // Matching segments
  const matchedSegments = segments.filter((seg) => evaluateCustomerForSegment(customerData, seg));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-navy-950/60 backdrop-blur-xs">
      <div className="flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl transition-all duration-300 dark:bg-navy-900">
        {/* Header Bar */}
        <div className="border-b border-gray-100 p-6 dark:border-navy-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-xl font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                {initials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-navy-900 dark:text-white">
                    {customerData.name}
                  </h2>
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 capitalize dark:bg-brand-950/80 dark:text-brand-300">
                    {customerData.customer_type}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                    customerData.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${customerData.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    <span className="capitalize">{customerData.status}</span>
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  {customerData.phone && (
                    <a href={`tel:${customerData.phone}`} className="flex items-center gap-1 hover:text-brand-600">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      <span>{customerData.phone}</span>
                    </a>
                  )}
                  {customerData.email && (
                    <a href={`mailto:${customerData.email}`} className="flex items-center gap-1 hover:text-brand-600">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      <span>{customerData.email}</span>
                    </a>
                  )}
                  {customerData.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      <span>{customerData.city}, {customerData.country || 'Tanzania'}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNewSale(customerData);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-600 active:scale-95"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>New POS Sale</span>
              </button>

              <button
                type="button"
                onClick={() => onEditCustomer(customerData)}
                className="rounded-xl border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:text-gray-200 dark:hover:bg-navy-800"
                title="Edit Customer Details"
              >
                <Edit3 className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:hover:bg-navy-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick Tags Chips */}
          {customerData.tags && customerData.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {customerData.tags.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${t.color || '#6366f1'}15`,
                    color: t.color || '#6366f1',
                  }}
                >
                  #{t.name}
                </span>
              ))}
            </div>
          )}

          {/* Financial KPI Summary Cards */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-gray-50/90 p-3 dark:bg-navy-950/70">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Lifetime Spent
              </span>
              <div className="mt-1 text-base font-bold text-navy-900 dark:text-white">
                {formatCurrency(customerData.total_spent || 0, currency)}
              </div>
              <span className="text-[11px] text-gray-500">{customerData.total_orders || 0} orders</span>
            </div>

            <div className="rounded-xl bg-gray-50/90 p-3 dark:bg-navy-950/70">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Avg Order Value
              </span>
              <div className="mt-1 text-base font-bold text-navy-900 dark:text-white">
                {formatCurrency(averageOrderValue, currency)}
              </div>
              <span className="text-[11px] text-gray-500">Per transaction</span>
            </div>

            <div className="rounded-xl bg-gray-50/90 p-3 dark:bg-navy-950/70">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Outstanding Balance
              </span>
              <div className={`mt-1 text-base font-bold ${hasDebt ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {formatCurrency(customerData.current_balance || 0, currency)}
              </div>
              {hasDebt ? (
                <button
                  type="button"
                  onClick={() => onOpenCreditPayment(customerData)}
                  className="text-[11px] font-bold text-brand-600 hover:underline dark:text-brand-400"
                >
                  Record Payment →
                </button>
              ) : (
                <span className="text-[11px] text-gray-400">No debt</span>
              )}
            </div>

            <div className="rounded-xl bg-gray-50/90 p-3 dark:bg-navy-950/70">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Credit Limit
              </span>
              <div className="mt-1 text-base font-bold text-navy-900 dark:text-white">
                {creditLimit > 0 ? formatCurrency(creditLimit, currency) : 'No Limit'}
              </div>
              {creditLimit > 0 && (
                <span className="text-[11px] text-gray-500">{creditUtilization}% utilized</span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 px-6 text-xs font-semibold dark:border-navy-800 dark:bg-navy-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`border-b-2 px-4 py-3 transition ${
              activeTab === 'overview'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                : 'border-transparent text-gray-500 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`border-b-2 px-4 py-3 transition ${
              activeTab === 'orders'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                : 'border-transparent text-gray-500 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Purchase History ({sales.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`border-b-2 px-4 py-3 transition ${
              activeTab === 'timeline'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                : 'border-transparent text-gray-500 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Activity Timeline ({activities.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`border-b-2 px-4 py-3 transition ${
              activeTab === 'notes'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                : 'border-transparent text-gray-500 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Internal Notes ({notes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('credit')}
            className={`border-b-2 px-4 py-3 transition ${
              activeTab === 'credit'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                : 'border-transparent text-gray-500 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Credit Ledger
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('segments')}
            className={`border-b-2 px-4 py-3 transition ${
              activeTab === 'segments'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                : 'border-transparent text-gray-500 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Segments & Marketing
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Detailed Contact & Demographic Information */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 p-4 dark:border-navy-800">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Contact & Location
                  </h4>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Phone:</span>
                      <span className="font-semibold text-navy-900 dark:text-white">
                        {customerData.phone || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="font-semibold text-navy-900 dark:text-white">
                        {customerData.email || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Street Address:</span>
                      <span className="font-semibold text-navy-900 dark:text-white">
                        {customerData.address || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">City & Country:</span>
                      <span className="font-semibold text-navy-900 dark:text-white">
                        {customerData.city || 'Dar es Salaam'}, {customerData.country || 'Tanzania'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 p-4 dark:border-navy-800">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Account & Engagement Profile
                  </h4>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Customer Type:</span>
                      <span className="font-semibold capitalize text-navy-900 dark:text-white">
                        {customerData.customer_type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Home Branch:</span>
                      <span className="font-semibold text-navy-900 dark:text-white">
                        {customerData.assigned_branch?.name || 'Downtown Flagship'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Member Since:</span>
                      <span className="font-semibold text-navy-900 dark:text-white">
                        {formatDate(customerData.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Last Purchase:</span>
                      <span className="font-semibold text-navy-900 dark:text-white">
                        {customerData.last_purchase_at ? formatDateTime(customerData.last_purchase_at) : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pinned Note Banner if exists */}
              {notes.filter((n) => n.is_pinned).length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/40">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                    <Pin className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span>Important Customer Note</span>
                  </div>
                  <div className="mt-2 text-xs text-amber-800 dark:text-amber-200">
                    {notes.find((n) => n.is_pinned)?.content}
                  </div>
                </div>
              )}

              {/* Customer Notes snippet */}
              {customerData.notes && (
                <div className="rounded-2xl border border-gray-100 p-4 dark:border-navy-800">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Customer Preferences & Bio
                  </h4>
                  <p className="mt-2 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {customerData.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PURCHASE HISTORY */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {sales.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  No purchase history found for this customer.
                </div>
              ) : (
                <div className="space-y-3">
                  {sales.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-col justify-between rounded-2xl border border-gray-100 p-4 transition hover:border-gray-200 dark:border-navy-800 dark:hover:border-navy-700 sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy-900 dark:text-white">
                            #{s.receipt_number}
                          </span>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 uppercase dark:bg-navy-800 dark:text-gray-300">
                            {s.payment_method}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            s.payment_status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : s.payment_status === 'partially_refunded' || s.payment_status === 'refunded'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}>
                            {s.payment_status}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          {formatDateTime(s.created_at)} · {s.items?.length || 0} items · Cashier: {s.cashier?.full_name || 'Staff'}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-4 border-t border-gray-100 pt-3 sm:mt-0 sm:border-0 sm:pt-0">
                        <div className="text-right">
                          <div className="font-bold text-navy-900 dark:text-white">
                            {formatCurrency(s.total_amount, currency)}
                          </div>
                          {s.due_amount > 0 && (
                            <div className="text-[10px] font-bold text-rose-600">
                              Due: {formatCurrency(s.due_amount, currency)}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedReceiptSale(s)}
                          className="inline-flex items-center gap-1 rounded-xl border border-gray-200 p-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800"
                          title="View Digital Receipt"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Receipt</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACTIVITY TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {activities.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  No activity log entries yet.
                </div>
              ) : (
                <div className="relative border-l border-gray-200 pl-4 space-y-6 dark:border-navy-700 ml-2">
                  {activities.map((act) => (
                    <div key={act.id} className="relative">
                      <div className="absolute -left-[21px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-brand-500 ring-4 ring-white dark:ring-navy-900" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs capitalize text-navy-900 dark:text-white">
                            {act.activity_type.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {formatDateTime(act.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                          {act.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INTERNAL NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="rounded-2xl border border-gray-100 p-4 bg-gray-50/50 dark:border-navy-800 dark:bg-navy-950/40">
                <textarea
                  rows={2}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Type an internal note regarding this customer..."
                  className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                />
                <div className="mt-2.5 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newNotePinned}
                      onChange={(e) => setNewNotePinned(e.target.checked)}
                      className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span>Pin note to profile top banner</span>
                  </label>
                  <button
                    type="submit"
                    disabled={submittingNote || !newNoteContent.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-600 disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Post Note</span>
                  </button>
                </div>
              </form>

              {/* Notes List */}
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={`flex items-start justify-between gap-3 rounded-2xl border p-3.5 ${
                      note.is_pinned
                        ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20'
                        : 'border-gray-100 bg-white dark:border-navy-800 dark:bg-navy-900'
                    }`}
                  >
                    <div>
                      {note.is_pinned && (
                        <div className="mb-1 flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          <Pin className="h-3 w-3 fill-amber-500" />
                          <span>Pinned Note</span>
                        </div>
                      )}
                      <p className="text-xs text-navy-900 dark:text-white whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <div className="mt-1 text-[10px] text-gray-400">
                        {formatDateTime(note.created_at)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 p-1"
                      title="Delete note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: CREDIT LEDGER */}
          {activeTab === 'credit' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 p-4 dark:border-navy-800">
                  <div className="text-xs font-bold text-gray-400 uppercase">Current Outstanding Debt</div>
                  <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(customerData.current_balance || 0, currency)}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Unpaid credit sales total.
                  </p>
                  {hasDebt && (
                    <button
                      type="button"
                      onClick={() => onOpenCreditPayment(customerData)}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-600"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Record Payment Towards Debt</span>
                    </button>
                  )}
                </div>

                <div className="rounded-2xl border border-gray-100 p-4 dark:border-navy-800">
                  <div className="text-xs font-bold text-gray-400 uppercase">Credit Facility Terms</div>
                  <div className="mt-2 text-2xl font-bold text-navy-900 dark:text-white">
                    {creditLimit > 0 ? formatCurrency(creditLimit, currency) : 'No Limit'}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Maximum credit ceiling permitted across POS checkouts.
                  </p>
                  <button
                    type="button"
                    onClick={() => onEditCustomer(customerData)}
                    className="mt-4 text-xs font-bold text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Adjust Credit Limit →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SEGMENTS & MARKETING */}
          {activeTab === 'segments' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Active Segments Qualification
                </h4>
                <p className="mt-1 text-xs text-gray-500">
                  This customer matches criteria for the following marketing audience segments:
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {matchedSegments.map((seg) => (
                    <div
                      key={seg.id}
                      className="flex items-center justify-between rounded-xl border border-gray-100 p-3 bg-gray-50/50 dark:border-navy-800 dark:bg-navy-950/40"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-white font-bold text-xs"
                          style={{ backgroundColor: seg.color || '#10b981' }}
                        >
                          ✓
                        </div>
                        <div>
                          <div className="font-bold text-xs text-navy-900 dark:text-white">
                            {seg.name}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {seg.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {matchedSegments.length === 0 && (
                    <div className="py-4 text-xs text-gray-400">
                      Customer does not match any specific custom segment rules.
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Communication Channels */}
              <div className="rounded-2xl border border-gray-100 p-4 dark:border-navy-800">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Direct Marketing Links
                </h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {customerData.phone && (
                    <a
                      href={`https://wa.me/${customerData.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(customerData.name)},%20thank%20you%20for%20choosing%20Verdant!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>WhatsApp Message</span>
                    </a>
                  )}
                  {customerData.email && (
                    <a
                      href={`mailto:${customerData.email}?subject=Special%20Offer%20for%20${encodeURIComponent(customerData.name)}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>Send Email</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
          </>
        )}
        </div>

        {/* Digital Receipt Modal if opened */}
        {selectedReceiptSale && (
          <ReceiptModal
            isOpen={Boolean(selectedReceiptSale)}
            sale={selectedReceiptSale}
            currency={currency}
            onNewSale={() => setSelectedReceiptSale(null)}
            onClose={() => setSelectedReceiptSale(null)}
          />
        )}
      </div>
    </div>
  );
}
