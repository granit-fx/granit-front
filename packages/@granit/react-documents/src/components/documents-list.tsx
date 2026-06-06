import { QueryProvider, useQueryEndpoint } from '@granit/react-query-engine';
import { useEffect, useMemo, useRef, useState } from 'react';

import { DOCUMENT_DRAG_MIME } from '../constants';
import { useRenameDocument, useTrashDocument } from '../hooks/use-document-mutations';
import { useMultiSelect } from '../hooks/use-multi-select';
import { useDocumentsConfig } from '../providers/documents-provider';

import { classifyDocumentName, documentBadge } from './document-kind';
import { InlineEdit } from './inline-edit';

import type { MultiSelectApi } from '../hooks/use-multi-select';
import type { DocumentsViewMode, TileSizeStep } from '../hooks/use-view-preferences';
import type { DocumentResponse } from '@granit/documents';
import type { FilterEntry, SortEntry } from '@granit/query-engine';
import type { DragEvent, KeyboardEvent, MouseEvent, ReactNode } from 'react';

const LIST_QUERY_KEY_PREFIX = ['documents', 'documents', 'list'] as const;
const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_TILE_SIZE: TileSizeStep = 160;

export interface DocumentsListLabels {
  readonly empty?: string;
  readonly nameHeader?: string;
  readonly statusHeader?: string;
  readonly selectHeader?: string;
  readonly selectRow?: string;
  readonly rename?: string;
  readonly trash?: string;
  readonly trashConfirm?: string;
  readonly trashCancel?: string;
  readonly loading?: string;
  readonly error?: string;
  readonly previous?: string;
  readonly next?: string;
  readonly pageOf?: (page: number, total: number) => string;
}

