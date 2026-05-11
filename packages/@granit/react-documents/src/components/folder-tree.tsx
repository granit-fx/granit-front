import { useState } from 'react';

import { useCreateFolder, useRenameFolder, useTrashFolder } from '../hooks/use-folder-mutations.js';
import { useFolders } from '../hooks/use-folders.js';

import type { FolderResponse, FolderStatus } from '@granit/documents';
import type { ReactNode } from 'react';

export interface FolderTreeLabels {
  readonly add?: string;
  readonly rename?: string;
  readonly delete?: string;
  readonly deleteConfirm?: string;
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
  readonly onSelect?: (folder: FolderResponse) => void;
  readonly labels?: FolderTreeLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<FolderTreeLabels> = {
  add: '+',
  rename: 'Rename',
  delete: 'Delete',
  deleteConfirm: 'Move this folder to the trash? Its contents will be trashed too.',
  empty: 'No folders.',
  loading: 'Loading…',
  error: 'Failed to load folders.',
  newFolderName: 'Folder name?',
};

interface FolderNodeProps {
  readonly folder: FolderResponse;
  readonly canManage: boolean;
  readonly status: FolderStatus;
  readonly labels: Required<FolderTreeLabels>;
  readonly onSelect?: (folder: FolderResponse) => void;
}

function FolderNode({
  folder,
  canManage,
  status,
  labels,
  onSelect,
}: Readonly<FolderNodeProps>): ReactNode {
  const [expanded, setExpanded] = useState(false);
  const childrenQuery = useFolders({ parentId: folder.id, status }, { enabled: expanded });
  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const trashFolder = useTrashFolder();
  const [error, setError] = useState<string | null>(null);

  function handleAdd(): void {
    if (typeof window === 'undefined') return;
    const name = window.prompt(labels.newFolderName);
    if (!name?.trim()) return;
    createFolder.mutate(
      { parentFolderId: folder.id, name: name.trim() },
      {
        onError: (err) => setError(err.message),
      }
    );
  }

  function handleRename(): void {
    if (typeof window === 'undefined') return;
    const next = window.prompt(labels.rename, folder.name);
    if (!next?.trim() || next.trim() === folder.name) return;
    renameFolder.mutate(
      { id: folder.id, request: { name: next.trim() } },
      {
        onError: (err) => setError(err.message),
      }
    );
  }

  function handleDelete(): void {
    if (typeof window === 'undefined' || !window.confirm(labels.deleteConfirm)) return;
    trashFolder.mutate(folder.id, {
      onError: (err) => setError(err.message),
    });
  }

  const children = childrenQuery.data?.folders ?? [];

  return (
    <li
      data-granit-folder-tree-node=""
      data-granit-folder-id={folder.id}
      data-granit-folder-depth={folder.depth}
    >
      <div data-granit-folder-tree-row="">
        <button
          type="button"
          data-granit-folder-tree-toggle=""
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? '▾' : '▸'}
        </button>
        {onSelect ? (
          <button type="button" data-granit-folder-tree-name="" onClick={() => onSelect(folder)}>
            {folder.name}
          </button>
        ) : (
          <span data-granit-folder-tree-name="">{folder.name}</span>
        )}
        {canManage && (
          <span data-granit-folder-tree-actions="">
            <button type="button" onClick={handleAdd}>
              {labels.add}
            </button>
            <button type="button" onClick={handleRename}>
              {labels.rename}
            </button>
            <button type="button" onClick={handleDelete} aria-label={labels.delete}>
              {labels.delete}
            </button>
          </span>
        )}
      </div>
      {error && (
        <div data-granit-folder-tree-error="" role="alert">
          {error}
        </div>
      )}
      {expanded && (
        <ul data-granit-folder-tree-children="">
          {childrenQuery.isLoading && <li data-granit-folder-tree-loading="">{labels.loading}</li>}
          {children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              canManage={canManage}
              status={status}
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
 * Lazy-loaded folder tree. Each node fetches its own direct children via
 * {@link useFolders}; expansion drives the lazy load. When `canManage` is
 * true, per-row buttons wire add/rename/trash (no drag-drop in this
 * iteration — buttons only).
 *
 * The component currently uses `window.prompt`/`window.confirm` for inline
 * edits, matching the taxonomy tree pattern; apps that want a richer dialog
 * can wrap or replace this component.
 */
export function FolderTree({
  rootFolderId = null,
  canManage = false,
  status = 'Active',
  onSelect,
  labels,
  className,
}: FolderTreeProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const rootsQuery = useFolders({ parentId: rootFolderId, status });
  const createFolder = useCreateFolder();

  function handleAddRoot(): void {
    if (typeof window === 'undefined') return;
    const name = window.prompt(labelStrings.newFolderName);
    if (!name?.trim()) return;
    createFolder.mutate({ parentFolderId: rootFolderId, name: name.trim() });
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
      {canManage && (
        <button type="button" data-granit-folder-tree-add-root="" onClick={handleAddRoot}>
          {labelStrings.add}
        </button>
      )}
      {roots.length === 0 ? (
        <div data-granit-folder-tree-empty="">{labelStrings.empty}</div>
      ) : (
        <ul data-granit-folder-tree-roots="">
          {roots.map((root) => (
            <FolderNode
              key={root.id}
              folder={root}
              canManage={canManage}
              status={status}
              labels={labelStrings}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
