import { Search, LayoutGrid, List, X, ArrowUpDown, Tag as TagIcon } from 'lucide-react';
import type { Tag, Branch, CustomerSegment } from '@/types/database';

interface CustomerFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  customerType: string;
  onCustomerTypeChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  selectedSegmentId: string;
  onSegmentChange: (val: string) => void;
  selectedTagId: string;
  onTagChange: (val: string) => void;
  selectedBranchId: string;
  onBranchChange: (val: string) => void;
  sortBy: string;
  onSortByChange: (val: string) => void;
  sortOrder: 'asc' | 'desc';
  onToggleSortOrder: () => void;
  viewMode: 'table' | 'grid';
  onViewModeChange: (val: 'table' | 'grid') => void;
  hasDebtOnly: boolean;
  onToggleHasDebtOnly: () => void;
  tags: Tag[];
  branches: Branch[];
  segments: CustomerSegment[];
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  totalFiltered: number;
  totalAll: number;
  onOpenCreate: () => void;
  onOpenExport: () => void;
  onOpenImport: () => void;
  onOpenTagsModal: () => void;
}

export function CustomerFilterBar({
  search,
  onSearchChange,
  customerType,
  onCustomerTypeChange,
  status,
  onStatusChange,
  selectedSegmentId,
  onSegmentChange,
  selectedTagId,
  onTagChange,
  selectedBranchId,
  onBranchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onToggleSortOrder,
  viewMode,
  onViewModeChange,
  hasDebtOnly,
  onToggleHasDebtOnly,
  tags,
  branches,
  segments,
  onResetFilters,
  hasActiveFilters,
  totalFiltered,
  totalAll,
  onOpenCreate,
  onOpenExport,
  onOpenImport,
  onOpenTagsModal,
}: CustomerFilterBarProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs dark:border-navy-800 dark:bg-navy-900">
      {/* Top row: search + action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by customer name, phone, email, notes, city..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pr-4 pl-10 text-xs font-medium text-navy-900 placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-hidden dark:border-navy-700 dark:bg-navy-950/50 dark:text-white dark:focus:border-brand-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-navy-900 dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={onOpenTagsModal}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:bg-navy-700"
            title="Manage Customer Tags"
          >
            <TagIcon className="h-3.5 w-3.5 text-brand-500" />
            <span className="hidden md:inline">Tags</span>
          </button>

          <button
            type="button"
            onClick={onOpenImport}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:bg-navy-700"
            title="Import Customers from CSV"
          >
            <Upload className="h-3.5 w-3.5 text-gray-500" />
            <span className="hidden md:inline">Import</span>
          </button>

          <button
            type="button"
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:bg-navy-700"
            title="Export Customers to CSV"
          >
            <Download className="h-3.5 w-3.5 text-gray-500" />
            <span className="hidden md:inline">Export</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-0.5 dark:border-navy-700 dark:bg-navy-950">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`rounded-lg p-1.5 text-xs font-medium transition ${
                viewMode === 'table'
                  ? 'bg-white text-brand-600 shadow-xs dark:bg-navy-800 dark:text-brand-400'
                  : 'text-gray-500 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`rounded-lg p-1.5 text-xs font-medium transition ${
                viewMode === 'grid'
                  ? 'bg-white text-brand-600 shadow-xs dark:bg-navy-800 dark:text-brand-400'
                  : 'text-gray-500 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white'
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-600 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Filter controls row */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-navy-800">
        {/* Customer Type */}
        <select
          value={customerType}
          onChange={(e) => onCustomerTypeChange(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50/50 py-1.5 px-3 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950/50 dark:text-white"
        >
          <option value="all">All Types</option>
          <option value="regular">Regular</option>
          <option value="vip">VIP</option>
          <option value="wholesale">Wholesale</option>
          <option value="corporate">Corporate</option>
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50/50 py-1.5 px-3 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950/50 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blocked">Blocked</option>
          <option value="archived">Archived</option>
        </select>

        {/* Segment */}
        {segments.length > 0 && (
          <select
            value={selectedSegmentId}
            onChange={(e) => onSegmentChange(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50/50 py-1.5 px-3 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950/50 dark:text-white"
          >
            <option value="all">All Segments</option>
            {segments.map((seg) => (
              <option key={seg.id} value={seg.id}>
                {seg.name} ({seg.customer_count || 0})
              </option>
            ))}
          </select>
        )}

        {/* Tag filter */}
        {tags.length > 0 && (
          <select
            value={selectedTagId}
            onChange={(e) => onTagChange(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50/50 py-1.5 px-3 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950/50 dark:text-white"
          >
            <option value="all">All Tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                #{t.name}
              </option>
            ))}
          </select>
        )}

        {/* Branch filter */}
        {branches.length > 1 && (
          <select
            value={selectedBranchId}
            onChange={(e) => onBranchChange(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50/50 py-1.5 px-3 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950/50 dark:text-white"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}

        {/* Has Debt Toggle */}
        <button
          type="button"
          onClick={onToggleHasDebtOnly}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
            hasDebtOnly
              ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
              : 'border-gray-200 bg-gray-50/50 text-gray-700 hover:bg-gray-100 dark:border-navy-700 dark:bg-navy-950/50 dark:text-gray-300'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${hasDebtOnly ? 'bg-rose-500' : 'bg-gray-400'}`} />
          <span>Has Unpaid Balance</span>
        </button>

        {/* Sort select */}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50/50 py-1.5 px-2.5 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950/50 dark:text-white"
          >
            <option value="created_at">Date Joined</option>
            <option value="name">Name</option>
            <option value="total_spent">Total Spent</option>
            <option value="total_orders">Total Orders</option>
            <option value="current_balance">Outstanding Balance</option>
            <option value="last_purchase_at">Last Visit</option>
          </select>

          <button
            type="button"
            onClick={onToggleSortOrder}
            className="rounded-xl border border-gray-200 bg-gray-50/50 p-1.5 text-gray-600 hover:bg-gray-100 dark:border-navy-700 dark:bg-navy-950/50 dark:text-gray-300"
            title={sortOrder === 'asc' ? 'Ascending (Click for Descending)' : 'Descending (Click for Ascending)'}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Reset button if active */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            <X className="h-3 w-3" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* Counter summary */}
      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
        <span>
          Showing <strong className="text-navy-900 dark:text-white">{totalFiltered}</strong> of {totalAll} customers
        </span>
      </div>
    </div>
  );
}
