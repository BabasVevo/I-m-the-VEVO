import { 
  Phone, 
  Mail, 
  MapPin, 
  ShoppingCart, 
  Eye, 
  Edit3
} from 'lucide-react';
import type { Customer } from '@/types/database';
import { formatCurrency, formatDate } from '@/lib/format';

interface CustomerGridProps {
  customers: Customer[];
  currency?: string;
  onViewProfile: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onNewSaleForCustomer: (customer: Customer) => void;
  onOpenCreditPayment: (customer: Customer) => void;
}

export function CustomerGrid({
  customers,
  currency = 'TZS',
  onViewProfile,
  onEditCustomer,
  onNewSaleForCustomer,
  onOpenCreditPayment,
}: CustomerGridProps) {
  if (customers.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {customers.map((c) => {
        const initials = c.name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'CU';

        const hasDebt = (c.current_balance || 0) > 0;

        return (
          <div
            key={c.id}
            className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-xs transition-all duration-200 hover:border-gray-200 hover:shadow-md dark:border-navy-800 dark:bg-navy-900 dark:hover:border-navy-700"
          >
            <div>
              {/* Header: Avatar, Name & Type */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                    {initials}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => onViewProfile(c)}
                      className="font-bold text-navy-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400 text-left line-clamp-1"
                    >
                      {c.name}
                    </button>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <span className="capitalize">{c.customer_type}</span>
                      <span>·</span>
                      <span className={`capitalize ${c.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {c.tags && c.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {c.tags.slice(0, 3).map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: `${t.color || '#6366f1'}15`,
                        color: t.color || '#6366f1',
                      }}
                    >
                      #{t.name}
                    </span>
                  ))}
                  {c.tags.length > 3 && (
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-1 py-0.5 text-[10px] text-gray-500 dark:bg-navy-800 dark:text-gray-400">
                      +{c.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Contact Info */}
              <div className="mt-4 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    <span>{c.city}, {c.country || 'Tanzania'}</span>
                  </div>
                )}
              </div>

              {/* Financial Stats Summary Box */}
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-gray-50/80 p-2.5 text-xs dark:bg-navy-950/60">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase">Total Spent</div>
                  <div className="font-bold text-navy-900 dark:text-white">
                    {formatCurrency(c.total_spent || 0, currency)}
                  </div>
                  <div className="text-[10px] text-gray-500">{c.total_orders || 0} orders</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase">Balance Due</div>
                  {hasDebt ? (
                    <button
                      type="button"
                      onClick={() => onOpenCreditPayment(c)}
                      className="text-left group/debt"
                    >
                      <div className="font-bold text-rose-600 dark:text-rose-400 group-hover/debt:underline">
                        {formatCurrency(c.current_balance, currency)}
                      </div>
                      <div className="text-[10px] text-rose-500 font-medium">Unpaid debt</div>
                    </button>
                  ) : (
                    <div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">0.00</div>
                      <div className="text-[10px] text-gray-400">Clear</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-navy-800">
              <span className="text-[11px] text-gray-400">
                {c.last_purchase_at ? `Last: ${formatDate(c.last_purchase_at)}` : 'No purchases yet'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onNewSaleForCustomer(c)}
                  className="inline-flex items-center gap-1 rounded-xl bg-brand-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-brand-600 active:scale-95"
                  title="New POS Sale"
                >
                  <ShoppingCart className="h-3 w-3" />
                  <span>Sell</span>
                </button>
                <button
                  type="button"
                  onClick={() => onViewProfile(c)}
                  className="rounded-xl border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800"
                  title="View Profile"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onEditCustomer(c)}
                  className="rounded-xl border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800"
                  title="Edit Customer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
