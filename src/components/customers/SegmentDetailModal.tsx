import { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Download, 
  Users, 
  ExternalLink
} from 'lucide-react';
import type { CustomerSegment, Customer } from '@/types/database';
import { fetchCustomers, evaluateCustomerForSegment, exportCustomersToCSV } from '@/services/customerService';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/context/ToastContext';

interface SegmentDetailModalProps {
  isOpen: boolean;
  segment: CustomerSegment | null;
  businessId: string;
  currency?: string;
  onClose: () => void;
  onViewCustomerProfile: (customer: Customer) => void;
}

export function SegmentDetailModal({
  isOpen,
  segment,
  businessId,
  currency = 'TZS',
  onClose,
  onViewCustomerProfile,
}: SegmentDetailModalProps) {
  const { addToast } = useToast();
  const [matchedCustomers, setMatchedCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSegmentAudience = useCallback(async () => {
    if (!segment) return;
    setLoading(true);
    try {
      const res = await fetchCustomers({ businessId, pageSize: 200 });
      const filtered = (res.customers || []).filter((c) => evaluateCustomerForSegment(c, segment));
      setMatchedCustomers(filtered);
    } catch (err) {
      console.error('Error calculating segment members:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId, segment]);

  useEffect(() => {
    if (!isOpen || !segment) return;
    loadSegmentAudience();
  }, [isOpen, segment, loadSegmentAudience]);

  if (!isOpen || !segment) return null;

  const handleExportAudience = () => {
    try {
      const csv = exportCustomersToCSV(matchedCustomers, currency);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `segment_${segment.name.toLowerCase().replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast({
        type: 'success',
        title: 'Export Complete',
        message: `Exported ${matchedCustomers.length} members of "${segment.name}".`,
      });
    } catch (err) {
      console.error('Error exporting segment members:', err);
    }
  };

  const totalSegmentSpent = matchedCustomers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
  const totalSegmentOrders = matchedCustomers.reduce((sum, c) => sum + (c.total_orders || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all dark:bg-navy-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-white font-bold"
              style={{ backgroundColor: segment.color || '#10b981' }}
            >
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-navy-900 dark:text-white">
                  {segment.name}
                </h3>
                {segment.is_system && (
                  <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-navy-800 dark:text-gray-400">
                    System Default
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {segment.description || 'Targeted customer audience segment'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={matchedCustomers.length === 0}
              onClick={handleExportAudience}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-navy-900 hover:bg-gray-50 disabled:opacity-50 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:hover:bg-navy-800 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Segment Summary KPIs */}
        <div className="grid grid-cols-3 gap-4 border-b border-gray-100 bg-gray-50/50 p-4 dark:border-navy-800 dark:bg-navy-950/40">
          <div>
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Audience Size
            </div>
            <div className="text-lg font-bold text-navy-900 dark:text-white">
              {matchedCustomers.length} Customers
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Total Revenue Generated
            </div>
            <div className="text-lg font-bold text-navy-900 dark:text-white">
              {formatCurrency(totalSegmentSpent, currency)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Total Transactions
            </div>
            <div className="text-lg font-bold text-navy-900 dark:text-white">
              {totalSegmentOrders} Orders
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400">
              Evaluating segment membership rules...
            </div>
          ) : matchedCustomers.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No customers match this segment&apos;s criteria yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-navy-800">
              {matchedCustomers.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-3 transition hover:bg-gray-50/50 dark:hover:bg-navy-800/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onViewCustomerProfile(c);
                          }}
                          className="font-bold text-xs text-navy-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                        >
                          {c.name}
                        </button>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium capitalize text-gray-600 dark:bg-navy-800 dark:text-gray-300">
                          {c.customer_type}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {c.phone || c.email || c.city || 'No contact specified'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-xs text-navy-900 dark:text-white">
                        {formatCurrency(c.total_spent || 0, currency)}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {c.total_orders || 0} orders
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onViewCustomerProfile(c);
                      }}
                      className="rounded-xl border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800"
                      title="View Customer Profile"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
