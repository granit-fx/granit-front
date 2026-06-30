import { GranitClientProvider } from '@granit/react-api-client';
import { CmsProvider } from '@granit/react-cms';
import { CORPORATE_SITE_ID, createMenusHandlers } from '@granit/react-cms/testing';
import { createMswServer } from '@granit/testing/msw-server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';

import { MenusListPage } from '../components/menus-list-page';

import { renderWithProviders } from './test-utils';

import type { ReactNode } from 'react';

const BASE_PATH = '/api/cms';
const client = axios.create({ baseURL: '' });

// Minimal `/menus/meta` so `useMenusMeta` resolves (the grid only reads
// `defaultSort`); the list itself is served by the shared CMS handlers.
const metaHandler = http.get(`${BASE_PATH}/menus/meta`, () =>
  HttpResponse.json({
    columns: [],
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
    defaultSort: 'key',
  })
);

const server = createMswServer(metaHandler, ...createMenusHandlers(`${BASE_PATH}/menus`));

function Wrapper({ children }: { readonly children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <GranitClientProvider client={client}>
      <QueryClientProvider client={queryClient}>
        <CmsProvider config={{ client, basePath: BASE_PATH }}>{children}</CmsProvider>
      </QueryClientProvider>
    </GranitClientProvider>
  );
}

const ROUTE = `/cms/sites/${CORPORATE_SITE_ID}/menus`;

function renderPage() {
  return renderWithProviders(
    <Wrapper>
      <MenusListPage />
    </Wrapper>,
    { route: ROUTE }
  );
}

describe('MenusListPage', () => {
  it('renders the page title and data-slot', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Menus' })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="menus-list-page"]')).toBeInTheDocument();
  });

  it('renders the new-menu action', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /New menu/i })).toBeInTheDocument();
  });

  it('renders the column headers', () => {
    renderPage();
    expect(screen.getByRole('columnheader', { name: 'Key' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Items' })).toBeInTheDocument();
  });

  it('renders a row per menu fetched from the query endpoint', async () => {
    renderPage();
    expect(await screen.findByText('main')).toBeInTheDocument();
    expect(screen.getByText('Main navigation')).toBeInTheDocument();
    expect(screen.getByText('footer')).toBeInTheDocument();
  });

  it('exposes accessible edit and delete actions per row', async () => {
    renderPage();
    await screen.findByText('main');
    expect(screen.getAllByRole('link', { name: 'Edit' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Delete' }).length).toBeGreaterThan(0);
  });

  it('renders no data rows when the endpoint returns no menus', async () => {
    server.use(
      http.get(`${BASE_PATH}/menus`, () =>
        HttpResponse.json({ items: [], totalCount: 0, hasMore: false, nextCursor: null })
      )
    );
    renderPage();
    await waitFor(() => expect(screen.queryByText('main')).not.toBeInTheDocument());
    expect(screen.getByRole('columnheader', { name: 'Key' })).toBeInTheDocument();
  });
});
