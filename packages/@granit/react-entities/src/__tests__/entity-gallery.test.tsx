import { GranitClientProvider } from '@granit/react-api-client';
import { QueryProvider } from '@granit/react-query-engine';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { EntityGallery } from '../components/entity-gallery.js';

import type { EntityManifestResponse } from '@granit/entities';
import type { ReactNode } from 'react';

const BASE_PATH = '/api/v1/parties';
const ENTITY_NAME = 'Granit.Parties.Party';

const META = {
  columns: [
    {
      name: 'name',
      label: 'Name',
      type: 'String',
      order: 0,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [],
  sortableFields: [],
  presetFilterGroups: [],
  quickFilters: [],
  dateFilters: [],
  groupByFields: [],
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxStreamSize: 10000,
    supportsCursor: false,
  },
};

const PAGE = {
  items: [
    {
      id: '8c6b1e10-0000-4000-8000-000000000001',
      name: 'ACME Corp',
      kind: 'Customer',
      avatarBlobId: 'parties/avatars/acme.jpg',
    },
    {
      id: '8c6b1e10-0000-4000-8000-000000000002',
      name: 'Globex',
      kind: 'Customer',
      avatarBlobId: null,
    },
  ],
  totalCount: 2,
  page: 1,
  pageSize: 20,
};

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
                    cardSize,
                  },
                },
              ]
            : [],
        }
      : null,
    relations: null,
  };
}

function freshHandlers() {
  return [
    http.get(`http://localhost${BASE_PATH}/meta`, () => HttpResponse.json(META)),
    http.get(`http://localhost${BASE_PATH}`, () => HttpResponse.json(PAGE)),
  ];
}

const server = setupServer(...freshHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers(...freshHandlers()));
afterAll(() => server.close());

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
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={manifest()} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(2)
    );
    const acme = container.querySelector(
      '[data-row-id="8c6b1e10-0000-4000-8000-000000000001"]'
    ) as HTMLElement;
    expect(acme.getAttribute('data-image-blob-id')).toBe('parties/avatars/acme.jpg');
    expect(acme.querySelector('[data-granit-gallery-card-title]')?.textContent).toBe('ACME Corp');
    expect(acme.querySelector('[data-granit-gallery-card-subtitle]')?.textContent).toBe('Customer');
  });

  it('omits data-image-blob-id when the row has no blob reference', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityGallery manifest={manifest()} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-gallery-card]').length).toBe(2)
    );
    const globex = container.querySelector(
      '[data-row-id="8c6b1e10-0000-4000-8000-000000000002"]'
    ) as HTMLElement;
    expect(globex.hasAttribute('data-image-blob-id')).toBe(false);
  });

  it('falls back to identity.displayProperty when titlePropertyName is null', async () => {
    const m = manifest();
    // mutate the layout to drop the title pointer
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
    // identity.displayProperty === 'name', so first card shows ACME Corp.
    const titles = Array.from(container.querySelectorAll('[data-granit-gallery-card-title]')).map(
      (n) => n.textContent
    );
    expect(titles).toEqual(['ACME Corp', 'Globex']);
  });

  it('omits the subtitle slot when subtitlePropertyName is null', async () => {
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
    const acme = container.querySelector(
      '[data-row-id="8c6b1e10-0000-4000-8000-000000000001"]'
    ) as HTMLElement;
    fireEvent.click(acme);
    expect(onCardClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: '8c6b1e10-0000-4000-8000-000000000001', name: 'ACME Corp' })
    );
  });

  it('uses an explicit layout prop over the manifest auto-pick', async () => {
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
            cardSize: 'Small',
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
});
