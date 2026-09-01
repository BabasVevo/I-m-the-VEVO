import { useState, useEffect } from 'react';
import { UserCircle, X, Sliders, AlertCircle } from 'lucide-react';
import type { CustomerSegment, SegmentRules, SegmentRuleCondition, CustomerType, Tag, Branch } from '@/types/database';
import { createSegment, updateSegment } from '@/services/customerService';
import { useToast } from '@/context/ToastContext';

/** Convert the flat editor rule fields to the stored condition-array format. */
function rulesToConditions(rules: SegmentRules): SegmentRuleCondition[] {
  const conditions: SegmentRuleCondition[] = [];
  if (rules.min_total_spent !== undefined) conditions.push({ field: 'total_spent', operator: 'greater_or_equal', value: rules.min_total_spent });
  if (rules.max_total_spent !== undefined) conditions.push({ field: 'total_spent', operator: 'less_or_equal', value: rules.max_total_spent });
  if (rules.min_total_orders !== undefined) conditions.push({ field: 'total_orders', operator: 'greater_or_equal', value: rules.min_total_orders });
  if (rules.max_total_orders !== undefined) conditions.push({ field: 'total_orders', operator: 'less_or_equal', value: rules.max_total_orders });
  if (rules.days_since_last_purchase !== undefined) conditions.push({ field: 'last_purchase_days', operator: 'greater_or_equal', value: rules.days_since_last_purchase });
  if (rules.has_outstanding_balance !== undefined) {
    conditions.push({
      field: 'credit_balance',
      operator: rules.has_outstanding_balance ? 'greater_than' : 'equals',
      value: rules.has_outstanding_balance ? 0 : 0,
    });
  }
  if (rules.customer_types && rules.customer_types.length > 0) conditions.push({ field: 'customer_type', operator: 'in', value: rules.customer_types });
  if (rules.tag_ids) {
    rules.tag_ids.forEach((tagId) => conditions.push({ field: 'has_tag', operator: 'equals', value: tagId }));
  }
  if (rules.branch_id) conditions.push({ field: 'assigned_branch_id', operator: 'equals', value: rules.branch_id });
  return conditions;
}

/** Parse stored conditions back into the flat editor rule fields. */
function conditionsToRules(conditions: SegmentRuleCondition[] | null | undefined): SegmentRules {
  const rules: SegmentRules = {};
  const tagIds: string[] = [];
  const customerTypes: string[] = [];
  (conditions || []).forEach((c) => {
    if (c.field === 'total_spent') {
      if (c.operator === 'greater_or_equal') rules.min_total_spent = Number(c.value);
      else if (c.operator === 'less_or_equal') rules.max_total_spent = Number(c.value);
    } else if (c.field === 'total_orders') {
      if (c.operator === 'greater_or_equal') rules.min_total_orders = Number(c.value);
      else if (c.operator === 'less_or_equal') rules.max_total_orders = Number(c.value);
    } else if (c.field === 'last_purchase_days' && c.operator === 'greater_or_equal') {
      rules.days_since_last_purchase = Number(c.value);
    } else if (c.field === 'credit_balance') {
      if (c.operator === 'greater_than') rules.has_outstanding_balance = true;
      else if (c.operator === 'equals') rules.has_outstanding_balance = false;
    } else if (c.field === 'customer_type') {
      if (Array.isArray(c.value)) customerTypes.push(...(c.value as string[]).map(String));
      else customerTypes.push(String(c.value));
    } else if (c.field === 'has_tag') {
      tagIds.push(String(c.value));
    } else if (c.field === 'assigned_branch_id') {
      rules.branch_id = String(c.value);
    }
  });
  if (tagIds.length > 0) rules.tag_ids = tagIds;
  if (customerTypes.length > 0) rules.customer_types = customerTypes;
  return rules;
}

