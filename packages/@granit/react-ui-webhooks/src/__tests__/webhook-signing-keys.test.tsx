import { screen, waitFor } from '@testing-library/react';

import { WebhookSigningKeys } from '../components/webhook-signing-keys';

import { renderWithProviders } from './test-utils';

const rotateMutateAsync = vi.fn().mockResolvedValue({ plainSecret: 'whsec_rotated' });
const revokeMutateAsync = vi.fn().mockResolvedValue(undefined);

const signingKeysState = {
  data: [
    {
      id: 'wsk-active',
      subscriptionId: 'ws-1',
      createdAt: '2026-03-01T08:00:00Z',
      expiresAt: null,
      revokedAt: null,
      lastRotationNotificationAt: null,
      status: 'Active',
    },
    {
      id: 'wsk-retired',
      subscriptionId: 'ws-1',
      createdAt: '2025-11-10T09:00:00Z',
      expiresAt: '2026-03-02T09:00:00Z',
      revokedAt: null,
      lastRotationNotificationAt: null,
      status: 'Retired',
    },
  ],
  isLoading: false,
};

vi.mock('@granit/react-webhooks', () => ({
  useSigningKeys: () => signingKeysState,
  useRotateSigningKey: () => ({ mutateAsync: rotateMutateAsync, isPending: false }),
  useRevokeSigningKey: () => ({ mutateAsync: revokeMutateAsync, isPending: false }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WebhookSigningKeys', () => {
  it('renders each key with its status', () => {
    renderWithProviders(
      <WebhookSigningKeys subscriptionId="ws-1" signingSecretHint="whsec_a***b" />
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Retired')).toBeInTheDocument();
  });

  it('does not offer to revoke the last Active key but allows revoking a Retired key', () => {
    renderWithProviders(
      <WebhookSigningKeys subscriptionId="ws-1" signingSecretHint="whsec_a***b" />
    );
    // Only the Retired key row exposes a Revoke action (the single Active key is protected).
    expect(screen.getAllByRole('button', { name: 'Revoke' })).toHaveLength(1);
  });

  it('reveals the new secret once after rotation', async () => {
    const { user } = renderWithProviders(
      <WebhookSigningKeys subscriptionId="ws-1" signingSecretHint="whsec_a***b" />
    );
    await user.click(screen.getByRole('button', { name: 'Rotate key' }));

    expect(rotateMutateAsync).toHaveBeenCalledWith('ws-1');
    await waitFor(() =>
      expect(
        screen.getByText('This secret will only be shown once. Copy it now.')
      ).toBeInTheDocument()
    );
    expect(screen.getByText('whsec_rotated')).toBeInTheDocument();
  });
});
