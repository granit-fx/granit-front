import { screen } from '@testing-library/react';

import { WebhookDetailPage } from '../webhook-detail-page';

import { renderWithProviders } from './test-utils';

const { mockUseParams } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useParams: mockUseParams,
    useNavigate: () => vi.fn(),
  };
});

const { mockUseSubscription, mockUseWebhookStats } = vi.hoisted(() => ({
  mockUseSubscription: vi.fn(),
  mockUseWebhookStats: vi.fn(),
}));

vi.mock('@granit/react-webhooks', () => {
  const noopMutation = () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false });
  return {
    useSubscription: mockUseSubscription,
    useWebhookConfig: () => ({ data: { storePayload: false } }),
    useWebhookStats: mockUseWebhookStats,
    useUpdateSubscription: noopMutation,
    useActivateSubscription: noopMutation,
    useSuspendSubscription: noopMutation,
    useDeactivateSubscription: noopMutation,
    useDeleteSubscription: noopMutation,
    useTestPing: noopMutation,
    useRetryDelivery: noopMutation,
  };
});

// The detail page composes several self-fetching child components. Stub them
// so the test exercises the page's own structure (header, status, tabs).
vi.mock('../components/webhook-dashboard', () => ({
  WebhookDashboard: () => <div data-testid="webhook-dashboard" />,
}));
vi.mock('../components/webhook-delivery-table', () => ({
  WebhookDeliveryTable: () => <div data-testid="webhook-delivery-table" />,
}));
vi.mock('../components/webhook-signing-keys', () => ({
  WebhookSigningKeys: () => <div data-testid="webhook-signing-keys" />,
}));
vi.mock('../components/webhook-subscription-form', () => ({
  WebhookSubscriptionForm: () => <div data-testid="webhook-subscription-form" />,
}));

const subscription = {
  id: '8c6b1e10-0000-4000-8000-000000000001',
  targetUrl: 'https://example.com/hooks',
  eventType: 'invoice.created',
  status: 'Active',
  consecutiveFailureCount: 0,
  lastSuccessAt: '2026-06-20T08:00:00.000Z',
  createdAt: '2026-06-01T08:00:00.000Z',
  modifiedAt: null,
  signingSecretHint: 'whsec_b46a****************5182',
};

beforeEach(() => {
  mockUseParams.mockReturnValue({ id: subscription.id });
  mockUseWebhookStats.mockReturnValue({ data: undefined, isLoading: false });
});

afterEach(() => vi.clearAllMocks());

describe('WebhookDetailPage', () => {
  it('should display the loading spinner', () => {
    mockUseSubscription.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<WebhookDetailPage />, { route: `/webhooks/${subscription.id}` });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display the not-found state when the subscription is missing', () => {
    mockUseSubscription.mockReturnValue({ data: undefined, isLoading: false });
    renderWithProviders(<WebhookDetailPage />, { route: `/webhooks/${subscription.id}` });
    expect(screen.getByText('Subscription not found')).toBeInTheDocument();
    expect(
      screen.getByText('The requested webhook subscription does not exist.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to webhooks/ })).toBeInTheDocument();
  });

  it('should render the subscription header and status', () => {
    mockUseSubscription.mockReturnValue({ data: subscription, isLoading: false });
    renderWithProviders(<WebhookDetailPage />, { route: `/webhooks/${subscription.id}` });
    expect(document.querySelector('[data-slot="webhook-detail-page"]')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'https://example.com/hooks' })
    ).toBeInTheDocument();
    expect(screen.getByText('invoice.created')).toBeInTheDocument();
  });

  it('should render the detail tabs', () => {
    mockUseSubscription.mockReturnValue({ data: subscription, isLoading: false });
    renderWithProviders(<WebhookDetailPage />, { route: `/webhooks/${subscription.id}` });
    expect(screen.getByRole('tab', { name: 'Details' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Deliveries' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Settings' })).toBeInTheDocument();
  });

  it('should render the dashboard and the active details tab', () => {
    mockUseSubscription.mockReturnValue({ data: subscription, isLoading: false });
    renderWithProviders(<WebhookDetailPage />, { route: `/webhooks/${subscription.id}` });
    expect(screen.getByTestId('webhook-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('webhook-subscription-form')).toBeInTheDocument();
  });
});
