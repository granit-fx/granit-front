import { useState } from 'react';

import { useCategories } from '../hooks/use-categories';
import {
  useCreateCategory,
  useDeleteCategory,
  useMoveCategory,
  useUpdateCategory,
} from '../hooks/use-category-mutations';

import type { CategoryResponse } from '@granit/taxonomy';
import type { ReactNode } from 'react';

export interface CategoryTreeLabels {
  readonly add?: string;
  readonly rename?: string;
  readonly move?: string;
  readonly delete?: string;
  readonly deleteConfirm?: string;
  readonly moveDialogTitle?: string;
  readonly movePromote?: string;
  readonly movePrompt?: string;
  readonly empty?: string;
  readonly loading?: string;
  readonly error422HasDescendants?: string;
  readonly error422HasAssignments?: string;
  readonly error422CrossScope?: string;
  readonly error422Cycle?: string;
}

export interface CategoryTreeProps {
  readonly scope: string;
  readonly canManage?: boolean;
  /** Selection callback for read-only browsers (e.g. inside the selector). */
  readonly onSelect?: (category: CategoryResponse) => void;
  readonly labels?: CategoryTreeLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<CategoryTreeLabels> = {
  add: '+',
  rename: 'Rename',
  move: 'Move',
  delete: 'Delete',
  deleteConfirm:
    'Delete this category? This cannot be undone. Categories with descendants or active assignments cannot be deleted.',
  moveDialogTitle: 'Move category',
  movePromote: '(promote to root)',
  movePrompt: 'Paste the new parent category id, or leave empty to promote to root.',
  empty: 'No categories.',
  loading: 'Loading…',
  error422HasDescendants: 'Cannot delete: this category has descendants.',
  error422HasAssignments: 'Cannot delete: this category has active assignments.',
  error422CrossScope: 'Cannot move across scopes.',
  error422Cycle: 'Cannot move a category under one of its descendants.',
};

function extractProblemDetail(err: unknown): string {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  if (detail) return detail;
  return err instanceof Error ? err.message : 'Request failed.';
}

interface CategoryNodeProps {
  readonly scope: string;
  readonly category: CategoryResponse;
  readonly canManage: boolean;
  readonly labels: Required<CategoryTreeLabels>;
  readonly onSelect?: (category: CategoryResponse) => void;
}

function CategoryNode({
  scope,
  category,
  canManage,
  labels,
  onSelect,
}: Readonly<CategoryNodeProps>): ReactNode {
  const [expanded, setExpanded] = useState(false);
  const childrenQuery = useCategories({ scope, parentId: category.id }, { enabled: expanded });
  const createCategory = useCreateCategory(scope);
  const updateCategory = useUpdateCategory(scope);
  const moveCategory = useMoveCategory(scope);
  const deleteCategory = useDeleteCategory(scope);
  const [error, setError] = useState<string | null>(null);

  function handleAdd(): void {
    if (globalThis.window === undefined) return;
    const name = globalThis.prompt('Category name?');
    if (!name?.trim()) return;
    createCategory.mutate(
      { scope, parentId: category.id, name: name.trim(), iconName: null, hideOnEntityCard: null },
      {
        // Auto-expand the parent so the freshly invalidated children query
        // actually fires (`enabled: expanded`) and the new node becomes
        // visible without a second click.
        onSuccess: () => setExpanded(true),
        onError: (err) => setError(extractProblemDetail(err)),
      }
    );
  }

  function handleRename(): void {
    if (globalThis.window === undefined) return;
    const next = globalThis.prompt('Rename category', category.name);
    if (!next?.trim() || next.trim() === category.name) return;
    updateCategory.mutate(
      { id: category.id, request: { name: next.trim(), iconName: null, hideOnEntityCard: null } },
      { onError: (err) => setError(extractProblemDetail(err)) }
    );
  }

  function handleMove(): void {
    if (globalThis.window === undefined) return;
    const next = globalThis.prompt(labels.movePrompt, '');
    if (next === null) return;
    if (next === category.id) {
      setError(labels.error422Cycle);
      return;
    }
    moveCategory.mutate(
      { id: category.id, request: { newParentId: next.trim() === '' ? null : next.trim() } },
      {
        onError: (err) => {
          const status = (err as { response?: { status?: number; data?: { detail?: string } } })
            ?.response?.status;
          if (status === 422) {
            const detail =
              (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? '';
            if (detail.includes('cycle')) setError(labels.error422Cycle);
            else if (detail.includes('cross-scope')) setError(labels.error422CrossScope);
            else setError(detail || err.message);
          } else {
            setError(err.message);
          }
        },
      }
    );
  }

  function handleDelete(): void {
    if (globalThis.window === undefined || !globalThis.confirm(labels.deleteConfirm)) return;
    deleteCategory.mutate(category.id, {
      onError: (err) => {
        const status = (err as { response?: { status?: number; data?: { detail?: string } } })
          ?.response?.status;
        if (status === 422) {
          const detail =
            (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? '';
          if (detail.includes('descendants')) setError(labels.error422HasDescendants);
          else if (detail.includes('assignments')) setError(labels.error422HasAssignments);
          else setError(detail || err.message);
        } else {
          setError(err.message);
        }
      },
    });
  }

  return (
    <li
      data-granit-category-tree-node=""
      data-granit-category-id={category.id}
      data-granit-category-depth={category.depth}
    >
      <div data-granit-category-tree-row="">
        {/* Show the toggle whenever the backend doesn't explicitly say the node
            is a leaf. The real `CategoryResponse` from the .NET backend has no
            `hasChildren` field; without this fallback, every row renders as a
            leaf and the lazy children query (`enabled: expanded`) never fires,
            so newly created sub-categories are invisible. Only treat the row
            as a definitive leaf when `hasChildren === false`. */}
        {category.hasChildren === false ? (
          <span data-granit-category-tree-leaf-spacer="" aria-hidden="true">
            •
          </span>
        ) : (
          <button
            type="button"
            data-granit-category-tree-toggle=""
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? '▾' : '▸'}
          </button>
        )}
        {onSelect ? (
          <button
            type="button"
            data-granit-category-tree-name=""
            onClick={() => onSelect(category)}
          >
            {category.name}
          </button>
        ) : (
          <span data-granit-category-tree-name="">{category.name}</span>
        )}
        {canManage && (
          <span data-granit-category-tree-actions="">
            <button type="button" onClick={handleAdd}>
              {labels.add}
            </button>
            <button type="button" onClick={handleRename}>
              {labels.rename}
            </button>
            <button type="button" onClick={handleMove}>
              {labels.move}
            </button>
            <button type="button" onClick={handleDelete}>
              {labels.delete}
            </button>
          </span>
        )}
      </div>
      {error && (
        <div data-granit-category-tree-error="" role="alert">
          {error}
        </div>
      )}
      {expanded && (
        <ul data-granit-category-tree-children="">
          {childrenQuery.isLoading && (
            <li data-granit-category-tree-loading="">{labels.loading}</li>
          )}
          {(childrenQuery.data ?? []).map((child) => (
            <CategoryNode
              key={child.id}
              scope={scope}
              category={child}
              canManage={canManage}
              labels={labels}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Lazy-loaded hierarchical tree. Each node fetches its own children via
 * {@link useCategories}; expansion drives the lazy load. When `canManage`
 * is true, per-row buttons wire create/rename/move/delete with explicit
 * 422 error mapping for the documented backend rejections (cycle,
 * cross-scope, has-descendants, has-assignments).
 *
 * Move and rename use `window.prompt` as a minimal default; apps that want
 * a richer dialog can replace this component or wrap it.
 */
export function CategoryTree({
  scope,
  canManage = false,
  onSelect,
  labels,
  className,
}: CategoryTreeProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const rootsQuery = useCategories({ scope });
  const createCategory = useCreateCategory(scope);
  const [rootError, setRootError] = useState<string | null>(null);

  function handleAddRoot(): void {
    if (globalThis.window === undefined) return;
    const name = globalThis.prompt('Root category name?');
    if (!name?.trim()) return;
    createCategory.mutate(
      { scope, parentId: null, name: name.trim(), iconName: null, hideOnEntityCard: null },
      {
        onError: (err) => {
          const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail;
          setRootError(detail ?? (err instanceof Error ? err.message : 'Request failed.'));
        },
      }
    );
  }

  if (rootsQuery.isLoading) {
    return (
      <div data-granit-category-tree="" data-granit-category-tree-loading="" className={className}>
        {labelStrings.loading}
      </div>
    );
  }
  if (rootsQuery.isError) {
    return (
      <div
        data-granit-category-tree=""
        data-granit-category-tree-error=""
        role="alert"
        className={className}
      >
        {rootsQuery.error?.message ?? 'Failed to load categories.'}
      </div>
    );
  }

  const roots = rootsQuery.data ?? [];

  return (
    <div data-granit-category-tree="" data-granit-category-tree-scope={scope} className={className}>
      {canManage && (
        <button type="button" data-granit-category-tree-add-root="" onClick={handleAddRoot}>
          {labelStrings.add}
        </button>
      )}
      {rootError && (
        <div data-granit-category-tree-error="" role="alert">
          {rootError}
        </div>
      )}
      {roots.length === 0 ? (
        <div data-granit-category-tree-empty="">{labelStrings.empty}</div>
      ) : (
        <ul data-granit-category-tree-roots="">
          {roots.map((root) => (
            <CategoryNode
              key={root.id}
              scope={scope}
              category={root}
              canManage={canManage}
              labels={labelStrings}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
