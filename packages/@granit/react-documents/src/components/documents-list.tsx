import { QueryProvider, useQueryEndpoint } from '@granit/react-query-engine';
import { useEffect, useMemo, useRef, useState } from 'react';

import { DOCUMENT_DRAG_MIME } from '../constants.js';
import { useRenameDocument, useTrashDocument } from '../hooks/use-document-mutations.js';
import { useMultiSelect } from '../hooks/use-multi-select.js';
import { useDocumentsConfig } from '../providers/documents-provider.js';

import { InlineEdit } from './inline-edit.js';

import type { DocumentResponse } from '@granit/documents';
import type { FilterEntry, SortEntry } from '@granit/query-engine';
import type { DragEvent, KeyboardEvent, MouseEvent, ReactNode } from 'react';

const LIST_QUERY_KEY_PREFIX = ['documents', 'documents', 'list'] as const;
const DEFAULT_PAGE_SIZE = 50;

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
  /** Open / preview a single document (Enter key or single click on name). */
  readonly onOpenDocument?: (id: string) => void;
  /** Bubbles the current selection (ids) to a parent toolbar or inspector. */
  readonly onSelectionChange?: (
    ids: ReadonlySet<string>,
    docs: readonly DocumentResponse[]
  ) => void;
  /** Bubbles the focused row (last single-clicked) for inspector binding. */
  readonly onFocusChange?: (doc: DocumentResponse | null) => void;
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
 * Beyond display, the list exposes:
 *  - Multi-selection (click / ctrl-click / shift-click / select-all checkbox).
 *  - Keyboard navigation: ↑↓ focus, Enter opens, F2 renames, Space toggles
 *    selection, Delete trashes the focused row (with inline confirm).
 *  - Inline rename via {@link InlineEdit} (replaces `window.prompt`).
 *  - Inline trash confirmation (replaces `window.confirm`).
 *  - Selection / focus callbacks for an external toolbar + inspector.
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

function DocumentsListBody({
  folderId,
  pageSize,
  canManage = false,
  onOpenDocument,
  onSelectionChange,
  onFocusChange,
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
  const tableRef = useRef<HTMLTableElement | null>(null);

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

  function setRowMode(id: string, mode: RowMode): void {
    setRowModes((prev) => ({ ...prev, [id]: mode }));
  }

  function clearRowMode(id: string): void {
    setRowModes((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function handleRowClick(event: MouseEvent<HTMLTableRowElement>, doc: DocumentResponse): void {
    if (event.shiftKey) {
      event.preventDefault();
      selection.selectRange(doc.id);
    } else if (event.ctrlKey || event.metaKey) {
      selection.toggle(doc.id);
    } else {
      selection.selectOnly(doc.id);
    }
    setFocusedId(doc.id);
  }

  function handleNameClick(doc: DocumentResponse): void {
    selection.selectOnly(doc.id);
    setFocusedId(doc.id);
    onOpenDocument?.(doc.id);
  }

  function handleRowDragStart(event: DragEvent<HTMLTableRowElement>, doc: DocumentResponse): void {
    if (!canManage) {
      event.preventDefault();
      return;
    }
    // If the dragged row is part of the current selection, move the whole
    // selection. Otherwise, drag this row only (and adopt it as the new
    // single selection, matching Finder / OneDrive behavior).
    let ids: string[];
    if (selection.selected.has(doc.id)) {
      ids = Array.from(selection.selected);
    } else {
      selection.selectOnly(doc.id);
      ids = [doc.id];
    }
    setFocusedId(doc.id);
    event.dataTransfer.setData(DOCUMENT_DRAG_MIME, JSON.stringify({ ids }));
    // Plain-text fallback so external apps (e.g. terminal, editor) see at
    // least the names. Comma-joined keeps it grep-friendly.
    const names = items.filter((d) => ids.includes(d.id)).map((d) => d.name);
    event.dataTransfer.setData('text/plain', names.join(', '));
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableElement>): void {
    if (items.length === 0) return;
    const index = focusedId ? items.findIndex((d) => d.id === focusedId) : -1;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = items[Math.min(items.length - 1, index + 1)];
      if (next) {
        setFocusedId(next.id);
        if (event.shiftKey) selection.selectRange(next.id);
        else if (!event.ctrlKey && !event.metaKey) selection.selectOnly(next.id);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const next = items[Math.max(0, index - 1)];
      if (next) {
        setFocusedId(next.id);
        if (event.shiftKey) selection.selectRange(next.id);
        else if (!event.ctrlKey && !event.metaKey) selection.selectOnly(next.id);
      }
    } else if (event.key === 'Enter' && focusedId) {
      event.preventDefault();
      onOpenDocument?.(focusedId);
    } else if (event.key === ' ' && focusedId) {
      event.preventDefault();
      selection.toggle(focusedId);
    } else if (event.key === 'F2' && focusedId && canManage) {
      event.preventDefault();
      setRowMode(focusedId, 'renaming');
    } else if ((event.key === 'Delete' || event.key === 'Backspace') && focusedId && canManage) {
      event.preventDefault();
      setRowMode(focusedId, 'confirming-trash');
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      selection.selectAll(orderedIds);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      selection.clear();
      setFocusedId(null);
    }
  }

  function commitRename(doc: DocumentResponse, name: string): void {
    if (name === doc.name) {
      clearRowMode(doc.id);
      return;
    }
    renameDocument.mutate(
      { id: doc.id, request: { name } },
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
        className={className}
      >
        {labelStrings.loading}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div data-granit-documents-list="" data-granit-documents-list-error="" className={className}>
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
      <div data-granit-documents-list="" className={className}>
        <div data-granit-documents-list-empty="">{labelStrings.empty}</div>
      </div>
    );
  }

  return (
    <div data-granit-documents-list="" className={className}>
      <table
        ref={tableRef}
        data-granit-documents-list-table=""
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
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
          {items.map((document) => {
            const isSelected = selection.isSelected(document.id);
            const isFocused = focusedId === document.id;
            const mode = rowModes[document.id] ?? 'idle';
            return (
              <tr
                key={document.id}
                data-granit-documents-list-row=""
                data-granit-document-id={document.id}
                data-granit-documents-list-selected={isSelected ? '' : undefined}
                data-granit-documents-list-focused={isFocused ? '' : undefined}
                data-granit-documents-list-draggable={canManage ? '' : undefined}
                aria-selected={isSelected}
                draggable={canManage}
                onClick={(event) => handleRowClick(event, document)}
                onDragStart={(event) => handleRowDragStart(event, document)}
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
                  {mode === 'renaming' && canManage ? (
                    <InlineEdit
                      initialValue={document.name}
                      ariaLabel={labelStrings.rename}
                      onCommit={(name) => commitRename(document, name)}
                      onCancel={() => clearRowMode(document.id)}
                    />
                  ) : onOpenDocument ? (
                    <button
                      type="button"
                      data-granit-documents-list-name=""
                      onClick={(event) => {
                        event.stopPropagation();
                        handleNameClick(document);
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
                  ) : (
                    <span data-granit-documents-list-name="">{document.name}</span>
                  )}
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
            );
          })}
        </tbody>
      </table>
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
