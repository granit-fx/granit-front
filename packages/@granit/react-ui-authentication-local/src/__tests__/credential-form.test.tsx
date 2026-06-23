import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { CredentialForm } from '../credential-form';

import { testI18n } from './test-utils';

import type { AccountLoginResponse } from '@granit/authentication-local';

vi.mock('@granit/api-client', () => ({
  isAxiosError: (err: unknown): boolean =>
    typeof err === 'object' &&
    err !== null &&
    (err as { isAxiosError?: boolean }).isAxiosError === true,
}));

const mockLoginMutateAsync = vi.fn<[unknown], Promise<AccountLoginResponse>>();
const mockLoginMutation = { isPending: false, mutateAsync: mockLoginMutateAsync };
const mockBeginPasskey = vi.fn<[], Promise<string>>();
const mockCompletePasskey = vi.fn<[unknown], Promise<AccountLoginResponse>>();
const mockAccountSettings = vi.fn();
const onErrorCapture = { fn: undefined as undefined | ((err: unknown) => void) };

vi.mock('@granit/react-account', () => ({
  useAccountSettings: () => mockAccountSettings(),
}));

vi.mock('@granit/react-authentication-local', () => ({
  useLoginWithRedirect: (opts: { onError: (err: unknown) => void }) => {
    onErrorCapture.fn = opts.onError;
    return { mutation: mockLoginMutation };
  },
  useBeginPasskeyAssertion: () => ({ mutateAsync: mockBeginPasskey, isPending: false }),
  useCompletePasskeyAssertion: () => ({ mutateAsync: mockCompletePasskey, isPending: false }),
  // Re-exported HTTP error guard (login-helpers narrows errors with it).
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

function requires2fa(methods?: readonly string[]): AccountLoginResponse {
  return {
    succeeded: false,
    requiresTwoFactor: true,
    isLockedOut: false,
    isNotAllowed: false,
    twoFactorMethods: methods,
  };
}

const hrefSpy = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockLoginMutateAsync.mockResolvedValue(SUCCESS);
  mockAccountSettings.mockReturnValue({ data: { allowSelfRegistration: false } });
  Object.defineProperty(window, 'location', {
    value: { search: '?returnUrl=/connect/authorize', href: '' },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window.location, 'href', { set: hrefSpy, get: () => '' });
});

function renderForm(props?: Partial<Parameters<typeof CredentialForm>[0]>) {
  const onTwoFactorRequired = vi.fn();
  const setServerError = vi.fn();
  const user = userEvent.setup();
  const result = render(
    <MemoryRouter>
      <I18nextProvider i18n={testI18n}>
        <CredentialForm
          serverError={null}
          setServerError={setServerError}
          onTwoFactorRequired={onTwoFactorRequired}
          {...props}
        />
      </I18nextProvider>
    </MemoryRouter>
  );
  return { ...result, user, onTwoFactorRequired, setServerError };
}

async function submitCredentials(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/email or username/i), 'admin@test.com');
  await user.type(screen.getByLabelText(/password/i), 'Password1!');
  await user.click(screen.getByRole('button', { name: /sign in/i }));
}

