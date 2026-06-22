import { GranitClientProvider } from '@granit/react-api-client';
import { QueryProvider } from '@granit/react-query-engine';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { EntityGallery } from '../components/entity-gallery';

import type { EntityManifestResponse } from '@granit/entities';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Branch-coverage backfill for EntityGallery. The base suite covers the happy
// card / pagination / actions paths. This file targets: resolveCardActions with
// a null manifest.actions, the empty-body marker after a load, cards with no
// title / no id / non-scalar field values, the nextPageParam totalCount path
// (server omits hasMore), pickGalleryLayout skipping a non-Gallery layout, and
// the non-intersecting IntersectionObserver branch.
// ---------------------------------------------------------------------------

const BASE_PATH = '/api/v1/parties';
const ENTITY_NAME = 'Granit.Parties.Party';

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

beforeAll(() => vi.stubGlobal('IntersectionObserver', MockIntersectionObserver));
beforeEach(() => {
  observers.length = 0;
});

function triggerLastObserver(intersecting = true): void {
  const last = observers[observers.length - 1];
  if (last) last.trigger(intersecting);
}

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function manifest(galleryOverrides: Record<string, unknown> = {}): EntityManifestResponse {
  return {
    schemaVersion: 1,
    identity: {
      name: ENTITY_NAME,
      entityClrType: 'Granit.Parties.Domain.Party',
      displayKey: null,
      icon: null,
      permissionGroup: null,
      displayProperty: 'name',
      subtitleProperty: null,
    },
    permissions: null,
    forms: null,
    details: null,
    collections: {
      query: { name: 'Granit.Parties.PartyQuery', clrTypeName: 'PartyQuery' },
      export: null,
      metrics: [],
      dashboards: [],
      defaultViewId: null,
      listLayouts: [
        {
          kind: 'Gallery',
          isDefault: false,
          kanban: null,
          calendar: null,
          gallery: {
            imagePropertyName: 'avatarBlobId',
            titlePropertyName: 'name',
            subtitlePropertyName: 'kind',
            groupByPropertyName: null,
            cardSize: 'Medium',
            actions: [],
            ...galleryOverrides,
          },
        },
      ],
      headerActions: [],
      selectionActions: [],
    },
    relations: null,
    actions: null,
  };
}

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>
        <QueryProvider config={{ basePath: BASE_PATH }}>{children}</QueryProvider>
      </GranitClientProvider>
    </QueryClientProvider>
  );
  return { wrapper };
}

describe('EntityGallery — resolveCardActions with null manifest actions', () => {
  it('renders cards without an action bar when the layout references actions but the manifest has none', async () => {
    const m = manifest();
    (m.collections!.listLayouts[0].gallery as { actions: unknown }).actions = [{ name: 'edit' }];
    // manifest.actions stays null → resolveCardActions hits the `!actions` arm → [].
    server.use(
      http.get(`http://localhost${BASE_PATH}`, () =>
        HttpResponse.json({
          items: [{ id: 'a', name: 'ACME', kind: 'Customer', avatarBlobId: null }],
          totalCount: 1,
          hasMore: false,
        })
      )
    );
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={m} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-card]')).not.toBeNull()
    );
    expect(container.querySelector('[data-granit-gallery-card-actions]')).toBeNull();
  });
});

describe('EntityGallery — empty body after a successful load', () => {
  it('emits the empty marker when the query returns zero items', async () => {
    server.use(
      http.get(`http://localhost${BASE_PATH}`, () =>
        HttpResponse.json({ items: [], totalCount: 0, hasMore: false })
      )
    );
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={manifest()} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-empty]')).not.toBeNull()
    );
    expect(container.querySelector('[data-granit-gallery-card]')).toBeNull();
  });
});

