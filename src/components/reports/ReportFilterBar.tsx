import { useState } from 'react';
import type { ReportDatePreset, ReportFilterOptions } from '@/services/reportService';
import type { Branch } from '@/types/database';
import {
  Calendar,
  Building2,
  Download,
  Printer,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';

interface ReportFilterBarProps {
  filters: ReportFilterOptions;
  branches: Branch[];
  activeTab?: string;
  isSuperAdmin: boolean;
  userBranchId?: string | null;
  loading: boolean;
  onFilterChange: (newFilters: ReportFilterOptions) => void;
  onRefresh: () => void;
  onExportCsv: () => void;
  onPrint: () => void;
}

export function ReportFilterBar({
  filters,
  branches,
  isSuperAdmin,
  userBranchId,
  loading,
  onFilterChange,
  onRefresh,
  onExportCsv,
  onPrint,
}: ReportFilterBarProps) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [tempStart, setTempStart] = useState(filters.startDate || new Date().toISOString().slice(0, 10));
  const [tempEnd, setTempEnd] = useState(filters.endDate || new Date().toISOString().slice(0, 10));

  const presets: { id: ReportDatePreset; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'this_year', label: 'This Year' },
    { id: 'last_30_days', label: 'Last 30 Days' },
    { id: 'last_90_days', label: 'Last 90 Days' },
    { id: 'custom', label: 'Custom Range' },
  ];

  const handlePresetSelect = (preset: ReportDatePreset) => {
    if (preset === 'custom') {
      setShowCustomModal(true);
      return;
    }
    onFilterChange({
      ...filters,
      datePreset: preset,
    });
  };

  const handleApplyCustom = () => {
    onFilterChange({
      ...filters,
      datePreset: 'custom',
      startDate: tempStart,
      endDate: tempEnd,
    });
    setShowCustomModal(false);
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onFilterChange({
      ...filters,
      branchId: val === 'all' ? null : val,
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200/80 dark:bg-navy-900 dark:ring-navy-800 lg:flex-row lg:items-center lg:justify-between">
      {/* Date Presets Row */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
        <span className="flex items-center gap-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-navy-300">
          <Calendar className="h-3.5 w-3.5" />
          Period:
        </span>

        {presets.map((p) => {
          const isActive = filters.datePreset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePresetSelect(p.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm ring-1 ring-brand-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 dark:bg-navy-800 dark:text-navy-200 dark:hover:bg-navy-700 dark:hover:text-white'
              }`}
            >
              {p.label}
              {p.id === 'custom' && filters.datePreset === 'custom' && filters.startDate && (
                <span className="ml-1 text-[10px] opacity-80">
                  ({filters.startDate.slice(5)} to {filters.endDate?.slice(5)})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Branch & Actions */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-gray-100 dark:border-navy-800 lg:pt-0 lg:border-t-0">
        {/* Branch Selector */}
        <div className="relative flex items-center min-w-[160px]">
          <Building2 className="pointer-events-none absolute left-3 h-4 w-4 text-gray-700 dark:text-navy-300" />
          <select
            id="report-branch-filter"
            value={filters.branchId || 'all'}
            onChange={handleBranchChange}
            disabled={!isSuperAdmin && !!userBranchId}
            className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/80 py-1.5 pl-9 pr-8 text-xs font-medium text-navy-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-60 dark:border-navy-700 dark:bg-navy-800/80 dark:text-white dark:focus:bg-navy-800"
          >
            {isSuperAdmin && <option value="all">All Branches (Consolidated)</option>}
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-gray-700 dark:text-navy-300" />
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh Report Data"
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50 hover:text-navy-900 disabled:opacity-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200 dark:hover:bg-navy-700 dark:hover:text-white transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
        </button>

        {/* Print Button */}
        <button
          type="button"
          onClick={onPrint}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:text-navy-900 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200 dark:hover:bg-navy-700 dark:hover:text-white transition"
        >
          <Printer className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Print</span>
        </button>

        {/* Export CSV Button */}
        <button
          type="button"
          onClick={onExportCsv}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Custom Date Range Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-gray-200 dark:bg-navy-900 dark:ring-navy-800 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              Select Custom Date Range
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-navy-300">
              Choose start and end dates for your analytical reports.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-navy-200">
                  Start Date
                </label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-navy-900 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-navy-200">
                  End Date
                </label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-navy-900 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="rounded-xl border border-gray-300 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:text-navy-200 dark:hover:bg-navy-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCustom}
                className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
