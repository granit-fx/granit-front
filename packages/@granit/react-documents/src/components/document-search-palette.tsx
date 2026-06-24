import { useDebouncedValue } from '@granit/react-data-lookup';
import { QueryProvider, useQueryEndpoint } from '@granit/react-query-engine';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDocumentsConfig } from '../providers/documents-provider';

import { classifyDocumentName, documentBadge } from './document-kind';

import type { DocumentBookmark } from '../hooks/use-document-bookmarks';
import type { DocumentResponse } from '@granit/documents';
import type { FilterEntry, SortEntry } from '@granit/query-engine';
import type { ChangeEvent, ReactNode } from 'react';

const SEARCH_QUERY_KEY_PREFIX = ['documents', 'documents', 'search'] as const;
const DEFAULT_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 200;

export interface DocumentSearchPaletteLabels {
  readonly title?: string;
  readonly placeholder?: string;
  readonly searching?: string;
  readonly noResults?: string;
  readonly recents?: string;
  readonly favorites?: string;
  readonly results?: string;
  readonly close?: string;
  readonly hint?: string;
}

export interface DocumentSearchPaletteProps {
  /** When `true`, the modal is open. */
  readonly open: boolean;
  readonly onClose: () => void;
  /** Called when the user picks a result (Enter or click). */
  readonly onPickDocument: (id: string, doc: DocumentResponse | DocumentBookmark) => void;
  /** Recent bookmarks shown when the query is empty. */
  readonly recents?: readonly DocumentBookmark[];
  /** Favorite bookmarks shown when the query is empty. */
  readonly favorites?: readonly DocumentBookmark[];
  /** Cap results per page. Defaults to 20. */
  readonly limit?: number;
  readonly labels?: DocumentSearchPaletteLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<DocumentSearchPaletteLabels> = {
  title: 'Search documents',
  placeholder: 'Type a name…',
  searching: 'Searching…',
  noResults: 'No results.',
  recents: 'Recent',
  favorites: 'Favorites',
  results: 'Results',
  close: 'Close',
  hint: '↑↓ to navigate, ↵ to open, Esc to close',
};

/**
 * Command-palette style document search — `⌘K` / `Ctrl+K` opens it from
 * the explorer. Live full-text search over the QueryEngine
 * `name Contains <query>` filter (debounced), with arrow-key navigation
 * and Enter to open. When the query is empty, falls back to two ranked
 * sections — Favorites + Recents — so the modal is useful as a "jump to
 * recently opened" launcher even without typing.
 *
 * Self-mounts a `<QueryProvider>` so it can be dropped anywhere under
 * `<DocumentsProvider>` without the caller wiring the basePath. The modal
 * uses the native `<dialog>` element (focus trap + Esc gratis); apps own
 * the visual layer via `data-granit-document-search-*` markers.
 */
export function DocumentSearchPalette(props: Readonly<DocumentSearchPaletteProps>): ReactNode {
  const config = useDocumentsConfig();
  if (!props.open) {
    // Render the closed-dialog shell so the ref-driven open effect inside
    // the body can still toggle on first prop flip without a remount jitter.
    return <ClosedDialogShell />;
  }
  return (
    <QueryProvider
      config={{
        client: config.client,
        basePath: `${config.basePath}/documents`,
        queryKeyPrefix: [...SEARCH_QUERY_KEY_PREFIX],
      }}
    >
      <DocumentSearchPaletteBody {...props} />
    </QueryProvider>
  );
}

function ClosedDialogShell(): ReactNode {
  return <dialog data-granit-document-search-palette="" aria-hidden hidden />;
}

interface PickableEntry {
  readonly id: string;
  readonly name: string;
  readonly folderId: string | null;
  readonly source: 'result' | 'favorite' | 'recent';
}

function bookmarkToEntry(b: DocumentBookmark, source: 'favorite' | 'recent'): PickableEntry {
  return { id: b.id, name: b.name, folderId: b.folderId, source };
}

function DocumentSearchPaletteBody({
  open,
  onClose,
  onPickDocument,
  recents,
  favorites,
  limit,
  labels,
  className,
}: Readonly<DocumentSearchPaletteProps>): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [draftQuery, setDraftQuery] = useState('');
  const activeQuery = useDebouncedValue(draftQuery.trim(), SEARCH_DEBOUNCE_MS);
  const [highlight, setHighlight] = useState(0);

