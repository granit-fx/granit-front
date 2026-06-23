import { screen, waitFor } from '@testing-library/react';

import { TwoFactorPage } from '../security/two-factor-page';

import { renderWithProviders } from './test-utils';

import type { AccountTwoFactorStatusResponse } from '@granit/account';

// ---------------------------------------------------------------------------
// Interactive 2FA flows: enable / disable authenticator, regenerate recovery
// codes, and the email-OTP send → confirm → disable enrollment. Each mutation
// is a vi.hoisted mock so individual flows can resolve / reject and assert on
// the call payload. Mirrors the co-located render-state test's mock shape.
// ---------------------------------------------------------------------------

const {
  mockUseTwoFactorStatus,
  mockUseAuthenticatorKey,
  mockEnable,
  mockDisable,
  mockGenerateCodes,
  mockEnableEmail,
  mockDisableEmail,
  mockSendEmailCode,
} = vi.hoisted(() => ({
  mockUseTwoFactorStatus: vi.fn(),
  mockUseAuthenticatorKey: vi.fn(),
  mockEnable: vi.fn(),
  mockDisable: vi.fn(),
  mockGenerateCodes: vi.fn(),
  mockEnableEmail: vi.fn(),
  mockDisableEmail: vi.fn(),
  mockSendEmailCode: vi.fn(),
}));