export interface DocumentsListProps {
  readonly folderId: string;
  readonly pageSize?: number;
  readonly canManage?: boolean;
  /** `'list'` (default) renders a table, `'grid'` renders a tile grid. */
  readonly viewMode?: DocumentsViewMode;
  /** Side of each tile in pixels (grid mode only). Defaults to 160. */
  readonly tileSize?: TileSizeStep;
  /** Open / preview a single document (Enter key or single click on name). */
  readonly onOpenDocument?: (id: string) => void;
  /**
   * Quick Look — invoked when the user presses `Space` on the focused row,
   * matching macOS Finder. When omitted, `Space` falls back to its previous
   * behavior of toggling the focused row's selection.
   */
  readonly onPreviewDocument?: (doc: DocumentResponse) => void;
  /** Bubbles the current selection (ids) to a parent toolbar or inspector. */
  readonly onSelectionChange?: (
    ids: ReadonlySet<string>,
    docs: readonly DocumentResponse[]
  ) => void;
  /** Bubbles the focused row (last single-clicked) for inspector binding. */
  readonly onFocusChange?: (doc: DocumentResponse | null) => void;
  /**
   * Bubbles the current page of items so a parent can use them for sibling
   * navigation (e.g. ← / → in `<DocumentQuickLook>`). Fires whenever the
   * underlying query returns a new page.
   */
  readonly onItemsChange?: (items: readonly DocumentResponse[]) => void;
  /**
   * Monotonic signal: bumping the value tells the list to clear its inner
   * selection + focus state. Useful when a parent toolbar exposes a
   * "Clear selection" action without lifting selection state up.
   */
  readonly clearSignal?: number;
  readonly labels?: DocumentsListLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<DocumentsListLabels> = {
  empty: 'This folder is empty.',
  nameHeader: 'Name',
  statusHeader: 'Status',
  selectHeader: 'Select all',
  selectRow: 'Select',
  rename: 'Rename',
  trash: 'Move to trash',
  trashConfirm: 'Confirm',
  trashCancel: 'Cancel',
  loading: 'Loading documents…',
  error: 'Failed to load documents.',
  previous: 'Previous',
  next: 'Next',
  pageOf: (page, total) => `Page ${page} of ${total}`,
};

/**
 * Lists active documents inside a folder. Backed by the QueryEngine
 * endpoint `GET {basePath}/documents` — pre-applies `folderId Equals <id>`
 * and `status Equals Active`. Trashed documents are surfaced in TrashBin.
 *
 * Two view modes:
 *  - `'list'` (default): a table with name / status / actions columns.
 *  - `'grid'`: a tile grid sized by `tileSize`, with a kind badge per
 *    extension (image / pdf / code / …) emitted as `data-granit-document-kind`
 *    so hosts can color-code without a thumbnail backend.
 *
 * Both modes share the same selection / focus / drag / rename / trash
 * machinery — switching the view does not lose state.
 */
export function DocumentsList(props: Readonly<DocumentsListProps>): ReactNode {
  const config = useDocumentsConfig();

  return (
    <QueryProvider
      config={{
        client: config.client,
        basePath: `${config.basePath}/documents`,
        queryKeyPrefix: [...LIST_QUERY_KEY_PREFIX, props.folderId],
      }}
    >
      <DocumentsListBody {...props} />
    </QueryProvider>
  );
}

type RowMode = 'idle' | 'renaming' | 'confirming-trash';

interface DocumentNameCellProps {
  readonly mode: RowMode;
  readonly canManage: boolean;
  readonly document: DocumentResponse;
  readonly onNameClick: ((doc: DocumentResponse) => void) | undefined;
  readonly renameLabel: string;
  readonly commitRename: (doc: DocumentResponse, name: string) => void;
  readonly clearRowMode: (id: string) => void;
  readonly setRowMode: (id: string, mode: RowMode) => void;
}

function DocumentNameCell({
  mode,
  canManage,
  document,
  onNameClick,
  renameLabel,
  commitRename,
  clearRowMode,
  setRowMode,
}: DocumentNameCellProps): ReactNode {
  if (mode === 'renaming' && canManage) {
    return (
      <InlineEdit
        initialValue={document.name}
        ariaLabel={renameLabel}
        onCommit={(name) => commitRename(document, name)}
        onCancel={() => clearRowMode(document.id)}
      />
    );
  }
  if (onNameClick) {
    return (
      <button
        type="button"
        data-granit-documents-list-name=""
        onClick={(event) => {
          event.stopPropagation();
          onNameClick(document);
        }}
        onDoubleClick={(event) => {
          if (canManage) {
            event.stopPropagation();
            setRowMode(document.id, 'renaming');
          }
        }}
      >
        {document.name}
      </button>
    );
  }
  return <span data-granit-documents-list-name="">{document.name}</span>;
}

// ---------------------------------------------------------------------------
// Module-level utility functions (extracted to reduce DocumentsListBody
// cognitive complexity — these contain the branching logic so the component
// body stays flat).
// ---------------------------------------------------------------------------

interface KeyDownHandlerParams {
  readonly items: readonly DocumentResponse[];
  readonly focusedId: string | null;
  readonly setFocusedId: (id: string | null) => void;
  readonly selection: MultiSelectApi;
  readonly orderedIds: readonly string[];
  readonly onOpenDocument: ((id: string) => void) | undefined;
  readonly onPreviewDocument: ((doc: DocumentResponse) => void) | undefined;
  readonly canManage: boolean;
  readonly setRowMode: (id: string, mode: RowMode) => void;
}

function buildKeyDownHandler(p: KeyDownHandlerParams): (event: KeyboardEvent<HTMLElement>) => void {
  return (event) => {
    if (p.items.length === 0) return;
    const index = p.focusedId ? p.items.findIndex((d) => d.id === p.focusedId) : -1;

    // Both list and grid use the same linear nav model. In grid mode the
    // visual rows are CSS-driven (auto-fill); without a JS-tracked column
    // count we can't do Finder-style up/down between rows, so left/right
    // (and up/down) all walk the flat ordering. Good enough for v1, and
    // matches what shadcn / radix do for command palettes.
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      const next = p.items[Math.min(p.items.length - 1, index + 1)];
      if (next) {
        p.setFocusedId(next.id);
        if (event.shiftKey) p.selection.selectRange(next.id);
        else if (!event.ctrlKey && !event.metaKey) p.selection.selectOnly(next.id);
      }
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const next = p.items[Math.max(0, index - 1)];
      if (next) {
        p.setFocusedId(next.id);
        if (event.shiftKey) p.selection.selectRange(next.id);
        else if (!event.ctrlKey && !event.metaKey) p.selection.selectOnly(next.id);
      }
    } else if (event.key === 'Enter' && p.focusedId) {
      event.preventDefault();
      p.onOpenDocument?.(p.focusedId);
    } else if (event.key === ' ' && p.focusedId) {
      event.preventDefault();
      if (p.onPreviewDocument) {
        const doc = p.items.find((d) => d.id === p.focusedId);
        if (doc) p.onPreviewDocument(doc);
      } else {
        // No preview handler wired → fall back to the legacy
        // "Space toggles selection" behavior to stay accessible.
        p.selection.toggle(p.focusedId);
      }
    } else if (event.key === 'F2' && p.focusedId && p.canManage) {
      event.preventDefault();
      p.setRowMode(p.focusedId, 'renaming');
    } else if (
      (event.key === 'Delete' || event.key === 'Backspace') &&
      p.focusedId &&
      p.canManage
    ) {
      event.preventDefault();
      p.setRowMode(p.focusedId, 'confirming-trash');
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      p.selection.selectAll(p.orderedIds);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      p.selection.clear();
      p.setFocusedId(null);
    }
  };
}

