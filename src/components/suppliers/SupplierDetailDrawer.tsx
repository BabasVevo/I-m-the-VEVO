import { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Globe,
  Plus,
  Trash2,
  Truck,
  DollarSign,
  Send,
  Edit,
} from 'lucide-react';
import type { Supplier, SupplierNote, PurchaseOrder } from '@/types/database';
import { formatCurrency, formatDateTime, formatDate, PAYMENT_TERMS_LABELS, SUPPLIER_TYPE_LABELS, PO_STATUS_CONFIG } from '@/lib/format';
import { fetchSupplierById, addSupplierNote, deleteSupplierNote } from '@/services/supplierService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface SupplierDetailDrawerProps {
  isOpen: boolean;
  supplierId: string | null;
  currency?: string;
  onClose: () => void;
  onEdit: (supplier: Supplier) => void;
  onRecordPayment: (supplier: Supplier) => void;
  onCreatePurchaseOrder: (supplier: Supplier) => void;
  onViewPurchaseOrder?: (po: PurchaseOrder) => void;
}

export function SupplierDetailDrawer({
  isOpen,
  supplierId,
  currency = 'TZS',
  onClose,
  onEdit,
  onRecordPayment,
  onCreatePurchaseOrder,
  onViewPurchaseOrder,
}: SupplierDetailDrawerProps) {
  const { business, user } = useAuth();
  const { addToast } = useToast();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [notes, setNotes] = useState<SupplierNote[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'purchases' | 'notes'>('overview');
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (isOpen && supplierId) {
      loadData(supplierId);
    }
  }, [isOpen, supplierId]);

  const loadData = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetchSupplierById(id);
      setSupplier(res.supplier);
      setNotes(res.notes);
      setPurchases(res.purchases);
    } catch (err) {
      console.error('Error loading supplier details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !supplier || !business) return;

    try {
      setAddingNote(true);
      const note = await addSupplierNote(business.id, supplier.id, newNote.trim(), user?.id || null);
      setNotes([note, ...notes]);
      setNewNote('');
      addToast({
        type: 'success',
        title: 'Note Added',
        message: 'Supplier internal note saved successfully.',
      });
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Could not save note.',
      });
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteSupplierNote(noteId);
      setNotes(notes.filter((n) => n.id !== noteId));
      addToast({
        type: 'success',
        title: 'Note Deleted',
        message: 'Note removed successfully.',
      });
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to delete note.',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div
          id="supplier-detail-drawer"
          className="w-screen max-w-2xl transform bg-white shadow-2xl transition-all dark:bg-navy-900 border-l border-gray-200 dark:border-navy-800 flex flex-col"
        >
          {/* Header */}
          <div className="border-b border-gray-200 p-6 dark:border-navy-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {supplier?.name || 'Loading...'}
                    </h2>
                    {supplier && (
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                          supplier.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-navy-800 dark:text-gray-300'
                        }`}
                      >
                        {supplier.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {supplier?.supplier_type ? SUPPLIER_TYPE_LABELS[supplier.supplier_type] : 'Vendor'} · {supplier?.city || 'Tanzania'}
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

            {/* Quick Actions Bar */}
            {supplier && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onCreatePurchaseOrder(supplier)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
                >
                  <Plus className="h-4 w-4" /> New Purchase Order
                </button>
                <button
                  type="button"
                  onClick={() => onRecordPayment(supplier)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  <DollarSign className="h-4 w-4" /> Record Payment
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(supplier)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-300 dark:hover:bg-navy-700"
                >
                  <Edit className="h-3.5 w-3.5" /> Edit
                </button>
              </div>
            )}

            {/* Nav Tabs */}
            <div className="mt-6 flex border-b border-gray-200 dark:border-navy-800 gap-6 text-sm font-medium">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-2.5 transition-colors border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Overview & Profile
              </button>
              <button
                onClick={() => setActiveTab('purchases')}
                className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'purchases'
                    ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Purchase Orders
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-2xs text-gray-600 dark:bg-navy-800 dark:text-gray-300">
                  {purchases.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'notes'
                    ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Supplier Notes
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-2xs text-gray-600 dark:bg-navy-800 dark:text-gray-300">
                  {notes.length}
                </span>
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'overview' && supplier && (
              <div className="space-y-6">
                {/* Financial KPI Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 dark:border-navy-800 dark:bg-navy-950/60">
                    <span className="text-2xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Outstanding Balance
                    </span>
                    <p className={`mt-1 text-base font-bold ${supplier.current_balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                      {formatCurrency(supplier.current_balance || 0, currency)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 dark:border-navy-800 dark:bg-navy-950/60">
                    <span className="text-2xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Total Purchased
                    </span>
                    <p className="mt-1 text-base font-bold text-gray-900 dark:text-white">
                      {formatCurrency(supplier.total_purchases_amount || 0, currency)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 dark:border-navy-800 dark:bg-navy-950/60">
                    <span className="text-2xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Total Paid
                    </span>
                    <p className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(supplier.total_paid_amount || 0, currency)}
                    </p>
                  </div>
                </div>

                {/* Vendor Contact and Commercial Profile */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-navy-800 dark:bg-navy-900">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
                    Contact & Address
                  </h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Contact Person</dt>
                      <dd className="font-semibold text-gray-900 dark:text-white mt-0.5">
                        {supplier.contact_person || 'Not specified'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Phone</dt>
                      <dd className="font-semibold text-gray-900 dark:text-white mt-0.5">
                        {supplier.phone || '—'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Alternative Phone</dt>
                      <dd className="font-semibold text-gray-900 dark:text-white mt-0.5">
                        {supplier.alternative_phone || '—'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Email Address</dt>
                      <dd className="font-semibold text-gray-900 dark:text-white mt-0.5">
                        {supplier.email || '—'}
                      </dd>
                    </div>

                    <div className="sm:col-span-2">
                      <dt className="text-gray-500 dark:text-gray-400">Physical Address</dt>
                      <dd className="font-semibold text-gray-900 dark:text-white mt-0.5">
                        {supplier.address ? `${supplier.address}, ${supplier.city || ''}` : supplier.city || '—'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Tax / TIN Number</dt>
                      <dd className="font-semibold text-gray-900 dark:text-white mt-0.5">
                        {supplier.tax_number || '—'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Website</dt>
                      <dd className="font-semibold text-brand-600 dark:text-brand-400 mt-0.5">
                        {supplier.website ? (
                          <a href={supplier.website} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                            {supplier.website} <Globe className="h-3 w-3 inline" />
                          </a>
                        ) : (
                          '—'
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Terms and Commercial Policies */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-navy-800 dark:bg-navy-900">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
                    Commercial & Payment Terms
                  </h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Payment Terms</dt>
                      <dd className="font-semibold text-gray-900 dark:text-white mt-0.5">
                        {PAYMENT_TERMS_LABELS[supplier.payment_terms] || supplier.payment_terms}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Credit Limit</dt>
                      <dd className="font-semibold text-gray-900 dark:text-white mt-0.5">
                        {formatCurrency(supplier.credit_limit || 0, currency)}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Assigned Branch</dt>
                      <dd className="font-semibold text-gray-900 dark:text-white mt-0.5">
                        {supplier.assigned_branch?.name || 'All Branches / Central'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Last Purchase</dt>
                      <dd className="font-semibold text-gray-900 dark:text-white mt-0.5">
                        {formatDate(supplier.last_purchase_date)}
                      </dd>
                    </div>

                    {supplier.notes && (
                      <div className="sm:col-span-2 pt-2 border-t border-gray-100 dark:border-navy-800">
                        <dt className="text-gray-500 dark:text-gray-400">Internal Operational Notes</dt>
                        <dd className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                          {supplier.notes}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}

            {/* Purchases Tab */}
            {activeTab === 'purchases' && (
              <div className="space-y-4">
                {purchases.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-navy-700">
                    <Truck className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      No purchase orders recorded yet
                    </p>
                    <p className="text-2xs text-gray-500 dark:text-gray-400 mt-1">
                      Create purchase orders to order products and stock from this supplier.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {purchases.map((po) => {
                      const st = PO_STATUS_CONFIG[po.status] || PO_STATUS_CONFIG.draft;
                      return (
                        <div
                          key={po.id}
                          onClick={() => onViewPurchaseOrder?.(po)}
                          className={`rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900 transition-all ${
                            onViewPurchaseOrder ? 'cursor-pointer hover:border-brand-500' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                                {po.po_number}
                              </span>
                              <span className="text-2xs text-gray-500 dark:text-gray-400 ml-2">
                                {formatDate(po.order_date)}
                              </span>
                            </div>
                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-semibold ${st.bg} ${st.text}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                              {st.label}
                            </span>
                          </div>

                          <div className="mt-3 flex items-baseline justify-between border-t border-gray-100 pt-2 text-xs dark:border-navy-800">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Total: </span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {formatCurrency(po.grand_total, currency)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Due: </span>
                              <span className={`font-semibold ${po.due_amount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {formatCurrency(po.due_amount, currency)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Supplier Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an internal note about this supplier (agreed rates, preferred delivery dates)..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={addingNote || !newNote.trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600"
                    >
                      <Send className="h-3.5 w-3.5" /> {addingNote ? 'Saving...' : 'Add Note'}
                    </button>
                  </div>
                </form>

                <div className="space-y-2.5 pt-2">
                  {notes.length === 0 ? (
                    <p className="text-center py-6 text-xs text-gray-400 dark:text-gray-500">
                      No internal notes recorded.
                    </p>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 text-xs dark:border-navy-800 dark:bg-navy-950/40 relative group"
                      >
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{note.content}</p>
                        <div className="mt-2 flex items-center justify-between text-2xs text-gray-400">
                          <span>{formatDateTime(note.created_at)}</span>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 transition-opacity"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
