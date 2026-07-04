import { GranitClientProvider } from '@granit/react-api-client';
import { mockEntityManifest } from '@granit/react-entities/testing';
import { QueryEndpointStateProvider, QueryProvider } from '@granit/react-query-engine';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
import axios from 'axios';
import { delay, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { EntityGalleryView, type GalleryRenderImage } from './entity-gallery-view';
import { asExtended, type ExtendedEntityManifest } from './manifest-extensions';

import type { EntityManifestResponse } from '@granit/entities';
import type { EntityGalleryLayoutManifest } from '@granit/entities';
import type { QueryRequest } from '@granit/query-engine';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Coverage suite for the host `<EntityGalleryView />` wrapper. Drives both
// modes: the flat delegation to the framework `<EntityGallery>` (params has no
// groupBy) and the manually-rendered grouped path (ambient groupBy set), which
// owns its own infinite-query, sentinel, section headers and card markup.
// Grouped-path branches exercised: loading / error / empty / populated,
// single vs multi group (header patching), title from layout vs identity
// fallback vs absent, subtitle present vs absent, scalar / non-scalar / missing
// field values, camelCase field fallback, card-click handler (string id fires,
// numeric id skipped, `Id` fallback, no-handler no-op), IntersectionObserver
// pagination (hasMore path, totalCount fallback, neither), non-intersecting and
// absent-observer guards.
// ---------------------------------------------------------------------------

const BASE_PATH = '/api/v1/parties';

// --- IntersectionObserver test double ---------------------------------------

interface FakeObserver {
  readonly observed: Element[];
  trigger(intersecting?: boolean): void;
}
const observers: FakeObserver[] = [];
class MockIntersectionObserver implements FakeObserver {
  readonly observed: Element[] = [];
  constructor(private readonly cb: IntersectionObserverCallback) {
    observers.push(this);
  }
  observe(node: Element): void {
    this.observed.push(node);
  }
  unobserve(node: Element): void {
    const idx = this.observed.indexOf(node);
    if (idx >= 0) this.observed.splice(idx, 1);
  }
  disconnect(): void {
    this.observed.length = 0;
    const idx = observers.indexOf(this);
    if (idx >= 0) observers.splice(idx, 1);
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  trigger(intersecting = true): void {
    const entries = this.observed.map(
      (target) =>
        ({
          target,
          isIntersecting: intersecting,
          intersectionRatio: intersecting ? 1 : 0,
          time: Date.now(),
          rootBounds: null,
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRect: target.getBoundingClientRect(),
        }) as IntersectionObserverEntry
    );
    this.cb(entries, this as unknown as IntersectionObserver);
  }
}

function triggerLastObserver(intersecting = true): void {
  const last = observers[observers.length - 1];
  if (last) last.trigger(intersecting);
}

beforeAll(() => vi.stubGlobal('IntersectionObserver', MockIntersectionObserver));
beforeEach(() => {
  observers.length = 0;
});

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// --- fixtures ---------------------------------------------------------------

const renderImage: GalleryRenderImage = (blobId) => (
  <div data-testid="gallery-image" data-blob={blobId ?? undefined} />
);

function galleryLayout(
  overrides: Partial<EntityGalleryLayoutManifest> = {}
): EntityGalleryLayoutManifest {
  return {
    imagePropertyName: 'avatarBlobId',
    titlePropertyName: 'name',
    subtitlePropertyName: 'kind',
    groupByPropertyName: null,
    cardSize: 'Medium',
    actions: [],
    ...overrides,
  };
}

function extManifest(identityPatch: Record<string, unknown> = {}): ExtendedEntityManifest {
  const clone = structuredClone(mockEntityManifest) as EntityManifestResponse;
  if (clone.identity) Object.assign(clone.identity, identityPatch);
  return asExtended(clone);
}

function makeWrapper(initialParams: QueryRequest) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>
        <QueryProvider config={{ basePath: BASE_PATH }}>
          <QueryEndpointStateProvider initialParams={initialParams}>
            {children}
          </QueryEndpointStateProvider>
        </QueryProvider>
      </GranitClientProvider>
    </QueryClientProvider>
  );
  return Wrapper;
}

function respondItems(items: readonly Record<string, unknown>[]): void {
  server.use(
    http.get(`http://localhost${BASE_PATH}`, () =>
      HttpResponse.json({ items, totalCount: items.length, hasMore: false })
    )
  );
}

// ===========================================================================
// Flat mode — no ambient groupBy → delegate to the framework <EntityGallery>.
// ===========================================================================