  // Reset state on every open so the palette doesn't show stale results.
  useEffect(() => {
    if (open) {
      setDraftQuery('');
      setHighlight(0);
    }
  }, [open]);

  // Sync the native <dialog> open state with the `open` prop.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      try {
        dialog.showModal();
      } catch {
        /* jsdom corner cases */
      }
      // Defer focus until after layout — `showModal()` doesn't always grab.
      queueMicrotask(() => inputRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const effectiveLimit = limit ?? DEFAULT_LIMIT;
  const initialFilters: readonly FilterEntry[] = useMemo(
    () => [{ field: 'status', operator: 'Eq', value: 'Active' }],
    []
  );
  const sort: readonly SortEntry[] = useMemo(() => [{ field: 'name', direction: 'asc' }], []);

  const { query, setFilters } = useQueryEndpoint<DocumentResponse>({
    initialParams: {
      page: 1,
      pageSize: effectiveLimit,
      filters: initialFilters,
      sort,
    },
    // Only hit the network when there's actually a query — empty searches
    // are served from the local Favorites / Recents lists.
    enabled: activeQuery.length > 0,
  });

  // Push the live `Contains` filter into the reducer whenever the debounced
  // active query changes. The reducer only captures `initialParams` once at
  // mount, so subsequent filter shape changes have to go through `setFilters`.
  useEffect(() => {
    if (activeQuery.length === 0) {
      setFilters([{ field: 'status', operator: 'Eq', value: 'Active' }]);
      return;
    }
    setFilters([
      { field: 'status', operator: 'Eq', value: 'Active' },
      { field: 'name', operator: 'Contains', value: activeQuery },
    ]);
  }, [activeQuery, setFilters]);

  // Merge the visible items into a flat ordered list so arrow-key nav
  // walks a single index regardless of section. Search results take
  // precedence when present; otherwise fall back to favorites + recents.
  const entries: readonly PickableEntry[] = useMemo(() => {
    if (activeQuery.length > 0) {
      const items = query.data?.items ?? [];
      return items.map<PickableEntry>((d) => ({
        id: d.id,
        name: d.name,
        folderId: d.folderId,
        source: 'result',
      }));
    }
    const out: PickableEntry[] = [];
    for (const f of favorites ?? []) out.push(bookmarkToEntry(f, 'favorite'));
    for (const r of recents ?? []) {
      if (!out.some((e) => e.id === r.id)) out.push(bookmarkToEntry(r, 'recent'));
    }
    return out;
  }, [activeQuery, query.data, favorites, recents]);

  // Clamp the highlight when entries shrink (e.g. user typed → fewer matches).
  useEffect(() => {
    if (highlight >= entries.length) setHighlight(Math.max(0, entries.length - 1));
  }, [entries.length, highlight]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlight((h) => Math.min(entries.length - 1, h + 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlight((h) => Math.max(0, h - 1));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const picked = entries[highlight];
        if (!picked) return;
        onPickDocument(picked.id, {
          id: picked.id,
          name: picked.name,
          folderId: picked.folderId,
          recordedAt: Date.now(),
        });
      }
    },
    [entries, highlight, onPickDocument]
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.addEventListener('keydown', handleKeyDown);
    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>): void {
    setDraftQuery(event.target.value);
    setHighlight(0);
  }

  const hasQuery = activeQuery.length > 0;
  const isLoading = hasQuery && query.isLoading;
  const isEmpty = hasQuery && !isLoading && entries.length === 0;

  return (
    <dialog
      ref={dialogRef}
      data-granit-document-search-palette=""
      aria-label={labelStrings.title}
      className={className}
      onClose={onClose}
      onCancel={onClose}
    >
      <div data-granit-document-search-palette-input-row="">
        <input
          ref={inputRef}
          type="search"
          data-granit-document-search-palette-input=""
          value={draftQuery}
          aria-label={labelStrings.title}
          placeholder={labelStrings.placeholder}
          onChange={handleInputChange}
        />
        <button
          type="button"
          data-granit-document-search-palette-close=""
          aria-label={labelStrings.close}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div data-granit-document-search-palette-body="">
        {isLoading && (
          <div data-granit-document-search-palette-loading="">{labelStrings.searching}</div>
        )}
        {isEmpty && (
          <div data-granit-document-search-palette-empty="">{labelStrings.noResults}</div>
        )}
        {!hasQuery && entries.length > 0 && (
          <SectionedEntries
            entries={entries}
            highlight={highlight}
            labels={labelStrings}
            onPick={(picked) =>
              onPickDocument(picked.id, {
                id: picked.id,
                name: picked.name,
                folderId: picked.folderId,
                recordedAt: Date.now(),
              })
            }
            onHover={setHighlight}
          />
        )}
        {hasQuery && !isLoading && entries.length > 0 && (
          <ul
            data-granit-document-search-palette-list=""
            data-granit-document-search-palette-section="results"
          >
            {entries.map((entry, index) => (
              <EntryRow
                key={`${entry.source}-${entry.id}`}
                entry={entry}
                highlighted={index === highlight}
                onPick={() =>
                  onPickDocument(entry.id, {
                    id: entry.id,
                    name: entry.name,
                    folderId: entry.folderId,
                    recordedAt: Date.now(),
                  })
                }
                onHover={() => setHighlight(index)}
              />
            ))}
          </ul>
        )}
      </div>
      <footer data-granit-document-search-palette-footer="">
        <span>{labelStrings.hint}</span>
      </footer>
    </dialog>
  );
}