interface SegmentCreateEditModalProps {
  isOpen: boolean;
  businessId: string;
  segmentToEdit?: CustomerSegment | null;
  tags: Tag[];
  branches?: Branch[];
  onSaved: () => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#10b981', // Green
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#14b8a6', // Teal
];

export function SegmentCreateEditModal({
  isOpen,
  businessId,
  segmentToEdit,
  tags,
  onSaved,
  onClose,
}: SegmentCreateEditModalProps) {
  const { addToast } = useToast();
  const isEditing = Boolean(segmentToEdit);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#10b981');

  // Rules
  const [minSpend, setMinSpend] = useState('');
  const [maxSpend, setMaxSpend] = useState('');
  const [minOrders, setMinOrders] = useState('');
  const [maxOrders, setMaxOrders] = useState('');
  const [daysInactive, setDaysInactive] = useState('');
  const [hasDebt, setHasDebt] = useState<boolean | null>(null);
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (segmentToEdit) {
      setName(segmentToEdit.name);
      setDescription(segmentToEdit.description || '');
      setColor(segmentToEdit.color || '#10b981');

      const r = conditionsToRules(segmentToEdit.rules);
      setMinSpend(r.min_total_spent !== undefined ? String(r.min_total_spent) : '');
      setMaxSpend(r.max_total_spent !== undefined ? String(r.max_total_spent) : '');
      setMinOrders(r.min_total_orders !== undefined ? String(r.min_total_orders) : '');
      setMaxOrders(r.max_total_orders !== undefined ? String(r.max_total_orders) : '');
      setDaysInactive(r.days_since_last_purchase !== undefined ? String(r.days_since_last_purchase) : '');
      setHasDebt(r.has_outstanding_balance !== undefined ? r.has_outstanding_balance : null);
      setCustomerTypes((r.customer_types || []) as CustomerType[]);
      setSelectedTagIds(r.tag_ids || []);
      setSelectedBranchId(r.branch_id || '');
    } else {
      setName('');
      setDescription('');
      setColor('#10b981');
      setMinSpend('');
      setMaxSpend('');
      setMinOrders('');
      setMaxOrders('');
      setDaysInactive('');
      setHasDebt(null);
      setCustomerTypes([]);
      setSelectedTagIds([]);
      setSelectedBranchId('');
    }
    setError(null);
  }, [segmentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleToggleCustomerType = (type: CustomerType) => {
    setCustomerTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this segment.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const rules: SegmentRules = {};
      if (minSpend) rules.min_total_spent = parseFloat(minSpend);
      if (maxSpend) rules.max_total_spent = parseFloat(maxSpend);
      if (minOrders) rules.min_total_orders = parseInt(minOrders, 10);
      if (maxOrders) rules.max_total_orders = parseInt(maxOrders, 10);
      if (daysInactive) rules.days_since_last_purchase = parseInt(daysInactive, 10);
      if (hasDebt !== null) rules.has_outstanding_balance = hasDebt;
      if (customerTypes.length > 0) rules.customer_types = customerTypes;
      if (selectedTagIds.length > 0) rules.tag_ids = selectedTagIds;
      if (selectedBranchId) rules.branch_id = selectedBranchId;

      const conditions = rulesToConditions(rules);

      if (isEditing && segmentToEdit) {
        await updateSegment(segmentToEdit.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          rules: conditions,
        });

        addToast({
          type: 'success',
          title: 'Segment Updated',
          message: `Customer segment "${name}" updated.`,
        });
      } else {
        await createSegment(businessId, {
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          rules: conditions,
          segment_type: 'custom',
          is_active: true,
          conditions_logic: 'AND',
        });

        addToast({
          type: 'success',
          title: 'Segment Created',
          message: `Customer segment "${name}" created.`,
        });
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      console.error('Error saving segment:', err);
      setError((err as Error).message || 'Failed to save segment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all dark:bg-navy-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <UserCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                {isEditing ? 'Edit Customer Segment' : 'Create Custom Segment'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Define automatic grouping rules based on purchase habits and demographics
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Segment Identity */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Segment Title <span className="text-brand-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. VIP Coffee Connoisseurs, Weekend Shoppers..."
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Description / Purpose
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Customers with high purchase frequency for loyalty campaigns"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Segment Color:
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-6 w-6 rounded-full transition ${color === c ? 'scale-125 ring-2 ring-brand-500 ring-offset-2' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-6 w-6 rounded-md border-0 p-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Rule Criteria */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-navy-800 dark:bg-navy-950/40 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-navy-900 dark:text-white">
                <Sliders className="h-4 w-4 text-brand-500" />
                <span>Qualification Criteria (Filters)</span>
              </div>

              {/* Total Spend Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                    Min Total Spend (BIF)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minSpend}
                    onChange={(e) => setMinSpend(e.target.value)}
                    placeholder="e.g. 500000"
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2 text-xs text-navy-900 focus:border-brand-500 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                    Max Total Spend (BIF)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxSpend}
                    onChange={(e) => setMaxSpend(e.target.value)}
                    placeholder="Unlimited"
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2 text-xs text-navy-900 focus:border-brand-500 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Total Orders Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                    Min Order Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minOrders}
                    onChange={(e) => setMinOrders(e.target.value)}
                    placeholder="e.g. 5"
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2 text-xs text-navy-900 focus:border-brand-500 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                    Max Order Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxOrders}
                    onChange={(e) => setMaxOrders(e.target.value)}
                    placeholder="Unlimited"
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2 text-xs text-navy-900 focus:border-brand-500 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Inactivity Threshold */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                  Days Inactive (Lapsed Customers)
                </label>
                <input
                  type="number"
                  min="0"
                  value={daysInactive}
                  onChange={(e) => setDaysInactive(e.target.value)}
                  placeholder="e.g. 45 days without a purchase"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2 text-xs text-navy-900 focus:border-brand-500 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                />
              </div>

              {/* Customer Types Match */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Match Customer Types:
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['regular', 'vip', 'wholesale', 'corporate'] as CustomerType[]).map((type) => {
                    const isSelected = customerTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleToggleCustomerType(type)}
                        className={`rounded-xl border px-3 py-1 text-xs font-semibold capitalize transition ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-950 dark:text-brand-300'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Has Outstanding Balance Toggle */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Outstanding Debt Status:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHasDebt(null)}
                    className={`rounded-xl border px-3 py-1 text-xs font-medium ${hasDebt === null ? 'border-brand-500 bg-brand-50 text-brand-700 font-bold dark:bg-brand-950 dark:text-brand-300' : 'border-gray-200 bg-white text-gray-600 dark:border-navy-700 dark:bg-navy-900'}`}
                  >
                    Any
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasDebt(true)}
                    className={`rounded-xl border px-3 py-1 text-xs font-medium ${hasDebt === true ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold dark:bg-rose-950 dark:text-rose-300' : 'border-gray-200 bg-white text-gray-600 dark:border-navy-700 dark:bg-navy-900'}`}
                  >
                    Must Have Unpaid Debt
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasDebt(false)}
                    className={`rounded-xl border px-3 py-1 text-xs font-medium ${hasDebt === false ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold dark:bg-emerald-950 dark:text-emerald-300' : 'border-gray-200 bg-white text-gray-600 dark:border-navy-700 dark:bg-navy-900'}`}
                  >
                    Zero Debt Only
                  </button>
                </div>
              </div>

              {/* Tag Match */}
              {tags.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Must Have Tag(s):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => {
                      const isSelected = selectedTagIds.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleToggleTag(t.id)}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                            isSelected
                              ? 'border-brand-500 bg-brand-50 text-brand-700 font-bold dark:bg-brand-950 dark:text-brand-300'
                              : 'border-gray-200 bg-white text-gray-600 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300'
                          }`}
                        >
                          #{t.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-navy-800 dark:bg-navy-950/40">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-600 active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEditing ? 'Save Segment Changes' : 'Create Segment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
