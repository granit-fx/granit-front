import { useState } from 'react';

import { useCreateFolder, useRenameFolder, useTrashFolder } from '../hooks/use-folder-mutations.js';
import { useFolders } from '../hooks/use-folders.js';

import { InlineEdit } from './inline-edit.js';

import type { FolderResponse, FolderStatus } from '@granit/documents';
import type { ReactNode } from 'react';

export interface FolderTreeLabels {
  readonly add?: string;
  readonly addRoot?: string;
  readonly rename?: string;
  readonly delete?: string;
  readonly deleteConfirmQuestion?: string;
  readonly deleteConfirm?: string;
  readonly deleteCancel?: string;
  readonly empty?: string;
  readonly loading?: string;
  readonly error?: string;
  readonly newFolderName?: string;
}

export interface FolderTreeProps {
  /** Root folder id. `null` (default) lists tenant-root folders. */
  readonly rootFolderId?: string | null;
  readonly canManage?: boolean;
  /** Filter shown folders by lifecycle status. Defaults to `Active`. */
  readonly status?: FolderStatus;
  /** Highlight a single node as "current" (e.g. the explorer's active folder). */
  readonly currentFolderId?: string | null;
  readonly onSelect?: (folder: FolderResponse) => void;
  /**
   * Fired with the folder id once a trash (soft-delete) mutation succeeds.
   * Consumers (e.g. `DocumentsExplorer`) use this to drop a stale current
   * selection. Not invoked on mutation error.
   */
  readonly onDeleted?: (folderId: string) => void;
  readonly labels?: FolderTreeLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<FolderTreeLabels> = {
  add: 'New folder',
  addRoot: 'New root folder',
  rename: 'Rename',
  delete: 'Delete',
  deleteConfirmQuestion: 'Move this folder to the trash?',
  deleteConfirm: 'Confirm',
  deleteCancel: 'Cancel',
  empty: 'No folders.',
  loading: 'Loading…',
  error: 'Failed to load folders.',
  newFolderName: 'Folder name',
};

type RowMode = 'idle' | 'renaming' | 'adding-child' | 'confirming-trash';

interface FolderNodeProps {
  readonly folder: FolderResponse;
  readonly canManage: boolean;
  readonly status: FolderStatus;
  readonly currentFolderId: string | null;
  readonly labels: Required<FolderTreeLabels>;
  readonly onSelect?: (folder: FolderResponse) => void;
  readonly onDeleted?: (folderId: string) => void;
}

function FolderNode({
  folder,
  canManage,
  status,
  currentFolderId,
  labels,
  onSelect,
  onDeleted,
}: Readonly<FolderNodeProps>): ReactNode {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<RowMode>('idle');
  const [error, setError] = useState<string | null>(null);
  const childrenQuery = useFolders({ parentId: folder.id, status }, { enabled: expanded });
  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const trashFolder = useTrashFolder();

  function startAdd(): void {
    setExpanded(true);
    setMode('adding-child');
    setError(null);
  }

  function startRename(): void {
    setMode('renaming');
    setError(null);
  }

  function startTrash(): void {
    setMode('confirming-trash');
    setError(null);
  }

  function commitAdd(name: string): void {
    createFolder.mutate(
      { parentFolderId: folder.id, name },
      {
        onSuccess: () => setMode('idle'),
        onError: (err) => setError(err.message),
      }
    );
  }

  function commitRename(name: string): void {
    if (name === folder.name) {
      setMode('idle');
      return;
    }
    renameFolder.mutate(
      { id: folder.id, request: { name } },
      {
        onSuccess: () => setMode('idle'),
        onError: (err) => setError(err.message),
      }
    );
  }

  function confirmTrash(): void {
    trashFolder.mutate(folder.id, {
      onSuccess: () => {
        setMode('idle');
        onDeleted?.(folder.id);
      },
      onError: (err) => setError(err.message),
    });
  }

  const children = childrenQuery.data?.folders ?? [];
  const isCurrent = currentFolderId === folder.id;

  return (
    <li
      data-granit-folder-tree-node=""
      data-granit-folder-id={folder.id}
      data-granit-folder-depth={folder.depth}
      data-granit-folder-tree-current={isCurrent ? '' : undefined}
    >
      <div
        data-granit-folder-tree-row=""
        data-granit-folder-tree-current={isCurrent ? '' : undefined}
      >
        <button
          type="button"
          data-granit-folder-tree-toggle=""
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse' : 'Expand'}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? '▾' : '▸'}
        </button>
        {mode === 'renaming' ? (
          <InlineEdit
            initialValue={folder.name}
            ariaLabel={labels.rename}
            onCommit={commitRename}
            onCancel={() => setMode('idle')}
          />
        ) : onSelect ? (
          <button
            type="button"
            data-granit-folder-tree-name=""
            onClick={() => onSelect(folder)}
            onDoubleClick={canManage ? startRename : undefined}
          >
            {folder.name}
          </button>
        ) : (
          <span data-granit-folder-tree-name="">{folder.name}</span>
        )}
        {canManage && mode === 'idle' && (
          <span data-granit-folder-tree-actions="">
            <button type="button" onClick={startAdd} aria-label={labels.add}>
              +
            </button>
            <button type="button" onClick={startRename} aria-label={labels.rename}>
              {labels.rename}
            </button>
            <button type="button" onClick={startTrash} aria-label={labels.delete}>
              {labels.delete}
            </button>
          </span>
        )}
      </div>
      {mode === 'confirming-trash' && (
        <div data-granit-folder-tree-confirm="" role="alertdialog">
          <span data-granit-folder-tree-confirm-text="">{labels.deleteConfirmQuestion}</span>
          <button
            type="button"
            data-granit-folder-tree-confirm-cancel=""
            onClick={() => setMode('idle')}
          >
            {labels.deleteCancel}
          </button>
          <button
            type="button"
            data-granit-folder-tree-confirm-ok=""
            onClick={confirmTrash}
            disabled={trashFolder.isPending}
          >
            {labels.deleteConfirm}
          </button>
        </div>
      )}
      {error && (
        <div data-granit-folder-tree-error="" role="alert">
          {error}
        </div>
      )}
      {(expanded || mode === 'adding-child') && (
        <ul data-granit-folder-tree-children="">
          {mode === 'adding-child' && (
            <li data-granit-folder-tree-new="">
              <InlineEdit
                initialValue=""
                placeholder={labels.newFolderName}
                ariaLabel={labels.newFolderName}
                onCommit={commitAdd}
                onCancel={() => setMode('idle')}
              />
            </li>
          )}
          {expanded && childrenQuery.isLoading && (
            <li data-granit-folder-tree-loading="">{labels.loading}</li>
          )}
          {expanded &&
            children.map((child) => (
              <FolderNode
                key={child.id}
                folder={child}
                canManage={canManage}
                status={status}
                currentFolderId={currentFolderId}
                labels={labels}
                onSelect={onSelect}
                onDeleted={onDeleted}
              />
            ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Lazy-loaded folder tree. Each node fetches its own direct children via
 * {@link useFolders}; expansion drives the lazy load. When `canManage` is
 * true, per-row inline editing wires add/rename/trash — no `window.prompt`
 * or `window.confirm`: instead the row morphs into an input (add/rename)
 * or a confirmation bar (trash). Double-click on a name also enters rename.
 */
export function FolderTree({
  rootFolderId = null,
  canManage = false,
  status = 'Active',
  currentFolderId = null,
  onSelect,
  onDeleted,
  labels,
  className,
}: FolderTreeProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const [addingRoot, setAddingRoot] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);
  const rootsQuery = useFolders({ parentId: rootFolderId, status });
  const createFolder = useCreateFolder();

  function commitAddRoot(name: string): void {
    createFolder.mutate(
      { parentFolderId: rootFolderId, name },
      {
        onSuccess: () => setAddingRoot(false),
        onError: (err) => setRootError(err.message),
      }
    );
  }

  if (rootsQuery.isLoading) {
    return (
      <div data-granit-folder-tree="" data-granit-folder-tree-loading="" className={className}>
        {labelStrings.loading}
      </div>
    );
  }
  if (rootsQuery.isError) {
    return (
      <div
        data-granit-folder-tree=""
        data-granit-folder-tree-error=""
        role="alert"
        className={className}
      >
        {rootsQuery.error?.message ?? labelStrings.error}
      </div>
    );
  }

  const roots = rootsQuery.data?.folders ?? [];

  return (
    <div data-granit-folder-tree="" className={className}>
      {canManage &&
        (addingRoot ? (
          <div data-granit-folder-tree-new-root="">
            <InlineEdit
              initialValue=""
              placeholder={labelStrings.newFolderName}
              ariaLabel={labelStrings.newFolderName}
              onCommit={commitAddRoot}
              onCancel={() => setAddingRoot(false)}
            />
          </div>
        ) : (
          <button
            type="button"
            data-granit-folder-tree-add-root=""
            onClick={() => {
              setRootError(null);
              setAddingRoot(true);
            }}
          >
            + {labelStrings.addRoot}
          </button>
        ))}
      {rootError && (
        <div data-granit-folder-tree-error="" role="alert">
          {rootError}
        </div>
      )}
      {roots.length === 0 && !addingRoot ? (
        <div data-granit-folder-tree-empty="">{labelStrings.empty}</div>
      ) : (
        <ul data-granit-folder-tree-roots="">
          {roots.map((root) => (
            <FolderNode
              key={root.id}
              folder={root}
              canManage={canManage}
              status={status}
              currentFolderId={currentFolderId}
              labels={labelStrings}
              onSelect={onSelect}
              onDeleted={onDeleted}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
