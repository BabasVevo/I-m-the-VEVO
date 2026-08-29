import { useState } from 'react';
import { X, Tag, Plus, Trash2, Edit2, Check } from 'lucide-react';
import type { ExpenseCategory } from '@/types/database';
import { createExpenseCategory, updateExpenseCategory, deleteExpenseCategory } from '@/services/expenseService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface ExpenseCategoriesModalProps {
  isOpen: boolean;
  categories: ExpenseCategory[];
  onClose: () => void;
  onRefresh: () => void;
}

export function ExpenseCategoriesModal({
  isOpen,
  categories,
  onClose,
  onRefresh,
}: ExpenseCategoriesModalProps) {
  const { business } = useAuth();
  const { addToast } = useToast();
  const businessId = business?.id || 'demo-biz-1';

  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setLoading(true);
      await createExpenseCategory(businessId, {
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      setNewName('');
      setNewDesc('');
      addToast({
        type: 'success',
        title: 'Category Created',
        message: `Expense category created.`,
      });
      onRefresh();
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to create category.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      await updateExpenseCategory(id, { name: editingName.trim() });
      setEditingId(null);
      addToast({
        type: 'success',
        title: 'Category Updated',
        message: 'Category name updated.',
      });
      onRefresh();
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to update category.',
      });
    }
  };

  const handleDelete = async (cat: ExpenseCategory) => {
    if (window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      try {
        await deleteExpenseCategory(cat.id);
        addToast({
          type: 'success',
          title: 'Category Deleted',
          message: `${cat.name} removed.`,
        });
        onRefresh();
      } catch (err: unknown) {
        addToast({
          type: 'error',
          title: 'Error',
          message: err instanceof Error ? err.message : 'Failed to delete category.',
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs">
      <div
        id="expense-categories-modal"
        className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl transition-all dark:border-navy-800 dark:bg-navy-900 max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Expense Categories</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Organize overheads, operations, and cost centers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-navy-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="mt-4 flex gap-2">
          <input
            type="text"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New Category Name (e.g. Legal Fees)..."
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading || !newName.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>

        <div className="mt-4 flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-navy-800 border border-gray-200 rounded-xl dark:border-navy-800">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-3 text-xs hover:bg-gray-50/70 dark:hover:bg-navy-800/40 transition-colors"
            >
              {editingId === cat.id ? (
                <div className="flex flex-1 items-center gap-2 mr-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 rounded border border-brand-500 px-2 py-1 text-xs text-gray-900 dark:bg-navy-950 dark:text-white"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdate(cat.id)}
                    className="text-emerald-600 hover:text-emerald-700 p-1"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {cat.name}
                  </span>
                  {cat.description && (
                    <span className="text-2xs text-gray-500 dark:text-gray-400 block">
                      {cat.description}
                    </span>
                  )}
                </div>
              )}

              {editingId !== cat.id && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(cat.id);
                      setEditingName(cat.name);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="p-1 text-gray-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 dark:bg-navy-800 dark:text-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
