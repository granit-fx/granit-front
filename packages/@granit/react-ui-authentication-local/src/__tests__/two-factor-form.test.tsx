import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';

import { TwoFactorForm } from '../two-factor-form';

import { testI18n } from './test-utils';

import type { AccountLoginResponse } from '@granit/authentication-local';

vi.mock('@granit/api-client', () => ({
  isAxiosError: (err: unknown): boolean =>
    typeof err === 'object' &&
    err !== null &&
    (err as { isAxiosError?: boolean }).isAxiosError === true,
}));

const mockVerify = vi.fn<[unknown], Promise<AccountLoginResponse>>();
const mockSendEmail = vi.fn<[], Promise<void>>();

vi.mock('@granit/react-authentication-local', () => ({
  useVerifyTwoFactorLogin: () => ({ mutateAsync: mockVerify, isPending: false }),
  useSendTwoFactorLoginEmailCode: () => ({ mutateAsync: mockSendEmail, isPending: false }),
  // Re-exported HTTP error guard (two-factor-form narrows errors with it).
  isAxiosError: (err: unknown): boolean =>
    typeof err === 'object' &&
    err !== null &&
    (err as { isAxiosError?: boolean }).isAxiosError === true,
}));

const SUCCESS: AccountLoginResponse = {
  succeeded: true,
  requiresTwoFactor: false,
  isLockedOut: false,
  isNotAllowed: false,
};

const hrefSpy = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'location', {
    value: { search: '?returnUrl=/connect/authorize', href: '' },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window.location, 'href', { set: hrefSpy, get: () => '' });
});

function renderForm(methods?: readonly string[]) {
  const setServerError = vi.fn();
  const onBack = vi.fn();
  const user = userEvent.setup();
  const result = render(
    <I18nextProvider i18n={testI18n}>
      <TwoFactorForm
        methods={methods}
        serverError={null}
        setServerError={setServerError}
        onBack={onBack}
      />
    </I18nextProvider>
  );
  return { ...result, user, setServerError, onBack };
}

describe('TwoFactorForm', () => {
  it('should default to authenticator when no methods are provided', () => {
    renderForm();
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
  });

  it('should verify the code and redirect on success', async () => {
    mockVerify.mockResolvedValueOnce(SUCCESS);
    const { user } = renderForm(['Authenticator']);
    await user.type(screen.getByLabelText(/verification code/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify/i }));
    await waitFor(() => {
      expect(hrefSpy).toHaveBeenCalledWith('/connect/authorize');
    });
  });

  it('should show an invalid-code error on a 401', async () => {
    mockVerify.mockRejectedValueOnce({ isAxiosError: true, response: { status: 401 } });
    const { user, setServerError } = renderForm(['Authenticator']);
    await user.type(screen.getByLabelText(/verification code/i), '000000');
    await user.click(screen.getByRole('button', { name: /verify/i }));
    await waitFor(() => {
      expect(setServerError).toHaveBeenCalledWith(expect.stringMatching(/invalid/i));
    });
  });

  it('should fall back to handleLoginError on a non-401 verify failure', async () => {
    mockVerify.mockRejectedValueOnce({ isAxiosError: true, response: { status: 500 } });
    const { user, setServerError } = renderForm(['Authenticator']);
    await user.type(screen.getByLabelText(/verification code/i), '111111');
    await user.click(screen.getByRole('button', { name: /verify/i }));
    await waitFor(() => {
      expect(setServerError).toHaveBeenCalledWith(expect.stringMatching(/unexpected/i));
    });
  });

  it('should send an email code and reveal the input on success', async () => {
    mockSendEmail.mockResolvedValueOnce(undefined);
    const { user } = renderForm(['Authenticator', 'Email']);
    await user.click(screen.getByText(/use an email code instead/i));
    await user.click(screen.getByRole('button', { name: /send a code by email/i }));
    await waitFor(() => {
      expect(mockSendEmail).toHaveBeenCalled();
      expect(screen.getByLabelText(/email code/i)).toBeInTheDocument();
    });
  });

  it('should surface an error when sending the email code fails', async () => {
    mockSendEmail.mockRejectedValueOnce(new Error('smtp down'));
    const { user, setServerError } = renderForm(['Authenticator', 'Email']);
    await user.click(screen.getByText(/use an email code instead/i));
    await user.click(screen.getByRole('button', { name: /send a code by email/i }));
    await waitFor(() => {
      expect(setServerError).toHaveBeenCalledWith(expect.stringMatching(/couldn't send/i));
    });
  });

  it('should call onBack when the back link is clicked', async () => {
    const { user, onBack } = renderForm(['Authenticator']);
    await user.click(screen.getByText(/back to login/i));
    expect(onBack).toHaveBeenCalled();
  });

  it('should switch to the recovery-code method', async () => {
    const { user } = renderForm(['Authenticator', 'RecoveryCode']);
    await user.click(screen.getByText(/use a recovery code/i));
    expect(screen.getByLabelText(/recovery code/i)).toBeInTheDocument();
  });
});
