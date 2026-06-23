import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { LocalLoginPage } from '../local-login-page';

import { testI18n } from './test-utils';

import type { AccountLoginResponse } from '@granit/authentication-local';

// ---------------------------------------------------------------------------
// Mocks — stub the headless data layers the page composes.
// ---------------------------------------------------------------------------

const mockLoginMutateAsync = vi.fn<[unknown], Promise<AccountLoginResponse>>();
const mockLoginMutation = { isPending: false, error: null, mutateAsync: mockLoginMutateAsync };
const mockVerify2faMutateAsync = vi.fn<[unknown], Promise<AccountLoginResponse>>();
const mockSendEmailCodeMutateAsync = vi.fn<[], Promise<void>>();
const mockBeginPasskeyMutateAsync = vi.fn<[], Promise<string>>();
const mockCompletePasskeyMutateAsync = vi.fn<[], Promise<AccountLoginResponse>>();
const mockAccountSettings = vi.fn();

vi.mock('@granit/react-account', () => ({
  AccountProvider: ({ children }: { children: React.ReactNode }) => children,
  useAccountSettings: () => mockAccountSettings(),
  useAvailableExternalProviders: () => ({ providers: [], isLoading: false }),
  useChallengeExternalLogin: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@granit/react-authentication-local', () => ({
  LocalAuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useLoginWithRedirect: () => ({ mutation: mockLoginMutation }),
  useVerifyTwoFactorLogin: () => ({ mutateAsync: mockVerify2faMutateAsync, isPending: false }),
  useSendTwoFactorLoginEmailCode: () => ({
    mutateAsync: mockSendEmailCodeMutateAsync,
    isPending: false,
  }),
  useBeginPasskeyAssertion: () => ({ mutateAsync: mockBeginPasskeyMutateAsync, isPending: false }),
  useCompletePasskeyAssertion: () => ({
    mutateAsync: mockCompletePasskeyMutateAsync,
    isPending: false,
  }),
  useLogin: () => ({ mutateAsync: vi.fn(), isPending: false }),
  // Re-exported HTTP error guard (login-helpers narrows errors with it).
  isAxiosError: (err: unknown): boolean =>
    typeof err === 'object' &&
    err !== null &&
    (err as { isAxiosError?: boolean }).isAxiosError === true,
}));

const locationHrefSpy = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  // Default: a plain successful login (no 2FA). The hook owns the redirect, so
  // the component does nothing further — tests that need 2FA override this.
  mockLoginMutateAsync.mockResolvedValue(SUCCESS);
  mockAccountSettings.mockReturnValue({
    data: { allowSelfRegistration: false },
    isLoading: false,
  });
  Object.defineProperty(window, 'location', {
    value: { search: '?returnUrl=/connect/authorize', href: '' },
    writable: true,
  });
  Object.defineProperty(window.location, 'href', { set: locationHrefSpy, get: () => '' });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPage() {
  const user = userEvent.setup();
  const result = render(
    <MemoryRouter>
      <I18nextProvider i18n={testI18n}>
        <LocalLoginPage />
      </I18nextProvider>
    </MemoryRouter>
  );
  return { ...result, user };
}

const SUCCESS: AccountLoginResponse = {
  succeeded: true,
  requiresTwoFactor: false,
  isLockedOut: false,
  isNotAllowed: false,
};

/** Build a `requiresTwoFactor` login response advertising the given factors. */
function requires2fa(methods: readonly string[]): AccountLoginResponse {
  return {
    succeeded: false,
    requiresTwoFactor: true,
    isLockedOut: false,
    isNotAllowed: false,
    twoFactorMethods: methods,
  };
}