describe('EntityGalleryView — flat mode (no groupBy)', () => {
  it('wraps the framework gallery in the view slot and forwards renderImage + card clicks', async () => {
    respondItems([{ id: 'a', name: 'ACME', kind: 'Customer', avatarBlobId: 'blob-a' }]);
    const onCardClick = vi.fn<(id: string) => void>();
    const Wrapper = makeWrapper({ page: 1, pageSize: 50 });
    const { container } = render(
      <Wrapper>
        <EntityGalleryView
          manifest={extManifest()}
          layout={galleryLayout()}
          onCardClick={onCardClick}
          actionHandlers={{}}
          renderImage={renderImage}
        />
      </Wrapper>
    );

    expect(container.querySelector('[data-slot="entity-gallery-view"]')).not.toBeNull();
    await waitFor(() =>
      expect(container.querySelector('[data-granit-entity-gallery]')).not.toBeNull()
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-card]')).not.toBeNull()
    );

    // The framework card forwards the row to our wrapped handler → onCardClick(id).
    const button = container.querySelector<HTMLElement>('[data-granit-gallery-card-button]');
    if (button) {
      fireEvent.click(button);
      expect(onCardClick).toHaveBeenCalledWith('a');
    }
  });
});

// ===========================================================================
// Grouped mode — ambient groupBy → the wrapper renders sections itself.
// ===========================================================================

describe('EntityGalleryView — grouped mode status branches', () => {
  it('shows the loading marker while the first page is in flight', () => {
    respondItems([{ id: '1', name: 'A', kind: 'Customer', avatarBlobId: null }]);
    const Wrapper = makeWrapper({ groupBy: 'kind', pageSize: 50 });
    const { container } = render(
      <Wrapper>
        <EntityGalleryView
          manifest={extManifest()}
          layout={galleryLayout({ groupByPropertyName: 'kind' })}
          renderImage={renderImage}
        />
      </Wrapper>
    );
    expect(container.querySelector('[data-granit-gallery-loading]')).not.toBeNull();
  });

  it('shows the error marker with a role=alert when the query rejects', async () => {
    server.use(
      http.get(`http://localhost${BASE_PATH}`, () => new HttpResponse(null, { status: 500 }))
    );
    const Wrapper = makeWrapper({ groupBy: 'kind', pageSize: 50 });
    const { container } = render(
      <Wrapper>
        <EntityGalleryView
          manifest={extManifest()}
          layout={galleryLayout({ groupByPropertyName: 'kind' })}
          renderImage={renderImage}
        />
      </Wrapper>
    );
    await waitFor(() => {
      const error = container.querySelector('[data-granit-gallery-error]');
      expect(error).not.toBeNull();
      expect(error?.getAttribute('role')).toBe('alert');
      expect((error?.textContent ?? '').length).toBeGreaterThan(0);
    });
  });

  it('shows the empty marker when the grouped query returns no items', async () => {
    respondItems([]);
    const Wrapper = makeWrapper({ groupBy: 'kind', pageSize: 50 });
    const { container } = render(
      <Wrapper>
        <EntityGalleryView
          manifest={extManifest()}
          layout={galleryLayout({ groupByPropertyName: 'kind' })}
          renderImage={renderImage}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-empty]')).not.toBeNull()
    );
    expect(container.querySelector('[data-granit-gallery-card]')).toBeNull();
  });
});

