import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useKeycloakInit } from '../keycloak-core.ts';

import type { KeycloakCoreConfig } from '../types.ts';

// ---------------------------------------------------------------------------
// Hoisted mock references (declared before vi.mock hoisting)
// ---------------------------------------------------------------------------
const {
  mockInit, mockLogin, mockLogout, mockRegister,
  mockLoadUserInfo, mockUpdateToken,
  mockHasRealmRole, mockHasResourceRole, mockIsTokenExpired,
  mockSetTokenGetter,
} = vi.hoisted(() => ({
  mockInit: vi.fn(),
  mockLogin: vi.fn(),
  mockLogout: vi.fn(),
  mockRegister: vi.fn(),
  mockLoadUserInfo: vi.fn(),
  mockUpdateToken: vi.fn(),
  mockHasRealmRole: vi.fn(),
  mockHasResourceRole: vi.fn(),
  mockIsTokenExpired: vi.fn(),
  mockSetTokenGetter: vi.fn(),
}));

// Mutable mock instance — tests can mutate tokenParsed, set callback props, etc.
const mockKeycloakInstance: Record<string, unknown> = {
  init: mockInit,
  login: mockLogin,
  logout: mockLogout,
  register: mockRegister,
  loadUserInfo: mockLoadUserInfo,
  updateToken: mockUpdateToken,
  hasRealmRole: mockHasRealmRole,
  hasResourceRole: mockHasResourceRole,
  isTokenExpired: mockIsTokenExpired,
  token: 'mock-access-token',
  tokenParsed: undefined as Record<string, unknown> | undefined,
  // Callback slots — set by the hook, triggered by tests
  onTokenExpired: undefined as (() => void) | undefined,
  onAuthRefreshError: undefined as (() => void) | undefined,
  onAuthRefreshSuccess: undefined as (() => void) | undefined,
  onAuthLogout: undefined as (() => void) | undefined,
  onAuthSuccess: undefined as (() => void) | undefined,
  onAuthError: undefined as ((err?: unknown) => void) | undefined,
  onReady: undefined as (() => void) | undefined,
};

vi.mock('keycloak-js', () => ({
  default: vi.fn(() => mockKeycloakInstance),
}));

