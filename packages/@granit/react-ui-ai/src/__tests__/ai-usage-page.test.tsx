import { screen } from '@testing-library/react';
import * as React from 'react';

import { AIUsagePage } from '../ai-usage-page';

import { renderWithProviders } from './test-utils';

import type { AIUsageRecord } from '@granit/ai';

const usageMock = vi.hoisted(() => ({ items: [] as AIUsageRecord[] }));

vi.mock('@granit/react-ai/usage', () => ({
  AIUsageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAIUsageMeta: () => ({
    data: { columns: [], presetFilterGroups: [], groupByFields: [] },
    isLoading: false,
  }),
  useAIUsage: () => ({
    query: {
      data: { items: usageMock.items, totalCount: usageMock.items.length },
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
}));

// Two records sharing all non-null fields so the only rendered dash comes from
// the nullable conversationId column under test.
const baseRecord = {
  tenantId: null,
  userId: null,
  workspaceName: 'ws-a',
  provider: 'openai',
  model: 'gpt-4',
  inputTokens: 10,
  outputTokens: 20,
  estimatedCost: 0.01,
  costCurrency: 'USD',
  timestamp: '2026-01-01T00:00:00Z',
  duration: '00:00:01',
};

const usageRecords = [
  { ...baseRecord, id: 'rec-1', conversationId: 'conv-123' },
  { ...baseRecord, id: 'rec-2', conversationId: null },
] as unknown as AIUsageRecord[];

describe('AIUsagePage', () => {
  beforeEach(() => {
    usageMock.items = [];
  });

  it('should render the page title', () => {
    renderWithProviders(<AIUsagePage />);
    expect(screen.getByText('AI Usage Tracking')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderWithProviders(<AIUsagePage />);
    expect(document.querySelector('[data-slot="ai-usage-page"]')).toBeInTheDocument();
  });

  it('should render the conversation column, showing the id or a dash when null', () => {
    usageMock.items = usageRecords;
    renderWithProviders(<AIUsagePage />);

    expect(screen.getByText('Conversation')).toBeInTheDocument();
    expect(screen.getByText('conv-123')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