interface ItemClickHandlerParams {
  readonly selection: MultiSelectApi;
  readonly setFocusedId: (id: string | null) => void;
}

function buildItemClickHandler(
  p: ItemClickHandlerParams
): (event: MouseEvent, doc: DocumentResponse) => void {
  return (event, doc) => {
    if (event.shiftKey) {
      event.preventDefault();
      p.selection.selectRange(doc.id);
    } else if (event.ctrlKey || event.metaKey) {
      p.selection.toggle(doc.id);
    } else {
      p.selection.selectOnly(doc.id);
    }
    p.setFocusedId(doc.id);
  };
}

interface ItemDragStartHandlerParams {
  readonly canManage: boolean;
  readonly selection: MultiSelectApi;
  readonly setFocusedId: (id: string | null) => void;
  readonly items: readonly DocumentResponse[];
}

function buildItemDragStartHandler(
  p: ItemDragStartHandlerParams
): (event: DragEvent, doc: DocumentResponse) => void {
  return (event, doc) => {
    if (!p.canManage) {
      event.preventDefault();
      return;
    }
    // If the dragged item is part of the current selection, move the whole
    // selection. Otherwise, drag this item only (and adopt it as the new
    // single selection, matching Finder / OneDrive behavior).
    let ids: string[];
    if (p.selection.selected.has(doc.id)) {
      ids = Array.from(p.selection.selected);
    } else {
      p.selection.selectOnly(doc.id);
      ids = [doc.id];
    }
    p.setFocusedId(doc.id);
    event.dataTransfer.setData(DOCUMENT_DRAG_MIME, JSON.stringify({ ids }));
    // Plain-text fallback so external apps (e.g. terminal, editor) see at
    // least the names. Comma-joined keeps it grep-friendly.
    const names = p.items.filter((d) => ids.includes(d.id)).map((d) => d.name);
    event.dataTransfer.setData('text/plain', names.join(', '));
    event.dataTransfer.effectAllowed = 'move';
  };
}