vi.mock('@granit/api-client', () => ({
  setTokenGetter: mockSetTokenGetter,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const config: KeycloakCoreConfig = {
  url: 'https://auth.example.com',
  realm: 'test-realm',
  clientId: 'test-client',
};

const userInfo = { sub: 'user-1', email: 'test@example.com', preferred_username: 'testuser' };

const tokenParsedFixture: Record<string, unknown> = {
  sub: 'user-1',
  email: 'token@example.com',
  name: 'Token User',
  preferred_username: 'tokenuser',
  given_name: 'Token',
  family_name: 'User',
};

// ---------------------------------------------------------------------------
// Tests — original behavior (backward compatibility)
// ---------------------------------------------------------------------------
describe('useKeycloakInit', () => {
  beforeEach(() => {
    mockLoadUserInfo.mockResolvedValue(userInfo);
    mockKeycloakInstance.tokenParsed = undefined;
    // Reset callback slots
    mockKeycloakInstance.onTokenExpired = undefined;
    mockKeycloakInstance.onAuthRefreshError = undefined;
    mockKeycloakInstance.onAuthRefreshSuccess = undefined;
    mockKeycloakInstance.onAuthLogout = undefined;
    mockKeycloakInstance.onAuthSuccess = undefined;
    mockKeycloakInstance.onAuthError = undefined;
    mockKeycloakInstance.onReady = undefined;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts with loading=true and authenticated=false', () => {
    mockInit.mockResolvedValue(false);
    const { result } = renderHook(() => useKeycloakInit(config));
    expect(result.current.loading).toBe(true);
    expect(result.current.authenticated).toBe(false);
  });

  it('sets loading=false after unauthenticated init', async () => {
    mockInit.mockResolvedValue(false);
    const { result } = renderHook(() => useKeycloakInit(config));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.authenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('sets authenticated=true and loads user info after successful init', async () => {
    mockInit.mockResolvedValue(true);
    const { result } = renderHook(() => useKeycloakInit(config));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.authenticated).toBe(true);
    expect(result.current.user).toMatchObject({ sub: 'user-1' });
  });

  it('registers a token getter with setTokenGetter when authenticated', async () => {
    mockInit.mockResolvedValue(true);
    renderHook(() => useKeycloakInit(config));

    await waitFor(() => expect(mockSetTokenGetter).toHaveBeenCalledOnce());
  });

  it('stays unauthenticated when keycloak.init rejects', async () => {
    mockInit.mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useKeycloakInit(config));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.authenticated).toBe(false);
  });

  it('handles loadUserInfo failure gracefully (non-fatal)', async () => {
    mockInit.mockResolvedValue(true);
    mockLoadUserInfo.mockRejectedValue(new Error('user info failed'));
    const { result } = renderHook(() => useKeycloakInit(config));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.authenticated).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('login calls keycloak.login()', async () => {
    mockInit.mockResolvedValue(true);
    mockLogin.mockResolvedValue(undefined);
    const { result } = renderHook(() => useKeycloakInit(config));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login();
    });

    expect(mockLogin).toHaveBeenCalledOnce();
  });

  it('logout calls keycloak.logout()', async () => {
    mockInit.mockResolvedValue(true);
    mockLogout.mockResolvedValue(undefined);
    const { result } = renderHook(() => useKeycloakInit(config));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.logout();
    });

    expect(mockLogout).toHaveBeenCalledOnce();
  });

  it('token getter returns token after successful updateToken', async () => {
    mockInit.mockResolvedValue(true);
    mockUpdateToken.mockResolvedValue(true);
    renderHook(() => useKeycloakInit(config));

    await waitFor(() => expect(mockSetTokenGetter).toHaveBeenCalledOnce());

    const getter = mockSetTokenGetter.mock.calls[0][0] as () => Promise<string | undefined>;
    const token = await getter();
    expect(token).toBe('mock-access-token');
  });

  it('token getter returns undefined when updateToken rejects', async () => {
    mockInit.mockResolvedValue(true);
    mockUpdateToken.mockRejectedValue(new Error('token expired'));
    renderHook(() => useKeycloakInit(config));

    await waitFor(() => expect(mockSetTokenGetter).toHaveBeenCalledOnce());

    const getter = mockSetTokenGetter.mock.calls[0][0] as () => Promise<string | undefined>;
    const token = await getter();
    expect(token).toBeUndefined();
  });

  it('silentCheckSso is omitted from init options when silentCheckSso=false', async () => {
    mockInit.mockResolvedValue(false);
    const { result } = renderHook(() =>
      useKeycloakInit({ ...config, silentCheckSso: false })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    const initArg = mockInit.mock.calls[0][0] as Record<string, unknown>;
    expect(initArg).not.toHaveProperty('silentCheckSsoRedirectUri');
  });

  // -------------------------------------------------------------------------
  // Story #2 — Lifecycle event callbacks
  // -------------------------------------------------------------------------
  describe('lifecycle events', () => {
    it('calls onTokenExpired callback when token expires', async () => {
      mockInit.mockResolvedValue(true);
      const onTokenExpired = vi.fn();
      renderHook(() => useKeycloakInit({ ...config, onTokenExpired }));

      await waitFor(() => expect(mockKeycloakInstance.onTokenExpired).toBeDefined());

      act(() => {
        (mockKeycloakInstance.onTokenExpired as () => void)();
      });

      expect(onTokenExpired).toHaveBeenCalledOnce();
    });

    it('calls onAuthRefreshError and sets authenticated=false on refresh failure', async () => {
      mockInit.mockResolvedValue(true);
      const onAuthRefreshError = vi.fn();
      const { result } = renderHook(() => useKeycloakInit({ ...config, onAuthRefreshError }));

      await waitFor(() => expect(result.current.authenticated).toBe(true));

      act(() => {
        (mockKeycloakInstance.onAuthRefreshError as () => void)();
      });

      expect(onAuthRefreshError).toHaveBeenCalledOnce();
      expect(result.current.authenticated).toBe(false);
    });

    it('calls onAuthLogout and resets state on logout event', async () => {
      mockInit.mockResolvedValue(true);
      const onAuthLogout = vi.fn();
      const { result } = renderHook(() => useKeycloakInit({ ...config, onAuthLogout }));

      await waitFor(() => expect(result.current.authenticated).toBe(true));

      act(() => {
        (mockKeycloakInstance.onAuthLogout as () => void)();
      });

      expect(onAuthLogout).toHaveBeenCalledOnce();
      expect(result.current.authenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('calls onEvent with event name for each Keycloak event', async () => {
      mockInit.mockResolvedValue(true);
      const onEvent = vi.fn();
      renderHook(() => useKeycloakInit({ ...config, onEvent }));

      await waitFor(() => expect(mockKeycloakInstance.onTokenExpired).toBeDefined());

      act(() => {
        (mockKeycloakInstance.onTokenExpired as () => void)();
        (mockKeycloakInstance.onAuthRefreshSuccess as () => void)();
        (mockKeycloakInstance.onAuthSuccess as () => void)();
        (mockKeycloakInstance.onReady as () => void)();
      });

      expect(onEvent).toHaveBeenCalledWith('onTokenExpired');
      expect(onEvent).toHaveBeenCalledWith('onAuthRefreshSuccess');
      expect(onEvent).toHaveBeenCalledWith('onAuthSuccess');
      expect(onEvent).toHaveBeenCalledWith('onReady');
    });

    it('works without any event callbacks (backward compat)', async () => {
      mockInit.mockResolvedValue(true);
      renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(mockKeycloakInstance.onTokenExpired).toBeDefined());

      // Firing events without callbacks should not throw
      expect(() => {
        act(() => {
          (mockKeycloakInstance.onTokenExpired as () => void)();
          (mockKeycloakInstance.onAuthRefreshError as () => void)();
          (mockKeycloakInstance.onAuthLogout as () => void)();
          (mockKeycloakInstance.onAuthRefreshSuccess as () => void)();
        });
      }).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Story #3 — tokenParsed vs loadUserInfo
  // -------------------------------------------------------------------------
  describe('useTokenClaims', () => {
    it('uses tokenParsed when useTokenClaims=true (no loadUserInfo call)', async () => {
      mockInit.mockResolvedValue(true);
      mockKeycloakInstance.tokenParsed = tokenParsedFixture;

      const { result } = renderHook(() =>
        useKeycloakInit({ ...config, useTokenClaims: true })
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.user).toMatchObject({
        sub: 'user-1',
        email: 'token@example.com',
        preferred_username: 'tokenuser',
      });
      expect(mockLoadUserInfo).not.toHaveBeenCalled();
    });

    it('falls back to loadUserInfo when useTokenClaims is not set', async () => {
      mockInit.mockResolvedValue(true);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mockLoadUserInfo).toHaveBeenCalledOnce();
      expect(result.current.user).toMatchObject({ sub: 'user-1' });
    });

    it('updates user from tokenParsed on token refresh when useTokenClaims=true', async () => {
      mockInit.mockResolvedValue(true);
      mockKeycloakInstance.tokenParsed = tokenParsedFixture;

      const { result } = renderHook(() =>
        useKeycloakInit({ ...config, useTokenClaims: true })
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Simulate a refreshed token with updated claims
      mockKeycloakInstance.tokenParsed = {
        ...tokenParsedFixture,
        email: 'refreshed@example.com',
      };

      act(() => {
        (mockKeycloakInstance.onAuthRefreshSuccess as () => void)();
      });

      expect(result.current.user).toMatchObject({ email: 'refreshed@example.com' });
    });
  });

  // -------------------------------------------------------------------------
  // Story #4 — Login / logout / register with options
  // -------------------------------------------------------------------------
  describe('login/logout/register options', () => {
    it('login passes options to keycloak.login()', async () => {
      mockInit.mockResolvedValue(true);
      mockLogin.mockResolvedValue(undefined);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      const opts = { idpHint: 'google', locale: 'fr' };
      await act(async () => {
        await result.current.login(opts);
      });

      expect(mockLogin).toHaveBeenCalledWith(opts);
    });

    it('logout passes options to keycloak.logout()', async () => {
      mockInit.mockResolvedValue(true);
      mockLogout.mockResolvedValue(undefined);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      const opts = { redirectUri: '/goodbye' };
      await act(async () => {
        await result.current.logout(opts);
      });

      expect(mockLogout).toHaveBeenCalledWith(opts);
    });

    it('register calls keycloak.register()', async () => {
      mockInit.mockResolvedValue(true);
      mockRegister.mockResolvedValue(undefined);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.register();
      });

      expect(mockRegister).toHaveBeenCalledOnce();
    });

    it('register forwards options to keycloak.register()', async () => {
      mockInit.mockResolvedValue(true);
      mockRegister.mockResolvedValue(undefined);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      const opts = { redirectUri: '/welcome', locale: 'fr' };
      await act(async () => {
        await result.current.register(opts);
      });

      expect(mockRegister).toHaveBeenCalledWith(opts);
    });
  });

  // -------------------------------------------------------------------------
  // Story #5 — Role checking
  // -------------------------------------------------------------------------
  describe('role checking', () => {
    it('hasRealmRole delegates to keycloak.hasRealmRole()', async () => {
      mockInit.mockResolvedValue(true);
      mockHasRealmRole.mockReturnValue(true);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.hasRealmRole('admin')).toBe(true);
      expect(mockHasRealmRole).toHaveBeenCalledWith('admin');
    });

    it('hasResourceRole delegates to keycloak.hasResourceRole()', async () => {
      mockInit.mockResolvedValue(true);
      mockHasResourceRole.mockReturnValue(true);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.hasResourceRole('editor', 'guava-admin')).toBe(true);
      expect(mockHasResourceRole).toHaveBeenCalledWith('editor', 'guava-admin');
    });

    it('hasRealmRole returns false when not authenticated', async () => {
      mockInit.mockResolvedValue(false);
      mockHasRealmRole.mockReturnValue(false);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.hasRealmRole('admin')).toBe(false);
    });

    it('hasResourceRole returns false when not authenticated', async () => {
      mockInit.mockResolvedValue(false);
      mockHasResourceRole.mockReturnValue(false);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.hasResourceRole('editor')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Story #6 — isTokenExpired + silentCheckSsoFallback + tokenParsed
  // -------------------------------------------------------------------------
  describe('token state and SSO fallback', () => {
    it('isTokenExpired delegates to keycloak.isTokenExpired()', async () => {
      mockInit.mockResolvedValue(true);
      mockIsTokenExpired.mockReturnValue(false);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.isTokenExpired(30)).toBe(false);
      expect(mockIsTokenExpired).toHaveBeenCalledWith(30);
    });

    it('isTokenExpired returns true when not authenticated (safe default)', async () => {
      mockInit.mockResolvedValue(false);
      mockIsTokenExpired.mockReturnValue(true);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.isTokenExpired()).toBe(true);
    });

    it('passes silentCheckSsoFallback to keycloak.init()', async () => {
      mockInit.mockResolvedValue(false);
      const { result } = renderHook(() =>
        useKeycloakInit({ ...config, silentCheckSsoFallback: false })
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      const initArg = mockInit.mock.calls[0][0] as Record<string, unknown>;
      expect(initArg.silentCheckSsoFallback).toBe(false);
    });

    it('defaults silentCheckSsoFallback to true', async () => {
      mockInit.mockResolvedValue(false);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      const initArg = mockInit.mock.calls[0][0] as Record<string, unknown>;
      expect(initArg.silentCheckSsoFallback).toBe(true);
    });

    it('exposes tokenParsed from keycloak instance', async () => {
      mockInit.mockResolvedValue(true);
      mockKeycloakInstance.tokenParsed = tokenParsedFixture;
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.tokenParsed).toMatchObject({ sub: 'user-1' });
    });

    it('tokenParsed is undefined before authentication', () => {
      mockInit.mockResolvedValue(false);
      mockKeycloakInstance.tokenParsed = undefined;
      const { result } = renderHook(() => useKeycloakInit(config));

      expect(result.current.tokenParsed).toBeUndefined();
    });
  });
});
