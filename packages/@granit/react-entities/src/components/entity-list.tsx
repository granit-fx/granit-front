import { useQueryEndpoint, useQueryMeta } from '@granit/react-query-engine';
import { useMemo, type ReactNode } from 'react';

import { useEntityRenderer } from '../providers/entity-renderer-provider';

import type { EntityManifestResponse } from '@granit/entities';
import type { ColumnDefinition } from '@granit/query-engine';

export interface EntityListProps {
  /** The entity manifest (typically from `useEntityMetadata`). */
  readonly manifest: EntityManifestResponse;
  /** Optional row activation handler — receives the full row object. */
  readonly onRowClick?: (row: Readonly<Record<string, unknown>>) => void;
  /** Optional class for the root element. */
  readonly className?: string;
}

/**
 * Generic list renderer. Bridges the entity manifest's `collections.query`
 * reference to the host's `<QueryProvider>` ambient configuration: column
 * definitions come from `useQueryMeta()`, paged rows from
 * `useQueryEndpoint()`, and the renderer paints a minimal HTML `<table>`.
 *
 * Wrap with the right `<QueryProvider>` for the entity's list endpoint:
 *
 * ```tsx
 * <QueryProvider config={{ basePath: '/api/v1/parties' }}>
 *   <EntityList manifest={partyManifest} />
 * </QueryProvider>
 * ```
 *
 * Manifests without a list collection (`collections.query === null`) render
 * a `data-granit-entity-list-empty` marker rather than an empty table —
 * the manifest itself is the source of truth for whether the entity is
 * even listable. Apps style via `className` + `data-*` attributes; full
 * filter / sort / search / saved-views UI lands in follow-up stories.
 */
export function EntityList({ manifest, onRowClick, className }: EntityListProps): ReactNode {
  const hasQuery = manifest.collections?.query != null;

  if (!hasQuery) {
    return (
      <div
        data-granit-entity-list=""
        data-granit-entity-list-empty=""
        data-entity={manifest.identity?.name}
        className={className}
      >
        {/* Manifest declares no list collection for this entity. */}
      </div>
    );
  }

  return (
    <div data-granit-entity-list="" data-entity={manifest.identity?.name} className={className}>
      <EntityListBody onRowClick={onRowClick} />
    </div>
  );
}

interface EntityListBodyProps {
  readonly onRowClick: ((row: Readonly<Record<string, unknown>>) => void) | undefined;
}

function EntityListBody({ onRowClick }: EntityListBodyProps): ReactNode {
  const { resolveLabel } = useEntityRenderer();
  const meta = useQueryMeta();
  const { query, params, setPage } = useQueryEndpoint<Readonly<Record<string, unknown>>>();

  const visibleColumns = useMemo<readonly ColumnDefinition[]>(
    () =>
      meta.data
        ? [...meta.data.columns].filter((c) => c.isVisible).sort((a, b) => a.order - b.order)
        : [],
    [meta.data]
  );

  if (meta.isError || query.isError) {
    return (
      <div data-granit-entity-list-error="" role="alert">
        {String((meta.error ?? query.error)?.message ?? 'Failed to load')}
      </div>
    );
  }
  if (meta.isLoading || !meta.data) {
    return <div data-granit-entity-list-loading="">Loading…</div>;
  }

  const items = query.data?.items ?? [];
  const totalCount = query.data?.totalCount ?? 0;
  const pageSize = params.pageSize ?? 20;
  const page = params.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <>
      <table data-granit-entity-list-table="">
        <thead>
          <tr>
            {visibleColumns.map((column) => (
              <th key={column.name} data-column={column.name}>
                {resolveLabel(column.label, column.label)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && !query.isLoading ? (
            <tr data-granit-entity-list-empty-row="">
              <td colSpan={visibleColumns.length}>—</td>
            </tr>
          ) : (
            items.map((row, idx) => (
              <tr
                key={readRowKey(row, idx)}
                data-granit-entity-list-row=""
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
              >
                {visibleColumns.map((column) => (
                  <td key={column.name} data-column={column.name}>
                    {formatCell(row[column.name])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <nav data-granit-entity-list-pagination="" aria-label="Pagination">
        <button
          type="button"
          data-granit-pagination-prev=""
          disabled={page <= 1 || query.isFetching}
          onClick={() => setPage(page - 1)}
        >
          ‹
        </button>
        <span data-granit-pagination-status="">
          {page} / {totalPages} · {totalCount}
        </span>
        <button
          type="button"
          data-granit-pagination-next=""
          disabled={page >= totalPages || query.isFetching}
          onClick={() => setPage(page + 1)}
        >
          ›
        </button>
      </nav>
    </>
  );
}

function readRowKey(row: Readonly<Record<string, unknown>>, fallbackIndex: number): string {
  const id = row['id'] ?? row['Id'];
  if (typeof id === 'string' || typeof id === 'number') return String(id);
  return String(fallbackIndex);
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? '✓' : '✗';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return '—';
}
