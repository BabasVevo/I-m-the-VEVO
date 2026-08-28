import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Store } from 'lucide-react';
import type { Branch } from '@/types/database';

interface BranchScopeSelectorProps {
  branches: Branch[];
  selectedBranchId: string | null; // null = all branches
  onSelectBranch: (branchId: string | null) => void;
  userAssignedBranchId?: string | null;
  canViewAllBranches: boolean;
  loading?: boolean;
}

export function BranchScopeSelector({
  branches,
  selectedBranchId,
  onSelectBranch,
  userAssignedBranchId,
  canViewAllBranches,
  loading = false,
}: BranchScopeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  // If user cannot view all branches and is restricted to their branch
  if (!canViewAllBranches && userAssignedBranchId) {
    const assigned = branches.find((b) => b.id === userAssignedBranchId);
    return (
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-navy-900 shadow-sm dark:border-navy-800 dark:bg-navy-900 dark:text-white">
        <Store className="h-4 w-4 text-brand-600 dark:text-brand-400" />
        <span className="truncate">{assigned ? assigned.name : 'Assigned Branch'}</span>
        <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-navy-800 dark:text-navy-400">
          Locked
        </span>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        disabled={loading}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-navy-900 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-navy-800 dark:bg-navy-900 dark:text-white dark:hover:bg-navy-800"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Building2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
        <span className="font-semibold text-navy-900 dark:text-white">
          {selectedBranch ? selectedBranch.name : 'All Branches'}
        </span>
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          {selectedBranch ? 'Single' : `${branches.length} Locations`}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-2 w-72 origin-top-right rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 dark:border-navy-700 dark:bg-navy-900">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-navy-400">
            Scope Filter
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectBranch(null);
              setIsOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              selectedBranchId === null
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300'
                : 'text-navy-700 hover:bg-gray-100 dark:text-navy-200 dark:hover:bg-navy-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 dark:bg-navy-800">
                <Building2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="text-left">
                <p className="font-semibold">All Branches Combined</p>
                <p className="text-xs text-gray-400 dark:text-navy-400">Aggregated enterprise metrics</p>
              </div>
            </div>
            {selectedBranchId === null && <Check className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
          </button>

          <div className="my-1 border-t border-gray-100 dark:border-navy-800" />

          <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-navy-400">
            Specific Branches ({branches.length})
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {branches.map((branch) => {
              const isSelected = selectedBranchId === branch.id;
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => {
                    onSelectBranch(branch.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                    isSelected
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300'
                      : 'text-navy-700 hover:bg-gray-100 dark:text-navy-200 dark:hover:bg-navy-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 dark:bg-navy-800">
                      <Store className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="font-medium">{branch.name}</p>
                      {branch.address && (
                        <p className="text-xs text-gray-400 dark:text-navy-400 truncate max-w-[170px]">
                          {branch.address}
                        </p>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
