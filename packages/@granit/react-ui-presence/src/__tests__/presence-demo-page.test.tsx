import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PresenceDemoPage } from '../presence-demo-page';

import { renderPresence } from './test-utils';

// ---------------------------------------------------------------------------
// Mocks — the page consumes the headless @granit/react-presence and
// @granit/react-identity hooks directly. They are stubbed in-workspace so no
// provider/network is needed; the visual components (DndBanner, PresenceDot,
// PresencePicker) are replaced with passthroughs.
// ---------------------------------------------------------------------------

vi.mock('@granit/react-presence', () => ({
  DndBanner: () => null,
  PresenceDot: () => <span data-slot="presence-dot" />,
  PresencePicker: () => <div data-slot="presence-picker" />,
  useMyPresence: () => ({
    data: {
      userId: 'me',
      effectiveStatus: 'Online',
      manualOverride: null,
      lastSeenUtc: '2026-06-01T10:00:00Z',
    },
    isPending: false,
    error: null,
  }),
  useClearMyPresenceOverride: () => ({ mutate: vi.fn() }),
  useBatchPresence: () => ({ data: { presences: {} } }),
  useResourcePresence: () => ({ isJoining: false, error: null, participants: [] }),
}));

vi.mock('@granit/react-identity', () => ({
  useProviderUsers: () => ({ data: [], isPending: false, error: null }),
}));

vi.mock('@granit/presence', () => ({
  PRESENCE_DEFAULTS: { OfflineThresholdSeconds: 90 },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PresenceDemoPage', () => {
  it('should render the page title', () => {
    renderPresence(<PresenceDemoPage />);
    expect(screen.getByRole('heading', { name: 'Presence demo' })).toBeInTheDocument();
  });

  it('should render the demo page slot', () => {
    renderPresence(<PresenceDemoPage />);
    expect(document.querySelector('[data-slot="presence-demo-page"]')).toBeInTheDocument();
  });

  it('should render the resource room card', () => {
    renderPresence(<PresenceDemoPage />);
    expect(document.querySelector('[data-slot="presence-room-card"]')).toBeInTheDocument();
  });

  it('should render translated section titles (not raw i18n keys)', () => {
    renderPresence(<PresenceDemoPage />);
    expect(screen.getByText('Your presence')).toBeInTheDocument();
    expect(screen.queryByText(/Presence\.YourPresence/)).not.toBeInTheDocument();
  });
});