describe('EntityGallery — card with no title / no id / non-scalar fields', () => {
  it('omits the title slot and data-row-id when no title property nor id resolves', async () => {
    // No title: layout titlePropertyName null AND identity.displayProperty null.
    const m = manifest({ titlePropertyName: null, subtitlePropertyName: null });
    m.identity!.displayProperty = null;
    server.use(
      http.get(`http://localhost${BASE_PATH}`, () =>
        HttpResponse.json({
          // Row carries no id/Id, and avatarBlobId is a non-scalar (object) → readScalar → null.
          items: [{ name: 'ignored', avatarBlobId: { nested: true } }],
          totalCount: 1,
          hasMore: false,
        })
      )
    );
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={m} />
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
});

describe('EntityGallery — nextPageParam via totalCount (no hasMore)', () => {
  it('paginates by comparing fetched count to totalCount when the server omits hasMore', async () => {
    // 3 items, pageSize default 50 — but we force pageSize=2 so page 1 returns 2, page 2 returns 1.
    const rows = [
      { id: '1', name: 'A', kind: 'Customer', avatarBlobId: null },
      { id: '2', name: 'B', kind: 'Supplier', avatarBlobId: null },
      { id: '3', name: 'C', kind: 'Customer', avatarBlobId: null },
    ];
    server.use(
      http.get(`http://localhost${BASE_PATH}`, ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page') ?? '1');
        const pageSize = Number(url.searchParams.get('pageSize') ?? '50');
        const start = (page - 1) * pageSize;
        // Deliberately omit `hasMore` → forces the totalCount fallback in nextPageParam.
        return HttpResponse.json({
          items: rows.slice(start, start + pageSize),
          totalCount: rows.length,
        });
      })
    );
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={manifest()} pageSize={2} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(2)
    );
    // Page 1 returned 2/3 → hasNextPage true → sentinel not exhausted.
    const sentinel = container.querySelector('[data-granit-gallery-sentinel]') as HTMLElement;
    expect(sentinel.hasAttribute('data-exhausted')).toBe(false);
    // Scroll → fetch page 2 → fetched (3) === totalCount (3) → no further pages.
    triggerLastObserver(true);
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(3)
    );
    const after = container.querySelector('[data-granit-gallery-sentinel]') as HTMLElement;
    expect(after.hasAttribute('data-exhausted')).toBe(true);
  });

  it('stops after one page when the server gives neither hasMore nor totalCount', async () => {
    server.use(
      http.get(`http://localhost${BASE_PATH}`, () =>
        HttpResponse.json({ items: [{ id: 'x', name: 'X', kind: 'C', avatarBlobId: null }] })
      )
    );
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={manifest()} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-card]')).not.toBeNull()
    );
    const sentinel = container.querySelector('[data-granit-gallery-sentinel]') as HTMLElement;
    // No bound → getNextPageParam returns undefined → exhausted.
    expect(sentinel.hasAttribute('data-exhausted')).toBe(true);
  });
});

describe('EntityGallery — pickGalleryLayout skips non-Gallery layouts', () => {
  it('returns the empty marker when the only layout is a non-Gallery kind', () => {
    const m = manifest();
    // Replace the gallery layout with a Kanban layout (gallery slot null).
    m.collections!.listLayouts = [
      { kind: 'Kanban', isDefault: false, kanban: null, calendar: null, gallery: null },
    ];
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={m} />
      </Wrapper>
    );
    expect(container.querySelector('[data-granit-entity-gallery-empty]')).not.toBeNull();
  });
});

describe('EntityGallery — numeric scalar field values', () => {
  it('stringifies a numeric title / image / id via readScalar', async () => {
    server.use(
      http.get(`http://localhost${BASE_PATH}`, () =>
        HttpResponse.json({
          // Numeric id + numeric title + numeric blob exercise readScalar's number arm.
          items: [{ id: 7, name: 123, kind: 'C', avatarBlobId: 456 }],
          totalCount: 1,
          hasMore: false,
        })
      )
    );
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={manifest()} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-card]')).not.toBeNull()
    );
    const card = container.querySelector('[data-granit-gallery-card]') as HTMLElement;
    expect(card.getAttribute('data-row-id')).toBe('7');
    expect(card.getAttribute('data-image-blob-id')).toBe('456');
    expect(container.querySelector('[data-granit-gallery-card-title]')?.textContent).toBe('123');
  });
});

describe('EntityGallery — environment without IntersectionObserver', () => {
  it('renders cards without arming a sentinel observer when IntersectionObserver is absent', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    server.use(
      http.get(`http://localhost${BASE_PATH}`, () =>
        HttpResponse.json({
          items: [{ id: 'a', name: 'A', kind: 'C', avatarBlobId: null }],
          totalCount: 5,
          hasMore: true,
        })
      )
    );
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={manifest()} pageSize={1} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-card]')).not.toBeNull()
    );
    // No observer registered (the `typeof IntersectionObserver === 'undefined'` guard short-circuits).
    expect(observers.length).toBe(0);
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });
});

describe('EntityGallery — non-intersecting sentinel does not fetch', () => {
  it('does not advance pages when the observer fires with isIntersecting=false', async () => {
    const rows = Array.from({ length: 4 }, (_, i) => ({
      id: String(i),
      name: `R${i}`,
      kind: 'C',
      avatarBlobId: null,
    }));
    server.use(
      http.get(`http://localhost${BASE_PATH}`, ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page') ?? '1');
        const pageSize = Number(url.searchParams.get('pageSize') ?? '50');
        const start = (page - 1) * pageSize;
        const slice = rows.slice(start, start + pageSize);
        return HttpResponse.json({
          items: slice,
          totalCount: rows.length,
          hasMore: start + slice.length < rows.length,
        });
      })
    );
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={manifest()} pageSize={2} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(2)
    );
    triggerLastObserver(false); // not intersecting → the `.some()` arm is false → no fetch.
    // Give any (unexpected) fetch a chance to land, then assert the count is unchanged.
    await Promise.resolve();
    expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(2);
  });
});
