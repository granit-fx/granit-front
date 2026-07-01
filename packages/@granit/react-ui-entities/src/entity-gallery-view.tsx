import { getPage, type PagedResult, type QueryRequest } from '@granit/query-engine';
import {
  EntityGallery,
  entityGalleryGroupedQueryKey,
  type EntityActionHandlers,
} from '@granit/react-entities';
import { useQueryConfig, useQueryEndpointState } from '@granit/react-query-engine';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import type { ExtendedEntityManifest } from './manifest-extensions';
import type { EntityGalleryLayoutManifest, EntityManifestResponse } from '@granit/entities';
import type { ReactNode } from 'react';

/**
 * Image slot — the host injects the image layer (e.g. `<BlobImage>` from
 * `@granit/react-blob-storage`) so this package stays storage-agnostic.
 * Signature matches the framework `<EntityGallery>`'s `renderImage`.
 */
export type GalleryRenderImage = (
  blobId: string | null,
  row: Readonly<Record<string, unknown>>
) => ReactNode;

export interface EntityGalleryViewProps {
  readonly manifest: ExtendedEntityManifest;
  readonly layout: EntityGalleryLayoutManifest;
  readonly onCardClick?: (id: string) => void;
  /**
   * Per-kind handler overrides forwarded to `<EntityGallery>` so card
   * `Navigate` actions stay in-app via React Router instead of falling
   * back to the framework default (`globalThis.location.href`).
   */
  readonly actionHandlers?: EntityActionHandlers;
  /** Renders each card's image — injected by the host (storage-agnostic). */
  readonly renderImage: GalleryRenderImage;
}

const DEFAULT_PAGE_SIZE = 50;

// Host wrapper around the framework's `<EntityGallery />`. Two modes:
//
//   * Flat (no ambient `groupBy`): delegate fully to `<EntityGallery>`
//     — framework owns the infinite-query, sentinel, card markup, and
//     calls our `renderImage` slot per card so `<BlobImage>` resolves
//     URLs (auth + lazy + onError fallback to the CSS placeholder).
//
//   * Grouped (ambient `groupBy` set): render manually because the
//     framework still paints flat even when grouping (section
//     rendering scheduled in a follow-up). Items come back sorted by
//     the groupBy field (server-side primary sort), so a single linear
//     pass walks them and emits a `<header>` whenever the value
//     changes — section breaks for free, infinite scroll preserved
//     end-to-end. CSS `grid-column: 1 / -1` makes the header span the
//     full row of the auto-fill grid.
//
// As soon as the framework `<EntityGallery>` ships native sectioning,
// the grouped branch can be dropped — the wrapper collapses back to
// the flat delegation.
export function EntityGalleryView({
  manifest,
  layout,
  onCardClick,
  actionHandlers,
  renderImage,
}: EntityGalleryViewProps) {
  const { params } = useQueryEndpointState();
  const handleCardClick = useCardClickHandler(onCardClick);

  if (params.groupBy != null) {
    return (
      <GroupedGallery
        manifest={manifest}
        layout={layout}
        groupBy={params.groupBy}
        onCardClick={handleCardClick}
        renderImage={renderImage}
      />
    );
  }

  return (
    <div data-slot="entity-gallery-view">
      <EntityGallery
        manifest={manifest as unknown as EntityManifestResponse}
        layout={layout}
        onCardClick={handleCardClick}
        actionHandlers={actionHandlers}
        renderImage={renderImage}
      />
    </div>
  );
}

interface GroupedGalleryProps {
  readonly manifest: ExtendedEntityManifest;
  readonly layout: EntityGalleryLayoutManifest;
  readonly groupBy: string;
  readonly onCardClick: ((row: Readonly<Record<string, unknown>>) => void) | undefined;
  readonly renderImage: GalleryRenderImage;
}

