import { useQueryEndpoint } from '@granit/react-query-engine';
import { useMemo, type ReactNode } from 'react';

import type { EntityGalleryLayoutManifest, EntityManifestResponse } from '@granit/entities';

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
  /** Optional card activation handler — receives the full row object. */
  readonly onCardClick?: (row: Readonly<Record<string, unknown>>) => void;
  /** Optional class for the root element. */
  readonly className?: string;
}

/**
 * Generic read-only image-card grid renderer. Bridges the entity manifest's
 * gallery layout to the host's ambient `<QueryProvider>`, fetches a page of
 * rows via `useQueryEndpoint`, and surfaces each row as a card slot the
 * host styles via CSS Grid:
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
 *   </ol>
 * </div>
 * ```
 *
 * The framework does **not** mount `<img>` tags directly — `BlobReference`
 * properties are opaque IDs the host resolves through its own blob-storage
 * URL scheme (auth, presigning, CDN). Apps wrap the `data-image-blob-id`
 * attribute with their own `<BlobImage />` component (see
 * `@granit/react-blob-storage`). The renderer surfaces the ID; the host
 * decides how to resolve it.
 *
 * Title and subtitle are projected from the layout's `titlePropertyName`
 * (falling back to `manifest.identity.displayProperty`) and
 * `subtitlePropertyName`. Loading / error / empty states surface as
 * dedicated data attributes (`data-granit-gallery-loading`, `…-error`,
 * `…-empty`) so apps render their own placeholders without inspecting
 * React state.
 */
export function EntityGallery({
  manifest,
  layout,
  onCardClick,
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
        titleFallback={manifest.identity?.displayProperty}
        onCardClick={onCardClick}
      />
    </div>
  );
}

interface EntityGalleryBodyProps {
  readonly layout: EntityGalleryLayoutManifest;
  readonly titleFallback: string | null | undefined;
  readonly onCardClick: ((row: Readonly<Record<string, unknown>>) => void) | undefined;
}

function EntityGalleryBody({
  layout,
  titleFallback,
  onCardClick,
}: EntityGalleryBodyProps): ReactNode {
  const { query } = useQueryEndpoint<Readonly<Record<string, unknown>>>();
  const items = query.data?.items ?? [];

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
          onCardClick={onCardClick}
        />
      ))}
    </ol>
  );
}

interface GalleryCardProps {
  readonly row: Readonly<Record<string, unknown>>;
  readonly imageProperty: string;
  readonly titleProperty: string | null;
  readonly subtitleProperty: string | null;
  readonly onCardClick: ((row: Readonly<Record<string, unknown>>) => void) | undefined;
}

function GalleryCard({
  row,
  imageProperty,
  titleProperty,
  subtitleProperty,
  onCardClick,
}: GalleryCardProps): ReactNode {
  const blobId = readScalar(row[imageProperty]);
  const title = titleProperty ? readScalar(row[titleProperty]) : null;
  const subtitle = subtitleProperty ? readScalar(row[subtitleProperty]) : null;
  const rowId = readScalar(row['id'] ?? row['Id']);

  return (
    <li
      data-granit-gallery-card=""
      data-row-id={rowId ?? undefined}
      data-image-blob-id={blobId ?? undefined}
      onClick={onCardClick ? () => onCardClick(row) : undefined}
      style={onCardClick ? { cursor: 'pointer' } : undefined}
    >
      {title !== null ? <span data-granit-gallery-card-title="">{title}</span> : null}
      {subtitle !== null ? <span data-granit-gallery-card-subtitle="">{subtitle}</span> : null}
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

function readScalar(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return null;
  return String(value);
}

function readRowKey(row: Readonly<Record<string, unknown>>, fallbackIndex: number): string {
  const id = row['id'] ?? row['Id'];
  if (typeof id === 'string' || typeof id === 'number') return String(id);
  return String(fallbackIndex);
}
