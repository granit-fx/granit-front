import { GranitClientProvider } from '@granit/react-api-client';
import { CmsProvider } from '@granit/react-cms';
import { CORPORATE_SITE_ID, createReleasesHandlers } from '@granit/react-cms/testing';
import { createMswServer } from '@granit/testing/msw-server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';

import { ReleasesListPage } from '../components/releases-list-page';

import { renderCmsReleases } from './test-utils';

import type { ReactNode } from 'react';

const BASE_PATH = '/api/cms';
const client = axios.create({ baseURL: '' });

// Minimal `/releases/meta` so `useReleasesMeta` resolves (the grid only reads
// `defaultSort`); the list itself is served by the shared CMS handlers.
const metaHandler = http.get(`${BASE_PATH}/releases/meta`, () =>
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
    defaultSort: '-createdAt',
  })
);

const server = createMswServer(metaHandler, ...createReleasesHandlers(`${BASE_PATH}/releases`));

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

const ROUTE = `/cms/sites/${CORPORATE_SITE_ID}/releases`;

function renderPage() {
  return renderCmsReleases(
    <Wrapper>
      <ReleasesListPage />
    </Wrapper>,
    { route: ROUTE }
  );
}

describe('ReleasesListPage', () => {
  it('renders the Releases heading and data-slot', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Releases' })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="releases-list-page"]')).toBeInTheDocument();
  });

  it('renders the column headers including status and schedule', () => {
    renderPage();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Schedule' })).toBeInTheDocument();
  });

  it('renders a row per release fetched from the query endpoint', async () => {
    renderPage();
    expect(await screen.findByText('Spring relaunch')).toBeInTheDocument();
    expect(screen.getByText('Q1 scheduled push')).toBeInTheDocument();
  });

  it('renders the status badge per release', async () => {
    renderPage();
    await screen.findByText('Spring relaunch');
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('exposes a view action on every row and publish only on Ready releases', async () => {
    renderPage();
    await screen.findByText('Spring relaunch');
    expect(screen.getAllByRole('button', { name: 'View' })).toHaveLength(2);
    // Only the `Ready` release (Q1 scheduled push) exposes publish.
    expect(screen.getAllByRole('button', { name: 'Publish' })).toHaveLength(1);
  });

  it('renders no data rows when the endpoint returns no releases', async () => {
    server.use(
      http.get(`${BASE_PATH}/releases`, () =>
        HttpResponse.json({ items: [], totalCount: 0, hasMore: false, nextCursor: null })
      )
    );
    renderPage();
    await waitFor(() => expect(screen.queryByText('Spring relaunch')).not.toBeInTheDocument());
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
  });
});
