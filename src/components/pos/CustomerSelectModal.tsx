import { useState, useEffect } from 'react';
import { Search, UserPlus, X, User, Phone, Mail, MapPin, Check, CreditCard } from 'lucide-react';
import type { Customer } from '@/types/database';
import { fetchCustomers } from '@/services/customerService';
import { formatCurrency } from '@/lib/format';

interface CustomerSelectModalProps {
  isOpen: boolean;
  businessId: string;
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onOpenCreateCustomer: () => void;
  onClose: () => void;
  currency?: string;
}

export function CustomerSelectModal({
  isOpen,
  businessId,
  selectedCustomer,
  onSelectCustomer,
  onOpenCreateCustomer,
  onClose,
  currency = 'BIF',
}: CustomerSelectModalProps) {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !businessId) return;
    let isMounted = true;
    setLoading(true);

    const timer = setTimeout(async () => {
      const list = await fetchCustomers(businessId, { search: search || undefined });
      if (isMounted) {
        setCustomers(list);
        setLoading(false);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, businessId, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all dark:bg-navy-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-navy-800">
          <div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              Select Customer
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Assign this sale to an existing client or choose Walk-in
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:hover:bg-navy-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="border-b border-gray-100 bg-gray-50/70 p-4 dark:border-navy-800 dark:bg-navy-950/40">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone, email..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-3 pl-9 text-xs font-medium text-navy-900 outline-hidden transition focus:border-brand-500 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreateCustomer();
              }}
              className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-brand-600 active:scale-95"
            >
              <UserPlus className="h-4 w-4" />
              <span>New</span>
            </button>
          </div>

          {/* Quick Choice: Walk-in */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                onSelectCustomer(null);
                onClose();
              }}
              className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left text-xs transition ${
                selectedCustomer === null
                  ? 'border-brand-500 bg-brand-50/50 font-bold text-brand-700 dark:border-brand-500 dark:bg-brand-950/30 dark:text-brand-300'
                  : 'border-dashed border-gray-300 bg-white hover:border-gray-400 dark:border-navy-700 dark:bg-navy-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-navy-800">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <div className="font-bold text-navy-900 dark:text-white">Walk-in Customer (General)</div>
                  <div className="text-[11px] text-gray-500">Standard direct cash or instant counter sale</div>
                </div>
              </div>
              {selectedCustomer === null && <Check className="h-4 w-4 text-brand-600" />}
            </button>
          </div>
        </div>

        {/* Customers list */}
        <div className="max-h-[360px] flex-1 divide-y divide-gray-100 overflow-y-auto p-2 dark:divide-navy-800">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400">Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                No registered customers found matching "{search}"
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateCustomer();
                }}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline dark:text-brand-400"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Register new customer now
              </button>
            </div>
          ) : (
            customers.map((c) => {
              const isSelected = selectedCustomer?.id === c.id;
              return (
                <div
                  key={c.id}
                  id={`cust-item-${c.id}`}
                  onClick={() => {
                    onSelectCustomer(c);
                    onClose();
                  }}
                  className={`flex cursor-pointer items-center justify-between rounded-xl p-3 transition ${
                    isSelected
                      ? 'bg-brand-50/70 text-brand-900 dark:bg-brand-950/40 dark:text-brand-200'
                      : 'hover:bg-gray-50 dark:hover:bg-navy-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-navy-900 dark:text-white">
                          {c.name}
                        </span>
                        {c.credit_limit > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded-sm bg-blue-50 px-1.5 py-0.2 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                            <CreditCard className="h-2.5 w-2.5" />
                            Credit Limit: {formatCurrency(c.credit_limit, currency)}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                        {c.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5" />
                            {c.phone}
                          </span>
                        )}
                        {c.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-2.5 w-2.5" />
                            {c.email}
                          </span>
                        )}
                        {c.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" />
                            {c.address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSelected && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 text-right dark:border-navy-800 dark:bg-navy-950">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
