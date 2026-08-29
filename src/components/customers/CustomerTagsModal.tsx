import { useState, useEffect, useCallback } from 'react';
import { Tag as TagIcon, X, Plus, Trash2, Edit2, Check } from 'lucide-react';
import type { Tag } from '@/types/database';
import { fetchTags, createTag, updateTag, deleteTag } from '@/services/customerService';
import { useToast } from '@/context/ToastContext';

interface CustomerTagsModalProps {
  isOpen: boolean;
  businessId: string;
  onClose: () => void;
  onTagsUpdated: () => void;
}

const PRESET_COLORS = [
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#14b8a6', // Teal
];

export function CustomerTagsModal({
  isOpen,
  businessId,
  onClose,
  onTagsUpdated,
}: CustomerTagsModalProps) {
  const { addToast } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);

  // New Tag Form
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Editing Tag
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTags(businessId);
      setTags(data);
    } catch (err) {
      console.error('Error loading tags:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (!isOpen || !businessId) return;
    loadTags();
  }, [isOpen, businessId, loadTags]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      const newTag = await createTag(businessId, name.trim(), color, description.trim() || undefined);
      setTags((prev) => [newTag, ...prev]);
      setName('');
      setDescription('');
      addToast({
        type: 'success',
        title: 'Tag Created',
        message: `Tag #${newTag.name} created.`,
      });
      onTagsUpdated();
    } catch (err) {
      console.error('Error creating tag:', err);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to create tag.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (t: Tag) => {
    setEditingTagId(t.id);
    setEditName(t.name);
    setEditColor(t.color || '#10b981');
  };

  const handleSaveEdit = async (tagId: string) => {
    if (!editName.trim()) return;
    try {
      const updated = await updateTag(tagId, editName.trim(), editColor);
      setTags((prev) => prev.map((t) => (t.id === tagId ? updated : t)));
      setEditingTagId(null);
      addToast({
        type: 'success',
        title: 'Tag Updated',
        message: `Tag #${updated.name} updated.`,
      });
      onTagsUpdated();
    } catch (err) {
      console.error('Error updating tag:', err);
    }
  };

  const handleDelete = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    try {
      await deleteTag(tagId);
      setTags((prev) => prev.filter((t) => t.id !== tagId));
      addToast({
        type: 'info',
        title: 'Tag Deleted',
        message: 'Tag removed from system.',
      });
      onTagsUpdated();
    } catch (err) {
      console.error('Error deleting tag:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all dark:bg-navy-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <TagIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Manage Customer Tags
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Organize and filter customers with custom labels
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Create Tag Form */}
          <form onSubmit={handleCreate} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 dark:border-navy-800 dark:bg-navy-950/40">
            <div className="text-xs font-bold text-navy-900 dark:text-white">
              Create New Tag
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tag label (e.g. coffee_enthusiast, weekly_regular)"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                />
              </div>

              {/* Color picker presets */}
              <div>
                <div className="text-[11px] text-gray-500 mb-1.5">Select Tag Color:</div>
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
                    title="Custom color"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-600 active:scale-95 disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Tag</span>
                </button>
              </div>
            </div>
          </form>

          {/* Tags List */}
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Existing Tags ({tags.length})
            </div>
            <div className="space-y-2">
              {tags.map((t) => {
                const isEditing = editingTagId === t.id;

                if (isEditing) {
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 rounded-xl border border-brand-300 bg-white p-2 dark:border-brand-800 dark:bg-navy-900"
                    >
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="h-7 w-7 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-navy-900 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(t.id)}
                        className="rounded-lg bg-emerald-500 p-1.5 text-white hover:bg-emerald-600"
                        title="Save changes"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTagId(null)}
                        className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:text-navy-900 dark:border-navy-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 hover:bg-gray-50/50 dark:border-navy-800 dark:bg-navy-900 dark:hover:bg-navy-800/50"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: t.color || '#10b981' }}
                      />
                      <span className="font-bold text-xs text-navy-900 dark:text-white">
                        #{t.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(t)}
                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:hover:bg-navy-800 dark:hover:text-white"
                        title="Edit Tag"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        className="rounded-lg p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                        title="Delete Tag"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {tags.length === 0 && !loading && (
                <div className="py-6 text-center text-xs text-gray-400">
                  No tags created yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
