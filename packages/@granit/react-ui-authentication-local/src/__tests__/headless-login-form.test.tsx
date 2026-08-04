import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { HeadlessLoginForm } from '../components/headless-login-form';

import { testI18n } from './test-utils';

import type { AccountLoginResponse } from '@granit/authentication-local';

vi.mock('@granit/api-client', () => ({
  isAxiosError: (err: unknown): boolean =>
    typeof err === 'object' &&
    err !== null &&
    (err as { isAxiosError?: boolean }).isAxiosError === true,
}));

const mockProviders = vi.fn();
const mockAccountSettings = vi.fn();
const mockLoginMutateAsync = vi.fn<[unknown], Promise<AccountLoginResponse>>();
const mockLoginIsError = { value: false };

vi.mock('@granit/react-account', () => ({
  useAvailableExternalProviders: () => mockProviders(),
  useAccountSettings: () => mockAccountSettings(),
  useChallengeExternalLogin: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@granit/react-authentication-local', () => ({
  useLogin: () => ({
    mutateAsync: mockLoginMutateAsync,
    isPending: false,
    get isError() {
      return mockLoginIsError.value;
    },
  }),
  useLoginWithRedirect: () => ({ mutation: { isPending: false, mutateAsync: vi.fn() } }),
  useVerifyTwoFactorLogin: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSendTwoFactorLoginEmailCode: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useBeginPasskeyAssertion: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCompletePasskeyAssertion: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const SUCCESS: AccountLoginResponse = {
  succeeded: true,
  requiresTwoFactor: false,
  isLockedOut: false,
  isNotAllowed: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockLoginIsError.value = false;
  mockProviders.mockReturnValue({ providers: [] });
  mockAccountSettings.mockReturnValue({ data: { allowSelfRegistration: false } });
  Object.defineProperty(window, 'location', {
    value: { search: '', href: '' },
    writable: true,
    configurable: true,
  });
});

function renderForm(route = '/') {
  const user = userEvent.setup();
  const result = render(
    <MemoryRouter initialEntries={[route]}>
      <I18nextProvider i18n={testI18n}>
        <HeadlessLoginForm />
      </I18nextProvider>
    </MemoryRouter>
  );
  return { ...result, user };
}

describe('HeadlessLoginForm', () => {
  it('should render the credential step with the direct-login demo', () => {
    renderForm();
    expect(screen.getAllByLabelText(/email or username/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/direct login \(no redirect\)/i)).toBeInTheDocument();
  });

  it('should show the access-denied alert when a redirect error is present', () => {
    renderForm('/?error=AccessDenied');
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
  });

  it('should render the external login section when providers exist', () => {
    mockProviders.mockReturnValue({
      providers: [{ name: 'Google', type: 'google', displayName: 'Google' }],
    });
    renderForm();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('should run the direct-login demo and show success on a succeeded response', async () => {
    mockLoginMutateAsync.mockResolvedValueOnce(SUCCESS);
    const { user, container } = renderForm();

    await user.type(container.querySelector('#directLogin')!, 'admin@test.com');
    await user.type(container.querySelector('#directPassword')!, 'Password1!');
    await user.click(screen.getByRole('button', { name: /try direct login/i }));

    await waitFor(() => {
      expect(screen.getByText(/login succeeded/i)).toBeInTheDocument();
    });
    // The reset button returns to the form.
    await user.click(screen.getByRole('button', { name: /try direct login/i }));
    expect(container.querySelector('#directLogin')).toBeInTheDocument();
  });

  it('should clear the result when the direct-login request fails', async () => {
    mockLoginMutateAsync.mockRejectedValueOnce(new Error('boom'));
    const { user, container } = renderForm();

    await user.type(container.querySelector('#directLogin')!, 'admin@test.com');
    await user.type(container.querySelector('#directPassword')!, 'Password1!');
    await user.click(screen.getByRole('button', { name: /try direct login/i }));

    await waitFor(() => {
      expect(mockLoginMutateAsync).toHaveBeenCalled();
    });
    // No success message rendered because result is null.
    expect(screen.queryByText(/login succeeded/i)).not.toBeInTheDocument();
  });

  it('should show the direct-login error message when the mutation isError flag is set', () => {
    mockLoginIsError.value = true;
    renderForm();
    expect(screen.getByText(/login request failed/i)).toBeInTheDocument();
  });
});
