/**
 * NewDiscussionForm
 * Form for creating new discussions
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Category, VisibilityScope, CreateDiscussionInput } from '@/types';
import { Select, SelectOption } from '@/components/atoms/Select';
import { CategoryBadge } from '@/components/atoms/CategoryBadge';
import { MarkdownEditor } from '@/components/molecules/MarkdownEditor';
import { TagInput } from '@/components/molecules/TagInput';
import { useTags } from '@/hooks/useTags';

interface NewDiscussionFormProps {
  /** Callback when form is submitted */
  onSubmit: (input: CreateDiscussionInput) => Promise<void>;
  /** Callback when cancel is clicked */
  onCancel: () => void;
  /** Whether the form is submitting */
  isSubmitting?: boolean;
  /** Default category */
  defaultCategory?: Category;
}

/**
 * NewDiscussionForm component - form for creating new discussions
 */
export function NewDiscussionForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  defaultCategory = Category.Announcements,
}: NewDiscussionFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [visibility, setVisibility] = useState<VisibilityScope>(
    VisibilityScope.Project
  );
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch available tags for autocomplete
  const { availableTags, isLoading: tagsLoading } = useTags();

  // Category options (MVP: only Announcements)
  const categoryOptions: SelectOption[] = [
    { value: Category.Announcements, label: 'Announcements' },
  ];

  // Visibility options
  const visibilityOptions: SelectOption[] = [
    { value: VisibilityScope.Project, label: 'This project only' },
    { value: VisibilityScope.Organization, label: 'Entire organization' },
  ];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!body.trim()) {
      newErrors.body = 'Body is required';
    } else if (body.length < 10) {
      newErrors.body = 'Body must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const input: CreateDiscussionInput = {
      title: title.trim(),
      body: body.trim(),
      category,
      visibility,
      tags: tags.length > 0 ? tags : undefined,
    };

    await onSubmit(input);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl"
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-content">
          Start a new discussion
        </h1>
        <p className="text-content-secondary">
          Share announcements, ideas, or questions with your team.
        </p>
      </div>

      {/* Category selection */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-content">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCategory(opt.value as Category)}
              className={`transition-opacity ${
                category === opt.value
                  ? 'opacity-100'
                  : 'opacity-50 hover:opacity-75'
              }`}
            >
              <CategoryBadge category={opt.value as Category} />
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-medium text-content"
        >
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          placeholder="Discussion title..."
          className={`w-full rounded-ado border bg-surface px-3 py-2 text-content placeholder:text-content-disabled focus:outline-none focus:ring-1 ${
            errors.title
              ? 'border-state-error focus:border-state-error focus:ring-state-error'
              : 'border-border focus:border-accent focus:ring-accent'
          }`}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-state-error">{errors.title}</p>
        )}
      </div>

      {/* Body */}
      <div className="mb-4">
        <label
          htmlFor="body"
          className="mb-2 block text-sm font-medium text-content"
        >
          Body
        </label>
        <MarkdownEditor
          id="body"
          value={body}
          onChange={setBody}
          disabled={isSubmitting}
          placeholder="Write your discussion content here..."
          rows={10}
          hasError={!!errors.body}
        />
        {errors.body && (
          <p className="mt-1 text-xs text-state-error">{errors.body}</p>
        )}
      </div>

      {/* Visibility */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-content">
          Visibility
        </label>
        <div className="w-64">
          <Select
            options={visibilityOptions}
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as VisibilityScope)}
            disabled={isSubmitting}
          />
        </div>
        <p className="mt-1 text-xs text-content-disabled">
          {visibility === VisibilityScope.Project
            ? 'Only members of this project can see this discussion.'
            : 'All members of the organization can see this discussion.'}
        </p>
      </div>

      {/* Tags */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-content">
          Tags
          <span className="ml-1 font-normal text-content-disabled">
            (optional, max 5)
          </span>
        </label>
        <TagInput
          tags={tags}
          onChange={setTags}
          availableTags={availableTags}
          maxTags={5}
          disabled={isSubmitting}
          placeholder="Add tags..."
          isLoading={tagsLoading}
        />
        <p className="mt-1 text-xs text-content-disabled">
          Add tags to help categorize and find this discussion.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-ado border border-border px-4 py-2 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-ado bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create discussion'}
        </button>
      </div>
    </motion.form>
  );
}

export default NewDiscussionForm;
