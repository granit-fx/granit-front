import { GranitClientProvider } from '@granit/react-api-client';
import { CmsProvider } from '@granit/react-cms';
import { createSitesHandlers } from '@granit/react-cms/testing';
import { createMswServer } from '@granit/testing/msw-server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';

import { SitesListPage } from '../components/sites-list-page';

import { renderWithProviders } from './test-utils';

import type { ReactNode } from 'react';

const BASE_PATH = '/api/cms';
const client = axios.create({ baseURL: '' });

// Minimal `/sites/meta` so `useSitesMeta` resolves (the grid only reads
// `defaultSort`); the list itself is served by the shared CMS handlers.
const metaHandler = http.get(`${BASE_PATH}/sites/meta`, () =>
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
    defaultSort: 'slug',
  })
);

const server = createMswServer(metaHandler, ...createSitesHandlers(`${BASE_PATH}/sites`));

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

function renderPage() {
  return renderWithProviders(
    <Wrapper>
      <SitesListPage />
    </Wrapper>
  );
}

describe('SitesListPage', () => {
  it('renders the page title, subtitle and data-slot', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Sites' })).toBeInTheDocument();
    expect(screen.getByText('Manage your CMS sites and their content.')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="sites-list-page"]')).toBeInTheDocument();
  });

  it('renders the new-site action', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /New site/i })).toBeInTheDocument();
  });

  it('renders the column headers', () => {
    renderPage();
    expect(screen.getByRole('columnheader', { name: 'Slug' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Cultures' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
  });

  it('renders a row per site fetched from the query endpoint', async () => {
    renderPage();
    expect(await screen.findByText('corporate')).toBeInTheDocument();
    expect(screen.getByText('Corporate Website')).toBeInTheDocument();
    expect(screen.getByText('support')).toBeInTheDocument();
  });

  it('renders active/inactive status badges', async () => {
    renderPage();
    await screen.findByText('corporate');
    expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('exposes the accessible per-row navigation and delete actions', async () => {
    renderPage();
    await screen.findByText('corporate');
    expect(screen.getAllByRole('button', { name: 'Pages' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Delete' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Edit' }).length).toBeGreaterThan(0);
  });

  it('renders no data rows when the endpoint returns no sites', async () => {
    server.use(
      http.get(`${BASE_PATH}/sites`, () =>
        HttpResponse.json({ items: [], totalCount: 0, hasMore: false, nextCursor: null })
      )
    );
    renderPage();
    await waitFor(() => expect(screen.queryByText('corporate')).not.toBeInTheDocument());
    expect(screen.getByRole('columnheader', { name: 'Slug' })).toBeInTheDocument();
  });
});
