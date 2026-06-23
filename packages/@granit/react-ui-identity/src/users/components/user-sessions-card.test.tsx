import { screen } from '@testing-library/react';

import { renderWithProviders } from '../../__tests__/test-utils';

import { UserSessionsCard } from './user-sessions-card';

import type { UserSessionResponse } from '@granit/identity';

const mockTerminateSession = {
  mutate: vi.fn(),
  isPending: false,
};

const mockTerminateAll = {
  mutate: vi.fn(),
  isPending: false,
};

let mockSessionsData: UserSessionResponse[] | undefined;
let mockIsLoading = false;

vi.mock('@granit/react-identity', () => ({
  useUserSessions: () => ({
    data: mockSessionsData,
    isLoading: mockIsLoading,
  }),
  useTerminateSession: () => mockTerminateSession,
  useTerminateAllSessions: () => mockTerminateAll,
}));

function makeSession(overrides: Partial<UserSessionResponse> = {}): UserSessionResponse {
  return {
    sessionId: 'session-1' as UserSessionResponse['sessionId'],
    isCurrent: false,
    createdAt: '2026-03-01T10:00:00Z' as UserSessionResponse['createdAt'],
    lastAccessedAt: '2026-03-08T09:30:00Z' as UserSessionResponse['lastAccessedAt'],
    userAgent: 'Mozilla/5.0 Chrome/134.0',
    ipAddress: '192.168.1.0',
    location: null,
    riskLevel: null,
    riskReasons: null,
    ...overrides,
  };
}

describe('UserSessionsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionsData = undefined;
    mockIsLoading = false;
  });

  it('should render skeleton when loading', () => {
    mockIsLoading = true;

    const { container } = renderWithProviders(<UserSessionsCard userId="user-1" />);

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render empty state when no sessions', () => {
    mockSessionsData = [];

    renderWithProviders(<UserSessionsCard userId="user-1" />);

    expect(screen.getByText('No active sessions')).toBeInTheDocument();
  });

  it('should render sessions list with user agent and IP', () => {
    mockSessionsData = [
      makeSession({ userAgent: 'Mozilla/5.0 Chrome/134.0', ipAddress: '192.168.1.0' }),
      makeSession({
        sessionId: 'session-2' as UserSessionResponse['sessionId'],
        userAgent: 'Mozilla/5.0 Safari/605.1',
        ipAddress: '10.0.0.0',
      }),
    ];

    renderWithProviders(<UserSessionsCard userId="user-1" />);

    // The raw user agent is parsed into a friendly label (raw string kept as a tooltip).
    expect(screen.getByText('Chrome')).toBeInTheDocument();
    expect(screen.getByText('Safari')).toBeInTheDocument();
    expect(screen.getByText(/192\.168\.1\.0/)).toBeInTheDocument();
    expect(screen.getByText(/10\.0\.0\.0/)).toBeInTheDocument();
  });

  it('should call terminate session mutation when clicking terminate button', async () => {
    mockSessionsData = [makeSession()];

    const { user } = renderWithProviders(<UserSessionsCard userId="user-1" />);

    const terminateButton = screen.getByRole('button', { name: 'Revoke' });
    await user.click(terminateButton);

    expect(mockTerminateSession.mutate).toHaveBeenCalledWith({
      userId: 'user-1',
      sessionId: 'session-1',
    });
  });
});
