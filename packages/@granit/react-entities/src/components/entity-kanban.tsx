import { useQueryEndpoint, useQueryMeta } from '@granit/react-query-engine';
import { useMemo, type ReactNode } from 'react';

import type { EntityManifestResponse } from '@granit/entities';

export interface EntityKanbanProps {
  /** The entity manifest (typically from `useEntityMetadata`). */
  readonly manifest: EntityManifestResponse;
  /**
   * Property name used to bucket cards into columns. Should be a
   * categorical field (typically `Status`); the renderer reads
   * `row[groupBy]` for every fetched item and groups them client-side.
   */
  readonly groupBy: string;
  /**
   * Property used as the card title. Defaults to
   * `manifest.identity.displayProperty`, falling back to the row's `name`
   * / `Name` field if neither is available.
   */
  readonly titleProperty?: string;
  /** Optional card activation handler — receives the full row object. */
  readonly onCardClick?: (row: Readonly<Record<string, unknown>>) => void;
  /** Optional class for the root element. */
  readonly className?: string;
}

/**
 * Generic read-only kanban board. Bridges the entity manifest's
 * `collections.query` to the host's ambient `<QueryProvider>`, fetches a
 * page of items via `useQueryEndpoint`, and buckets them client-side by
 * `row[groupBy]` to produce one column per distinct value.
 *
 * **Read-only scope** — drag-and-drop status transitions land in a
 * follow-up story once the manifest exposes a workflow / mutation
 * contract (per ADR-048 §5). For now the kanban surfaces the board
 * shape; transitions go through whatever action surface the entity
 * provides (smart buttons, action bar, etc.).
 *
 * Pagination is intentionally omitted: kanban boards are dense by
 * design, and adding it now would require deciding between "infinite
 * scroll within a column" vs "global page bar across all columns" — a
 * UX choice that's better made once a real consumer asks for it.
 */
export function EntityKanban({
  manifest,
  groupBy,
  titleProperty,
  onCardClick,
  className,
}: EntityKanbanProps): ReactNode {
  const hasQuery = manifest.collections?.query != null;
  if (!hasQuery) {
    return (
      <div
        data-granit-entity-kanban=""
        data-granit-entity-kanban-empty=""
        data-entity={manifest.identity?.name}
        className={className}
      />
    );
  }

  return (
    <div
      data-granit-entity-kanban=""
      data-entity={manifest.identity?.name}
      data-group-by={groupBy}
      className={className}
    >
      <EntityKanbanBody
        groupBy={groupBy}
        titleProperty={titleProperty ?? manifest.identity?.displayProperty ?? 'Name'}
        onCardClick={onCardClick}
      />
    </div>
  );
}

interface EntityKanbanBodyProps {
  readonly groupBy: string;
  readonly titleProperty: string;
  readonly onCardClick: ((row: Readonly<Record<string, unknown>>) => void) | undefined;
}

function EntityKanbanBody({
  groupBy,
  titleProperty,
  onCardClick,
}: EntityKanbanBodyProps): ReactNode {
  const meta = useQueryMeta();
  const { query } = useQueryEndpoint<Readonly<Record<string, unknown>>>();

  const groups = useMemo(
    () => bucketByField(query.data?.items ?? [], groupBy),
    [query.data, groupBy]
  );

  if (meta.isError || query.isError) {
    return (
      <div data-granit-entity-kanban-error="" role="alert">
        {String((meta.error ?? query.error)?.message ?? 'Failed to load')}
      </div>
    );
  }
  if (query.isLoading) {
    return <div data-granit-entity-kanban-loading="">Loading…</div>;
  }

  return (
    <div data-granit-entity-kanban-board="">
      {groups.map(({ key, label, items }) => (
        <section key={key} data-granit-kanban-column="" data-group-key={key}>
          <header data-granit-kanban-column-header="">
            <span data-granit-kanban-column-title="">{label}</span>
            <span data-granit-kanban-column-count="">{items.length}</span>
          </header>
          <ul data-granit-kanban-cards="">
            {items.map((row, idx) => (
              <li
                key={readRowKey(row, idx)}
                data-granit-kanban-card=""
                onClick={onCardClick ? () => onCardClick(row) : undefined}
                style={onCardClick ? { cursor: 'pointer' } : undefined}
              >
                {formatTitle(row[titleProperty]) ?? readRowKey(row, idx)}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

interface KanbanGroup {
  readonly key: string;
  readonly label: string;
  readonly items: readonly Readonly<Record<string, unknown>>[];
}

/**
 * Walks the items once, buckets them by `row[groupBy]` value, and
 * preserves first-seen order so the column layout is stable across
 * refetches (rather than alphabetical, which would jump as new values
 * appear).
 */
function bucketByField(
  items: readonly Readonly<Record<string, unknown>>[],
  groupBy: string
): readonly KanbanGroup[] {
  const buckets = new Map<string, { label: string; items: Readonly<Record<string, unknown>>[] }>();
  for (const item of items) {
    const raw = item[groupBy];
    const key = raw === null || raw === undefined ? '∅' : String(raw);
    const label = raw === null || raw === undefined ? '—' : String(raw);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { label, items: [] };
      buckets.set(key, bucket);
    }
    bucket.items.push(item);
  }
  return Array.from(buckets, ([key, value]) => ({ key, label: value.label, items: value.items }));
}

function readRowKey(row: Readonly<Record<string, unknown>>, fallbackIndex: number): string {
  const id = row['id'] ?? row['Id'];
  if (typeof id === 'string' || typeof id === 'number') return String(id);
  return String(fallbackIndex);
}

function formatTitle(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return null;
  return String(value);
}