function GroupedGallery({
  manifest,
  layout,
  groupBy,
  onCardClick,
  renderImage,
}: GroupedGalleryProps) {
  const { params } = useQueryEndpointState();
  const config = useQueryConfig();
  const sentinelRef = useRef<HTMLLIElement | null>(null);

  // Mirror the framework's request composition: ambient filter / sort
  // / search / groupBy / quickFilters / presets, plus the gallery's
  // own page-size override. The infinite query owns the page cursor.
  const baseRequest = useMemo<QueryRequest>(() => {
    const rest: QueryRequest = { ...params };
    delete (rest as { page?: number }).page;
    return { ...rest, pageSize: DEFAULT_PAGE_SIZE };
  }, [params]);

  const query = useInfiniteQuery({
    queryKey: entityGalleryGroupedQueryKey(config.basePath, baseRequest),
    queryFn: ({ pageParam }) =>
      getPage<Readonly<Record<string, unknown>>>(config.client, config.basePath, {
        ...baseRequest,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
  });

  const items = useMemo(() => flattenPages(query.data?.pages), [query.data]);
  const exhausted = !query.hasNextPage && !query.isLoading;

  // Mirror the framework's sentinel pattern. Pulling the dispatch
  // out of `query` (rather than passing the whole object as a dep)
  // keeps the effect from re-arming on every status tick — the
  // `useInfiniteQuery` return identity changes more often than the
  // bits we actually depend on.
  const fetchNextPage = query.fetchNextPage;
  const hasNextPage = query.hasNextPage;
  const isFetchingNextPage = query.isFetchingNextPage;
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (!hasNextPage || isFetchingNextPage) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          fetchNextPage().catch(() => undefined);
        }
      },
      { rootMargin: '256px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, items.length]);

  if (query.isError) {
    return (
      <div data-slot="entity-gallery-view">
        <div data-granit-gallery-error="" role="alert">
          {String((query.error as Error | undefined)?.message ?? 'Failed to load')}
        </div>
      </div>
    );
  }
  if (query.isLoading) {
    return (
      <div data-slot="entity-gallery-view">
        <div data-granit-gallery-loading="" />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div data-slot="entity-gallery-view">
        <div data-granit-gallery-empty="" />
      </div>
    );
  }

  const titleProperty = layout.titlePropertyName ?? manifest.identity?.displayProperty ?? null;
  const subtitleProperty = layout.subtitlePropertyName;

  // Walk items linearly, emitting a header `<li>` whenever the
  // groupBy field value changes. The header carries `grid-column:
  // 1 / -1` (CSS) so it spans the full row — visually breaks the
  // grid into labelled sections without changing the cards' grid
  // contract.
  const elements: ReactNode[] = [];
  let lastGroupValue: unknown = NO_GROUP;
  let currentGroupCount = 0;
  let lastHeaderIndex = -1;

  for (let i = 0; i < items.length; i++) {
    const row = items[i]!;
    const groupValue = readRowField(row, groupBy);
    if (!isSameGroup(groupValue, lastGroupValue)) {
      // Patch the previous header with its final count before moving on.
      if (lastHeaderIndex >= 0) {
        elements[lastHeaderIndex] = renderGroupHeader(
          lastGroupValue,
          currentGroupCount,
          lastHeaderIndex
        );
      }
      lastHeaderIndex = elements.length;
      currentGroupCount = 0;
      elements.push(renderGroupHeader(groupValue, currentGroupCount, lastHeaderIndex));
      lastGroupValue = groupValue;
    }
    currentGroupCount += 1;
    elements.push(
      <GroupedCard
        key={readRowKey(row, i)}
        row={row}
        layout={layout}
        titleProperty={titleProperty}
        subtitleProperty={subtitleProperty}
        onCardClick={onCardClick}
        renderImage={renderImage}
      />
    );
  }

  // Final header count.
  if (lastHeaderIndex >= 0) {
    elements[lastHeaderIndex] = renderGroupHeader(
      lastGroupValue,
      currentGroupCount,
      lastHeaderIndex
    );
  }

  return (
    <div
      data-slot="entity-gallery-view"
      data-granit-entity-gallery=""
      data-entity={manifest.identity?.name ?? undefined}
      data-card-size={layout.cardSize}
      data-granit-gallery-grouped=""
    >
      <ol data-granit-gallery-cards="">
        {elements}
        <li
          ref={sentinelRef}
          data-granit-gallery-sentinel=""
          data-fetching={query.isFetchingNextPage ? '' : undefined}
          data-exhausted={exhausted ? '' : undefined}
          aria-hidden="true"
        />
      </ol>
    </div>
  );
}

interface GroupedCardProps {
  readonly row: Readonly<Record<string, unknown>>;
  readonly layout: EntityGalleryLayoutManifest;
  readonly titleProperty: string | null;
  readonly subtitleProperty: string | null;
  readonly onCardClick: ((row: Readonly<Record<string, unknown>>) => void) | undefined;
  readonly renderImage: GalleryRenderImage;
}

function GroupedCard({
  row,
  layout,
  titleProperty,
  subtitleProperty,
  onCardClick,
  renderImage,
}: GroupedCardProps) {
  const blobId = readScalar(row[layout.imagePropertyName]);
  const title = titleProperty ? readScalar(readRowField(row, titleProperty)) : null;
  const subtitle = subtitleProperty ? readScalar(readRowField(row, subtitleProperty)) : null;
  const rowId = readScalar(row['id'] ?? row['Id']);
  const inner = (
    <>
      {renderImage(blobId, row)}
      {title === null ? null : <span data-granit-gallery-card-title="">{title}</span>}
      {subtitle === null ? null : <span data-granit-gallery-card-subtitle="">{subtitle}</span>}
    </>
  );
  return (
    <li
      data-granit-gallery-card=""
      data-row-id={rowId ?? undefined}
      data-image-blob-id={blobId ?? undefined}
    >
      {onCardClick ? (
        <button
          type="button"
          onClick={() => onCardClick(row)}
          data-granit-gallery-card-button=""
          className="block w-full cursor-pointer appearance-none border-0 bg-transparent p-0 text-inherit text-left"
        >
          {inner}
        </button>
      ) : (
        inner
      )}
    </li>
  );
}

function renderGroupHeader(value: unknown, count: number, key: number): ReactNode {
  const label = stringifyGroupValue(value);
  return (
    <li
      key={`granit-gallery-group-header-${key}`}
      data-granit-gallery-group-header=""
      role="presentation" // NOSONAR(jsx-a11y/prefer-tag-over-role)
    >
      <span data-granit-gallery-group-label="">{label}</span>
      <span data-granit-gallery-group-count="">{count}</span>
    </li>
  );
}

function useCardClickHandler(
  onCardClick: ((id: string) => void) | undefined
): ((row: Readonly<Record<string, unknown>>) => void) | undefined {
  return useCallback(
    (row: Readonly<Record<string, unknown>>) => {
      if (!onCardClick) return;
      const id = row['id'] ?? row['Id'];
      if (typeof id === 'string') onCardClick(id);
    },
    [onCardClick]
  );
}

const NO_GROUP = Symbol('no-group');

function isSameGroup(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  return false;
}

function readRowField(row: Readonly<Record<string, unknown>>, fieldName: string): unknown {
  if (fieldName in row) return row[fieldName];
  const camel = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
  return row[camel];
}

function readScalar(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return null;
  return String(value); // NOSONAR: remaining types (symbol, function) stringify safely
}

function stringifyGroupValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value); // NOSONAR: remaining types (symbol, function) stringify safely
}

function readRowKey(row: Readonly<Record<string, unknown>>, fallbackIndex: number): string {
  const id = row['id'] ?? row['Id'];
  if (typeof id === 'string' || typeof id === 'number') return String(id);
  return String(fallbackIndex);
}

function nextPageParam(
  last: PagedResult<Readonly<Record<string, unknown>>>,
  pages: readonly PagedResult<Readonly<Record<string, unknown>>>[]
): number | undefined {
  if (last.hasMore !== undefined) return last.hasMore ? pages.length + 1 : undefined;
  if (last.totalCount !== null && last.totalCount !== undefined) {
    const fetched = pages.reduce((sum, page) => sum + (page.items?.length ?? 0), 0);
    return fetched < last.totalCount ? pages.length + 1 : undefined;
  }
  return undefined;
}

function flattenPages(
  pages: readonly PagedResult<Readonly<Record<string, unknown>>>[] | undefined
): readonly Readonly<Record<string, unknown>>[] {
  if (!pages) return [];
  const out: Readonly<Record<string, unknown>>[] = [];
  for (const page of pages) {
    if (page.items) out.push(...page.items);
  }
  return out;
}
