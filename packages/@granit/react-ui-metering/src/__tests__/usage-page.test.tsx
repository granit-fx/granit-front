import { screen } from '@testing-library/react';

import { MeteringUsagePage } from '../usage-page';

import { renderWithProviders } from './test-utils';

import type * as React from 'react';

vi.mock('@granit/react-query-engine', () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useQueryMeta: () => ({ data: null, isLoading: false }),
  useQueryEndpoint: () => ({
    query: { data: { items: [], totalCount: 0 }, isLoading: false },
    groupedQuery: { data: null, isLoading: false },
    params: { page: 1, pageSize: 20, sort: [], groupBy: undefined },
    isGrouped: false,
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    toggleSort: vi.fn(),
    setGroupBy: vi.fn(),
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
    togglePreset: vi.fn(),
    removeToken: vi.fn(),
  }),
}));

vi.mock('@granit/react-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useSmartFilterSync: () => ({ handlePresetToggle: vi.fn() }),
    useOperatorLabels: () => ({}),
  };
});

vi.mock('@granit/react-localization', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useDateFormatter: () => ({
      formatDate: (d: string) => d,
      formatDateTime: (d: string) => d,
      formatTimeAgo: (d: string) => d,
    }),
  };
});

describe('MeteringUsagePage', () => {
  it('renders the page title', () => {
    renderWithProviders(<MeteringUsagePage />);
    expect(screen.getByText('Usage')).toBeInTheDocument();
  });

  it('renders the page description', () => {
    renderWithProviders(<MeteringUsagePage />);
    expect(
      screen.getByText('Browse usage aggregates across all tenants and meters.')
    ).toBeInTheDocument();
  });

  it('has the correct data-slot', () => {
    renderWithProviders(<MeteringUsagePage />);
    expect(document.querySelector('[data-slot="metering-usage-page"]')).toBeInTheDocument();
  });
});
