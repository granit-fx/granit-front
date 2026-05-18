import { getPage } from '@granit/query-engine';
import { useQueryConfig, useQueryEndpointState } from '@granit/react-query-engine';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';

import { EntityActionButton, resolveAction } from '../actions/entity-action-button.js';
import {
  useEntityActionDispatcher,
  type EntityActionHandlers,
} from '../actions/use-entity-action-dispatcher.js';

import type {
  EntityActionManifest,
  EntityGalleryLayoutManifest,
  EntityManifestResponse,
} from '@granit/entities';
import type { PagedResult, QueryRequest } from '@granit/query-engine';

export interface EntityGalleryProps {
  /** The entity manifest (typically from `useEntityMetadata`). */
  readonly manifest: EntityManifestResponse;
  /**
   * Gallery layout to render. When omitted, the first
   * `manifest.collections.listLayouts` entry whose `kind === 'Gallery'` is
   * used. Pass an explicit layout to disambiguate when the entity
   * declares multiple galleries (reserved for a future kind today).
   */
  readonly layout?: EntityGalleryLayoutManifest;
  /**
   * Items per page fetched from the server. Defaults to 50 — higher than
   * the standard list pageSize so each scroll batch covers a meaningful
   * viewport without thrashing the API. The server caps via the
   * `Pagination.MaxPageSize` limit declared by the entity's
   * `QueryDefinition`.
   */
  readonly pageSize?: number;
  /**
   * Slot that mounts the actual image inside each card. Receives the
   * raw `BlobReference` value read off the row at
   * `layout.imagePropertyName` (a string id, or `null` when the row
   * has no image) plus the full row object for context.
   *
   * Apps typically pass `<BlobImage blobId={…} fallback={…} />` from
   * `@granit/react-blob-storage`, but the slot stays renderer-agnostic
   * — hosts with non-blob backends (CDN URLs, data-URI thumbnails,
   * SVG icons …) plug in their own component.
   *
   * When omitted, the renderer paints the card structure (title /
   * subtitle slots, `data-image-blob-id` data attribute, sentinel)
   * but no `<img>` tag — useful for data-only screens or hosts that
   * still need to migrate their image layer.
   */
  readonly renderImage?: (
    blobId: string | null,
    row: Readonly<Record<string, unknown>>
  ) => ReactNode;
  /** Optional card activation handler — receives the full row object. */
  readonly onCardClick?: (row: Readonly<Record<string, unknown>>) => void;
  /**
   * Per-kind handler overrides forwarded to
   * `useEntityActionDispatcher`. Apps with SPA routers / workflow
   * runtimes wire `navigate` / `workflowTransition` here so card
   * action buttons execute through the host's stack.
   */
  readonly actionHandlers?: EntityActionHandlers;
  /** Optional class for the root element. */
  readonly className?: string;
}

const DEFAULT_PAGE_SIZE = 50;

/**
 * Generic read-only image-card grid renderer. Bridges the entity manifest's
 * gallery layout to the host's ambient `<QueryProvider>` and paginates via
 * `useInfiniteQuery` + an `IntersectionObserver` sentinel.
 *
 * When wrapped in a `<QueryEndpointStateProvider>`, automatically subscribes
 * to the shared filter / sort / search / quickFilters / presets — host-side
 * controls (SmartFilterBar, SortSelector, preset toggles) work transparently
 * without per-renderer wiring. Without that provider the renderer falls
 * back to pagination-only fetches (page / pageSize), useful for embed
 * scenarios where no toolbar is wired up.
 *
 * `groupByPropertyName` on the layout seeds the request as a default —
 * ambient `params.groupBy` from the provider (driven by a host-side
 * `GroupBySelector`) wins when set, so users can repivot the grid at
 * runtime, matching the table renderer's behavior. The server returns
 * grouped buckets the renderer threads through to the cards (currently
 * flat — section rendering lands in a follow-up).
 *
 *
 * ```html
 * <div data-granit-entity-gallery data-entity="…" data-card-size="Medium">
 *   <ol data-granit-gallery-cards>
 *     <li data-granit-gallery-card
 *         data-row-id="abc"
 *         data-image-blob-id="parties/avatars/abc.jpg">
 *       <span data-granit-gallery-card-title>ACME Corp</span>
 *       <span data-granit-gallery-card-subtitle>Customer</span>
 *     </li>
 *     …
 *     <li data-granit-gallery-sentinel
 *         data-fetching=""
 *         data-exhausted="" />
 *   </ol>
 * </div>
 * ```
 *
 * The sentinel is the last child of the cards list. When it scrolls into
 * view it calls `fetchNextPage()`, append the new items, and re-arm itself
 * for the next scroll. Once `hasNextPage` flips to `false` the sentinel
 * gains `data-exhausted` so apps can render their own end-of-list marker
 * (or rely on the absence of further reflow).
 *
 * Image mounting goes through the `renderImage` slot — the renderer
 * passes the row's `BlobReference` (read off `layout.imagePropertyName`)
 * to the slot, which decides how to turn the id into pixels. Hosts
 * typically pass `<BlobImage blobId={id} fallback={…} />` from
 * `@granit/react-blob-storage`; apps with non-blob backends plug in
 * their own component. When the slot is omitted the renderer paints
 * the card structure (title / subtitle / `data-image-blob-id`) but
 * no `<img>` tag.
 *
 * Title and subtitle project from the layout's `titlePropertyName`
 * (falling back to `manifest.identity.displayProperty`) and
 * `subtitlePropertyName`. Loading / error / empty surface as dedicated
 * data attributes so apps render their own placeholders without
 * inspecting React state.
 */
