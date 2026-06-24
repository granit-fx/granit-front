import { screen } from '@testing-library/react';
import * as React from 'react';

import { PlanListPage } from '../plans/plan-list-page';

import { renderWithProviders } from './test-utils';

import type { PlanQueryItem } from '../plans/types';

const SAMPLE_ITEMS: PlanQueryItem[] = [
  {
    id: 'plan-001',
    name: 'Starter',
    pricingModel: 'Flat',
    defaultInterval: 'Monthly',
    lifecycleStatus: 'Draft',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'plan-002',
    name: 'Professional',
    pricingModel: 'PerSeat',
    defaultInterval: 'Monthly',
    lifecycleStatus: 'Published',
    createdAt: '2026-01-02T00:00:00Z',
  },
  {
    id: 'plan-003',
    name: 'Enterprise Legacy',
    pricingModel: 'Tiered',
    defaultInterval: 'Annual',
    lifecycleStatus: 'Archived',
    createdAt: '2026-01-03T00:00:00Z',
  },
];

vi.mock('@granit/react-query-engine', () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useQueryMeta: () => ({
    data: { columns: [], presetFilterGroups: [], groupByFields: [] },
    isLoading: false,
  }),
  useQueryEndpoint: () => ({
    query: {
      data: { items: SAMPLE_ITEMS, totalCount: SAMPLE_ITEMS.length },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    },
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
    removeToken: vi.fn(),
  }),
}));

vi.mock('@granit/react-subscriptions', () => ({
  useCreatePlan: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@granit/react-ui-kit', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useSmartFilterSync: () => ({ handlePresetToggle: vi.fn() }),
  useOperatorLabels: () => ({}),
}));

describe('PlanListPage', () => {
  it('renders plans of every lifecycle status', () => {
    renderWithProviders(<PlanListPage />);
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Legacy')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('exposes the data-slot on the page root', () => {
    renderWithProviders(<PlanListPage />);
    expect(document.querySelector('[data-slot="plan-list-page"]')).toBeInTheDocument();
  });
});
