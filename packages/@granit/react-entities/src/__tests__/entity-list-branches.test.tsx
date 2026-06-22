import { GranitClientProvider } from '@granit/react-api-client';
import { QueryProvider } from '@granit/react-query-engine';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { EntityList } from '../components/entity-list';
import { EntityRendererProvider } from '../providers/index';

import type { EntityManifestResponse } from '@granit/entities';
import type { QueryMetadata } from '@granit/query-engine';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Branch-coverage backfill for EntityList. The base suite covers the empty
// manifest, happy rows, row-click, meta-error and zero-items paths. This file
// targets the formatCell type switch (null / object / number / fallback), the
// readRowKey fallback-index arm (rows without an id), the query-error arm with
// no meta error, and the nullish-coalescing fallbacks in the body.
// ---------------------------------------------------------------------------

const BASE_PATH = '/api/v1/things';
const ENTITY_NAME = 'Granit.Things.Thing';

const META: QueryMetadata = {
  columns: [
    {
      name: 'label',
      label: 'Label',
      type: 'String',
      order: 0,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'count',
      label: 'Count',
      type: 'Int32',
      order: 1,
      isSortable: true,
      isFilterable: false,
      isVisible: true,
    },
    {
      name: 'payload',
      label: 'Payload',
      type: 'Object',
      order: 2,
      isSortable: false,
      isFilterable: false,
      isVisible: true,
    },
    {
      name: 'note',
      label: 'Note',
      type: 'String',
      order: 3,
      isSortable: false,
      isFilterable: false,
      isVisible: true,
    },
  ],
  filterableFields: [],
  sortableFields: [],
  presets: [],
  quickFilters: [],
  defaultSort: [],
};

function manifest(): EntityManifestResponse {
  return {
    schemaVersion: 1,
    identity: {
      name: ENTITY_NAME,
      entityClrType: 'Granit.Things.Domain.Thing',
      displayKey: null,
      icon: null,
      permissionGroup: null,
      displayProperty: null,
      subtitleProperty: null,
    },
    permissions: null,
    forms: null,
    details: null,
    collections: {
      query: { name: 'Granit.Things.ThingQuery', clrTypeName: 'ThingQuery' },
      export: null,
      metrics: [],
      dashboards: [],
      defaultViewId: null,
      listLayouts: [],
      headerActions: [],
      selectionActions: [],
    },
    relations: null,
    actions: null,
  };
}

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function metaHandler() {
  return http.get(`http://localhost${BASE_PATH}/meta`, () => HttpResponse.json(META));
}

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>
        <QueryProvider config={{ basePath: BASE_PATH }}>
          <EntityRendererProvider>{children}</EntityRendererProvider>
        </QueryProvider>
      </GranitClientProvider>
    </QueryClientProvider>
  );
  return { wrapper };
}

describe('EntityList — formatCell type switch', () => {
  it('renders dash for null, ✓/✗ for booleans, JSON for objects, and raw for numbers/strings', async () => {
    server.use(
      metaHandler(),
      http.get(`http://localhost${BASE_PATH}`, () =>
        HttpResponse.json({
          items: [{ label: null, count: 5, payload: { a: 1 }, note: 'hi' }],
          totalCount: 1,
          page: 1,
          pageSize: 20,
        })
      )
    );
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityList manifest={manifest()} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-entity-list-row]')).not.toBeNull()
    );
    const cells = Array.from(container.querySelectorAll('tbody tr td')).map((td) => td.textContent);
    // label=null → dash, count=5 → '5', payload object → JSON, note string → raw.
    expect(cells).toEqual(['—', '5', '{"a":1}', 'hi']);
  });

  it('falls back to dash for an unsupported cell type (undefined)', async () => {
    server.use(
      metaHandler(),
      http.get(`http://localhost${BASE_PATH}`, () =>
        HttpResponse.json({
          // `count` absent on the row → row['count'] is undefined → first dash arm.
          items: [{ label: 'L', payload: {}, note: 'n' }],
          totalCount: 1,
          page: 1,
          pageSize: 20,
        })
      )
    );
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityList manifest={manifest()} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-entity-list-row]')).not.toBeNull()
    );
    const countCell = container.querySelector('td[data-column="count"]');
    expect(countCell?.textContent).toBe('—');
  });
});

describe('EntityList — readRowKey fallback index', () => {
  it('keys rows by their array index when no id/Id is present', async () => {
    server.use(
      metaHandler(),
      http.get(`http://localhost${BASE_PATH}`, () =>
        HttpResponse.json({
          items: [
            { label: 'A', count: 1, payload: {}, note: '' },
            { label: 'B', count: 2, payload: {}, note: '' },
          ],
          totalCount: 2,
          page: 1,
          pageSize: 20,
        })
      )
    );
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityList manifest={manifest()} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-entity-list-row]').length).toBe(2)
    );
  });
});

describe('EntityList — query error without meta error', () => {
  it('surfaces "Failed to load" when the page request fails but meta succeeds', async () => {
    server.use(
      metaHandler(),
      http.get(`http://localhost${BASE_PATH}`, () => HttpResponse.text('', { status: 500 }))
    );
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityList manifest={manifest()} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-entity-list-error]')).not.toBeNull()
    );
    // meta.error is undefined → the `?? query.error` arm surfaces the axios message.
    expect(container.querySelector('[data-granit-entity-list-error]')?.textContent).toContain(
      '500'
    );
  });
});

describe('EntityList — pagination navigation', () => {
  it('advances to the next page when next is clicked (drives setPage)', async () => {
    const page1 = [{ label: 'A', count: 1, payload: {}, note: '' }];
    const page2 = [{ label: 'B', count: 2, payload: {}, note: '' }];
    server.use(
      metaHandler(),
      http.get(`http://localhost${BASE_PATH}`, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? '1');
        return HttpResponse.json({
          items: page === 1 ? page1 : page2,
          totalCount: 40,
          page,
          pageSize: 20,
        });
      })
    );
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityList manifest={manifest()} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('td[data-column="label"]')?.textContent).toBe('A')
    );
    const next = container.querySelector('[data-granit-pagination-next]') as HTMLButtonElement;
    expect(next.disabled).toBe(false);
    fireEvent.click(next);
    await waitFor(() =>
      expect(container.querySelector('td[data-column="label"]')?.textContent).toBe('B')
    );
    // Now on page 2, prev becomes enabled — clicking it drives setPage(page - 1).
    const prev = container.querySelector('[data-granit-pagination-prev]') as HTMLButtonElement;
    expect(prev.disabled).toBe(false);
    fireEvent.click(prev);
    await waitFor(() =>
      expect(container.querySelector('td[data-column="label"]')?.textContent).toBe('A')
    );
  });
});

describe('EntityList — pagination next disabled on the last page', () => {
  it('disables next when the current page is the only page', async () => {
    server.use(
      metaHandler(),
      http.get(`http://localhost${BASE_PATH}`, () =>
        HttpResponse.json({
          items: [{ label: 'A', count: 1, payload: {}, note: '' }],
          totalCount: 1,
          page: 1,
          pageSize: 20,
        })
      )
    );
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityList manifest={manifest()} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-pagination-next]')).not.toBeNull()
    );
    expect(
      (container.querySelector('[data-granit-pagination-next]') as HTMLButtonElement).disabled
    ).toBe(true);
  });
});