function DocumentsListBody({
  folderId,
  pageSize,
  canManage = false,
  viewMode = 'list',
  tileSize = DEFAULT_TILE_SIZE,
  onOpenDocument,
  onPreviewDocument,
  onSelectionChange,
  onFocusChange,
  onItemsChange,
  clearSignal,
  labels,
  className,
}: Readonly<DocumentsListProps>): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const effectivePageSize = pageSize ?? DEFAULT_PAGE_SIZE;

  const filters: readonly FilterEntry[] = useMemo(
    () => [
      { field: 'folderId', operator: 'Eq', value: folderId },
      { field: 'status', operator: 'Eq', value: 'Active' },
    ],
    [folderId]
  );
  const sort: readonly SortEntry[] = useMemo(() => [{ field: 'name', direction: 'asc' }], []);

  const { params, query, setPage } = useQueryEndpoint<DocumentResponse>({
    initialParams: { page: 1, pageSize: effectivePageSize, filters, sort },
  });

  const items = useMemo<readonly DocumentResponse[]>(() => query.data?.items ?? [], [query.data]);
  const orderedIds = useMemo(() => items.map((d) => d.id), [items]);
  const selection = useMultiSelect(orderedIds);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [rowModes, setRowModes] = useState<Readonly<Record<string, RowMode>>>({});

  const renameDocument = useRenameDocument();
  const trashDocument = useTrashDocument();

  // Reset transient row state when the folder or page changes.
  useEffect(() => {
    setRowModes({});
    setFocusedId(null);
  }, [folderId, params.page]);

  // Honor a parent-driven "clear selection" signal. We intentionally
  // depend only on the monotonic signal — `selection.clear` is a stable
  // useCallback, but listing it as a dep would re-run this every render
  // (selection is a fresh object literal each render).
  const selectionClearRef = useRef(selection.clear);
  selectionClearRef.current = selection.clear;
  useEffect(() => {
    if (clearSignal === undefined) return;
    selectionClearRef.current();
    setFocusedId(null);
    setRowModes({});
  }, [clearSignal]);

  // Surface selection / focus to parents. Depend on `selection.selected`
  // (the state Set, stable when unchanged) rather than the `selection`
  // object literal — otherwise the effect re-fires every render and bounces
  // a fresh `docs` array up to the parent, which would re-render this list
  // again. That's a textbook update loop and bit us pre-fix.
  useEffect(() => {
    if (!onSelectionChange) return;
    const docs = items.filter((d) => selection.selected.has(d.id));
    onSelectionChange(selection.selected, docs);
  }, [selection.selected, items, onSelectionChange]);

  useEffect(() => {
    if (!onFocusChange) return;
    const doc = focusedId ? (items.find((d) => d.id === focusedId) ?? null) : null;
    onFocusChange(doc);
  }, [focusedId, items, onFocusChange]);

  useEffect(() => {
    if (!onItemsChange) return;
    onItemsChange(items);
  }, [items, onItemsChange]);

  const setRowMode = useMemo(
    () =>
      (id: string, mode: RowMode): void => {
        setRowModes((prev) => ({ ...prev, [id]: mode }));
      },
    []
  );

  const clearRowMode = useMemo(
    () =>
      (id: string): void => {
        setRowModes((prev) => {
          if (!(id in prev)) return prev;
          const next = { ...prev };
          delete next[id];
          return next;
        });
      },
    []
  );

  const handleItemClick = useMemo(
    () => buildItemClickHandler({ selection, setFocusedId }),
    [selection.toggle, selection.selectRange, selection.selectOnly, setFocusedId]
  );

  const handleNameClick = useMemo(
    () =>
      (doc: DocumentResponse): void => {
        selection.selectOnly(doc.id);
        setFocusedId(doc.id);
        onOpenDocument?.(doc.id);
      },
    [selection.selectOnly, setFocusedId, onOpenDocument]
  );

  const handleItemDragStart = useMemo(
    () => buildItemDragStartHandler({ canManage, selection, setFocusedId, items }),
    [canManage, selection.selected, selection.selectOnly, setFocusedId, items]
  );

  const handleKeyDown = useMemo(
    () =>
      buildKeyDownHandler({
        items,
        focusedId,
        setFocusedId,
        selection,
        orderedIds,
        onOpenDocument,
        onPreviewDocument,
        canManage,
        setRowMode,
      }),
    [
      items,
      focusedId,
      setFocusedId,
      selection.selectRange,
      selection.selectOnly,
      selection.toggle,
      selection.selectAll,
      selection.clear,
      orderedIds,
      onOpenDocument,
      onPreviewDocument,
      canManage,
      setRowMode,
    ]
  );

  function commitRename(doc: DocumentResponse, name: string): void {
    if (name === doc.name) {
      clearRowMode(doc.id);
      return;
    }
    renameDocument.mutate(
      { id: doc.id, request: { name, description: null } },
      { onSettled: () => clearRowMode(doc.id) }
    );
  }

  function confirmTrash(doc: DocumentResponse): void {
    trashDocument.mutate(doc.id, {
      onSettled: () => {
        clearRowMode(doc.id);
        selection.remove([doc.id]);
        if (focusedId === doc.id) setFocusedId(null);
      },
    });
  }

  if (query.isLoading) {
    return (
      <div
        data-granit-documents-list=""
        data-granit-documents-list-loading=""
        data-granit-documents-list-view={viewMode}
        className={className}
      >
        {labelStrings.loading}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div
        data-granit-documents-list=""
        data-granit-documents-list-error=""
        data-granit-documents-list-view={viewMode}
        className={className}
      >
        {labelStrings.error}
      </div>
    );
  }

  const totalCount = query.data?.totalCount ?? 0;
  const currentPage = params.page ?? 1;
  const currentPageSize = params.pageSize ?? effectivePageSize;
  const totalPages = Math.max(1, Math.ceil(totalCount / currentPageSize));
  const allSelected = orderedIds.length > 0 && orderedIds.every((id) => selection.isSelected(id));

  if (items.length === 0) {
    return (
      <div
        data-granit-documents-list=""
        data-granit-documents-list-view={viewMode}
        className={className}
      >
        <div data-granit-documents-list-empty="">{labelStrings.empty}</div>
      </div>
    );
  }

  const itemRenderState = items.map((document) => ({
    document,
    isSelected: selection.isSelected(document.id),
    isFocused: focusedId === document.id,
    mode: rowModes[document.id] ?? 'idle',
    kind: classifyDocumentName(document.name),
    badge: documentBadge(document.name),
  }));

  return (
    <div
      data-granit-documents-list=""
      data-granit-documents-list-view={viewMode}
      className={className}
    >
      {viewMode === 'list' ? (
        <div role="application" tabIndex={0} onKeyDown={handleKeyDown}>
          <table data-granit-documents-list-table="">
            <thead>
              <tr>
                <th data-granit-documents-list-select-col="">
                  <input
                    type="checkbox"
                    aria-label={labelStrings.selectHeader}
                    checked={allSelected}
                    onChange={(event) =>
                      event.target.checked ? selection.selectAll(orderedIds) : selection.clear()
                    }
                  />
                </th>
                <th>{labelStrings.nameHeader}</th>
                <th>{labelStrings.statusHeader}</th>
                {canManage && <th data-granit-documents-list-actions-col="" />}
              </tr>
            </thead>
            <tbody>
              {itemRenderState.map(({ document, isSelected, isFocused, mode, kind }) => (
                <tr
                  key={document.id}
                  data-granit-documents-list-row=""
                  data-granit-document-id={document.id}
                  data-granit-document-kind={kind}
                  data-granit-documents-list-selected={isSelected ? '' : undefined}
                  data-granit-documents-list-focused={isFocused ? '' : undefined}
                  data-granit-documents-list-draggable={canManage ? '' : undefined}
                  aria-selected={isSelected}
                  tabIndex={-1}
                  draggable={canManage}
                  onClick={(event) => handleItemClick(event, document)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      selection.selectOnly(document.id);
                      setFocusedId(document.id);
                      onOpenDocument?.(document.id);
                    }
                  }}
                  onDragStart={(event) => handleItemDragStart(event, document)}
                >
                  <td data-granit-documents-list-select-cell="">
                    <input
                      type="checkbox"
                      aria-label={`${labelStrings.selectRow} ${document.name}`}
                      checked={isSelected}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => selection.toggle(document.id)}
                    />
                  </td>
                  <td>
                    <DocumentNameCell
                      mode={mode}
                      canManage={canManage}
                      document={document}
                      onNameClick={onOpenDocument ? handleNameClick : undefined}
                      renameLabel={labelStrings.rename}
                      commitRename={commitRename}
                      clearRowMode={clearRowMode}
                      setRowMode={setRowMode}
                    />
                  </td>
                  <td>{document.status}</td>
                  {canManage && (
                    <td data-granit-documents-list-actions="">
                      {mode === 'confirming-trash' ? (
                        <span data-granit-documents-list-confirm="" role="alertdialog">
                          <button type="button" onClick={() => clearRowMode(document.id)}>
                            {labelStrings.trashCancel}
                          </button>
                          <button
                            type="button"
                            data-granit-documents-list-confirm-ok=""
                            onClick={() => confirmTrash(document)}
                            disabled={trashDocument.isPending}
                          >
                            {labelStrings.trashConfirm}
                          </button>
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            aria-label={labelStrings.rename}
                            onClick={(event) => {
                              event.stopPropagation();
                              setRowMode(document.id, 'renaming');
                            }}
                          >
                            {labelStrings.rename}
                          </button>
                          <button
                            type="button"
                            aria-label={labelStrings.trash}
                            onClick={(event) => {
                              event.stopPropagation();
                              setRowMode(document.id, 'confirming-trash');
                            }}
                          >
                            {labelStrings.trash}
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div role="application" tabIndex={0} onKeyDown={handleKeyDown}>
          <ul
            data-granit-documents-list-grid=""
            // tile size becomes a CSS custom property the host stylesheet picks
            // up to drive the grid column track + tile dimensions.
            style={{ ['--granit-documents-tile-size' as string]: `${String(tileSize)}px` }}
          >
            {itemRenderState.map(({ document, isSelected, isFocused, mode, kind, badge }) => (
              <li
                key={document.id}
                data-granit-documents-list-tile=""
                data-granit-document-id={document.id}
                data-granit-document-kind={kind}
                data-granit-documents-list-selected={isSelected ? '' : undefined}
                data-granit-documents-list-focused={isFocused ? '' : undefined}
                data-granit-documents-list-draggable={canManage ? '' : undefined}
                tabIndex={-1}
                draggable={canManage}
                onClick={(event) => handleItemClick(event, document)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    selection.selectOnly(document.id);
                    setFocusedId(document.id);
                    onOpenDocument?.(document.id);
                  }
                }}
                onDoubleClick={() => onOpenDocument?.(document.id)}
                onDragStart={(event) => handleItemDragStart(event, document)}
              >
                <input
                  type="checkbox"
                  data-granit-documents-list-tile-checkbox=""
                  aria-label={`${labelStrings.selectRow} ${document.name}`}
                  checked={isSelected}
                  onClick={(event) => event.stopPropagation()}
                  onChange={() => selection.toggle(document.id)}
                />
                <div data-granit-documents-list-tile-thumb="" aria-hidden>
                  <span data-granit-documents-list-tile-badge="">{badge}</span>
                </div>
                <div data-granit-documents-list-tile-name="">
                  <DocumentNameCell
                    mode={mode}
                    canManage={canManage}
                    document={document}
                    onNameClick={onOpenDocument ? handleNameClick : undefined}
                    renameLabel={labelStrings.rename}
                    commitRename={commitRename}
                    clearRowMode={clearRowMode}
                    setRowMode={setRowMode}
                  />
                </div>
                {canManage && (
                  <div data-granit-documents-list-tile-actions="">
                    {mode === 'confirming-trash' ? (
                      <span data-granit-documents-list-confirm="" role="alertdialog">
                        <button type="button" onClick={() => clearRowMode(document.id)}>
                          {labelStrings.trashCancel}
                        </button>
                        <button
                          type="button"
                          data-granit-documents-list-confirm-ok=""
                          onClick={() => confirmTrash(document)}
                          disabled={trashDocument.isPending}
                        >
                          {labelStrings.trashConfirm}
                        </button>
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          aria-label={labelStrings.rename}
                          onClick={(event) => {
                            event.stopPropagation();
                            setRowMode(document.id, 'renaming');
                          }}
                        >
                          {labelStrings.rename}
                        </button>
                        <button
                          type="button"
                          aria-label={labelStrings.trash}
                          onClick={(event) => {
                            event.stopPropagation();
                            setRowMode(document.id, 'confirming-trash');
                          }}
                        >
                          {labelStrings.trash}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <nav data-granit-documents-list-pagination="" aria-label="Pagination">
        <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>
          {labelStrings.previous}
        </button>
        <span data-granit-documents-list-page-info="">
          {labelStrings.pageOf(currentPage, totalPages)}
        </span>
        <button
          type="button"
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          {labelStrings.next}
        </button>
      </nav>
    </div>
  );
}
