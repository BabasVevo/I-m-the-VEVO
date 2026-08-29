import { 
  MoreVertical, 
  Eye, 
  Edit3, 
  ShoppingCart, 
  CreditCard, 
  Archive, 
  Trash2, 
  Phone, 
  FileText
} from 'lucide-react';
import type { Customer } from '@/types/database';
import { formatCurrency, formatDate } from '@/lib/format';
import { useState } from 'react';

interface CustomerTableProps {
  customers: Customer[];
  currency?: string;
  onViewProfile: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onNewSaleForCustomer: (customer: Customer) => void;
  onOpenCreditPayment: (customer: Customer) => void;
  onArchiveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
  onAddNote: (customer: Customer) => void;
}

export function CustomerTable({
  customers,
  currency = 'TZS',
  onViewProfile,
  onEditCustomer,
  onNewSaleForCustomer,
  onOpenCreditPayment,
  onArchiveCustomer,
  onDeleteCustomer,
  onAddNote,
}: CustomerTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center dark:border-navy-800 dark:bg-navy-900">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 dark:bg-navy-800">
          <FileText className="h-6 w-6" />
        </div>
        <h4 className="mt-3 text-sm font-bold text-navy-900 dark:text-white">No customers found</h4>
        <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
          Try changing your search keywords or active filters, or register a new customer.
        </p>
      </div>
    );
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'vip':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            ★ VIP
          </span>
        );
      case 'wholesale':
        return (
          <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
            Wholesale
          </span>
        );
      case 'corporate':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            Corporate
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-navy-800 dark:text-gray-400">
            Regular
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
            Inactive
          </span>
        );
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Blocked
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs dark:border-navy-800 dark:bg-navy-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-100 bg-gray-50/80 font-semibold text-gray-500 uppercase tracking-wider dark:border-navy-800 dark:bg-navy-950/40 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-4 py-3.5">Customer Name & Contacts</th>
              <th scope="col" className="px-4 py-3.5">Type & Status</th>
              <th scope="col" className="px-4 py-3.5">Tags</th>
              <th scope="col" className="px-4 py-3.5 text-center">Orders</th>
              <th scope="col" className="px-4 py-3.5 text-right">Total Spent</th>
              <th scope="col" className="px-4 py-3.5 text-right">Balance Due</th>
              <th scope="col" className="px-4 py-3.5">Last Visit</th>
              <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
            {customers.map((c) => {
              const initials = c.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'CU';

              const hasDebt = (c.current_balance || 0) > 0;

              return (
                <tr
                  key={c.id}
                  className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-navy-800/40"
                >
                  {/* Customer Info */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 font-bold text-xs text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onViewProfile(c)}
                          className="font-bold text-navy-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400 text-left truncate block max-w-xs"
                        >
                          {c.name}
                        </button>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-gray-500 dark:text-gray-400">
                          {c.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {c.phone}
                            </span>
                          ) : null}
                          {c.city && <span>· {c.city}</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Type & Status */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div>{getTypeBadge(c.customer_type)}</div>
                      <div>{getStatusBadge(c.status)}</div>
                    </div>
                  </td>

                  {/* Tags */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {c.tags && c.tags.length > 0 ? (
                        c.tags.slice(0, 3).map((t) => (
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
                        ))
                      ) : (
                        <span className="text-[11px] text-gray-400">—</span>
                      )}
                      {c.tags && c.tags.length > 3 && (
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-1 py-0.5 text-[10px] text-gray-600 dark:bg-navy-800 dark:text-gray-400">
                          +{c.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Orders */}
                  <td className="px-4 py-3.5 text-center font-semibold text-navy-900 dark:text-white">
                    {c.total_orders || 0}
                  </td>

                  {/* Total Spent */}
                  <td className="px-4 py-3.5 text-right font-bold text-navy-900 dark:text-white whitespace-nowrap">
                    {formatCurrency(c.total_spent || 0, currency)}
                  </td>

                  {/* Current Balance (Debt) */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    {hasDebt ? (
                      <button
                        type="button"
                        onClick={() => onOpenCreditPayment(c)}
                        className="inline-flex flex-col items-end group/debt"
                        title="Click to record payment against debt"
                      >
                        <span className="font-bold text-rose-600 dark:text-rose-400 group-hover/debt:underline">
                          {formatCurrency(c.current_balance, currency)}
                        </span>
                        <span className="text-[10px] text-rose-500 font-medium">Unpaid debt</span>
                      </button>
                    ) : (
                      <span className="text-gray-400">0.00</span>
                    )}
                  </td>

                  {/* Last Purchase Date */}
                  <td className="px-4 py-3.5 text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {c.last_purchase_at ? formatDate(c.last_purchase_at) : 'Never'}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="relative inline-flex items-center gap-1">
                      {/* Direct POS button */}
                      <button
                        type="button"
                        onClick={() => onNewSaleForCustomer(c)}
                        className="inline-flex items-center gap-1 rounded-xl bg-brand-50 px-2.5 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100 dark:bg-brand-950/60 dark:text-brand-300 dark:hover:bg-brand-900/60"
                        title="Start New Sale in POS"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Sell</span>
                      </button>

                      {/* View Profile */}
                      <button
                        type="button"
                        onClick={() => onViewProfile(c)}
                        className="rounded-xl border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 hover:text-navy-900 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800"
                        title="View Full 360° Profile"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      {/* Dropdown Menu Toggle */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                          className="rounded-xl border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100 dark:border-navy-700 dark:text-gray-400 dark:hover:bg-navy-800"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>

                        {openMenuId === c.id && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 top-full z-30 mt-1.5 w-44 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl dark:border-navy-700 dark:bg-navy-800 text-left">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onViewProfile(c);
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-navy-700"
                              >
                                <Eye className="h-3.5 w-3.5 text-gray-400" />
                                <span>View Profile</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onEditCustomer(c);
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-navy-700"
                              >
                                <Edit3 className="h-3.5 w-3.5 text-gray-400" />
                                <span>Edit Details</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onAddNote(c);
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-navy-700"
                              >
                                <FileText className="h-3.5 w-3.5 text-gray-400" />
                                <span>Add Quick Note</span>
                              </button>
                              {hasDebt && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onOpenCreditPayment(c);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                >
                                  <CreditCard className="h-3.5 w-3.5" />
                                  <span>Record Payment</span>
                                </button>
                              )}
                              <div className="my-1 border-t border-gray-100 dark:border-navy-700" />
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onArchiveCustomer(c);
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
                              >
                                <Archive className="h-3.5 w-3.5" />
                                <span>{c.status === 'archived' ? 'Restore' : 'Archive'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onDeleteCustomer(c);
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