describe('CredentialForm', () => {
  it('should redirect on a successful credential login', async () => {
    const { user } = renderForm();
    await submitCredentials(user);
    await waitFor(() => {
      expect(hrefSpy).toHaveBeenCalledWith('/connect/authorize');
    });
  });

  it('should call onTwoFactorRequired when the response demands a second factor', async () => {
    mockLoginMutateAsync.mockResolvedValueOnce(requires2fa(['Authenticator', 'Email']));
    const { user, onTwoFactorRequired } = renderForm();
    await submitCredentials(user);
    await waitFor(() => {
      expect(onTwoFactorRequired).toHaveBeenCalledWith(['Authenticator', 'Email']);
    });
  });

  it('should surface the server error via the hook onError on a rejected login', async () => {
    mockLoginMutateAsync.mockRejectedValueOnce({ isAxiosError: true, response: { status: 401 } });
    const { user, setServerError } = renderForm();
    await submitCredentials(user);
    await waitFor(() => {
      // Trigger the captured onError handler the hook would call.
      onErrorCapture.fn?.({ isAxiosError: true, response: { status: 401 } });
      expect(setServerError).toHaveBeenCalled();
    });
  });

  it('should render a server error alert when serverError is set', () => {
    renderForm({ serverError: 'Boom happened' });
    expect(screen.getByText('Boom happened')).toBeInTheDocument();
  });

  it('should show the register link when self-registration is enabled', () => {
    mockAccountSettings.mockReturnValue({ data: { allowSelfRegistration: true } });
    renderForm();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('should not show the register link when settings are missing', () => {
    mockAccountSettings.mockReturnValue({ data: undefined });
    renderForm();
    expect(screen.queryByText(/don't have an account/i)).not.toBeInTheDocument();
  });

  describe('passkey path', () => {
    const originalPkc = (globalThis as { PublicKeyCredential?: unknown }).PublicKeyCredential;

    beforeEach(() => {
      (globalThis as { PublicKeyCredential?: unknown }).PublicKeyCredential = function () {};
    });

    afterEach(() => {
      (globalThis as { PublicKeyCredential?: unknown }).PublicKeyCredential = originalPkc;
    });

    function stubCredentialsGet(value: unknown) {
      Object.defineProperty(navigator, 'credentials', {
        value: { get: vi.fn().mockResolvedValue(value) },
        configurable: true,
      });
    }

    it('should complete passkey login and redirect on success', async () => {
      mockBeginPasskey.mockResolvedValueOnce(
        JSON.stringify({ challenge: 'AAAA', allowCredentials: [{ id: 'BBBB' }] })
      );
      mockCompletePasskey.mockResolvedValueOnce(SUCCESS);
      stubCredentialsGet({
        id: 'cred',
        type: 'public-key',
        rawId: new Uint8Array([1]).buffer,
        response: {
          authenticatorData: new Uint8Array([2]).buffer,
          clientDataJSON: new Uint8Array([3]).buffer,
          signature: new Uint8Array([4]).buffer,
          userHandle: null,
        },
      });

      const { user } = renderForm();
      await user.click(screen.getByRole('button', { name: /passkey/i }));

      await waitFor(() => {
        expect(mockCompletePasskey).toHaveBeenCalled();
        expect(hrefSpy).toHaveBeenCalledWith('/connect/authorize');
      });
    });

    it('should route to 2FA when passkey login requires a second factor', async () => {
      mockBeginPasskey.mockResolvedValueOnce(JSON.stringify({}));
      mockCompletePasskey.mockResolvedValueOnce(requires2fa(['Authenticator']));
      stubCredentialsGet({
        id: 'cred',
        type: 'public-key',
        rawId: new Uint8Array([1]).buffer,
        response: {
          authenticatorData: new Uint8Array([2]).buffer,
          clientDataJSON: new Uint8Array([3]).buffer,
          signature: new Uint8Array([4]).buffer,
          userHandle: null,
        },
      });

      const { user, onTwoFactorRequired } = renderForm();
      await user.click(screen.getByRole('button', { name: /passkey/i }));

      await waitFor(() => {
        expect(onTwoFactorRequired).toHaveBeenCalledWith(['Authenticator']);
      });
    });

    it('should silently abort when the credential is null', async () => {
      mockBeginPasskey.mockResolvedValueOnce(JSON.stringify({}));
      stubCredentialsGet(null);

      const { user } = renderForm();
      await user.click(screen.getByRole('button', { name: /passkey/i }));

      await waitFor(() => {
        expect(mockBeginPasskey).toHaveBeenCalled();
      });
      expect(mockCompletePasskey).not.toHaveBeenCalled();
    });

    it('should ignore a NotAllowedError (user cancelled)', async () => {
      mockBeginPasskey.mockRejectedValueOnce(new DOMException('cancelled', 'NotAllowedError'));

      const { user, setServerError } = renderForm();
      await user.click(screen.getByRole('button', { name: /passkey/i }));

      await waitFor(() => {
        expect(mockBeginPasskey).toHaveBeenCalled();
      });
      // setServerError only called with null at the start, never with an error.
      expect(setServerError).not.toHaveBeenCalledWith(expect.stringMatching(/passkey/i));
    });

    it('should surface a passkey error on an unexpected failure', async () => {
      mockBeginPasskey.mockRejectedValueOnce(new Error('boom'));

      const { user, setServerError } = renderForm();
      await user.click(screen.getByRole('button', { name: /passkey/i }));

      await waitFor(() => {
        expect(setServerError).toHaveBeenCalledWith(expect.stringMatching(/passkey/i));
      });
    });
  });
});
