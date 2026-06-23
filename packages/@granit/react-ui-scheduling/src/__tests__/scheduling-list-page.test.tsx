import { ScheduledActionStatus } from '@granit/scheduling';
import { screen, waitFor } from '@testing-library/react';

import { SchedulingListPage } from '../scheduling-list-page';

import { renderWithProviders } from './test-utils';

import type { ScheduledActionResponse } from '@granit/scheduling';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockActions: ScheduledActionResponse[] = [
  {
    id: '1',
    payloadType: 'SendReminderEmail',
    executeAt: '2026-04-05T09:00:00Z',
    correlationId: null,
    status: ScheduledActionStatus.Pending,
    executedAt: null,
    cancelledBy: null,
    failureReason: null,
    createdAt: '2026-04-02T14:30:00Z',
  },
  {
    id: '2',
    payloadType: 'GenerateMonthlyReport',
    executeAt: '2026-04-01T00:00:00Z',
    correlationId: 'batch-42',
    status: ScheduledActionStatus.Executed,
    executedAt: '2026-04-01T00:01:23Z',
    cancelledBy: null,
    failureReason: null,
    createdAt: '2026-03-25T10:00:00Z',
  },
];

const mockMeta = {
  columns: [
    {
      name: 'payloadType',
      label: 'Action Type',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'executeAt',
      label: 'Scheduled For',
      type: 'DateTime',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'payloadType', type: 'String', operators: ['Eq', 'Contains'] },
    { name: 'status', type: 'String', operators: ['Eq', 'In'] },
  ],
  sortableFields: [{ name: 'payloadType' }, { name: 'status' }, { name: 'executeAt' }],
  presetFilterGroups: [
    {
      name: 'status',
      label: 'Status',
      presets: [
        { name: 'pending', label: 'Pending', isDefault: false },
        { name: 'executed', label: 'Executed', isDefault: false },
      ],
    },
  ],
  quickFilters: [],
  dateFilters: [],
  groupByFields: [],
  pagination: { defaultPageSize: 20, maxPageSize: 50, supportsCursor: false },
};

const mockQueryEndpoint = {
  query: {
    data: { items: mockActions, totalCount: 2 },
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  },
  groupedQuery: { data: undefined, isLoading: false },
  params: {
    page: 1,
    pageSize: 20,
    sort: [{ field: 'executeAt', direction: 'desc' }],
    filters: [],
    search: '',
  },
  isGrouped: false,
  setPage: vi.fn(),
  setPageSize: vi.fn(),
  toggleSort: vi.fn(),
  setFilters: vi.fn(),
  setSearch: vi.fn(),
  setPresets: vi.fn(),
  setQuickFilters: vi.fn(),
  setGroupBy: vi.fn(),
};

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@granit/react-query-engine', () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useQueryMeta: () => ({ data: mockMeta, isLoading: false }),
  useQueryEndpoint: () => mockQueryEndpoint,
  useSmartFilter: () => ({
    filters: [],
    search: '',
    presets: {},
    quickFilters: [],
    tokens: [],
    addPresetToken: vi.fn(),
    removeToken: vi.fn(),
  }),
}));

const mockCancelMutate = vi.fn();
const mockRescheduleMutate = vi.fn();

vi.mock('@granit/react-scheduling', () => ({
  SchedulingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useCancelScheduledAction: () => ({ mutate: mockCancelMutate, isPending: false }),
  useRescheduleScheduledAction: () => ({ mutate: mockRescheduleMutate, isPending: false }),
}));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => true, isLoading: false }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SchedulingListPage', () => {
  it('should render page title and subtitle', () => {
    renderWithProviders(<SchedulingListPage />);
    expect(screen.getByText('Scheduled Actions')).toBeInTheDocument();
    expect(screen.getByText('Manage scheduled actions')).toBeInTheDocument();
  });

  it('should render refresh button', () => {
    renderWithProviders(<SchedulingListPage />);
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('should render smart filter bar', async () => {
    renderWithProviders(<SchedulingListPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search or filter/i)).toBeInTheDocument();
    });
  });

  it('should render filter preset buttons', async () => {
    renderWithProviders(<SchedulingListPage />);

    await waitFor(() => {
      const presetContainer = document.querySelector('[data-slot="filter-presets"]');
      expect(presetContainer).toBeInTheDocument();
    });
  });

  it('should display scheduled actions in the table', async () => {
    renderWithProviders(<SchedulingListPage />);

    await waitFor(() => {
      expect(screen.getByText('SendReminderEmail')).toBeInTheDocument();
      expect(screen.getByText('GenerateMonthlyReport')).toBeInTheDocument();
    });
  });

  it('should show correlation ID when present', async () => {
    renderWithProviders(<SchedulingListPage />);

    await waitFor(() => {
      expect(screen.getByText('batch-42')).toBeInTheDocument();
    });
  });

  it('should show action menu for pending actions', async () => {
    const { user } = renderWithProviders(<SchedulingListPage />);

    await waitFor(() => {
      expect(screen.getByText('SendReminderEmail')).toBeInTheDocument();
    });

    const actionButton = screen.getByRole('button', {
      name: /actions for sendreminderem/i,
    });
    await user.click(actionButton);

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /reschedule/i })).toBeInTheDocument();
    });
  });

  it('should open cancel confirmation dialog', async () => {
    const { user } = renderWithProviders(<SchedulingListPage />);

    await waitFor(() => {
      expect(screen.getByText('SendReminderEmail')).toBeInTheDocument();
    });

    const actionButton = screen.getByRole('button', {
      name: /actions for sendreminderem/i,
    });
    await user.click(actionButton);

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /cancel/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('menuitem', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to cancel this action?')).toBeInTheDocument();
    });
  });

  it('should open reschedule dialog', async () => {
    const { user } = renderWithProviders(<SchedulingListPage />);

    await waitFor(() => {
      expect(screen.getByText('SendReminderEmail')).toBeInTheDocument();
    });

    const actionButton = screen.getByRole('button', {
      name: /actions for sendreminderem/i,
    });
    await user.click(actionButton);

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /reschedule/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('menuitem', { name: /reschedule/i }));

    await waitFor(() => {
      expect(screen.getByText('Reschedule Action')).toBeInTheDocument();
      expect(screen.getByText('New Execution Date')).toBeInTheDocument();
    });
  });

  it('should have data-slot attribute on page', () => {
    renderWithProviders(<SchedulingListPage />);
    expect(document.querySelector('[data-slot="scheduling-list-page"]')).toBeInTheDocument();
  });
});