describe('EntityGalleryView — grouped rendering with section headers', () => {
  it('emits a header per group with the running count and populates card slots', async () => {
    respondItems([
      { id: '1', name: 'ACME', kind: 'Customer', avatarBlobId: 'blob-1' },
      { id: '2', name: 'Globex', kind: 'Customer', avatarBlobId: 'blob-2' },
      { id: '3', name: 'Initech', kind: 'Supplier', avatarBlobId: null },
    ]);
    const Wrapper = makeWrapper({ groupBy: 'kind', pageSize: 50 });
    const { container } = render(
      <Wrapper>
        <EntityGalleryView
          manifest={extManifest()}
          layout={galleryLayout({ groupByPropertyName: 'kind' })}
          renderImage={renderImage}
        />
      </Wrapper>
    );

    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(3)
    );

    const root = container.querySelector('[data-granit-entity-gallery]') as HTMLElement;
    expect(root.getAttribute('data-entity')).toBe('Granit.Parties.Party');
    expect(root.getAttribute('data-card-size')).toBe('Medium');
    expect(root.hasAttribute('data-granit-gallery-grouped')).toBe(true);

    const headers = container.querySelectorAll('[data-granit-gallery-group-header]');
    expect(headers.length).toBe(2);
    const labels = [...container.querySelectorAll('[data-granit-gallery-group-label]')].map(
      (n) => n.textContent
    );
    expect(labels).toEqual(['Customer', 'Supplier']);
    const counts = [...container.querySelectorAll('[data-granit-gallery-group-count]')].map(
      (n) => n.textContent
    );
    expect(counts).toEqual(['2', '1']);

    // Title / subtitle / image slots resolve from the layout property names.
    expect(container.querySelector('[data-granit-gallery-card-title]')?.textContent).toBe('ACME');
    expect(container.querySelector('[data-granit-gallery-card-subtitle]')?.textContent).toBe(
      'Customer'
    );
    const firstCard = container.querySelector('[data-granit-gallery-card]') as HTMLElement;
    expect(firstCard.getAttribute('data-row-id')).toBe('1');
    expect(firstCard.getAttribute('data-image-blob-id')).toBe('blob-1');
  });

  it('falls back to identity.displayProperty for the title and reads camelCased fields', async () => {
    // No layout title → identity.displayProperty ('Number') supplies the title.
    // The row carries only the camelCase key `number`, exercising readRowField's fallback.
    respondItems([{ id: '1', number: 'P-001', kind: 'Customer', avatarBlobId: null }]);
    const Wrapper = makeWrapper({ groupBy: 'kind', pageSize: 50 });
    const { container } = render(
      <Wrapper>
        <EntityGalleryView
          manifest={extManifest()}
          layout={galleryLayout({ titlePropertyName: null, groupByPropertyName: 'kind' })}
          renderImage={renderImage}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-card]')).not.toBeNull()
    );
    expect(container.querySelector('[data-granit-gallery-card-title]')?.textContent).toBe('P-001');
  });

  it('omits the title / subtitle / id / image attrs for non-scalar and missing fields', async () => {
    // identity.displayProperty null AND layout title null → titleProperty null → no title slot.
    // subtitle null, no id/Id key, object-valued image → readScalar → null.
    respondItems([{ name: 'ignored', kind: 'Customer', avatarBlobId: { nested: true } }]);
    const Wrapper = makeWrapper({ groupBy: 'kind', pageSize: 50 });
    const { container } = render(
      <Wrapper>
        <EntityGalleryView
          manifest={extManifest({ displayProperty: null })}
          layout={galleryLayout({ titlePropertyName: null, subtitlePropertyName: null })}
          renderImage={renderImage}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-card]')).not.toBeNull()
    );
    const card = container.querySelector('[data-granit-gallery-card]') as HTMLElement;
    expect(card.hasAttribute('data-row-id')).toBe(false);
    expect(card.hasAttribute('data-image-blob-id')).toBe(false);
    expect(container.querySelector('[data-granit-gallery-card-title]')).toBeNull();
    expect(container.querySelector('[data-granit-gallery-card-subtitle]')).toBeNull();
  });

  it('stringifies null and object group values (— and JSON) and keys rows by fallback index', async () => {
    respondItems([
      { name: 'A', kind: null },
      { name: 'B', kind: null },
      { name: 'C', kind: { tier: 'gold' } },
    ]);
    const Wrapper = makeWrapper({ groupBy: 'kind', pageSize: 50 });
    const { container } = render(
      <Wrapper>
        <EntityGalleryView
          manifest={extManifest()}
          layout={galleryLayout({ subtitlePropertyName: null, groupByPropertyName: 'kind' })}
          renderImage={renderImage}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(3)
    );
    const labels = [...container.querySelectorAll('[data-granit-gallery-group-label]')].map(
      (n) => n.textContent
    );
    expect(labels).toEqual(['—', '{"tier":"gold"}']);
    const counts = [...container.querySelectorAll('[data-granit-gallery-group-count]')].map(
      (n) => n.textContent
    );
    expect(counts).toEqual(['2', '1']);
  });
});

