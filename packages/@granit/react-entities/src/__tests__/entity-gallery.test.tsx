import { GranitClientProvider } from '@granit/react-api-client';
import { QueryEndpointStateProvider, QueryProvider } from '@granit/react-query-engine';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { EntityGallery } from '../components/entity-gallery.js';

import type { EntityManifestResponse } from '@granit/entities';
import type { ReactNode } from 'react';

const BASE_PATH = '/api/v1/parties';
const ENTITY_NAME = 'Granit.Parties.Party';

// ---------------------------------------------------------------------------
// IntersectionObserver mock — drives the auto-fetch sentinel deterministically.
// ---------------------------------------------------------------------------

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

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});
beforeEach(() => {
  observers.length = 0;
});

function triggerLastObserver(intersecting = true): void {
  const last = observers[observers.length - 1];
  if (last) last.trigger(intersecting);
}

// ---------------------------------------------------------------------------
// Server fixtures
// ---------------------------------------------------------------------------

interface PartyRow {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
  readonly avatarBlobId: string | null;
}

function makeParty(idx: number): PartyRow {
  return {
    id: `00000000-0000-4000-8000-${String(idx).padStart(12, '0')}`,
    name: `Party ${idx}`,
    kind: idx % 2 === 0 ? 'Customer' : 'Supplier',
    avatarBlobId: idx % 3 === 0 ? null : `parties/avatars/p${idx}.jpg`,
  };
}

let lastQuery: Record<string, string> | null = null;

beforeEach(() => {
  lastQuery = null;
});

function pageHandler(items: PartyRow[], opts: { hasMoreOnPage1?: boolean } = {}) {
  const hasMoreOnPage1 = opts.hasMoreOnPage1 ?? false;
  return http.get(`http://localhost${BASE_PATH}`, ({ request }) => {
    const url = new URL(request.url);
    lastQuery = Object.fromEntries(url.searchParams.entries());
    const page = Number(url.searchParams.get('page') ?? '1');
    const pageSize = Number(url.searchParams.get('pageSize') ?? '50');
    const start = (page - 1) * pageSize;
    const slice = items.slice(start, start + pageSize);
    const hasMore = start + slice.length < items.length;
    return HttpResponse.json({
      items: slice,
      totalCount: items.length,
      hasMore: page === 1 && hasMoreOnPage1 ? true : hasMore,
    });
  });
}

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function manifest(
  options: {
    hasGallery?: boolean;
    hasQuery?: boolean;
    cardSize?: 'Small' | 'Medium' | 'Large';
  } = {}
): EntityManifestResponse {
  const hasGallery = options.hasGallery ?? true;
  const hasQuery = options.hasQuery ?? true;
  const cardSize = options.cardSize ?? 'Medium';
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
    collections: hasQuery
      ? {
          query: { name: 'Granit.Parties.PartyQuery', clrTypeName: 'PartyQuery' },
          export: null,
          metrics: [],
          dashboards: [],
          defaultViewId: null,
          listLayouts: hasGallery
            ? [
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
                    cardSize,
                    actions: [],
                  },
                },
              ]
            : [],
          headerActions: [],
        }
      : null,
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

