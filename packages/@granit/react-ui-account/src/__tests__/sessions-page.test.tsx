import { screen } from '@testing-library/react';

import { SessionsPage } from '../sessions-page';

import { renderWithProviders } from './test-utils';

import type { UserSessionResponse } from '@granit/identity';

// ---------------------------------------------------------------------------
// The self-service sessions/devices cards are backed by `@granit/react-identity`
// hooks. Stub the data + revoke mutations; reassign `sessionsState` per test.
// The page renders the cards only when `sessionTrackingEnabled` is passed.
// ---------------------------------------------------------------------------

const { mockUseMyUserSessions, mockUseMyUserDevices, mockRevoke, mockRevokeOthers } = vi.hoisted(
  () => ({
    mockUseMyUserSessions: vi.fn(),
    mockUseMyUserDevices: vi.fn(),
    mockRevoke: vi.fn(),
    mockRevokeOthers: vi.fn(),
  })
);

vi.mock('@granit/react-identity', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useMyUserSessions: mockUseMyUserSessions,
    useMyUserDevices: mockUseMyUserDevices,
    useRevokeMyUserSession: () => ({ mutate: mockRevoke, isPending: false }),
    useRevokeMyOtherUserSessions: () => ({ mutate: mockRevokeOthers, isPending: false }),
  };
});

const currentSession: UserSessionResponse = {
  sessionId: 'sess-1' as UserSessionResponse['sessionId'],
  userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0',
  ipAddress: '192.0.2.1',
  createdAt: '2026-06-01T10:00:00Z' as UserSessionResponse['createdAt'],
  lastAccessedAt: '2026-06-21T10:00:00Z' as UserSessionResponse['lastAccessedAt'],
  isCurrent: true,
  location: null,
  riskLevel: 'None',
  riskReasons: [],
} as UserSessionResponse;

beforeEach(() => {
  vi.clearAllMocks();
  mockUseMyUserDevices.mockReturnValue({ data: [], isLoading: false });
});

describe('SessionsPage', () => {
  it('should render both the sessions and devices cards when session tracking is enabled', () => {
    mockUseMyUserSessions.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<SessionsPage sessionTrackingEnabled />);

    expect(document.querySelector('[data-slot="sessions-page"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="my-sessions-card"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="my-devices-card"]')).toBeInTheDocument();
    expect(screen.getByText('My Sessions')).toBeInTheDocument();
    expect(screen.getByText('My devices')).toBeInTheDocument();
  });

  it('should hide both cards when session tracking is disabled (default)', () => {
    mockUseMyUserSessions.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<SessionsPage />);

    expect(document.querySelector('[data-slot="sessions-page"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="my-sessions-card"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="my-devices-card"]')).not.toBeInTheDocument();
  });

  it('should show the empty states when there are no sessions or devices', () => {
    mockUseMyUserSessions.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<SessionsPage sessionTrackingEnabled />);

    expect(screen.getByText('No active sessions')).toBeInTheDocument();
    expect(screen.getByText('No device activity')).toBeInTheDocument();
  });

  it('should render an active session row with its "current" badge', () => {
    mockUseMyUserSessions.mockReturnValue({ data: [currentSession], isLoading: false });
    renderWithProviders(<SessionsPage sessionTrackingEnabled />);

    // The current session is labelled and shows its IP address.
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText(/192\.0\.2\.1/)).toBeInTheDocument();
  });
});
