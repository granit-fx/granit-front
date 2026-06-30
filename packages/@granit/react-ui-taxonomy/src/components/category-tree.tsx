import { useTranslation } from '@granit/react-localization';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useMoveCategory,
  useUpdateCategory,
} from '@granit/react-taxonomy';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Tree,
  TreeGroup,
  TreeItem,
  TreeItemRow,
  TreeItemSpacer,
  TreeItemToggle,
} from '@granit/react-ui';
import { ConfirmActionDialog, FormDialog } from '@granit/react-ui-kit';
import { createConstraintsResolver } from '@granit/react-validation';
import { taxonomyConstraints } from '@granit/taxonomy';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { logger } from '../logger';

import type { CategoryResponse } from '@granit/taxonomy';
import type { ReactNode } from 'react';
import type { Resolver } from 'react-hook-form';

export interface CategoryTreeLabels {
  readonly add?: string;
  readonly addDialogTitle?: string;
  readonly nameField?: string;
  readonly rename?: string;
  readonly renameDialogTitle?: string;
  readonly move?: string;
  readonly delete?: string;
  readonly deleteConfirm?: string;
  readonly confirmDelete?: string;
  readonly cancel?: string;
  readonly submit?: string;
  readonly moveDialogTitle?: string;
  readonly movePromote?: string;
  readonly movePrompt?: string;
  readonly newParentField?: string;
  readonly expand?: string;
  readonly collapse?: string;
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
  addDialogTitle: 'Add category',
  nameField: 'Name',
  rename: 'Rename',
  renameDialogTitle: 'Rename category',
  move: 'Move',
  delete: 'Delete',
  deleteConfirm:
    'Delete this category? This cannot be undone. Categories with descendants or active assignments cannot be deleted.',
  confirmDelete: 'Delete',
  cancel: 'Cancel',
  submit: 'Save',
  moveDialogTitle: 'Move category',
  movePromote: '(promote to root)',
  movePrompt: 'Paste the new parent category id, or leave empty to promote to root.',
  newParentField: 'New parent category id',
  expand: 'Expand',
  collapse: 'Collapse',
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

interface NameFormValues {
  readonly name: string;
}

interface MoveFormValues {
  readonly newParentId: string;
}

interface CategoryNodeProps {
  readonly scope: string;
  readonly category: CategoryResponse;
  readonly canManage: boolean;
  readonly labels: Required<CategoryTreeLabels>;
  readonly onSelect?: (category: CategoryResponse) => void;
}

type OpenDialog = 'add' | 'rename' | 'move' | 'delete' | null;

function CategoryNode({
  scope,
  category,
  canManage,
  labels,
  onSelect,
}: Readonly<CategoryNodeProps>): ReactNode {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const childrenQuery = useCategories({ scope, parentId: category.id }, { enabled: expanded });
  const createCategory = useCreateCategory(scope);
  const updateCategory = useUpdateCategory(scope);
  const moveCategory = useMoveCategory(scope);
  const deleteCategory = useDeleteCategory(scope);
  const [error, setError] = useState<string | null>(null);

  const nameResolver = useMemo(
    () =>
      createConstraintsResolver(taxonomyConstraints.CreateCategoryRequest, t, {
        labelResolver: () => labels.nameField,
      }) as unknown as Resolver<NameFormValues>,
    [t, labels.nameField]
  );

  const addForm = useForm<NameFormValues>({ resolver: nameResolver, defaultValues: { name: '' } });
  const renameForm = useForm<NameFormValues>({
    resolver: nameResolver,
    defaultValues: { name: category.name },
  });
  const moveForm = useForm<MoveFormValues>({ defaultValues: { newParentId: '' } });

  function closeDialog(): void {
    setDialog(null);
    addForm.reset({ name: '' });
    renameForm.reset({ name: category.name });
    moveForm.reset({ newParentId: '' });
  }

  function handleAdd(values: NameFormValues): void {
    createCategory.mutate(
      { scope, parentId: category.id, name: values.name.trim(), iconName: null },
      {
        // Auto-expand the parent so the freshly invalidated children query
        // actually fires (`enabled: expanded`) and the new node becomes
        // visible without a second click.
        onSuccess: () => {
          setExpanded(true);
          closeDialog();
        },
        onError: (err) => setError(extractProblemDetail(err)),
      }
    );
  }

  function handleRename(values: NameFormValues): void {
    const next = values.name.trim();
    if (next === category.name) {
      closeDialog();
      return;
    }
    updateCategory.mutate(
      {
        id: category.id,
        request: {
          concurrencyStamp: category.concurrencyStamp,
          name: next,
          iconName: null,
          hideOnEntityCard: null,
        },
      },
      {
        onSuccess: () => closeDialog(),
        onError: (err) => {
          setError(extractProblemDetail(err));
          closeDialog();
        },
      }
    );
  }

  function handleMove(values: MoveFormValues): void {
    const target = values.newParentId.trim();
    if (target === category.id) {
      setError(labels.error422Cycle);
      closeDialog();
      return;
    }
    moveCategory.mutate(
      { id: category.id, request: { newParentId: target === '' ? null : target } },
      {
        onSuccess: () => closeDialog(),
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
          closeDialog();
        },
      }
    );
  }

