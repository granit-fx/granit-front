import { useRef, useState } from 'react';

import { DOCUMENT_DRAG_MIME } from '../constants';
import { useMoveDocument } from '../hooks/use-document-mutations';
import { useCreateFolder, useRenameFolder, useTrashFolder } from '../hooks/use-folder-mutations';
import { useFolders } from '../hooks/use-folders';

import { InlineEdit } from './inline-edit';
import { TransferOwnershipDialog } from './transfer-ownership-dialog';

import type { TransferOwnershipDialogLabels } from './transfer-ownership-dialog';
import type { FolderResponse, FolderStatus } from '@granit/documents';
import type { DragEvent, ReactNode } from 'react';

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
  readonly transferOwnership?: string;
  readonly transferOwnershipDialog?: TransferOwnershipDialogLabels;
}

export interface FolderTreeProps {
  /** Root folder id. `null` (default) lists tenant-root folders. */
  readonly rootFolderId?: string | null;
  readonly canManage?: boolean;
  /**
   * When `true`, exposes the "Transfer ownership" action on each folder
   * node. Host must gate this with the `Documents.Folders.TransferOwnership`
   * permission. The tenant root is never visible in the tree, so no extra
   * client-side guard is needed.
   */
  readonly canTransferOwnership?: boolean;
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

const DEFAULT_LABELS: Required<Omit<FolderTreeLabels, 'transferOwnershipDialog'>> & {
  readonly transferOwnershipDialog: TransferOwnershipDialogLabels | undefined;
} = {
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
  transferOwnership: 'Transfer ownership',
  transferOwnershipDialog: undefined,
};

type RowMode = 'idle' | 'renaming' | 'adding-child' | 'confirming-trash';

interface FolderNodeProps {
  readonly folder: FolderResponse;
  readonly canManage: boolean;
  readonly canTransferOwnership: boolean;
  readonly status: FolderStatus;
  readonly currentFolderId: string | null;
  readonly labels: typeof DEFAULT_LABELS;
  readonly onSelect?: (folder: FolderResponse) => void;
  readonly onDeleted?: (folderId: string) => void;
}

function FolderNode({
  folder,
  canManage,
  canTransferOwnership,
  status,
  currentFolderId,
  labels,
  onSelect,
  onDeleted,
}: Readonly<FolderNodeProps>): ReactNode {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<RowMode>('idle');
  const [error, setError] = useState<string | null>(null);
  const [dropOver, setDropOver] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const dropDepthRef = useRef(0);
  const childrenQuery = useFolders({ parentId: folder.id, status }, { enabled: expanded });
  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const trashFolder = useTrashFolder();
  const moveDocument = useMoveDocument();

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

  function carriesDocumentDrag(event: DragEvent<HTMLDivElement>): boolean {
    if (!canManage) return false;
    for (const type of event.dataTransfer.types) {
      if (type === DOCUMENT_DRAG_MIME) return true;
    }
    return false;
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>): void {
    if (!carriesDocumentDrag(event)) return;
    dropDepthRef.current += 1;
    if (dropDepthRef.current === 1) setDropOver(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>): void {
    if (!carriesDocumentDrag(event)) return;
    dropDepthRef.current = Math.max(0, dropDepthRef.current - 1);
    if (dropDepthRef.current === 0) setDropOver(false);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>): void {
    if (!carriesDocumentDrag(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>): Promise<void> {
    if (!carriesDocumentDrag(event)) return;
    event.preventDefault();
    event.stopPropagation();
    dropDepthRef.current = 0;
    setDropOver(false);
    const raw = event.dataTransfer.getData(DOCUMENT_DRAG_MIME);
    if (!raw) return;
    let payload: { ids?: unknown };
    try {
      payload = JSON.parse(raw) as { ids?: unknown };
    } catch {
      return;
    }
    const ids = Array.isArray(payload.ids)
      ? payload.ids.filter((x): x is string => typeof x === 'string')
      : [];
    if (ids.length === 0) return;
    setError(null);
    for (const id of ids) {
      try {
        await moveDocument.mutateAsync({
          id,
          request: { newFolderId: folder.id },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Move failed.');
        break;
      }
    }
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
      {/* NOSONAR: role="group" is correct for a tree item's content group in the WAI-ARIA tree pattern */}
      <div
        role="group"
        data-granit-folder-tree-row=""
        data-granit-folder-tree-current={isCurrent ? '' : undefined}
        data-granit-folder-tree-drop-over={dropOver ? '' : undefined}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={(event) => {
          void handleDrop(event);
        }}
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
        {mode === 'renaming' && (
          <InlineEdit
            initialValue={folder.name}
            ariaLabel={labels.rename}
            onCommit={commitRename}
            onCancel={() => setMode('idle')}
          />
        )}
        {mode !== 'renaming' && onSelect && (
          <button
            type="button"
            data-granit-folder-tree-name=""
            onClick={() => onSelect(folder)}
            onDoubleClick={canManage ? startRename : undefined}
          >
            {folder.name}
          </button>
        )}
        {mode !== 'renaming' && !onSelect && (
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
            {canTransferOwnership && (
              <button
                type="button"
                data-granit-folder-tree-transfer-ownership=""
                onClick={() => setTransferOpen(true)}
                aria-label={labels.transferOwnership}
              >
                {labels.transferOwnership}
              </button>
            )}
          </span>
        )}
      </div>
      {canTransferOwnership && (
        <TransferOwnershipDialog
          open={transferOpen}
          onClose={() => setTransferOpen(false)}
          target={{ type: 'Folder', id: folder.id }}
          currentOwnerId={folder.ownerId}
          labels={labels.transferOwnershipDialog}
        />
      )}
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
                canTransferOwnership={canTransferOwnership}
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
  canTransferOwnership = false,
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
              canTransferOwnership={canTransferOwnership}
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