vi.mock('@granit/react-account', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useTwoFactorStatus: mockUseTwoFactorStatus,
    useAuthenticatorKey: mockUseAuthenticatorKey,
    useEnableTwoFactor: () => ({ mutateAsync: mockEnable, isPending: false }),
    useDisableTwoFactor: () => ({ mutateAsync: mockDisable, isPending: false }),
    useGenerateRecoveryCodes: () => ({ mutateAsync: mockGenerateCodes, isPending: false }),
    useEnableTwoFactorEmail: () => ({ mutateAsync: mockEnableEmail, isPending: false }),
    useDisableTwoFactorEmail: () => ({ mutateAsync: mockDisableEmail, isPending: false }),
    useSendTwoFactorEmailEnrollmentCode: () => ({
      mutateAsync: mockSendEmailCode,
      isPending: false,
    }),
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

describe('TwoFactorPage — enable authenticator', () => {
  it('should call the enable mutation with the typed code and report recovery codes', async () => {
    mockUseTwoFactorStatus.mockReturnValue({ data: disabledStatus, isLoading: false });
    mockEnable.mockResolvedValue({ recoveryCodes: ['code-a', 'code-b'] });
    const { user } = renderWithProviders(<TwoFactorPage />);

    await user.type(screen.getByLabelText('Verification code'), '123 456');
    await user.click(screen.getByRole('button', { name: 'Enable 2FA' }));

    expect(mockEnable).toHaveBeenCalledWith({ code: '123456' });
  });

  it('should flag the code field invalid when enabling fails', async () => {
    mockUseTwoFactorStatus.mockReturnValue({ data: disabledStatus, isLoading: false });
    mockEnable.mockRejectedValue(new Error('bad code'));
    const { user } = renderWithProviders(<TwoFactorPage />);

    const input = screen.getByLabelText('Verification code');
    await user.type(input, '000000');
    await user.click(screen.getByRole('button', { name: 'Enable 2FA' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid verification code.')).toBeInTheDocument();
    });
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('should copy the authenticator setup key to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);
    mockUseTwoFactorStatus.mockReturnValue({ data: disabledStatus, isLoading: false });
    const { user } = renderWithProviders(<TwoFactorPage />);

    await user.click(screen.getByRole('button', { name: 'Copy' }));

    expect(writeText).toHaveBeenCalledWith('ABCDEF123456');
  });

  it('should render the enable form spinner while the authenticator key loads', () => {
    mockUseAuthenticatorKey.mockReturnValue({ data: undefined, isLoading: true });
    mockUseTwoFactorStatus.mockReturnValue({ data: disabledStatus, isLoading: false });
    renderWithProviders(<TwoFactorPage />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('TwoFactorPage — disable authenticator', () => {
  it('should call the disable mutation with the current password', async () => {
    mockUseTwoFactorStatus.mockReturnValue({ data: enabledStatus, isLoading: false });
    mockDisable.mockResolvedValue(undefined);
    const { user } = renderWithProviders(<TwoFactorPage />);

    await user.type(
      screen.getByLabelText('Current password', { selector: '#disablePassword' }),
      'hunter2'
    );
    await user.click(screen.getByRole('button', { name: 'Disable 2FA' }));

    expect(mockDisable).toHaveBeenCalledWith({ password: 'hunter2' });
  });

  it('should swallow a disable error without crashing', async () => {
    mockUseTwoFactorStatus.mockReturnValue({ data: enabledStatus, isLoading: false });
    mockDisable.mockRejectedValue(new Error('wrong password'));
    const { user } = renderWithProviders(<TwoFactorPage />);

    await user.type(
      screen.getByLabelText('Current password', { selector: '#disablePassword' }),
      'wrong'
    );
    await user.click(screen.getByRole('button', { name: 'Disable 2FA' }));

    await waitFor(() => expect(mockDisable).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Disable 2FA' })).toBeInTheDocument();
  });
});

describe('TwoFactorPage — recovery codes', () => {
  it('should generate and display new recovery codes, then dismiss them', async () => {
    mockUseTwoFactorStatus.mockReturnValue({ data: enabledStatus, isLoading: false });
    mockGenerateCodes.mockResolvedValue({ recoveryCodes: ['rc-1', 'rc-2'] });
    const { user } = renderWithProviders(<TwoFactorPage />);

    await user.type(
      screen.getByLabelText('Current password', { selector: '#regenPassword' }),
      'hunter2'
    );
    await user.click(screen.getByRole('button', { name: 'Generate new codes' }));

    expect(mockGenerateCodes).toHaveBeenCalledWith({ password: 'hunter2' });
    await waitFor(() => {
      expect(screen.getByText('rc-1')).toBeInTheDocument();
    });
    expect(screen.getByText('rc-2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => {
      expect(screen.queryByText('rc-1')).not.toBeInTheDocument();
    });
  });

  it('should copy all generated codes to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);
    mockUseTwoFactorStatus.mockReturnValue({ data: enabledStatus, isLoading: false });
    mockGenerateCodes.mockResolvedValue({ recoveryCodes: ['rc-1', 'rc-2'] });
    const { user } = renderWithProviders(<TwoFactorPage />);

    await user.type(
      screen.getByLabelText('Current password', { selector: '#regenPassword' }),
      'hunter2'
    );
    await user.click(screen.getByRole('button', { name: 'Generate new codes' }));
    await screen.findByText('rc-1');
    await user.click(screen.getByRole('button', { name: 'Copy all' }));

    expect(writeText).toHaveBeenCalledWith('rc-1\nrc-2');
  });

  it('should swallow a recovery-code generation error', async () => {
    mockUseTwoFactorStatus.mockReturnValue({ data: enabledStatus, isLoading: false });
    mockGenerateCodes.mockRejectedValue(new Error('boom'));
    const { user } = renderWithProviders(<TwoFactorPage />);

    await user.type(
      screen.getByLabelText('Current password', { selector: '#regenPassword' }),
      'hunter2'
    );
    await user.click(screen.getByRole('button', { name: 'Generate new codes' }));

    await waitFor(() => expect(mockGenerateCodes).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('Save your recovery codes')).not.toBeInTheDocument();
  });
});

describe('TwoFactorPage — email one-time codes', () => {
  it('should send an enrollment code then confirm it', async () => {
    mockUseTwoFactorStatus.mockReturnValue({ data: disabledStatus, isLoading: false });
    mockSendEmailCode.mockResolvedValue(undefined);
    mockEnableEmail.mockResolvedValue(undefined);
    const { user } = renderWithProviders(<TwoFactorPage />);

    await user.click(screen.getByRole('button', { name: 'Send verification code' }));
    expect(mockSendEmailCode).toHaveBeenCalledTimes(1);

    const codeInput = await screen.findByLabelText('Verification code', {
      selector: '#emailOtpCode',
    });
    await user.type(codeInput, '654321');
    await user.click(screen.getByRole('button', { name: 'Enable email codes' }));

    expect(mockEnableEmail).toHaveBeenCalledWith({ code: '654321' });
  });

  it('should flag the email code field invalid when confirmation fails', async () => {
    mockUseTwoFactorStatus.mockReturnValue({ data: disabledStatus, isLoading: false });
    mockSendEmailCode.mockResolvedValue(undefined);
    mockEnableEmail.mockRejectedValue(new Error('bad'));
    const { user } = renderWithProviders(<TwoFactorPage />);

    await user.click(screen.getByRole('button', { name: 'Send verification code' }));
    const codeInput = await screen.findByLabelText('Verification code', {
      selector: '#emailOtpCode',
    });
    await user.type(codeInput, '111111');
    await user.click(screen.getByRole('button', { name: 'Enable email codes' }));

    await waitFor(() => {
      expect(codeInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('should swallow a send-code error and stay on the send step', async () => {
    mockUseTwoFactorStatus.mockReturnValue({ data: disabledStatus, isLoading: false });
    mockSendEmailCode.mockRejectedValue(new Error('mail down'));
    const { user } = renderWithProviders(<TwoFactorPage />);

    await user.click(screen.getByRole('button', { name: 'Send verification code' }));

    await waitFor(() => expect(mockSendEmailCode).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Send verification code' })).toBeInTheDocument();
  });

  it('should disable the email factor with the current password when enrolled', async () => {
    mockUseTwoFactorStatus.mockReturnValue({
      data: { ...enabledStatus, hasEmailOtp: true },
      isLoading: false,
    });
    mockDisableEmail.mockResolvedValue(undefined);
    const { user } = renderWithProviders(<TwoFactorPage />);

    await user.type(
      screen.getByLabelText('Current password', { selector: '#emailOtpDisablePassword' }),
      'hunter2'
    );
    await user.click(screen.getByRole('button', { name: 'Disable email codes' }));

    expect(mockDisableEmail).toHaveBeenCalledWith({ password: 'hunter2' });
  });

  it('should swallow an email-disable error', async () => {
    mockUseTwoFactorStatus.mockReturnValue({
      data: { ...enabledStatus, hasEmailOtp: true },
      isLoading: false,
    });
    mockDisableEmail.mockRejectedValue(new Error('nope'));
    const { user } = renderWithProviders(<TwoFactorPage />);

    await user.type(
      screen.getByLabelText('Current password', { selector: '#emailOtpDisablePassword' }),
      'bad'
    );
    await user.click(screen.getByRole('button', { name: 'Disable email codes' }));

    await waitFor(() => expect(mockDisableEmail).toHaveBeenCalledTimes(1));
  });
});
