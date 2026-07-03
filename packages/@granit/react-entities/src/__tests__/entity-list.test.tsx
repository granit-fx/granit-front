import { GranitClientProvider } from '@granit/react-api-client';
import { QueryProvider } from '@granit/react-query-engine';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { EntityList } from '../components/entity-list';
import { EntityRendererProvider } from '../providers/index';

import type { EntityManifestResponse } from '@granit/entities';
import type { QueryMetadata } from '@granit/query-engine';
import type { ReactNode } from 'react';

const BASE_PATH = '/api/v1/parties';
const ENTITY_NAME = 'Granit.Parties.Party';

const META: QueryMetadata = {
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
    {
      name: 'isActive',
      label: 'Active',
      type: 'Boolean',
      order: 2,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'internalCode',
      label: 'Internal',
      type: 'String',
      order: 1,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
  ],
  filterableFields: [],
  sortableFields: [],
  presets: [],
  quickFilters: [],
  defaultSort: [],
};

const PAGE = {
  items: [
    { id: '1', name: 'ACME', isActive: true, internalCode: 'AC' },
    { id: '2', name: 'Globex', isActive: false, internalCode: 'GL' },
  ],
  totalCount: 2,
  page: 1,
  pageSize: 20,
};

function manifest(hasQuery: boolean): EntityManifestResponse {
  return {
    schemaVersion: 1,
    identity: hasQuery
      ? {
          name: ENTITY_NAME,
          entityClrType: 'Granit.Parties.Domain.Party',
          displayKey: null,
          icon: null,
          permissionGroup: null,
          displayProperty: null,
          subtitleProperty: null,
        }
      : null,
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
          listLayouts: [],
          headerActions: [],
          selectionActions: [],
        }
      : null,
    relations: null,
    actions: null,
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
afterEach(() => {
  server.resetHandlers(...freshHandlers());
});
afterAll(() => server.close());

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

describe('EntityList', () => {
  it('renders the empty marker when the manifest declares no list collection', () => {
    const { wrapper } = makeWrapper();
    const Wrapped = wrapper;
    const { container } = render(
      <Wrapped>
        <EntityList manifest={manifest(false)} />
      </Wrapped>
    );
    expect(container.querySelector('[data-granit-entity-list-empty]')).not.toBeNull();
    expect(container.querySelector('[data-granit-entity-list-table]')).toBeNull();
  });

  it('renders rows with visible columns sorted by order, hides invisible ones', async () => {
    const { wrapper } = makeWrapper();
    const Wrapped = wrapper;
    const { container } = render(
      <Wrapped>
        <EntityList manifest={manifest(true)} />
      </Wrapped>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-entity-list-table]')).not.toBeNull()
    );
    const headers = Array.from(container.querySelectorAll('thead th')).map((th) =>
      th.getAttribute('data-column')
    );
    expect(headers).toEqual(['name', 'isActive']);
    const firstRowCells = Array.from(container.querySelectorAll('tbody tr:first-of-type td')).map(
      (td) => td.textContent
    );
    expect(firstRowCells).toEqual(['ACME', '✓']);
  });

  it('fires onRowClick with the row when a row is clicked', async () => {
    const { wrapper } = makeWrapper();
    const Wrapped = wrapper;
    const onRowClick = vi.fn();
    const { container } = render(
      <Wrapped>
        <EntityList manifest={manifest(true)} onRowClick={onRowClick} />
      </Wrapped>
    );
    await waitFor(() => expect(container.querySelectorAll('tbody tr').length).toBeGreaterThan(0));
    fireEvent.click(container.querySelector('tbody tr') as HTMLTableRowElement);
    expect(onRowClick).toHaveBeenCalledWith(PAGE.items[0]);
  });

  it('disables prev on the first page and enables next when more pages exist', async () => {
    server.use(
      http.get(`http://localhost${BASE_PATH}`, () =>
        HttpResponse.json({ items: PAGE.items, totalCount: 50, page: 1, pageSize: 20 })
      )
    );
    const { wrapper } = makeWrapper();
    const Wrapped = wrapper;
    const { container } = render(
      <Wrapped>
        <EntityList manifest={manifest(true)} />
      </Wrapped>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-pagination-prev]')).not.toBeNull()
    );
    expect(
      (container.querySelector('[data-granit-pagination-prev]') as HTMLButtonElement).disabled
    ).toBe(true);
    expect(
      (container.querySelector('[data-granit-pagination-next]') as HTMLButtonElement).disabled
    ).toBe(false);
  });

  it('surfaces an error message when the meta endpoint fails', async () => {
    server.use(
      http.get(`http://localhost${BASE_PATH}/meta`, () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 })
      )
    );
    const { wrapper } = makeWrapper();
    const Wrapped = wrapper;
    const { container } = render(
      <Wrapped>
        <EntityList manifest={manifest(true)} />
      </Wrapped>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-entity-list-error]')).not.toBeNull()
    );
  });

  it('renders cells from column valueKind (Url anchor + fixed-code Currency)', async () => {
    const valueKindMeta: QueryMetadata = {
      ...META,
      columns: [
        { ...META.columns[0], name: 'website', label: 'Website', valueKind: 'Url' },
        {
          name: 'balance',
          label: 'Balance',
          type: 'Decimal',
          order: 1,
          isSortable: false,
          isFilterable: false,
          isVisible: true,
          valueKind: 'Currency',
          currencyCode: 'EUR',
        },
      ],
    };
    server.use(
      http.get(`http://localhost${BASE_PATH}/meta`, () => HttpResponse.json(valueKindMeta)),
      http.get(`http://localhost${BASE_PATH}`, () =>
        HttpResponse.json({
          items: [{ id: '1', website: 'https://acme.test', balance: 12345 }],
          totalCount: 1,
          page: 1,
          pageSize: 20,
        })
      )
    );
    const { wrapper } = makeWrapper();
    const Wrapped = wrapper;
    const { container } = render(
      <Wrapped>
        <EntityList manifest={manifest(true)} />
      </Wrapped>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-entity-list-table]')).not.toBeNull()
    );
    const link = container.querySelector('td[data-column="website"] a');
    expect(link?.getAttribute('href')).toBe('https://acme.test');
    const balance = container.querySelector('td[data-column="balance"]')?.textContent ?? '';
    expect(balance).toContain('123.45');
    expect(balance).toContain('€');
  });

  it('shows a single empty-row when the page returns zero items', async () => {
    server.use(
      http.get(`http://localhost${BASE_PATH}`, () =>
        HttpResponse.json({ items: [], totalCount: 0, page: 1, pageSize: 20 })
      )
    );
    const { wrapper } = makeWrapper();
    const Wrapped = wrapper;
    const { container } = render(
      <Wrapped>
        <EntityList manifest={manifest(true)} />
      </Wrapped>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-entity-list-empty-row]')).not.toBeNull()
    );
  });
});
