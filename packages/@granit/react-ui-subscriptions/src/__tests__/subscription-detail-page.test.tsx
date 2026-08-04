import { screen } from '@testing-library/react';

import { SubscriptionDetailPage } from '../subscriptions/subscription-detail-page';

import { renderWithProviders } from './test-utils';

import type { SeatResponse, SubscriptionResponse } from '@granit/subscriptions';

const { mockUseParams } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
}));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useParams: mockUseParams,
  };
});

const { mockUseSubscription, mockUseSeats } = vi.hoisted(() => ({
  mockUseSubscription: vi.fn(),
  mockUseSeats: vi.fn(),
}));

vi.mock('@granit/react-subscriptions', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useSubscription: mockUseSubscription,
    useSeats: mockUseSeats,
    useActivePlans: () => ({ data: [] }),
    // MigratePriceDialog (rendered by the detail page) calls usePlan, which needs
    // a SubscriptionsProvider the test harness does not mount — stub it.
    usePlan: () => ({ data: undefined }),
    useCancelSubscription: () => ({ mutate: vi.fn(), isPending: false }),
    useChangeSubscriptionPlan: () => ({ mutate: vi.fn(), isPending: false }),
    useMigrateSubscriptionPrice: () => ({ mutate: vi.fn(), isPending: false }),
    useAssignSeat: () => ({ mutate: vi.fn(), isPending: false }),
    useRevokeSeat: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

const mockSubscription: SubscriptionResponse = {
  id: 'sub-0001-aaaa-bbbb-cccc-000000000001',
  partyId: 'party-0001',
  planId: 'plan-0001',
  status: 'Active',
  currency: 'EUR',
  currentPeriodStart: '2026-01-01T00:00:00Z',
  currentPeriodEnd: '2026-02-01T00:00:00Z',
  trialEndsAt: null,
  cancelAtPeriodEnd: false,
  cancelledAt: null,
  cancellationReason: null,
  seatCount: 2,
  createdAt: '2026-01-01T00:00:00Z',
  modifiedAt: null,
  planPriceId: 'price-0001',
};

const mockSeats: SeatResponse[] = [
  { id: 'seat-001', userId: 'user-alice', assignedAt: '2026-01-05T00:00:00Z' },
  { id: 'seat-002', userId: 'user-bob', assignedAt: '2026-01-06T00:00:00Z' },
];

describe('SubscriptionDetailPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: mockSubscription.id });
    mockUseSeats.mockReturnValue({ data: mockSeats, isLoading: false });
  });

  afterEach(() => vi.clearAllMocks());

  it('renders the loading skeleton while fetching', () => {
    mockUseSubscription.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderWithProviders(<SubscriptionDetailPage />, {
      route: `/subscriptions/${mockSubscription.id}`,
    });
    expect(document.querySelector('[data-slot="subscription-detail-page"]')).toBeInTheDocument();
    // Title only appears once the subscription has loaded.
    expect(screen.queryByText('Subscription Details')).not.toBeInTheDocument();
  });

  it('renders the not-found state when the subscription is missing', () => {
    mockUseSubscription.mockReturnValue({ data: undefined, isLoading: false, error: null });
    renderWithProviders(<SubscriptionDetailPage />, {
      route: `/subscriptions/${mockSubscription.id}`,
    });
    expect(screen.getByText('Subscription not found')).toBeInTheDocument();
    expect(screen.getByText('Back to list')).toBeInTheDocument();
  });

  it('renders the not-found state on error', () => {
    mockUseSubscription.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('boom'),
    });
    renderWithProviders(<SubscriptionDetailPage />, {
      route: `/subscriptions/${mockSubscription.id}`,
    });
    expect(screen.getByText('Subscription not found')).toBeInTheDocument();
  });

  it('renders the subscription details and status badge', () => {
    mockUseSubscription.mockReturnValue({
      data: mockSubscription,
      isLoading: false,
      error: null,
    });
    renderWithProviders(<SubscriptionDetailPage />, {
      route: `/subscriptions/${mockSubscription.id}`,
    });
    expect(screen.getByText('Subscription Details')).toBeInTheDocument();
    expect(screen.getByText('Subscription Information')).toBeInTheDocument();
    // subscription id rendered in header
    expect(screen.getByText(mockSubscription.id)).toBeInTheDocument();
    // planId rendered in info grid
    expect(screen.getByText(mockSubscription.planId)).toBeInTheDocument();
    // status badge resolves Subscriptions.Status.Active -> "Active"
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders assigned seats', () => {
    mockUseSubscription.mockReturnValue({
      data: mockSubscription,
      isLoading: false,
      error: null,
    });
    renderWithProviders(<SubscriptionDetailPage />, {
      route: `/subscriptions/${mockSubscription.id}`,
    });
    expect(screen.getByText('user-alice')).toBeInTheDocument();
    expect(screen.getByText('user-bob')).toBeInTheDocument();
  });

  it('renders the empty seats state when there are no seats', () => {
    mockUseSubscription.mockReturnValue({
      data: mockSubscription,
      isLoading: false,
      error: null,
    });
    mockUseSeats.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<SubscriptionDetailPage />, {
      route: `/subscriptions/${mockSubscription.id}`,
    });
    expect(screen.getByText('No seats assigned')).toBeInTheDocument();
  });

  it('shows action buttons only for active subscriptions', () => {
    mockUseSubscription.mockReturnValue({
      data: { ...mockSubscription, status: 'Cancelled' },
      isLoading: false,
      error: null,
    });
    renderWithProviders(<SubscriptionDetailPage />, {
      route: `/subscriptions/${mockSubscription.id}`,
    });
    expect(screen.queryByText('Cancel Subscription')).not.toBeInTheDocument();
  });
});