/** Submit valid credentials whose login response demands a second factor. */
async function reachTwoFactorStep(
  user: ReturnType<typeof userEvent.setup>,
  methods: readonly string[] = ['Authenticator', 'Email', 'RecoveryCode']
) {
  mockLoginMutateAsync.mockResolvedValueOnce(requires2fa(methods));
  await user.type(screen.getAllByLabelText(/email or username/i)[0]!, '2fa@test.com');
  await user.type(screen.getAllByLabelText(/password/i)[0]!, 'any');
  await user.click(screen.getByRole('button', { name: /sign in/i }));
  await waitFor(() => {
    expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LocalLoginPage', () => {
  it('should render login form with email and password fields', () => {
    renderPage();
    expect(screen.getByText('Granit Showcase Admin')).toBeInTheDocument();
    // The page also renders DirectLoginDemo which has the same labels — take the first (main form).
    expect(screen.getAllByLabelText(/email or username/i)[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText(/password/i)[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should call the login mutation on form submit', async () => {
    const { user } = renderPage();
    await user.type(screen.getAllByLabelText(/email or username/i)[0]!, 'admin@test.com');
    await user.type(screen.getAllByLabelText(/password/i)[0]!, 'Password1!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLoginMutateAsync).toHaveBeenCalledWith({
        login: 'admin@test.com',
        password: 'Password1!',
        rememberMe: false,
      });
    });
  });

  it('should show the 2FA form when login requires a second factor', async () => {
    const { user } = renderPage();
    await reachTwoFactorStep(user);

    // Authenticator is the default offered factor, so its input shows at once.
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
  });

  it('should verify the authenticator code and redirect on success', async () => {
    mockVerify2faMutateAsync.mockResolvedValueOnce(SUCCESS);

    const { user } = renderPage();
    await reachTwoFactorStep(user);

    await user.type(screen.getByLabelText(/verification code/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    await waitFor(() => {
      expect(mockVerify2faMutateAsync).toHaveBeenCalledWith({
        code: '123456',
        method: 'Authenticator',
      });
      expect(locationHrefSpy).toHaveBeenCalledWith('/connect/authorize');
    });
  });

  it('should show an error on an invalid 2FA code', async () => {
    mockVerify2faMutateAsync.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401 },
    });

    const { user } = renderPage();
    await reachTwoFactorStep(user);

    await user.type(screen.getByLabelText(/verification code/i), '000000');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid verification code/i)).toBeInTheDocument();
    });
  });

  it('should switch to recovery code mode when offered', async () => {
    const { user } = renderPage();
    await reachTwoFactorStep(user);

    await user.click(screen.getByText(/use a recovery code/i));
    expect(screen.getByLabelText(/recovery code/i)).toBeInTheDocument();
    expect(screen.getByText(/use authenticator app/i)).toBeInTheDocument();
  });

  it('should send an email code and verify with the Email method', async () => {
    mockSendEmailCodeMutateAsync.mockResolvedValueOnce(undefined);
    mockVerify2faMutateAsync.mockResolvedValueOnce(SUCCESS);

    const { user } = renderPage();
    await reachTwoFactorStep(user);

    // Switch to the opt-in email factor, then request a code.
    await user.click(screen.getByText(/use an email code instead/i));
    await user.click(screen.getByRole('button', { name: /send a code by email/i }));

    await waitFor(() => {
      expect(mockSendEmailCodeMutateAsync).toHaveBeenCalled();
      expect(screen.getByLabelText(/email code/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/email code/i), '654321');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    await waitFor(() => {
      expect(mockVerify2faMutateAsync).toHaveBeenCalledWith({ code: '654321', method: 'Email' });
      expect(locationHrefSpy).toHaveBeenCalledWith('/connect/authorize');
    });
  });

  it('should not offer the email factor when the server omits it', async () => {
    const { user } = renderPage();
    await reachTwoFactorStep(user, ['Authenticator', 'RecoveryCode']);

    expect(screen.queryByText(/use an email code instead/i)).not.toBeInTheDocument();
    expect(screen.getByText(/use a recovery code/i)).toBeInTheDocument();
  });

  it('should navigate back from 2FA to the credential form', async () => {
    const { user } = renderPage();
    await reachTwoFactorStep(user);

    await user.click(screen.getByText(/back to login/i));
    expect(screen.getAllByLabelText(/email or username/i)[0]).toBeInTheDocument();
  });

  it('should not show register link when self-registration is disabled', () => {
    mockAccountSettings.mockReturnValue({
      data: { allowSelfRegistration: false },
      isLoading: false,
    });
    renderPage();
    expect(screen.queryByText(/don't have an account/i)).not.toBeInTheDocument();
  });

  it('should show register link when self-registration is enabled', () => {
    mockAccountSettings.mockReturnValue({
      data: { allowSelfRegistration: true },
      isLoading: false,
    });
    renderPage();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });
});
