import { render, screen } from '@testing-library/react';
import { useContext, createContext } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { KeycloakAuthProvider } from '../keycloak-auth-provider';

import type { KeycloakAuthContextType, KeycloakCoreConfig } from '@granit/authentication-keycloak';
import type { Context } from 'react';

// ---------------------------------------------------------------------------
// Hoisted mock references (declared before vi.mock hoisting)
// ---------------------------------------------------------------------------
const { mockUseKeycloakInit, mockHookLogin, mockHookLogout, mockUseTranslation } = vi.hoisted(
  () => ({
    mockUseKeycloakInit: vi.fn(),
    mockHookLogin: vi.fn(),
    mockHookLogout: vi.fn(),
    mockUseTranslation: vi.fn(),
  })
);

vi.mock('@granit/react-authentication-keycloak', () => ({
  useKeycloakInit: mockUseKeycloakInit,
}));

vi.mock('@granit/react-localization', () => ({
  useTranslation: mockUseTranslation,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const config: KeycloakCoreConfig = {
  url: 'https://auth.example.com',
  realm: 'test-realm',
  clientId: 'test-client',
};

type HookResult = ReturnType<typeof mockUseKeycloakInit>;

/**
 * Build the object the mocked `useKeycloakInit` returns. The provider only
 * reads `keycloak`, `authenticated`, `loading`, `user`, `login`, `logout`.
 */
function buildHookReturn(overrides: Partial<HookResult> = {}): HookResult {
  return {
    keycloak: null,
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
const AuthContext: Context<KeycloakAuthContextType | undefined> = createContext<
  KeycloakAuthContextType | undefined
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
      <span data-testid="keycloak">{ctx.keycloak ? 'instance' : 'null'}</span>
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
    <KeycloakAuthProvider context={AuthContext} config={config}>
      <Probe />
    </KeycloakAuthProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('KeycloakAuthProvider', () => {
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
    mockUseKeycloakInit.mockReturnValue(buildHookReturn({ loading: true }));

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
    mockUseKeycloakInit.mockReturnValue(buildHookReturn({ loading: true }));

    renderProvider();

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
  });

  it('provides the auth context with the authenticated session once loading completes', () => {
    const keycloak = { token: 'abc' } as unknown as KeycloakAuthContextType['keycloak'];
    mockUseKeycloakInit.mockReturnValue(
      buildHookReturn({
        loading: false,
        authenticated: true,
        user: { sub: 'user-1', email: 'test@example.com' },
        keycloak,
      })
    );

    renderProvider();

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('user-1');
    expect(screen.getByTestId('keycloak').textContent).toBe('instance');
  });

  it('provides an unauthenticated context (no user, null keycloak)', () => {
    mockUseKeycloakInit.mockReturnValue(
      buildHookReturn({ loading: false, authenticated: false, user: null, keycloak: null })
    );

    renderProvider();

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('keycloak').textContent).toBe('null');
  });

  it('passes the hook config straight through to useKeycloakInit', () => {
    mockUseKeycloakInit.mockReturnValue(buildHookReturn({ loading: false }));

    renderProvider();

    expect(mockUseKeycloakInit).toHaveBeenCalledWith(config);
  });

  it('forwards the active UI locale to the hook login on login()', async () => {
    mockUseTranslation.mockReturnValue({
      t: (_key: string, fallback?: string) => fallback ?? _key,
      i18n: { language: 'fr' },
    });
    mockUseKeycloakInit.mockReturnValue(buildHookReturn({ loading: false, authenticated: true }));

    const { default: userEventDefault } = await import('@testing-library/user-event');
    const user = userEventDefault.setup();

    renderProvider();

    await user.click(screen.getByTestId('login'));

    expect(mockHookLogin).toHaveBeenCalledWith({ locale: 'fr' });
  });

  it('delegates logout() to the hook logout', async () => {
    mockUseKeycloakInit.mockReturnValue(buildHookReturn({ loading: false, authenticated: true }));

    const { default: userEventDefault } = await import('@testing-library/user-event');
    const user = userEventDefault.setup();

    renderProvider();

    await user.click(screen.getByTestId('logout'));

    expect(mockHookLogout).toHaveBeenCalledOnce();
    expect(mockHookLogout).toHaveBeenCalledWith();
  });

  it('reflects a locale change in the login callback', async () => {
    mockUseKeycloakInit.mockReturnValue(buildHookReturn({ loading: false, authenticated: true }));
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