describe('EntityGalleryView — grouped card click handler', () => {
  it('fires onCardClick with the string id, skips numeric ids, and reads the `Id` fallback', async () => {
    respondItems([
      { id: 'a', name: 'ACME', kind: 'Customer', avatarBlobId: null },
      { id: 7, name: 'Numeric', kind: 'Customer', avatarBlobId: null },
      { Id: 'b', name: 'Capital', kind: 'Customer', avatarBlobId: null },
    ]);
    const onCardClick = vi.fn<(id: string) => void>();
    const Wrapper = makeWrapper({ groupBy: 'kind', pageSize: 50 });
    const { container } = render(
      <Wrapper>
        <EntityGalleryView
          manifest={extManifest()}
          layout={galleryLayout({ groupByPropertyName: 'kind' })}
          onCardClick={onCardClick}
          renderImage={renderImage}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-gallery-card-button]').length).toBe(3)
    );
    const buttons = container.querySelectorAll<HTMLElement>('[data-granit-gallery-card-button]');
    fireEvent.click(buttons[0]!); // string id → fires with 'a'
    fireEvent.click(buttons[1]!); // numeric id → typeof !== 'string' → no call
    fireEvent.click(buttons[2]!); // `Id` fallback → fires with 'b'
    expect(onCardClick.mock.calls).toEqual([['a'], ['b']]);
  });

  it('still renders a card button and no-ops on click when no onCardClick is provided', async () => {
    respondItems([{ id: 'a', name: 'ACME', kind: 'Customer', avatarBlobId: null }]);
    const Wrapper = makeWrapper({ groupBy: 'kind', pageSize: 50 });
    const { container } = render(
      <Wrapper>
        <EntityGalleryView
          manifest={extManifest()}
          layout={galleryLayout({ groupByPropertyName: 'kind' })}
          renderImage={renderImage}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-card-button]')).not.toBeNull()
    );
    const button = container.querySelector<HTMLElement>('[data-granit-gallery-card-button]');
    expect(() => fireEvent.click(button!)).not.toThrow();
  });
});

describe('EntityGalleryView — grouped pagination', () => {
  // GroupedGallery hardcodes pageSize=50 on the request, so paginate with our
  // own fixed page size (2) driven purely by the `page` cursor.
  const PAGE = 2;
  function paginatedHandler(
    rows: readonly Record<string, unknown>[],
    mode: 'hasMore' | 'totalCount' | 'none'
  ): void {
    server.use(
      http.get(`http://localhost${BASE_PATH}`, ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page') ?? '1');
        const start = (page - 1) * PAGE;
        const slice = rows.slice(start, start + PAGE);
        if (mode === 'hasMore') {
          return HttpResponse.json({ items: slice, hasMore: start + slice.length < rows.length });
        }
        if (mode === 'totalCount') {
          return HttpResponse.json({ items: slice, totalCount: rows.length });
        }
        return HttpResponse.json({ items: slice });
      })
    );
  }

  const rows = [
    { id: '1', name: 'A', kind: 'Customer', avatarBlobId: null },
    { id: '2', name: 'B', kind: 'Customer', avatarBlobId: null },
    { id: '3', name: 'C', kind: 'Customer', avatarBlobId: null },
  ];

  it('advances pages via the hasMore flag when the sentinel intersects', async () => {
    paginatedHandler(rows, 'hasMore');
    const Wrapper = makeWrapper({ groupBy: 'kind', pageSize: 2 });
    const { container } = render(
      <Wrapper>
        <EntityGalleryView
          manifest={extManifest()}
          layout={galleryLayout({ groupByPropertyName: 'kind' })}
          renderImage={renderImage}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(2)
    );
    const sentinel = container.querySelector('[data-granit-gallery-sentinel]') as HTMLElement;
    expect(sentinel.hasAttribute('data-exhausted')).toBe(false);

    triggerLastObserver(true);
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(3)
    );
    const after = container.querySelector('[data-granit-gallery-sentinel]') as HTMLElement;
    expect(after.hasAttribute('data-exhausted')).toBe(true);
  });

  it('advances pages via the totalCount fallback when hasMore is omitted', async () => {
    paginatedHandler(rows, 'totalCount');
    const Wrapper = makeWrapper({ groupBy: 'kind', pageSize: 2 });
    const { container } = render(
      <Wrapper>
        <EntityGalleryView
          manifest={extManifest()}
          layout={galleryLayout({ groupByPropertyName: 'kind' })}
          renderImage={renderImage}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(2)
    );
    triggerLastObserver(true);
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(3)
    );
    const sentinel = container.querySelector('[data-granit-gallery-sentinel]') as HTMLElement;
    expect(sentinel.hasAttribute('data-exhausted')).toBe(true);
  });

  it('stops after one page when the server sends neither hasMore nor totalCount', async () => {
    paginatedHandler(rows, 'none');
    const Wrapper = makeWrapper({ groupBy: 'kind', pageSize: 2 });
    const { container } = render(
      <Wrapper>
        <EntityGalleryView
          manifest={extManifest()}
          layout={galleryLayout({ groupByPropertyName: 'kind' })}
          renderImage={renderImage}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(2)
    );
    const sentinel = container.querySelector('[data-granit-gallery-sentinel]') as HTMLElement;
    expect(sentinel.hasAttribute('data-exhausted')).toBe(true);
  });

  it('does not fetch further pages when the sentinel reports no intersection', async () => {
    paginatedHandler(rows, 'hasMore');
    const Wrapper = makeWrapper({ groupBy: 'kind', pageSize: 2 });
    const { container } = render(
      <Wrapper>
        <EntityGalleryView
          manifest={extManifest()}
          layout={galleryLayout({ groupByPropertyName: 'kind' })}
          renderImage={renderImage}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(2)
    );
    triggerLastObserver(false); // .some() arm false → no fetchNextPage
    await Promise.resolve();
    expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(2);
  });

  it('renders cards without arming an observer when IntersectionObserver is absent', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    paginatedHandler(rows, 'hasMore');
    const Wrapper = makeWrapper({ groupBy: 'kind', pageSize: 2 });
    const { container } = render(
      <Wrapper>
        <EntityGalleryView
          manifest={extManifest()}
          layout={galleryLayout({ groupByPropertyName: 'kind' })}
          renderImage={renderImage}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(2)
    );
    expect(observers.length).toBe(0);
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });
});

