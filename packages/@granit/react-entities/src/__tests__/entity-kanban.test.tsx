import { GranitClientProvider } from '@granit/react-api-client';
import { QueryProvider } from '@granit/react-query-engine';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { EntityKanban } from '../components/entity-kanban.js';
import { EntityRendererProvider } from '../provider/index.js';

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
  groupByFields: [{ name: 'status', type: 'String' }],
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxStreamSize: 10000,
    supportsCursor: false,
  },
};

const PAGE = {
  items: [
    { id: '1', name: 'ACME', status: 'Active' },
    { id: '2', name: 'Globex', status: 'Active' },
    { id: '3', name: 'Initech', status: 'Pending' },
    { id: '4', name: 'Hooli', status: null },
  ],
  totalCount: 4,
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
          displayProperty: 'name',
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
        <QueryProvider config={{ basePath: BASE_PATH }}>
          <EntityRendererProvider>{children}</EntityRendererProvider>
        </QueryProvider>
      </GranitClientProvider>
    </QueryClientProvider>
  );
  return { wrapper };
}

describe('EntityKanban', () => {
  it('renders the empty marker when the manifest declares no list collection', () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityKanban manifest={manifest(false)} groupBy="status" />
      </Wrapper>
    );
    expect(container.querySelector('[data-granit-entity-kanban-empty]')).not.toBeNull();
    expect(container.querySelector('[data-granit-entity-kanban-board]')).toBeNull();
  });

  it('buckets items into one column per distinct groupBy value', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityKanban manifest={manifest(true)} groupBy="status" />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-entity-kanban-board]')).not.toBeNull()
    );
    const columns = Array.from(container.querySelectorAll('[data-granit-kanban-column]'));
    expect(columns.map((c) => c.getAttribute('data-group-key'))).toEqual([
      'Active',
      'Pending',
      '∅',
    ]);
    const counts = columns.map(
      (c) => c.querySelector('[data-granit-kanban-column-count]')?.textContent
    );
    expect(counts).toEqual(['2', '1', '1']);
  });

  it('uses identity.displayProperty as card title by default', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityKanban manifest={manifest(true)} groupBy="status" />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-kanban-card]')).not.toBeNull()
    );
    const firstCard = container.querySelector('[data-granit-kanban-card]');
    expect(firstCard?.textContent).toBe('ACME');
  });

  it('honours an explicit titleProperty', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityKanban manifest={manifest(true)} groupBy="status" titleProperty="id" />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-kanban-card]')).not.toBeNull()
    );
    const titles = Array.from(container.querySelectorAll('[data-granit-kanban-card]')).map(
      (el) => el.textContent
    );
    expect(titles).toEqual(['1', '2', '3', '4']);
  });

  it('fires onCardClick with the row when a card is clicked', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const onCardClick = vi.fn();
    const { container } = render(
      <Wrapper>
        <EntityKanban manifest={manifest(true)} groupBy="status" onCardClick={onCardClick} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-kanban-card]')).not.toBeNull()
    );
    fireEvent.click(container.querySelector('[data-granit-kanban-card]') as HTMLLIElement);
    expect(onCardClick).toHaveBeenCalledWith(PAGE.items[0]);
  });

  it('surfaces an error message when the page endpoint fails', async () => {
    server.use(
      http.get(`http://localhost${BASE_PATH}`, () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 })
      )
    );
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityKanban manifest={manifest(true)} groupBy="status" />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-entity-kanban-error]')).not.toBeNull()
    );
  });
});
