import { screen } from '@testing-library/react';
import * as React from 'react';

import { WebhookListPage } from '../webhook-list-page';

import { renderWithProviders } from './test-utils';

vi.mock('@granit/react-query-engine', () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useQueryMeta: () => ({
    data: { columns: [], presetFilterGroups: [], groupByFields: [] },
    isLoading: false,
  }),
  useQueryEndpoint: () => ({
    query: {
      data: { items: [], totalCount: 0 },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    },
    params: { page: 1, pageSize: 20, sort: [] },
    isGrouped: false,
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    toggleSort: vi.fn(),
  }),
  useSmartFilter: () => ({
    filters: [],
    search: '',
    presets: {},
    quickFilters: [],
    tokens: [],
    setSearch: vi.fn(),
    addFilter: vi.fn(),
    removeFilter: vi.fn(),
    clearFilters: vi.fn(),
    removeToken: vi.fn(),
  }),
}));

vi.mock('@granit/react-ui-kit', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useSmartFilterSync: () => ({ handlePresetToggle: vi.fn() }),
  useOperatorLabels: () => ({}),
}));

describe('WebhookListPage', () => {
  it('should render page title', () => {
    renderWithProviders(<WebhookListPage />);
    expect(screen.getByText('Webhook Management')).toBeInTheDocument();
  });

  it('should render subtitle', () => {
    renderWithProviders(<WebhookListPage />);
    expect(
      screen.getByText('Manage webhook subscriptions and monitor deliveries')
    ).toBeInTheDocument();
  });

  it('should render create button', () => {
    renderWithProviders(<WebhookListPage />);
    expect(screen.getByText('New subscription')).toBeInTheDocument();
  });
});
