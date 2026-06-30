import { render, screen } from '@testing-library/react';
import { useContext, createContext } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CognitoAuthProvider } from './cognito-auth-provider';

import type { CognitoAuthContextType, CognitoCoreConfig } from '@granit/authentication-cognito';
import type { Context } from 'react';

// ---------------------------------------------------------------------------
// Hoisted mock references (declared before vi.mock hoisting)
// ---------------------------------------------------------------------------
const { mockUseCognitoInit, mockHookLogin, mockHookLogout, mockUseTranslation } = vi.hoisted(
  () => ({
    mockUseCognitoInit: vi.fn(),
    mockHookLogin: vi.fn(),
    mockHookLogout: vi.fn(),
    mockUseTranslation: vi.fn(),
  })
);

vi.mock('@granit/react-authentication-cognito', () => ({
  useCognitoInit: mockUseCognitoInit,
}));

vi.mock('@granit/react-localization', () => ({
  useTranslation: mockUseTranslation,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const config: CognitoCoreConfig = {
  userPoolId: 'eu-west-1_TESTPOOL',
  clientId: 'test-client',
  region: 'eu-west-1',
};

type HookResult = ReturnType<typeof mockUseCognitoInit>;

/**
 * Build the object the mocked `useCognitoInit` returns. The provider only
 * reads `userPool`, `authenticated`, `loading`, `user`, `login`, `logout`.
 */
function buildHookReturn(overrides: Partial<HookResult> = {}): HookResult {
  return {
    userPool: null,
    authenticated: false,
    loading: false,
    user: null,
    login: mockHookLogin,
    logout: mockHookLogout,
    ...overrides,
  };
}

// A probe component reads the provided auth context so tests can assert the
// exact value the provider supplies (and that callbacks wire through).
const AuthContext: Context<CognitoAuthContextType | undefined> = createContext<
  CognitoAuthContextType | undefined
>(undefined);

function Probe() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return <div data-testid="probe">no-context</div>;
  }
  return (
    <div data-testid="probe">
      <span data-testid="authenticated">{String(ctx.authenticated)}</span>
      <span data-testid="loading">{String(ctx.loading)}</span>
      <span data-testid="user">{ctx.user ? ctx.user.sub : 'null'}</span>
      <span data-testid="userPool">{ctx.userPool ? 'instance' : 'null'}</span>
      <button type="button" data-testid="login" onClick={() => ctx.login()}>
        login
      </button>
      <button type="button" data-testid="logout" onClick={() => ctx.logout()}>
        logout
      </button>
    </div>
  );
}

function renderProvider() {
  return render(
    <CognitoAuthProvider context={AuthContext} config={config}>
      <Probe />
    </CognitoAuthProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('CognitoAuthProvider', () => {
  beforeEach(() => {
    mockUseTranslation.mockReturnValue({
      t: (_key: string, fallback?: string) => fallback ?? _key,
      i18n: { language: 'en' },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the init spinner while loading and does not provide the context', () => {
    mockUseCognitoInit.mockReturnValue(buildHookReturn({ loading: true }));

    renderProvider();

    // The probe child is not rendered while loading.
    expect(screen.queryByTestId('probe')).not.toBeInTheDocument();
    expect(screen.getByText('Initializing…')).toBeInTheDocument();
  });

  it('uses the translated string for the initializing label when provided', () => {
    mockUseTranslation.mockReturnValue({
      t: (_key: string) => 'Chargement…',
      i18n: { language: 'fr' },
    });
    mockUseCognitoInit.mockReturnValue(buildHookReturn({ loading: true }));

    renderProvider();

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
  });

  it('provides the auth context with the authenticated session once loading completes', () => {
    const userPool = {
      getCurrentUser: () => null,
    } as unknown as CognitoAuthContextType['userPool'];
    mockUseCognitoInit.mockReturnValue(
      buildHookReturn({
        loading: false,
        authenticated: true,
        user: { sub: 'user-1', email: 'test@example.com' },
        userPool,
      })
    );

    renderProvider();

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('user-1');
    // The userPool from the hook must flow through the provided context.
    expect(screen.getByTestId('userPool').textContent).toBe('instance');
  });

  it('provides an unauthenticated context (no user, null userPool)', () => {
    mockUseCognitoInit.mockReturnValue(
      buildHookReturn({ loading: false, authenticated: false, user: null, userPool: null })
    );

    renderProvider();

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('userPool').textContent).toBe('null');
  });

  it('passes the hook config straight through to useCognitoInit', () => {
    mockUseCognitoInit.mockReturnValue(buildHookReturn({ loading: false }));

    renderProvider();

    expect(mockUseCognitoInit).toHaveBeenCalledWith(config);
  });

  it('forwards the active UI locale to the hook login on login()', async () => {
    mockUseTranslation.mockReturnValue({
      t: (_key: string, fallback?: string) => fallback ?? _key,
      i18n: { language: 'fr' },
    });
    mockUseCognitoInit.mockReturnValue(buildHookReturn({ loading: false, authenticated: true }));

    const { default: userEventDefault } = await import('@testing-library/user-event');
    const user = userEventDefault.setup();

    renderProvider();

    await user.click(screen.getByTestId('login'));

    expect(mockHookLogin).toHaveBeenCalledWith({ locale: 'fr' });
  });

  it('delegates logout() to the hook logout', async () => {
    mockUseCognitoInit.mockReturnValue(buildHookReturn({ loading: false, authenticated: true }));

    const { default: userEventDefault } = await import('@testing-library/user-event');
    const user = userEventDefault.setup();

    renderProvider();

    await user.click(screen.getByTestId('logout'));

    expect(mockHookLogout).toHaveBeenCalledOnce();
    expect(mockHookLogout).toHaveBeenCalledWith();
  });

  it('reflects a locale change in the login callback', async () => {
    mockUseCognitoInit.mockReturnValue(buildHookReturn({ loading: false, authenticated: true }));
    mockUseTranslation.mockReturnValue({
      t: (_key: string, fallback?: string) => fallback ?? _key,
      i18n: { language: 'de' },
    });

    const { default: userEventDefault } = await import('@testing-library/user-event');
    const user = userEventDefault.setup();

    renderProvider();

    await user.click(screen.getByTestId('login'));

    expect(mockHookLogin).toHaveBeenCalledWith({ locale: 'de' });
  });
});
