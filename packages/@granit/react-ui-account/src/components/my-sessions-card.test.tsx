import { screen, waitFor } from '@testing-library/react';

import { renderWithProviders } from '../__tests__/test-utils';

import { MySessionsCard } from './my-sessions-card';

import type { UserSessionResponse } from '@granit/identity';

// ---------------------------------------------------------------------------
// Mock @granit/react-identity self-service hooks. Override sessions per test by
// reassigning `currentSessions` before render.
// ---------------------------------------------------------------------------

let currentSessions: readonly UserSessionResponse[] = [];
const revokeSpy = vi.fn();
const revokeAllSpy = vi.fn();

vi.mock('@granit/react-identity', () => ({
  useMyUserSessions: () => ({ data: currentSessions, isLoading: false }),
  useRevokeMyUserSession: () => ({ mutate: revokeSpy, isPending: false }),
  useRevokeMyOtherUserSessions: () => ({ mutate: revokeAllSpy, isPending: false }),
}));

function makeSession(overrides: Partial<UserSessionResponse> = {}): UserSessionResponse {
  return {
    sessionId: 'ab12-cd34' as UserSessionResponse['sessionId'],
    isCurrent: false,
    createdAt: '2026-03-23T08:15:00Z' as UserSessionResponse['createdAt'],
    lastAccessedAt: null,
    userAgent: 'Mozilla/5.0',
    ipAddress: null,
    location: null,
    riskLevel: null,
    riskReasons: null,
    ...overrides,
  };
}

beforeEach(() => {
  currentSessions = [];
  revokeSpy.mockClear();
  revokeAllSpy.mockClear();
});

describe('MySessionsCard', () => {
  it('should render nothing when session tracking is disabled', () => {
    currentSessions = [makeSession({ isCurrent: true, userAgent: 'Chrome' })];
    const { container } = renderWithProviders(<MySessionsCard sessionTrackingEnabled={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render sessions with user agent', async () => {
    currentSessions = [
      makeSession({ isCurrent: true, userAgent: 'Mozilla/5.0 Chrome/134.0' }),
      makeSession({
        sessionId: 'ef56-gh78' as UserSessionResponse['sessionId'],
        userAgent: 'Mozilla/5.0 Safari/605.1',
      }),
    ];

    renderWithProviders(<MySessionsCard sessionTrackingEnabled />);

    // The raw user agent is parsed into a friendly label (raw string kept as a tooltip).
    expect(await screen.findByText('Chrome')).toBeInTheDocument();
    expect(screen.getByText('Safari')).toBeInTheDocument();
  });

  it('should render empty state when no sessions', async () => {
    currentSessions = [];

    renderWithProviders(<MySessionsCard sessionTrackingEnabled />);

    expect(await screen.findByText('No active sessions')).toBeInTheDocument();
  });

  it('should show "Current" badge on the current session', async () => {
    currentSessions = [makeSession({ isCurrent: true, userAgent: 'Chrome' })];

    renderWithProviders(<MySessionsCard sessionTrackingEnabled />);

    expect(await screen.findByText('Current')).toBeInTheDocument();
  });

  it('should disable revoke button for current session', async () => {
    currentSessions = [makeSession({ isCurrent: true, userAgent: 'Chrome' })];

    renderWithProviders(<MySessionsCard sessionTrackingEnabled />);

    const revokeButton = await screen.findByRole('button', { name: 'Revoke' });
    expect(revokeButton).toBeDisabled();
  });

  it('should call revoke when clicking revoke on non-current session', async () => {
    currentSessions = [
      makeSession({ isCurrent: true, userAgent: 'Mozilla/5.0 Chrome/134.0' }),
      makeSession({
        sessionId: 'ef56-gh78' as UserSessionResponse['sessionId'],
        userAgent: 'Mozilla/5.0 Safari/605.1',
      }),
    ];

    const { user } = renderWithProviders(<MySessionsCard sessionTrackingEnabled />);

    await screen.findByText('Chrome');
    const revokeButtons = screen.getAllByRole('button', { name: 'Revoke' });
    const nonCurrentButton = revokeButtons.find((btn) => !btn.hasAttribute('disabled'));
    expect(nonCurrentButton).toBeDefined();

    await user.click(nonCurrentButton!);

    await waitFor(() => expect(revokeSpy).toHaveBeenCalledWith('ef56-gh78'));
  });

  it('should show "Revoke all others" button when other sessions exist', async () => {
    currentSessions = [
      makeSession({ isCurrent: true, userAgent: 'Chrome' }),
      makeSession({
        sessionId: 'ef56-gh78' as UserSessionResponse['sessionId'],
        userAgent: 'Safari',
      }),
    ];

    renderWithProviders(<MySessionsCard sessionTrackingEnabled />);

    expect(await screen.findByText('Revoke all others')).toBeInTheDocument();
  });

  it('should call revokeAll when clicking "Revoke all others"', async () => {
    currentSessions = [
      makeSession({ isCurrent: true, userAgent: 'Chrome' }),
      makeSession({
        sessionId: 'ef56-gh78' as UserSessionResponse['sessionId'],
        userAgent: 'Safari',
      }),
    ];

    const { user } = renderWithProviders(<MySessionsCard sessionTrackingEnabled />);

    const revokeAllButton = await screen.findByText('Revoke all others');
    await user.click(revokeAllButton);

    await waitFor(() => expect(revokeAllSpy).toHaveBeenCalled());
  });

  it('should show "Unknown device" when userAgent is null', async () => {
    currentSessions = [
      makeSession({
        sessionId: 'ij90-kl12' as UserSessionResponse['sessionId'],
        userAgent: null,
      }),
    ];

    renderWithProviders(<MySessionsCard sessionTrackingEnabled />);

    expect(await screen.findByText('Unknown device')).toBeInTheDocument();
  });
});
