import { screen } from '@testing-library/react';

import { PlanDetailPage } from '../plans/plan-detail-page';

import { renderWithProviders } from './test-utils';

import type { PlanResponse } from '@granit/subscriptions';

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

const { mockUsePlan } = vi.hoisted(() => ({
  mockUsePlan: vi.fn(),
}));

vi.mock('@granit/react-subscriptions', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    usePlan: mockUsePlan,
    useUpdatePlan: () => ({ mutate: vi.fn(), isPending: false }),
    usePublishPlan: () => ({ mutate: vi.fn(), isPending: false }),
    useArchivePlan: () => ({ mutate: vi.fn(), isPending: false }),
    useCreatePriceVersion: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

const mockPlan: PlanResponse = {
  id: 'plan-0001-aaaa-bbbb-cccc-000000000001',
  name: 'Professional',
  description: 'The professional tier',
  pricingModel: 'PerSeat',
  defaultInterval: 'Monthly',
  trialDays: 14,
  seatLimit: 50,
  sortOrder: 1,
  lifecycleStatus: 'Published',
  prices: [
    {
      id: 'price-current-0001',
      amount: 4999,
      currency: 'EUR',
      interval: 'Monthly',
      effectiveFrom: '2026-01-01T00:00:00Z',
      isCurrent: true,
      replacedByPriceId: null,
      replacedAt: null,
      productId: null,
    },
    {
      id: 'price-past-0002',
      amount: 3999,
      currency: 'EUR',
      interval: 'Monthly',
      effectiveFrom: '2025-01-01T00:00:00Z',
      isCurrent: false,
      replacedByPriceId: 'price-current-0001',
      replacedAt: '2026-01-01T00:00:00Z',
      productId: null,
    },
  ],
};

describe('PlanDetailPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: mockPlan.id });
  });

  afterEach(() => vi.clearAllMocks());

  it('renders the loading skeleton while fetching', () => {
    mockUsePlan.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderWithProviders(<PlanDetailPage />, { route: `/subscriptions/plans/${mockPlan.id}` });
    expect(document.querySelector('[data-slot="plan-detail-page"]')).toBeInTheDocument();
    expect(screen.queryByText('Professional')).not.toBeInTheDocument();
  });

  it('renders the not-found state when the plan is missing', () => {
    mockUsePlan.mockReturnValue({ data: undefined, isLoading: false, error: null });
    renderWithProviders(<PlanDetailPage />, { route: `/subscriptions/plans/${mockPlan.id}` });
    expect(screen.getByText('Plan not found')).toBeInTheDocument();
    expect(screen.getByText('Back to list')).toBeInTheDocument();
  });

  it('renders the not-found state on error', () => {
    mockUsePlan.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('boom'),
    });
    renderWithProviders(<PlanDetailPage />, { route: `/subscriptions/plans/${mockPlan.id}` });
    expect(screen.getByText('Plan not found')).toBeInTheDocument();
  });

  it('renders the plan name, description and status', () => {
    mockUsePlan.mockReturnValue({ data: mockPlan, isLoading: false, error: null });
    renderWithProviders(<PlanDetailPage />, { route: `/subscriptions/plans/${mockPlan.id}` });
    expect(screen.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByText('The professional tier')).toBeInTheDocument();
    expect(screen.getByText('Plan Details')).toBeInTheDocument();
    // pricing model + interval labels resolve from flat i18n keys
    expect(screen.getByText('Per Seat')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('renders the price history with current and past versions', () => {
    mockUsePlan.mockReturnValue({ data: mockPlan, isLoading: false, error: null });
    renderWithProviders(<PlanDetailPage />, { route: `/subscriptions/plans/${mockPlan.id}` });
    expect(screen.getByText('Price History')).toBeInTheDocument();
    // truncated price ids (first 8 chars)
    expect(screen.getByText('price-cu')).toBeInTheDocument();
    expect(screen.getByText('price-pa')).toBeInTheDocument();
    // status badges
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('Past')).toBeInTheDocument();
  });

  it('shows the archive action for published plans', () => {
    mockUsePlan.mockReturnValue({ data: mockPlan, isLoading: false, error: null });
    renderWithProviders(<PlanDetailPage />, { route: `/subscriptions/plans/${mockPlan.id}` });
    expect(screen.getByText('Archive')).toBeInTheDocument();
  });

  it('shows the publish action for draft plans', () => {
    mockUsePlan.mockReturnValue({
      data: { ...mockPlan, lifecycleStatus: 'Draft' },
      isLoading: false,
      error: null,
    });
    renderWithProviders(<PlanDetailPage />, { route: `/subscriptions/plans/${mockPlan.id}` });
    expect(screen.getByText('Publish')).toBeInTheDocument();
  });
});
