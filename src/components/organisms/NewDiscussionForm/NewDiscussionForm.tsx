/**
 * NewDiscussionForm
 * Form for creating new discussions with dynamic category selection
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CategoryValue, VisibilityScope, CreateDiscussionInput } from '@/types';
import { Select, SelectOption } from '@/components/atoms/Select';
import { CategoryBadge } from '@/components/atoms/CategoryBadge';
import { MarkdownEditor } from '@/components/molecules/MarkdownEditor';
import { TagInput } from '@/components/molecules/TagInput';
import { useTags } from '@/hooks/useTags';
import { useCategories } from '@/hooks/useCategories';

interface NewDiscussionFormProps {
  /** Callback when form is submitted */
  onSubmit: (input: CreateDiscussionInput) => Promise<void>;
  /** Callback when cancel is clicked */
  onCancel: () => void;
  /** Whether the form is submitting */
  isSubmitting?: boolean;
  /** Default category (overrides the first category from picklist) */
  defaultCategory?: CategoryValue;
}

/**
 * NewDiscussionForm component - form for creating new discussions.
 * Categories are dynamically loaded from ADO picklist configuration.
 */
export function NewDiscussionForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  defaultCategory,
}: NewDiscussionFormProps) {
  // Get dynamic categories from hook
  const {
    categories,
    defaultCategory: hookDefaultCategory,
    isLoading: categoriesLoading,
  } = useCategories();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<CategoryValue>(
    defaultCategory ?? hookDefaultCategory
  );
  const [visibility, setVisibility] = useState<VisibilityScope>(
    VisibilityScope.Project
  );
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update category when categories load (if not already set to a valid value)
  useEffect(() => {
    if (!categoriesLoading && categories.length > 0) {
      // If current category is not in the list, reset to default
      if (!categories.includes(category)) {
        setCategory(defaultCategory ?? categories[0]);
      }
    }
  }, [categories, categoriesLoading, category, defaultCategory]);

  // Fetch available tags for autocomplete
  const { availableTags, isLoading: tagsLoading } = useTags();

  // Visibility options
  const visibilityOptions: SelectOption[] = [
    {
      value: VisibilityScope.Project,
      label: 'This project only',
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      value: VisibilityScope.Organization,
      label: 'Entire organization',
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
      ),
    },
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
        {categoriesLoading ? (
          <div className="flex items-center gap-2 text-content-secondary">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="text-sm">Loading categories...</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`transition-opacity ${
                  category === cat
                    ? 'opacity-100'
                    : 'opacity-50 hover:opacity-75'
                }`}
              >
                <CategoryBadge category={cat} />
              </button>
            ))}
          </div>
        )}
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
          disabled={isSubmitting || categoriesLoading}
          className="rounded-ado bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create discussion'}
        </button>
      </div>
    </motion.form>
  );
}

export default NewDiscussionForm;
