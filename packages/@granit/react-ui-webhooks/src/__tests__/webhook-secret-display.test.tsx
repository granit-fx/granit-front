import { screen } from '@testing-library/react';

import { WebhookSecretDisplay } from '../components/webhook-secret-display';

import { renderWithProviders } from './test-utils';

describe('WebhookSecretDisplay', () => {
  describe('hint mode (canReveal=false)', () => {
    const hint = 'whsec_b46a****************5182';

    it('renders the hint verbatim — no re-masking with bullets', () => {
      renderWithProviders(<WebhookSecretDisplay secret={hint} canReveal={false} />);
      expect(screen.getByText(hint)).toBeInTheDocument();
    });

    it('renders the legacy static placeholder verbatim when caller passes it', () => {
      const placeholder = '••••••••••••••••';
      renderWithProviders(<WebhookSecretDisplay secret={placeholder} canReveal={false} />);
      expect(screen.getByText(placeholder)).toBeInTheDocument();
    });

    it('does not expose reveal or copy buttons (no plaintext leakage)', () => {
      renderWithProviders(<WebhookSecretDisplay secret={hint} canReveal={false} />);
      expect(screen.queryByLabelText(/show secret|hide secret/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/copy secret/i)).not.toBeInTheDocument();
    });

    it('still renders the rotate action when onRotate is provided', () => {
      renderWithProviders(
        <WebhookSecretDisplay secret={hint} canReveal={false} onRotate={() => {}} />
      );
      expect(screen.getByRole('button', { name: /rotate secret/i })).toBeInTheDocument();
    });
  });

  describe('plaintext mode (canReveal=true)', () => {
    const secret = 'whsec_test-placeholder-not-a-real-secret'; // gitleaks:allow

    it('masks the secret with bullets by default', () => {
      renderWithProviders(<WebhookSecretDisplay secret={secret} />);
      expect(screen.queryByText(secret)).not.toBeInTheDocument();
    });

    it('exposes reveal and copy buttons', () => {
      renderWithProviders(<WebhookSecretDisplay secret={secret} />);
      expect(screen.getByLabelText(/show secret/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/copy secret/i)).toBeInTheDocument();
    });

    it('shows the secret immediately in one-time mode', () => {
      renderWithProviders(<WebhookSecretDisplay secret={secret} isOneTime />);
      expect(screen.getByText(secret)).toBeInTheDocument();
    });
  });
});
