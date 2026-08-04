import { screen } from '@testing-library/react';

import { SchedulingDetailPage } from '../scheduling-detail-page';

import { renderWithProviders } from './test-utils';

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

const { mockUseScheduledAction } = vi.hoisted(() => ({
  mockUseScheduledAction: vi.fn(),
}));

vi.mock('@granit/react-scheduling', () => ({
  SchedulingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useScheduledAction: mockUseScheduledAction,
  useCancelScheduledAction: () => ({ mutate: vi.fn(), isPending: false }),
  useRescheduleScheduledAction: () => ({ mutate: vi.fn(), isPending: false }),
}));

// Grant the manage permission so action buttons render for a pending action.
vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

const action = {
  id: '8c6b1e10-0000-4000-8000-000000000001',
  payloadType: 'Granit.Showcase.SampleReminder',
  executeAt: '2026-07-01T10:00:00.000Z',
  correlationId: null,
  status: 'Pending',
  executedAt: null,
  cancelledBy: null,
  failureReason: null,
  createdAt: '2026-06-20T08:00:00.000Z',
  modifiedAt: null,
};

beforeEach(() => {
  mockUseParams.mockReturnValue({ id: action.id });
});

afterEach(() => vi.clearAllMocks());

describe('SchedulingDetailPage', () => {
  it('should display the loading spinner', () => {
    mockUseScheduledAction.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<SchedulingDetailPage />, { route: `/scheduling/${action.id}` });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display the not-found state when the action is missing', () => {
    mockUseScheduledAction.mockReturnValue({ data: undefined, isLoading: false });
    renderWithProviders(<SchedulingDetailPage />, { route: `/scheduling/${action.id}` });
    expect(screen.getByText('Scheduled action not found')).toBeInTheDocument();
  });

  it('should render the action detail card and fields', () => {
    mockUseScheduledAction.mockReturnValue({ data: action, isLoading: false });
    renderWithProviders(<SchedulingDetailPage />, { route: `/scheduling/${action.id}` });
    expect(document.querySelector('[data-slot="scheduling-detail-page"]')).toBeInTheDocument();
    expect(screen.getByText('Scheduled Action')).toBeInTheDocument();
    expect(screen.getByText('Payload Type')).toBeInTheDocument();
    expect(screen.getByText('Granit.Showcase.SampleReminder')).toBeInTheDocument();
  });

  it('should render the back link', () => {
    mockUseScheduledAction.mockReturnValue({ data: action, isLoading: false });
    renderWithProviders(<SchedulingDetailPage />, { route: `/scheduling/${action.id}` });
    expect(screen.getByRole('link', { name: /Back/ })).toHaveAttribute('href', '/scheduling');
  });

  it('should render manage actions for a pending action', () => {
    mockUseScheduledAction.mockReturnValue({ data: action, isLoading: false });
    renderWithProviders(<SchedulingDetailPage />, { route: `/scheduling/${action.id}` });
    expect(screen.getByRole('button', { name: /Reschedule/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
  });
});
