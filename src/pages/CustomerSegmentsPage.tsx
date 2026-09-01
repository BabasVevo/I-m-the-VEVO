import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  ArrowLeft, 
  Users, 
  Edit3, 
  Trash2, 
  Eye, 
  Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { CustomerSegment, Customer, Tag, Branch } from '@/types/database';
import { 
  fetchSegments, 
  fetchCustomers, 
  fetchTags, 
  deleteSegment, 
  evaluateCustomerForSegment
} from '@/services/customerService';
import { fetchBranches } from '@/services/dashboardService';
import { formatCurrency } from '@/lib/format';
import { SegmentCreateEditModal } from '@/components/customers/SegmentCreateEditModal';
import { SegmentDetailModal } from '@/components/customers/SegmentDetailModal';
import { CustomerDetailDrawer } from '@/components/customers/CustomerDetailDrawer';

export function CustomerSegmentsPage() {
  const navigate = useNavigate();
  const { business } = useAuth();
  const { addToast } = useToast();

  const businessId = business?.id || 'demo-biz-1';
  const currency = business?.currency || 'BIF';

  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateEditModalOpen, setIsCreateEditModalOpen] = useState(false);
  const [segmentToEdit, setSegmentToEdit] = useState<CustomerSegment | null>(null);

  const [selectedSegmentForView, setSelectedSegmentForView] = useState<CustomerSegment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [customerForDrawer, setCustomerForDrawer] = useState<Customer | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [segs, custRes, tagList, branchList] = await Promise.all([
        fetchSegments(businessId),
        fetchCustomers({ businessId, pageSize: 500 }),
        fetchTags(businessId),
        fetchBranches(businessId),
      ]);

      setSegments(segs || []);
      setAllCustomers(custRes.customers || []);
      setTags(tagList || []);
      setBranches(branchList || []);
    } catch (err) {
      console.error('Error loading segments:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreateModal = () => {
    setSegmentToEdit(null);
    setIsCreateEditModalOpen(true);
  };

  const handleOpenEditModal = (seg: CustomerSegment) => {
    setSegmentToEdit(seg);
    setIsCreateEditModalOpen(true);
  };

  const handleViewSegmentMembers = (seg: CustomerSegment) => {
    setSelectedSegmentForView(seg);
    setIsViewModalOpen(true);
  };

  const handleDeleteSegment = async (segmentId: string, segmentName: string) => {
    if (!confirm(`Are you sure you want to delete the segment "${segmentName}"?`)) return;
    try {
      await deleteSegment(segmentId);
      addToast({
        type: 'info',
        title: 'Segment Deleted',
        message: `Segment "${segmentName}" deleted.`,
      });
      loadData();
    } catch (err) {
      console.error('Error deleting segment:', err);
    }
  };

  return (
    <div className="min-h-screen space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Customers Directory</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
              Customer Segments & Insights
            </h1>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {segments.length} Segments
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Automatically group your customers into actionable cohorts based on lifetime value, purchase cadence, debt, and behavior.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-600 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Create Custom Segment</span>
        </button>
      </div>

      {/* Segments Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {segments.map((seg) => {
          const matchingAudience = allCustomers.filter((c) => evaluateCustomerForSegment(c, seg));
          const totalSpend = matchingAudience.reduce((sum, c) => sum + (c.total_spent || 0), 0);
          const totalOrders = matchingAudience.reduce((sum, c) => sum + (c.total_orders || 0), 0);
          const avgSpend = matchingAudience.length > 0 ? Math.round(totalSpend / matchingAudience.length) : 0;

          return (
            <div
              key={seg.id}
              className="flex flex-col justify-between rounded-3xl border border-gray-100 bg-white p-6 shadow-xs transition hover:border-gray-200 hover:shadow-md dark:border-navy-800 dark:bg-navy-900 dark:hover:border-navy-700"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white font-bold"
                      style={{ backgroundColor: seg.color || '#10b981' }}
                    >
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-navy-900 dark:text-white line-clamp-1">
                        {seg.name}
                      </h3>
                      {seg.is_system && (
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          System Rule
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {!seg.is_system && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(seg)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:hover:bg-navy-800 dark:hover:text-white"
                          title="Edit Rules"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSegment(seg.id, seg.name)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                          title="Delete Segment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {seg.description || 'Targeted customer segment based on purchase behavior.'}
                </p>

                {/* Audience Size Pill */}
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-gray-50/80 p-3.5 dark:bg-navy-950/60">
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Audience Size
                    </div>
                    <div className="text-xl font-bold text-navy-900 dark:text-white">
                      {matchingAudience.length}{' '}
                      <span className="text-xs font-normal text-gray-500">customers</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Total Revenue
                    </div>
                    <div className="text-sm font-bold text-navy-900 dark:text-white">
                      {formatCurrency(totalSpend, currency)}
                    </div>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                  <div>• Avg LTV: <strong>{formatCurrency(avgSpend, currency)}</strong></div>
                  <div>• Total Orders: <strong>{totalOrders}</strong></div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-6 flex items-center gap-2 border-t border-gray-100 pt-4 dark:border-navy-800">
                <button
                  type="button"
                  onClick={() => handleViewSegmentMembers(seg)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-50 py-2.5 text-xs font-bold text-brand-700 hover:bg-brand-100 dark:bg-brand-950/60 dark:text-brand-300 dark:hover:bg-brand-900/60 transition"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>View Customer List</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* MODALS */}
      <SegmentCreateEditModal
        isOpen={isCreateEditModalOpen}
        businessId={businessId}
        segmentToEdit={segmentToEdit}
        tags={tags}
        branches={branches}
        onSaved={loadData}
        onClose={() => {
          setIsCreateEditModalOpen(false);
          setSegmentToEdit(null);
        }}
      />

      <SegmentDetailModal
        isOpen={isViewModalOpen}
        segment={selectedSegmentForView}
        businessId={businessId}
        currency={currency}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedSegmentForView(null);
        }}
        onViewCustomerProfile={(c) => {
          setCustomerForDrawer(c);
          setIsDrawerOpen(true);
        }}
      />

      <CustomerDetailDrawer
        customer={customerForDrawer}
        isOpen={isDrawerOpen}
        businessId={businessId}
        currency={currency}
        segments={segments}
        onClose={() => {
          setIsDrawerOpen(false);
          setCustomerForDrawer(null);
        }}
        onEditCustomer={() => {}}
        onNewSale={(c) => navigate('/pos', { state: { selectedCustomerId: c.id, selectedCustomer: c } })}
        onOpenCreditPayment={() => {}}
        onArchiveCustomer={() => {}}
      />
    </div>
  );
}