export function EntityGallery({
  manifest,
  layout,
  pageSize = DEFAULT_PAGE_SIZE,
  renderImage,
  onCardClick,
  actionHandlers,
  className,
}: EntityGalleryProps): ReactNode {
  const resolvedLayout = useMemo(() => layout ?? pickGalleryLayout(manifest), [layout, manifest]);

  if (!resolvedLayout || manifest.collections?.query == null) {
    return (
      <div
        data-granit-entity-gallery=""
        data-granit-entity-gallery-empty=""
        data-entity={manifest.identity?.name}
        className={className}
      />
    );
  }

  return (
    <div
      data-granit-entity-gallery=""
      data-entity={manifest.identity?.name}
      data-card-size={resolvedLayout.cardSize}
      className={className}
    >
      <EntityGalleryBody
        layout={resolvedLayout}
        actions={resolveCardActions(resolvedLayout.actions, manifest.actions)}
        actionHandlers={actionHandlers}
        titleFallback={manifest.identity?.displayProperty}
        pageSize={pageSize}
        renderImage={renderImage}
        onCardClick={onCardClick}
      />
    </div>
  );
}

function resolveCardActions(
  refs: readonly { readonly name: string }[],
  actions: readonly EntityActionManifest[] | null
): readonly EntityActionManifest[] {
  if (refs.length === 0 || !actions) return [];
  const resolved: EntityActionManifest[] = [];
  for (const ref of refs) {
    const action = resolveAction(ref, actions);
    if (action) resolved.push(action);
  }
  return resolved;
}

interface EntityGalleryBodyProps {
  readonly layout: EntityGalleryLayoutManifest;
  readonly actions: readonly EntityActionManifest[];
  readonly actionHandlers: EntityActionHandlers | undefined;
  readonly titleFallback: string | null | undefined;
  readonly pageSize: number;
  readonly renderImage:
    | ((blobId: string | null, row: Readonly<Record<string, unknown>>) => ReactNode)
    | undefined;
  readonly onCardClick: ((row: Readonly<Record<string, unknown>>) => void) | undefined;
}

