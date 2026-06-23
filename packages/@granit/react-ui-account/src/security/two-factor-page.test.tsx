import { screen } from '@testing-library/react';

import { renderWithProviders } from '../__tests__/test-utils';

import { TwoFactorPage } from './two-factor-page';

import type { AccountTwoFactorStatusResponse } from '@granit/account';

// ---------------------------------------------------------------------------
// Stub the 2FA status query plus every factor mutation. Reassign `statusState`
// per test before rendering. `useAuthenticatorKey` feeds the enable form's QR /
// setup key when 2FA is disabled.
// ---------------------------------------------------------------------------

const { mockUseTwoFactorStatus, mockUseAuthenticatorKey } = vi.hoisted(() => ({
  mockUseTwoFactorStatus: vi.fn(),
  mockUseAuthenticatorKey: vi.fn(),
}));

vi.mock('@granit/react-account', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const noopMutation = () => ({ mutateAsync: vi.fn(), isPending: false });
  return {
    ...actual,
    useTwoFactorStatus: mockUseTwoFactorStatus,
    useAuthenticatorKey: mockUseAuthenticatorKey,
    useEnableTwoFactor: noopMutation,
    useDisableTwoFactor: noopMutation,
    useGenerateRecoveryCodes: noopMutation,
    useEnableTwoFactorEmail: noopMutation,
    useDisableTwoFactorEmail: noopMutation,
    useSendTwoFactorEmailEnrollmentCode: noopMutation,
  };
});

const disabledStatus: AccountTwoFactorStatusResponse = {
  isEnabled: false,
  hasAuthenticatorApp: false,
  hasEmailOtp: false,
  recoveryCodesLeft: 0,
};

const enabledStatus: AccountTwoFactorStatusResponse = {
  isEnabled: true,
  hasAuthenticatorApp: true,
  hasEmailOtp: false,
  recoveryCodesLeft: 5,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuthenticatorKey.mockReturnValue({
    data: { sharedKey: 'ABCDEF123456', qrCodeUri: 'otpauth://totp/Demo' }, // gitleaks:allow (fake TOTP key)
    isLoading: false,
  });
});

describe('TwoFactorPage', () => {
  it('should show the loading spinner while the status loads', () => {
    mockUseTwoFactorStatus.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<TwoFactorPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render the setup card with a disabled badge when 2FA is off', () => {
    mockUseTwoFactorStatus.mockReturnValue({ data: disabledStatus, isLoading: false });
    renderWithProviders(<TwoFactorPage />);

    expect(document.querySelector('[data-slot="two-factor-page"]')).toBeInTheDocument();
    expect(screen.getByText('Two-factor authentication')).toBeInTheDocument();
    expect(screen.getByText('Set up authenticator app')).toBeInTheDocument();
    expect(screen.getByText('Authenticator setup key')).toBeInTheDocument();
    expect(screen.getAllByText('Disabled').length).toBeGreaterThanOrEqual(1);
    // The disable / recovery-codes cards are hidden when 2FA is off.
    expect(screen.queryByText('Recovery codes')).not.toBeInTheDocument();
  });

  it('should render the disable and recovery-codes cards when 2FA is on', () => {
    mockUseTwoFactorStatus.mockReturnValue({ data: enabledStatus, isLoading: false });
    renderWithProviders(<TwoFactorPage />);

    // "Disable 2FA" is both the card title and the submit button.
    expect(screen.getByRole('button', { name: 'Disable 2FA' })).toBeInTheDocument();
    expect(screen.getByText('Recovery codes')).toBeInTheDocument();
    expect(screen.getByText('5 recovery codes remaining')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    // The enable/setup card is hidden when 2FA is already on.
    expect(screen.queryByText('Set up authenticator app')).not.toBeInTheDocument();
  });

  it('should always render the email one-time-code factor card', () => {
    mockUseTwoFactorStatus.mockReturnValue({ data: disabledStatus, isLoading: false });
    renderWithProviders(<TwoFactorPage />);
    expect(screen.getByText('Email one-time codes')).toBeInTheDocument();
  });
});