interface SectionedEntriesProps {
  readonly entries: readonly PickableEntry[];
  readonly highlight: number;
  readonly labels: Required<DocumentSearchPaletteLabels>;
  readonly onPick: (entry: PickableEntry) => void;
  readonly onHover: (index: number) => void;
}

function SectionedEntries({
  entries,
  highlight,
  labels,
  onPick,
  onHover,
}: SectionedEntriesProps): ReactNode {
  const favorites = entries.filter((e) => e.source === 'favorite');
  const recents = entries.filter((e) => e.source === 'recent');
  const indexOf = (entry: PickableEntry): number => entries.indexOf(entry);

  return (
    <>
      {favorites.length > 0 && (
        <ul
          data-granit-document-search-palette-list=""
          data-granit-document-search-palette-section="favorites"
        >
          <li data-granit-document-search-palette-section-title="">{labels.favorites}</li>
          {favorites.map((entry) => {
            const index = indexOf(entry);
            return (
              <EntryRow
                key={`fav-${entry.id}`}
                entry={entry}
                highlighted={index === highlight}
                onPick={() => onPick(entry)}
                onHover={() => onHover(index)}
              />
            );
          })}
        </ul>
      )}
      {recents.length > 0 && (
        <ul
          data-granit-document-search-palette-list=""
          data-granit-document-search-palette-section="recents"
        >
          <li data-granit-document-search-palette-section-title="">{labels.recents}</li>
          {recents.map((entry) => {
            const index = indexOf(entry);
            return (
              <EntryRow
                key={`rec-${entry.id}`}
                entry={entry}
                highlighted={index === highlight}
                onPick={() => onPick(entry)}
                onHover={() => onHover(index)}
              />
            );
          })}
        </ul>
      )}
    </>
  );
}

interface EntryRowProps {
  readonly entry: PickableEntry;
  readonly highlighted: boolean;
  readonly onPick: () => void;
  readonly onHover: () => void;
}

function EntryRow({ entry, highlighted, onPick, onHover }: EntryRowProps): ReactNode {
  const kind = classifyDocumentName(entry.name);
  const badge = documentBadge(entry.name);
  return (
    <li
      data-granit-document-search-palette-entry=""
      data-granit-document-id={entry.id}
      data-granit-document-kind={kind}
      data-granit-document-search-palette-source={entry.source}
      data-granit-document-search-palette-highlighted={highlighted ? '' : undefined}
      onMouseMove={onHover}
    >
      <button type="button" data-granit-document-search-palette-entry-button="" onClick={onPick}>
        <span data-granit-document-search-palette-entry-badge="">{badge}</span>
        <span data-granit-document-search-palette-entry-name="">{entry.name}</span>
      </button>
    </li>
  );
}
