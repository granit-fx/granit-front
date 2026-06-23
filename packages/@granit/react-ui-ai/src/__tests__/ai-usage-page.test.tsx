import { mockUsageRecords } from '@granit/react-ai/testing';
import { screen } from '@testing-library/react';
import * as React from 'react';

import { AIUsagePage } from '../ai-usage-page';

import { renderWithProviders } from './test-utils';

import type { AIUsageRecord } from '@granit/ai';

const usageMock = vi.hoisted(() => ({
  items: [] as AIUsageRecord[],
  meta: {
    columns: [] as unknown[],
    presetFilterGroups: [] as unknown[],
    groupByFields: [] as unknown[],
  },
  isGrouped: false,
  groupedTotal: 0,
}));

vi.mock('@granit/react-ai/usage', () => ({
  AIUsageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAIUsageMeta: () => ({ data: usageMock.meta, isLoading: false }),
  useAIUsage: () => ({
    query: {
      data: { items: usageMock.items, totalCount: usageMock.items.length },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    },
    groupedQuery: {
      data: { groups: [], totalCount: usageMock.groupedTotal },
      isLoading: false,
    },
    params: { page: 1, pageSize: 20, sort: [], groupBy: undefined },
    isGrouped: usageMock.isGrouped,
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    toggleSort: vi.fn(),
    setGroupBy: vi.fn(),
  }),
}));

describe('AIUsagePage', () => {
  beforeEach(() => {
    usageMock.items = [];
    usageMock.meta = { columns: [], presetFilterGroups: [], groupByFields: [] };
    usageMock.isGrouped = false;
    usageMock.groupedTotal = 0;
  });

  it('should render the page title', () => {
    renderWithProviders(<AIUsagePage />);
    expect(screen.getByText('AI Usage Tracking')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderWithProviders(<AIUsagePage />);
    expect(document.querySelector('[data-slot="ai-usage-page"]')).toBeInTheDocument();
  });

  it('renders every cell type from the shared usage fixtures', () => {
    usageMock.items = mockUsageRecords;
    renderWithProviders(<AIUsagePage />);

    // Conversation id column shows ids and a dash for the null record.
    expect(screen.getByText('Conversation')).toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);

    // Cost cell formats currency for records with a currency…
    const withCurrency = mockUsageRecords.find((r) => r.costCurrency)!;
    expect(
      screen.getAllByText((text) => text.includes(withCurrency.estimatedCost!.toFixed(4))).length
    ).toBeGreaterThan(0);

    // …and a dash for the record whose cost is null.
    expect(mockUsageRecords.some((r) => r.estimatedCost === null)).toBe(true);

    // Token columns are localized numbers.
    expect(
      screen.getAllByText(mockUsageRecords[0]!.inputTokens.toLocaleString()).length
    ).toBeGreaterThan(0);
  });

  it('renders the meta toolbar with the record count when meta has columns', () => {
    usageMock.items = mockUsageRecords;
    usageMock.meta = {
      columns: [{ id: 'provider', label: 'Provider', sortable: true }],
      presetFilterGroups: [],
      groupByFields: [{ field: 'provider', label: 'Provider' }],
    };
    renderWithProviders(<AIUsagePage />);
    expect(screen.getByText('AI Usage Tracking')).toBeInTheDocument();
  });

  it('uses the grouped totals when the query is grouped', () => {
    usageMock.meta = {
      columns: [{ id: 'provider', label: 'Provider', sortable: true }],
      presetFilterGroups: [],
      groupByFields: [],
    };
    usageMock.isGrouped = true;
    usageMock.groupedTotal = 7;
    renderWithProviders(<AIUsagePage />);
    expect(screen.getByText('AI Usage Tracking')).toBeInTheDocument();
  });
});