// ===========================================================================
// Residual branch coverage — the untaken sides left after the suites above.
// ===========================================================================

describe('EntityGalleryView — residual branch coverage', () => {
  it('omits the data-entity attr when the manifest identity has no name', async () => {
    // `manifest.identity?.name ?? undefined` → nullish-left side (line 244).
    respondItems([{ id: '1', name: 'ACME', kind: 'Customer', avatarBlobId: null }]);
    const Wrapper = makeWrapper({ groupBy: 'kind', pageSize: 50 });
    const { container } = render(
      <Wrapper>
        <EntityGalleryView
          manifest={extManifest({ name: null })}
          layout={galleryLayout({ groupByPropertyName: 'kind' })}
          renderImage={renderImage}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-card]')).not.toBeNull()
    );
    const root = container.querySelector('[data-granit-entity-gallery]') as HTMLElement;
    expect(root.hasAttribute('data-entity')).toBe(false);
  });

  it('groups a null value together with a missing (undefined) value under one header', async () => {
    // isSameGroup(undefined, null): a !== b yet both == null → same group (line 343).
    respondItems([
      { id: '1', name: 'A', kind: null, avatarBlobId: null },
      { id: '2', name: 'B', avatarBlobId: null }, // `kind` absent → readRowField → undefined
    ]);
    const Wrapper = makeWrapper({ groupBy: 'kind', pageSize: 50 });
    const { container } = render(
      <Wrapper>
        <EntityGalleryView
          manifest={extManifest()}
          layout={galleryLayout({ subtitlePropertyName: null, groupByPropertyName: 'kind' })}
          renderImage={renderImage}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(2)
    );
    expect(container.querySelectorAll('[data-granit-gallery-group-header]').length).toBe(1);
    expect(container.querySelector('[data-granit-gallery-group-count]')?.textContent).toBe('2');
    expect(container.querySelector('[data-granit-gallery-group-label]')?.textContent).toBe('—');
  });

  it('tolerates a page that omits its items array (totalCount only)', async () => {
    // flattenPages skips the item-less page (line 389) and nextPageParam's
    // reduce falls back to 0 for its length (line 377) → empty marker.
    server.use(
      http.get(`http://localhost${BASE_PATH}`, () => HttpResponse.json({ totalCount: 0 }))
    );
    const Wrapper = makeWrapper({ groupBy: 'kind', pageSize: 50 });
    const { container } = render(
      <Wrapper>
        <EntityGalleryView
          manifest={extManifest()}
          layout={galleryLayout({ groupByPropertyName: 'kind' })}
          renderImage={renderImage}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-empty]')).not.toBeNull()
    );
    expect(container.querySelector('[data-granit-gallery-card]')).toBeNull();
  });

  it('marks the sentinel as fetching while the next page is in flight', async () => {
    server.use(
      http.get(`http://localhost${BASE_PATH}`, async ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? '1');
        if (page > 1) await delay('infinite'); // keep page 2 pending → isFetchingNextPage stays true
        return HttpResponse.json({
          items: [{ id: '1', name: 'A', kind: 'Customer', avatarBlobId: null }],
          hasMore: true,
        });
      })
    );
    const Wrapper = makeWrapper({ groupBy: 'kind', pageSize: 2 });
    const { container } = render(
      <Wrapper>
        <EntityGalleryView
          manifest={extManifest()}
          layout={galleryLayout({ groupByPropertyName: 'kind' })}
          renderImage={renderImage}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-sentinel]')).not.toBeNull()
    );
    triggerLastObserver(true);
    await waitFor(() => {
      const sentinel = container.querySelector('[data-granit-gallery-sentinel]') as HTMLElement;
      expect(sentinel.hasAttribute('data-fetching')).toBe(true);
    });
  });
});