describe('EntityGallery', () => {
  it('emits the empty marker when the manifest declares no gallery layout', () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={manifest({ hasGallery: false })} />
      </Wrapper>
    );
    expect(container.querySelector('[data-granit-entity-gallery-empty]')).not.toBeNull();
    expect(container.querySelector('[data-granit-gallery-cards]')).toBeNull();
  });

  it('emits the empty marker when the manifest has no query collection', () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={manifest({ hasQuery: false })} />
      </Wrapper>
    );
    expect(container.querySelector('[data-granit-entity-gallery-empty]')).not.toBeNull();
  });

  it('exposes card-size + entity name as data attributes on the root', async () => {
    server.use(pageHandler([makeParty(1)]));
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={manifest({ cardSize: 'Large' })} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-card]')).not.toBeNull()
    );
    const root = container.querySelector('[data-granit-entity-gallery]') as HTMLElement;
    expect(root.getAttribute('data-entity')).toBe(ENTITY_NAME);
    expect(root.getAttribute('data-card-size')).toBe('Large');
  });

  it('renders one card per row with image-blob-id, title and subtitle slots', async () => {
    server.use(pageHandler([makeParty(1), makeParty(2)]));
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={manifest()} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(2)
    );
    const first = container.querySelector(`[data-row-id="${makeParty(1).id}"]`) as HTMLElement;
    expect(first.getAttribute('data-image-blob-id')).toBe('parties/avatars/p1.jpg');
    expect(first.querySelector('[data-granit-gallery-card-title]')?.textContent).toBe('Party 1');
    expect(first.querySelector('[data-granit-gallery-card-subtitle]')?.textContent).toBe(
      'Supplier'
    );
  });

  it('omits data-image-blob-id when the row has no blob reference', async () => {
    server.use(pageHandler([makeParty(3)])); // idx 3 → avatarBlobId null
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
    expect(card.hasAttribute('data-image-blob-id')).toBe(false);
  });

  it('falls back to identity.displayProperty when titlePropertyName is null', async () => {
    server.use(pageHandler([makeParty(1)]));
    const m = manifest();
    (
      m.collections!.listLayouts[0].gallery as { titlePropertyName: string | null }
    ).titlePropertyName = null;
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={m} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-card-title]')).not.toBeNull()
    );
    expect(container.querySelector('[data-granit-gallery-card-title]')?.textContent).toBe(
      'Party 1'
    );
  });

  it('omits the subtitle slot when subtitlePropertyName is null', async () => {
    server.use(pageHandler([makeParty(1)]));
    const m = manifest();
    (
      m.collections!.listLayouts[0].gallery as { subtitlePropertyName: string | null }
    ).subtitlePropertyName = null;
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={m} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-card]')).not.toBeNull()
    );
    expect(container.querySelector('[data-granit-gallery-card-subtitle]')).toBeNull();
  });

  it('emits a loading marker before the response lands', () => {
    server.use(pageHandler([makeParty(1)]));
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={manifest()} />
      </Wrapper>
    );
    expect(container.querySelector('[data-granit-gallery-loading]')).not.toBeNull();
  });

  it('emits an error marker with role=alert when the endpoint returns 500', async () => {
    server.use(
      http.get(`http://localhost${BASE_PATH}`, () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 })
      )
    );
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={manifest()} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-error]')).not.toBeNull()
    );
    expect(container.querySelector('[data-granit-gallery-error]')?.getAttribute('role')).toBe(
      'alert'
    );
  });

  it('invokes onCardClick with the full row object', async () => {
    server.use(pageHandler([makeParty(1)]));
    const onCardClick = vi.fn();
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={manifest()} onCardClick={onCardClick} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-card]')).not.toBeNull()
    );
    const card = container.querySelector('[data-granit-gallery-card]') as HTMLElement;
    fireEvent.click(card);
    expect(onCardClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: makeParty(1).id, name: 'Party 1' })
    );
  });

  it('uses an explicit layout prop over the manifest auto-pick', async () => {
    server.use(pageHandler([makeParty(1)]));
    const { wrapper: Wrapper } = makeWrapper();
    const m = manifest({ hasGallery: false });
    const { container } = render(
      <Wrapper>
        <EntityGallery
          manifest={m}
          layout={{
            imagePropertyName: 'avatarBlobId',
            titlePropertyName: 'name',
            subtitlePropertyName: null,
            groupByPropertyName: null,
            cardSize: 'Small',
            actions: [],
          }}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-card]')).not.toBeNull()
    );
    const root = container.querySelector('[data-granit-entity-gallery]') as HTMLElement;
    expect(root.getAttribute('data-card-size')).toBe('Small');
  });

  it('renders a sentinel marked exhausted when the first page returns every item', async () => {
    server.use(pageHandler([makeParty(1), makeParty(2)]));
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={manifest()} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-sentinel]')).not.toBeNull()
    );
    const sentinel = container.querySelector('[data-granit-gallery-sentinel]') as HTMLElement;
    expect(sentinel.hasAttribute('data-exhausted')).toBe(true);
    expect(sentinel.hasAttribute('data-fetching')).toBe(false);
  });

  it('fetches the next page when the sentinel intersects the viewport', async () => {
    // 60 rows ⇒ 2 pages of 50 + 10
    const rows = Array.from({ length: 60 }, (_, i) => makeParty(i + 1));
    server.use(pageHandler(rows));
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={manifest()} />
      </Wrapper>
    );
    // First page (50 rows) lands.
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(50)
    );
    const sentinelBefore = container.querySelector('[data-granit-gallery-sentinel]') as HTMLElement;
    expect(sentinelBefore.hasAttribute('data-exhausted')).toBe(false);

    // Trigger the IntersectionObserver — second page should fetch and append.
    triggerLastObserver(true);
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(60)
    );
    const sentinelAfter = container.querySelector('[data-granit-gallery-sentinel]') as HTMLElement;
    expect(sentinelAfter.hasAttribute('data-exhausted')).toBe(true);
  });

  it('threads ambient filter / search / sort from QueryEndpointStateProvider into the request', async () => {
    server.use(pageHandler([makeParty(1)]));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const apiClient = axios.create({ baseURL: 'http://localhost' });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <GranitClientProvider client={apiClient}>
          <QueryProvider config={{ basePath: BASE_PATH }}>
            <QueryEndpointStateProvider
              initialParams={{
                page: 1,
                pageSize: 20,
                search: 'acme',
                filters: [{ field: 'kind', operator: 'eq', value: 'Customer' }],
                sort: [{ field: 'name', direction: 'asc' }],
              }}
            >
              {children}
            </QueryEndpointStateProvider>
          </QueryProvider>
        </GranitClientProvider>
      </QueryClientProvider>
    );
    const { container } = render(
      <>
        <EntityGallery manifest={manifest()} />
      </>,
      { wrapper }
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-card]')).not.toBeNull()
    );
    expect(lastQuery?.search).toBe('acme');
    expect(lastQuery?.sort).toContain('name');
    // Filter encoded — the query-engine's serializer puts it under `filter`.
    expect(JSON.stringify(lastQuery)).toContain('Customer');
    // Gallery's own pageSize override (default 50) wins over the provider's 20.
    expect(lastQuery?.pageSize).toBe('50');
  });

  it('falls back to plain pagination when no QueryEndpointStateProvider is mounted', async () => {
    server.use(pageHandler([makeParty(1)]));
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={manifest()} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-card]')).not.toBeNull()
    );
    expect(lastQuery?.search).toBeUndefined();
    expect(lastQuery?.pageSize).toBe('50');
    expect(lastQuery?.page).toBe('1');
  });

  it('falls back to layout.groupByPropertyName when ambient groupBy is unset', async () => {
    server.use(pageHandler([makeParty(1)]));
    const m = manifest();
    (
      m.collections!.listLayouts[0].gallery as { groupByPropertyName: string | null }
    ).groupByPropertyName = 'kind';
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={m} />
      </Wrapper>
    );
    await waitFor(() => expect(lastQuery).not.toBeNull());
    expect(lastQuery?.groupBy).toBe('kind');
    expect(container.querySelector('[data-granit-entity-gallery]')).not.toBeNull();
  });

  it('lets ambient groupBy from the provider override layout.groupByPropertyName', async () => {
    server.use(pageHandler([makeParty(1)]));
    const m = manifest();
    (
      m.collections!.listLayouts[0].gallery as { groupByPropertyName: string | null }
    ).groupByPropertyName = 'kind';
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const apiClient = axios.create({ baseURL: 'http://localhost' });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <GranitClientProvider client={apiClient}>
          <QueryProvider config={{ basePath: BASE_PATH }}>
            <QueryEndpointStateProvider initialParams={{ groupBy: 'name' }}>
              {children}
            </QueryEndpointStateProvider>
          </QueryProvider>
        </GranitClientProvider>
      </QueryClientProvider>
    );
    render(<EntityGallery manifest={m} />, { wrapper });
    await waitFor(() => expect(lastQuery).not.toBeNull());
    expect(lastQuery?.groupBy).toBe('name');
  });

  it('mounts the renderImage slot per card with the row blobId', async () => {
    server.use(pageHandler([makeParty(1), makeParty(2)]));
    const { wrapper: Wrapper } = makeWrapper();
    const renderImage = vi.fn((blobId: string | null) =>
      blobId ? <img data-testid="card-img" src={`https://cdn.example.com/${blobId}`} /> : null
    );
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={manifest()} renderImage={renderImage} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(2)
    );
    // Both rows in the fixture have a blobId — both calls receive a non-null value.
    expect(renderImage).toHaveBeenCalledWith('parties/avatars/p1.jpg', expect.any(Object));
    expect(renderImage).toHaveBeenCalledWith('parties/avatars/p2.jpg', expect.any(Object));
    const imgs = container.querySelectorAll('[data-testid="card-img"]');
    expect(imgs).toHaveLength(2);
    expect(imgs[0].getAttribute('src')).toBe('https://cdn.example.com/parties/avatars/p1.jpg');
  });

  it('passes null to the renderImage slot when the row has no blob reference', async () => {
    server.use(pageHandler([makeParty(3)])); // idx 3 → avatarBlobId null
    const { wrapper: Wrapper } = makeWrapper();
    const renderImage = vi.fn(() => null);
    render(
      <Wrapper>
        <EntityGallery manifest={manifest()} renderImage={renderImage} />
      </Wrapper>
    );
    await waitFor(() => expect(renderImage).toHaveBeenCalled());
    expect(renderImage).toHaveBeenCalledWith(null, expect.objectContaining({ name: 'Party 3' }));
  });

  it('omits the renderImage call entirely when the slot is not provided', async () => {
    server.use(pageHandler([makeParty(1)]));
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={manifest()} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-gallery-card]')).not.toBeNull()
    );
    // Card structure still rendered (data-image-blob-id attr stays for CSS hooks),
    // but no <img> is mounted by the framework.
    expect(container.querySelector('[data-granit-gallery-card] img')).toBeNull();
    expect(
      container.querySelector('[data-granit-gallery-card]')?.getAttribute('data-image-blob-id')
    ).toBe('parties/avatars/p1.jpg');
  });

  it('paints layout.actions as icon-buttons inside each card and dispatches via the custom navigate handler', async () => {
    server.use(pageHandler([makeParty(1)]));
    const m = manifest();
    (m.collections!.listLayouts[0].gallery as { actions: unknown }).actions = [
      {
        name: 'edit',
        displayKey: 'Parties.Action.Edit',
        icon: 'pencil',
        contributorAssemblyName: null,
      },
    ];
    (m as { actions: unknown }).actions = [
      {
        name: 'edit',
        kind: 'Navigate',
        displayKey: 'Parties.Action.Edit',
        icon: 'pencil',
        order: 0,
        urlTemplate: '/parties/{id}/edit',
        httpMethod: null,
        confirmationKey: null,
        workflowTransitionName: null,
        contributorAssemblyName: null,
      },
    ];
    const navigate = vi.fn();
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={m} actionHandlers={{ navigate }} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-entity-action]')).not.toBeNull()
    );
    const button = container.querySelector('[data-granit-entity-action]') as HTMLElement;
    expect(button.getAttribute('data-action-kind')).toBe('Navigate');
    expect(button.getAttribute('data-action-icon')).toBe('pencil');
    fireEvent.click(button);
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'edit', kind: 'Navigate' }),
      makeParty(1).id,
      expect.objectContaining({ id: makeParty(1).id }),
      expect.anything()
    );
  });

  it('does not bubble action button clicks to the card onCardClick handler', async () => {
    server.use(pageHandler([makeParty(1)]));
    const m = manifest();
    (m.collections!.listLayouts[0].gallery as { actions: unknown }).actions = [
      { name: 'edit', displayKey: null, icon: null, contributorAssemblyName: null },
    ];
    (m as { actions: unknown }).actions = [
      {
        name: 'edit',
        kind: 'Navigate',
        displayKey: null,
        icon: null,
        order: 0,
        urlTemplate: '/parties/{id}/edit',
        httpMethod: null,
        confirmationKey: null,
        workflowTransitionName: null,
        contributorAssemblyName: null,
      },
    ];
    const navigate = vi.fn();
    const onCardClick = vi.fn();
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={m} onCardClick={onCardClick} actionHandlers={{ navigate }} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-entity-action]')).not.toBeNull()
    );
    fireEvent.click(container.querySelector('[data-granit-entity-action]') as HTMLElement);
    expect(navigate).toHaveBeenCalledOnce();
    expect(onCardClick).not.toHaveBeenCalled();
  });
});