function EntityGalleryBody({
  layout,
  actions,
  actionHandlers,
  titleFallback,
  pageSize,
  renderImage,
  onCardClick,
}: EntityGalleryBodyProps): ReactNode {
  const dispatch = useEntityActionDispatcher(actionHandlers);
  const config = useQueryConfig();
  const { params } = useQueryEndpointState();
  const sentinelRef = useRef<HTMLLIElement | null>(null);

  // Compose the base request once: the host's ambient filter / sort /
  // search / groupBy / quickFilters / presets, plus the gallery's own
  // page-size override. The layout's `groupByPropertyName` only acts
  // as a fallback when ambient `groupBy` is unset — toolbar pivots
  // win, mirroring the table renderer. The infinite query owns the
  // `page` cursor (the shared `page` is single-cursor while the gallery
  // accumulates pages through scroll).
  const baseRequest = useMemo<QueryRequest>(() => {
    const rest: QueryRequest = { ...params };
    delete (rest as { page?: number }).page;
    if (rest.groupBy == null && layout.groupByPropertyName) {
      return { ...rest, pageSize, groupBy: layout.groupByPropertyName };
    }
    return { ...rest, pageSize };
  }, [params, pageSize, layout.groupByPropertyName]);

  const query = useInfiniteQuery({
    queryKey: ['granit', 'entity-gallery', config.basePath, baseRequest] as const,
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

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (!query.hasNextPage || query.isFetchingNextPage) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          query.fetchNextPage().catch(() => {});
        }
      },
      { rootMargin: '256px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage, items.length]);

  if (query.isError) {
    return (
      <div data-granit-gallery-error="" role="alert">
        {String(query.error?.message ?? 'Failed to load')}
      </div>
    );
  }
  if (query.isLoading) {
    return <div data-granit-gallery-loading="" />;
  }
  if (items.length === 0) {
    return <div data-granit-gallery-empty="" />;
  }

  const titleProperty = layout.titlePropertyName ?? titleFallback ?? null;

  return (
    <ol data-granit-gallery-cards="">
      {items.map((row, idx) => (
        <GalleryCard
          key={readRowKey(row, idx)}
          row={row}
          imageProperty={layout.imagePropertyName}
          titleProperty={titleProperty}
          subtitleProperty={layout.subtitlePropertyName}
          renderImage={renderImage}
          onCardClick={onCardClick}
          actions={actions}
          dispatch={dispatch}
        />
      ))}
      <li
        ref={sentinelRef}
        data-granit-gallery-sentinel=""
        data-fetching={query.isFetchingNextPage ? '' : undefined}
        data-exhausted={exhausted ? '' : undefined}
        aria-hidden="true"
      />
    </ol>
  );
}

interface GalleryCardProps {
  readonly row: Readonly<Record<string, unknown>>;
  readonly imageProperty: string;
  readonly titleProperty: string | null;
  readonly subtitleProperty: string | null;
  readonly renderImage:
    | ((blobId: string | null, row: Readonly<Record<string, unknown>>) => ReactNode)
    | undefined;
  readonly onCardClick: ((row: Readonly<Record<string, unknown>>) => void) | undefined;
  readonly actions: readonly EntityActionManifest[];
  readonly dispatch: ReturnType<typeof useEntityActionDispatcher>;
}

function GalleryCard({
  row,
  imageProperty,
  titleProperty,
  subtitleProperty,
  renderImage,
  onCardClick,
  actions,
  dispatch,
}: GalleryCardProps): ReactNode {
  const blobId = readScalar(row[imageProperty]);
  const title = titleProperty ? readScalar(row[titleProperty]) : null;
  const subtitle = subtitleProperty ? readScalar(row[subtitleProperty]) : null;
  const rowId = readScalar(row['id'] ?? row['Id']);

  const cardContent = (
    <>
      {renderImage ? renderImage(blobId, row) : null}
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
        <button type="button" onClick={() => onCardClick(row)} style={{ cursor: 'pointer' }}>
          {cardContent}
        </button>
      ) : (
        cardContent
      )}
      {actions.length > 0 ? (
        <div data-granit-gallery-card-actions="">
          {actions.map((action) => (
            <EntityActionButton
              key={action.name}
              action={action}
              rowId={rowId}
              row={row}
              dispatch={dispatch}
            />
          ))}
        </div>
      ) : null}
    </li>
  );
}

function pickGalleryLayout(manifest: EntityManifestResponse): EntityGalleryLayoutManifest | null {
  const layouts = manifest.collections?.listLayouts ?? [];
  for (const entry of layouts) {
    if (entry.kind === 'Gallery' && entry.gallery !== null) {
      return entry.gallery;
    }
  }
  return null;
}

/**
 * Decides whether to fetch another page. Honours `hasMore` when the server
 * sets it (preferred — works with both keyset and offset paging). Falls
 * back to comparing `items.length` against `totalCount` for hosts that
 * don't surface `hasMore` yet.
 */
function nextPageParam(
  last: PagedResult<Readonly<Record<string, unknown>>>,
  pages: readonly PagedResult<Readonly<Record<string, unknown>>>[]
): number | undefined {
  if (last.hasMore !== undefined) {
    return last.hasMore ? pages.length + 1 : undefined;
  }
  if (last.totalCount !== null && last.totalCount !== undefined) {
    const fetched = pages.reduce((sum, page) => sum + (page.items?.length ?? 0), 0);
    return fetched < last.totalCount ? pages.length + 1 : undefined;
  }
  // No bound — stop after one page rather than loop forever on a buggy server.
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

function readScalar(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return null;
}

function readRowKey(row: Readonly<Record<string, unknown>>, fallbackIndex: number): string {
  const id = row['id'] ?? row['Id'];
  if (typeof id === 'string' || typeof id === 'number') return String(id);
  return String(fallbackIndex);
}
