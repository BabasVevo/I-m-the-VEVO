import { useState, useEffect } from 'react';
import { X, Building2, Phone, CreditCard } from 'lucide-react';
import type { Supplier, SupplierType, PaymentTerms, SupplierStatus, Branch } from '@/types/database';
import { PAYMENT_TERMS_LABELS, SUPPLIER_TYPE_LABELS } from '@/lib/format';

interface SupplierFormModalProps {
  isOpen: boolean;
  supplier: Supplier | null;
  branches?: Branch[];
  onClose: () => void;
  onSubmit: (data: Partial<Supplier>) => Promise<void>;
}

export function SupplierFormModal({
  isOpen,
  supplier,
  branches = [],
  onClose,
  onSubmit,
}: SupplierFormModalProps) {
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [supplierType, setSupplierType] = useState<SupplierType>('wholesaler');
  const [taxNumber, setTaxNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [alternativePhone, setAlternativePhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Burundi');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('net_30');
  const [creditLimit, setCreditLimit] = useState<number | string>(0);
  const [assignedBranchId, setAssignedBranchId] = useState<string>('');
  const [status, setStatus] = useState<SupplierStatus>('active');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (supplier) {
      setName(supplier.name || '');
      setContactPerson(supplier.contact_person || '');
      setSupplierType(supplier.supplier_type || 'wholesaler');
      setTaxNumber(supplier.tax_number || '');
      setWebsite(supplier.website || '');
      setPhone(supplier.phone || '');
      setAlternativePhone(supplier.alternative_phone || '');
      setEmail(supplier.email || '');
      setAddress(supplier.address || '');
      setCity(supplier.city || '');
      setCountry(supplier.country || 'Burundi');
      setPaymentTerms(supplier.payment_terms || 'net_30');
      setCreditLimit(supplier.credit_limit || 0);
      setAssignedBranchId(supplier.assigned_branch_id || '');
      setStatus(supplier.status || 'active');
      setNotes(supplier.notes || '');
    } else {
      setName('');
      setContactPerson('');
      setSupplierType('wholesaler');
      setTaxNumber('');
      setWebsite('');
      setPhone('');
      setAlternativePhone('');
      setEmail('');
      setAddress('');
      setCity('');
      setCountry('Burundi');
      setPaymentTerms('net_30');
      setCreditLimit(0);
      setAssignedBranchId('');
      setStatus('active');
      setNotes('');
    }
    setError(null);
  }, [supplier, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Supplier or Company Name is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        name: name.trim(),
        contact_person: contactPerson.trim() || null,
        supplier_type: supplierType,
        tax_number: taxNumber.trim() || null,
        website: website.trim() || null,
        phone: phone.trim() || null,
        alternative_phone: alternativePhone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        country: country.trim() || 'Burundi',
        payment_terms: paymentTerms,
        credit_limit: Number(creditLimit) || 0,
        assigned_branch_id: assignedBranchId || null,
        status,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save supplier. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs">
      <div
        id="supplier-form-modal"
        className="relative w-full max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all dark:border-navy-800 dark:bg-navy-900 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {supplier ? 'Edit Supplier Profile' : 'Add New Supplier'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Configure vendor details, payment terms, and purchasing terms
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          {/* Section: Business Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" /> Company & Vendor Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Supplier / Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kibungo Coffee & Grains Ltd"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. David Mrosso"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Supplier Category / Type
                </label>
                <select
                  value={supplierType}
                  onChange={(e) => setSupplierType(e.target.value as SupplierType)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                >
                  {Object.entries(SUPPLIER_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Tax / TIN / VAT Number
                </label>
                <input
                  type="text"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  placeholder="e.g. NIF-400-019-823"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.bi"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section: Contact & Location */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" /> Contact Details & Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Primary Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+257 75 40 00 11"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Alternative Phone
                </label>
                <input
                  type="text"
                  value={alternativePhone}
                  onChange={(e) => setAlternativePhone(e.target.value)}
                  placeholder="+257 22 20 03 00"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="orders@supplier.bi"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Physical Address / Street
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Avenue de l'Industrie, Quartier Industriel"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  City / Town
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bujumbura / Gitega"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Burundi"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section: Commercial & Credit */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5" /> Payment & Terms
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Default Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                >
                  {Object.entries(PAYMENT_TERMS_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Credit Limit (BIF)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Account Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SupplierStatus)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {branches && branches.length > 0 && (
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Assigned Primary Branch
                  </label>
                  <select
                    value={assignedBranchId}
                    onChange={(e) => setAssignedBranchId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                  >
                    <option value="">All Branches / Central Warehouse</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Internal Notes & Delivery Instructions
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Free delivery on orders over 5M BIF. Key contact prefers WhatsApp."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>
            </div>
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
            {loading ? 'Saving...' : supplier ? 'Update Supplier' : 'Create Supplier'}
          </button>
        </div>
      </div>
    </div>
  );
}