  function handleDelete(): void {
    deleteCategory.mutate(category.id, {
      onSuccess: () => closeDialog(),
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
        logger.warn('category delete rejected', { status });
        closeDialog();
      },
    });
  }

  // Show the toggle whenever the backend doesn't explicitly say the node is a
  // leaf. The real `CategoryResponse` from the .NET backend has no `hasChildren`
  // field; without this fallback every row renders as a leaf and the lazy
  // children query (`enabled: expanded`) never fires, so newly created
  // sub-categories are invisible. Only treat the row as a definitive leaf when
  // `hasChildren === false`.
  const childIndent = `${(category.depth + 1) * 1.25 + 0.25}rem`;
  const actionClass =
    'rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground';

  return (
    <TreeItem
      data-granit-category-tree-node=""
      data-granit-category-id={category.id}
      data-granit-category-depth={category.depth}
    >
      <TreeItemRow level={category.depth} data-granit-category-tree-row="">
        {category.hasChildren === false ? (
          <TreeItemSpacer data-granit-category-tree-leaf-spacer="" />
        ) : (
          <TreeItemToggle
            expanded={expanded}
            aria-label={expanded ? labels.collapse : labels.expand}
            data-granit-category-tree-toggle=""
            onClick={() => setExpanded((current) => !current)}
          />
        )}
        {onSelect ? (
          <button
            type="button"
            data-granit-category-tree-name=""
            onClick={() => onSelect(category)}
            className="flex-1 truncate rounded px-1 text-left hover:underline"
          >
            {category.name}
          </button>
        ) : (
          <span data-granit-category-tree-name="" className="flex-1 truncate px-1">
            {category.name}
          </span>
        )}
        {canManage && (
          <span
            data-granit-category-tree-actions=""
            className="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/tree-row:opacity-100 focus-within:opacity-100"
          >
            <button
              type="button"
              aria-label={labels.add}
              onClick={() => setDialog('add')}
              className={actionClass}
            >
              {labels.add}
            </button>
            <button type="button" onClick={() => setDialog('rename')} className={actionClass}>
              {labels.rename}
            </button>
            <button type="button" onClick={() => setDialog('move')} className={actionClass}>
              {labels.move}
            </button>
            <button
              type="button"
              onClick={() => setDialog('delete')}
              className="rounded px-1.5 py-0.5 text-xs text-destructive hover:bg-destructive/10"
            >
              {labels.delete}
            </button>
          </span>
        )}
      </TreeItemRow>

      {canManage && (
        <>
          <FormDialog
            open={dialog === 'add'}
            onOpenChange={(open) => (open ? setDialog('add') : closeDialog())}
            form={addForm}
            onSubmit={handleAdd}
            title={labels.addDialogTitle}
            submitLabel={labels.submit}
            cancelLabel={labels.cancel}
            isSubmitting={createCategory.isPending}
            data-slot="category-tree-add-dialog"
          >
            <FormField
              control={addForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labels.nameField}</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormDialog>

          <FormDialog
            open={dialog === 'rename'}
            onOpenChange={(open) => (open ? setDialog('rename') : closeDialog())}
            form={renameForm}
            onSubmit={handleRename}
            title={labels.renameDialogTitle}
            submitLabel={labels.submit}
            cancelLabel={labels.cancel}
            isSubmitting={updateCategory.isPending}
            data-slot="category-tree-rename-dialog"
          >
            <FormField
              control={renameForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labels.nameField}</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormDialog>

          <FormDialog
            open={dialog === 'move'}
            onOpenChange={(open) => (open ? setDialog('move') : closeDialog())}
            form={moveForm}
            onSubmit={handleMove}
            title={labels.moveDialogTitle}
            description={labels.movePrompt}
            submitLabel={labels.submit}
            cancelLabel={labels.cancel}
            isSubmitting={moveCategory.isPending}
            data-slot="category-tree-move-dialog"
          >
            <FormField
              control={moveForm.control}
              name="newParentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labels.newParentField}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={labels.movePromote} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormDialog>

          <ConfirmActionDialog
            open={dialog === 'delete'}
            onOpenChange={(open) => (open ? setDialog('delete') : closeDialog())}
            tone="destructive"
            title={labels.delete}
            description={labels.deleteConfirm}
            confirmLabel={labels.confirmDelete}
            cancelLabel={labels.cancel}
            isPending={deleteCategory.isPending}
            onConfirm={handleDelete}
            data-slot="category-tree-delete-dialog"
          />
        </>
      )}

      {error && (
        <div
          data-granit-category-tree-error=""
          role="alert"
          className="py-1 pr-1 text-xs text-destructive"
          style={{ paddingInlineStart: childIndent }}
        >
          {error}
        </div>
      )}
      {expanded && (
        <TreeGroup data-granit-category-tree-children="">
          {childrenQuery.isLoading && (
            <li
              data-granit-category-tree-loading=""
              className="py-1 text-xs text-muted-foreground"
              style={{ paddingInlineStart: childIndent }}
            >
              {labels.loading}
            </li>
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
        </TreeGroup>
      )}
    </TreeItem>
  );
}

/**
 * Lazy-loaded hierarchical tree. Each node fetches its own children via
 * {@link useCategories}; expansion drives the lazy load. When `canManage`
 * is true, per-row buttons wire create/rename/move/delete with explicit
 * 422 error mapping for the documented backend rejections (cycle,
 * cross-scope, has-descendants, has-assignments).
 *
 * Rename / move / add open a spec-driven `FormDialog` (constraints derived
 * from `taxonomy.json`); delete opens a `ConfirmActionDialog`. User-facing
 * strings are injected as `labels` by the page wrapper — the component owns no
 * taxonomy i18n namespace (it only resolves host-owned `Validation:Builtin:*`
 * messages for the form resolver).
 */
export function CategoryTree({
  scope,
  canManage = false,
  onSelect,
  labels,
  className,
}: CategoryTreeProps): ReactNode {
  const { t } = useTranslation();
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const rootsQuery = useCategories({ scope });
  const createCategory = useCreateCategory(scope);
  const [rootDialogOpen, setRootDialogOpen] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);

  const rootResolver = useMemo(
    () =>
      createConstraintsResolver(taxonomyConstraints.CreateCategoryRequest, t, {
        labelResolver: () => labelStrings.nameField,
      }) as unknown as Resolver<NameFormValues>,
    [t, labelStrings.nameField]
  );
  const rootForm = useForm<NameFormValues>({
    resolver: rootResolver,
    defaultValues: { name: '' },
  });

  function handleAddRoot(values: NameFormValues): void {
    createCategory.mutate(
      { scope, parentId: null, name: values.name.trim(), iconName: null },
      {
        onSuccess: () => {
          setRootDialogOpen(false);
          rootForm.reset({ name: '' });
        },
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
      <div
        data-granit-category-tree=""
        data-granit-category-tree-loading=""
        className={`p-2 text-sm text-muted-foreground ${className ?? ''}`}
      >
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
        className={`p-2 text-sm text-destructive ${className ?? ''}`}
      >
        {rootsQuery.error?.message ?? 'Failed to load categories.'}
      </div>
    );
  }

  const roots = rootsQuery.data ?? [];

  return (
    <div
      data-granit-category-tree=""
      data-granit-category-tree-scope={scope}
      className={`space-y-1 ${className ?? ''}`}
    >
      {canManage && (
        <button
          type="button"
          data-granit-category-tree-add-root=""
          aria-label={labelStrings.add}
          onClick={() => setRootDialogOpen(true)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {labelStrings.add}
        </button>
      )}
      {canManage && (
        <FormDialog
          open={rootDialogOpen}
          onOpenChange={setRootDialogOpen}
          form={rootForm}
          onSubmit={handleAddRoot}
          title={labelStrings.addDialogTitle}
          submitLabel={labelStrings.submit}
          cancelLabel={labelStrings.cancel}
          isSubmitting={createCategory.isPending}
          data-slot="category-tree-add-root-dialog"
        >
          <FormField
            control={rootForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{labelStrings.nameField}</FormLabel>
                <FormControl>
                  <Input {...field} autoFocus />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormDialog>
      )}
      {rootError && (
        <div
          data-granit-category-tree-error=""
          role="alert"
          className="px-2 py-1 text-xs text-destructive"
        >
          {rootError}
        </div>
      )}
      {roots.length === 0 ? (
        <div data-granit-category-tree-empty="" className="px-2 py-1 text-sm text-muted-foreground">
          {labelStrings.empty}
        </div>
      ) : (
        <Tree data-granit-category-tree-roots="">
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
        </Tree>
      )}
    </div>
  );
}
