import { screen } from '@testing-library/react';
import * as React from 'react';

import { SubscriptionListPage } from '../subscriptions/subscription-list-page';

import { renderWithProviders } from './test-utils';

import type { SubscriptionResponse } from '@granit/subscriptions';

const SAMPLE_ITEMS: SubscriptionResponse[] = [
  {
    id: 'sub-00000001-aaaa-bbbb-cccc-000000000001',
    partyId: 'party-001',
    planId: 'plan-001',
    status: 'Active',
    currency: 'EUR',
    currentPeriodStart: '2026-01-01T00:00:00Z',
    currentPeriodEnd: '2026-02-01T00:00:00Z',
    trialEndsAt: null,
    cancelAtPeriodEnd: false,
    cancelledAt: null,
    cancellationReason: null,
    seatCount: 5,
    createdAt: '2026-01-01T00:00:00Z',
    modifiedAt: null,
    planPriceId: 'price-001',
  },
  {
    id: 'sub-00000002-aaaa-bbbb-cccc-000000000002',
    partyId: 'party-002',
    planId: 'plan-002',
    status: 'Cancelled',
    currency: 'USD',
    currentPeriodStart: '2026-01-02T00:00:00Z',
    currentPeriodEnd: '2026-02-02T00:00:00Z',
    trialEndsAt: null,
    cancelAtPeriodEnd: true,
    cancelledAt: '2026-01-15T00:00:00Z',
    cancellationReason: 'Customer request',
    seatCount: 3,
    createdAt: '2026-01-02T00:00:00Z',
    modifiedAt: null,
    planPriceId: 'price-002',
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
  useActivePlans: () => ({ data: [{ id: 'plan-001', name: 'Starter' }] }),
  useCreateSubscription: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@granit/react-ui-admin-kit', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useSmartFilterSync: () => ({ handlePresetToggle: vi.fn() }),
  useOperatorLabels: () => ({}),
}));

describe('SubscriptionListPage', () => {
  it('renders the page title and subtitle', () => {
    renderWithProviders(<SubscriptionListPage />);
    expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('Manage subscriptions')).toBeInTheDocument();
  });

  it('exposes the data-slot on the page root', () => {
    renderWithProviders(<SubscriptionListPage />);
    expect(document.querySelector('[data-slot="subscription-list-page"]')).toBeInTheDocument();
  });

  it('renders subscription rows with their statuses', () => {
    renderWithProviders(<SubscriptionListPage />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('resolves the plan name from active plans when available', () => {
    renderWithProviders(<SubscriptionListPage />);
    // plan-001 maps to "Starter" via useActivePlans; plan-002 is unknown and truncated.
    expect(screen.getByText('Starter')).toBeInTheDocument();
  });
});
