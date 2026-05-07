import { useState } from 'react';

import { useCategory } from '../hooks/use-categories.js';
import { useAssignCategory, useUnassignCategory } from '../hooks/use-category-mutations.js';

import { CategoryBreadcrumb } from './category-breadcrumb.tsx';
import { CategoryTree } from './category-tree.tsx';

import type { CategoryResponse } from '@granit/taxonomy';
import type { ReactNode } from 'react';

export interface CategorySelectorLabels {
  readonly noCategory?: string;
  readonly choose?: string;
  readonly clear?: string;
  readonly close?: string;
  readonly dialogTitle?: string;
}

export interface CategorySelectorProps {
  readonly scope: string;
  readonly targetType: string;
  readonly targetId: string;
  /**
   * Currently assigned category id, if any. The component does not own the
   * read — apps pass it from the entity detail (per-target reads aren't
   * exposed on the canonical surface; the entity itself carries the id).
   * `null` / `undefined` renders the "No category" state.
   */
  readonly value: string | null | undefined;
  readonly canManage?: boolean;
  readonly labels?: CategorySelectorLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<CategorySelectorLabels> = {
  noCategory: 'No category',
  choose: 'Choose…',
  clear: 'Clear',
  close: 'Close',
  dialogTitle: 'Choose a category',
};

/**
 * Single-assignment category widget. Shows the current selection's
 * breadcrumb (or a "No category" state); the Choose / Clear buttons wire
 * `useAssignCategory` (idempotent — re-assignment updates in place
 * server-side) and `useUnassignCategory`. Selection happens via an inline
 * {@link CategoryTree} dialog scoped to the same `scope`.
 */
export function CategorySelector({
  scope,
  targetType,
  targetId,
  value,
  canManage = false,
  labels,
  className,
}: CategorySelectorProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const [open, setOpen] = useState(false);
  const target = { targetType, targetId };

  const detailQuery = useCategory(value ?? '');
  const assignCategory = useAssignCategory();
  const unassignCategory = useUnassignCategory();

  function handleSelect(category: CategoryResponse): void {
    assignCategory.mutate({ categoryId: category.id, target }, { onSuccess: () => setOpen(false) });
  }

  return (
    <div
      data-granit-category-selector=""
      data-granit-category-selector-scope={scope}
      className={className}
    >
      <div data-granit-category-selector-display="">
        {value && detailQuery.data ? (
          <CategoryBreadcrumb category={detailQuery.data} />
        ) : (
          <span data-granit-category-selector-empty="">{labelStrings.noCategory}</span>
        )}
        {canManage && (
          <span data-granit-category-selector-actions="">
            <button type="button" onClick={() => setOpen(true)}>
              {labelStrings.choose}
            </button>
            {value && (
              <button type="button" onClick={() => unassignCategory.mutate(target)}>
                {labelStrings.clear}
              </button>
            )}
          </span>
        )}
      </div>
      {open && (
        <div
          role="dialog"
          aria-label={labelStrings.dialogTitle}
          data-granit-category-selector-dialog=""
        >
          <header data-granit-category-selector-dialog-header="">
            <h3>{labelStrings.dialogTitle}</h3>
            <button type="button" onClick={() => setOpen(false)}>
              {labelStrings.close}
            </button>
          </header>
          <CategoryTree scope={scope} onSelect={handleSelect} />
        </div>
      )}
    </div>
  );
}
