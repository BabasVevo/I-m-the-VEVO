import { useState } from 'react';
import { UserPlus, X, AlertCircle } from 'lucide-react';
import type { Customer } from '@/types/database';
import { createCustomer } from '@/services/customerService';
import { useToast } from '@/context/ToastContext';

interface CustomerCreateModalProps {
  isOpen: boolean;
  businessId: string;
  onCreated: (customer: Customer) => void;
  onClose: () => void;
}

export function CustomerCreateModal({
  isOpen,
  businessId,
  onCreated,
  onClose,
}: CustomerCreateModalProps) {
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Customer full name or business title is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const { customer: created, duplicateWarning } = await createCustomer({
        business_id: businessId,
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        credit_limit: parseFloat(creditLimit) || 0,
      });

      if (duplicateWarning) {
        addToast({
          type: 'warning',
          title: 'Duplicate Phone Notice',
          message: duplicateWarning,
        });
      }

      addToast({
        type: 'success',
        title: 'Customer Registered',
        message: `${created.name} is now selected for this sale.`,
      });

      onCreated(created);
      onClose();
      // Reset form
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setCreditLimit('');
    } catch (err) {
      console.error('Error creating customer:', err);
      setError('Failed to create customer record. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl transition-all dark:bg-navy-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                New Customer
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Register customer to assign sales and track credit
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:hover:bg-navy-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Customer Name / Business Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grace Makani or Acacia Ltd"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-medium text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+257 7XX XXX XXX"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-medium text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@email.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-medium text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Delivery / Physical Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Boulevard de l'Uprona, Rohero, Bujumbura"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-medium text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Allowed Credit Limit (BIF / Currency)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="e.g. 500000 (0 for no credit)"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-medium text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-navy-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-600 active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Save & Select'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
