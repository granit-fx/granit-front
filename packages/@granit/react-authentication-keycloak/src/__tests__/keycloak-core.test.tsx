import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useKeycloakInit } from '../hooks/use-keycloak-core';

import type { KeycloakCoreConfig } from '@granit/authentication-keycloak';

// ---------------------------------------------------------------------------
// Hoisted mock references (declared before vi.mock hoisting)
// ---------------------------------------------------------------------------
const {
  mockInit,
  mockLogin,
  mockLogout,
  mockRegister,
  mockLoadUserInfo,
  mockUpdateToken,
  mockHasRealmRole,
  mockHasResourceRole,
  mockIsTokenExpired,
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
  default: vi.fn(function () {
    return mockKeycloakInstance;
  }),
}));

vi.mock('@granit/api-client', () => ({
  setTokenGetter: mockSetTokenGetter,
  setOnUnauthorized: vi.fn(),
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
// Tests
// ---------------------------------------------------------------------------
describe('useKeycloakInit', () => {
  beforeEach(() => {
    mockLoadUserInfo.mockResolvedValue(userInfo);
    mockKeycloakInstance.tokenParsed = undefined;
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

  it('should start with loading=true and authenticated=false', () => {
    mockInit.mockResolvedValue(false);
    const { result } = renderHook(() => useKeycloakInit(config));
    expect(result.current.loading).toBe(true);
    expect(result.current.authenticated).toBe(false);
  });

  it('should set loading=false after unauthenticated init', async () => {
    mockInit.mockResolvedValue(false);
    const { result } = renderHook(() => useKeycloakInit(config));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.authenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should set authenticated=true and load user info after successful init', async () => {
    mockInit.mockResolvedValue(true);
    const { result } = renderHook(() => useKeycloakInit(config));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.authenticated).toBe(true);
    expect(result.current.user).toMatchObject({ sub: 'user-1' });
  });

  it('should register a token getter with setTokenGetter when authenticated', async () => {
    mockInit.mockResolvedValue(true);
    renderHook(() => useKeycloakInit(config));

    await waitFor(() => expect(mockSetTokenGetter).toHaveBeenCalledOnce());
  });

  it('should stay unauthenticated when keycloak.init rejects', async () => {
    mockInit.mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useKeycloakInit(config));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.authenticated).toBe(false);
  });

  it('should handle loadUserInfo failure gracefully (non-fatal)', async () => {
    mockInit.mockResolvedValue(true);
    mockLoadUserInfo.mockRejectedValue(new Error('user info failed'));
    const { result } = renderHook(() => useKeycloakInit(config));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.authenticated).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('should call keycloak.login() on login', async () => {
    mockInit.mockResolvedValue(true);
    mockLogin.mockResolvedValue(undefined);
    const { result } = renderHook(() => useKeycloakInit(config));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login();
    });

    expect(mockLogin).toHaveBeenCalledOnce();
  });

  it('should call keycloak.logout() on logout', async () => {
    mockInit.mockResolvedValue(true);
    mockLogout.mockResolvedValue(undefined);
    const { result } = renderHook(() => useKeycloakInit(config));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.logout();
    });

    expect(mockLogout).toHaveBeenCalledOnce();
  });

  it('should return token from getter after successful updateToken', async () => {
    mockInit.mockResolvedValue(true);
    mockUpdateToken.mockResolvedValue(true);
    renderHook(() => useKeycloakInit(config));

    await waitFor(() => expect(mockSetTokenGetter).toHaveBeenCalledOnce());

    const getter = mockSetTokenGetter.mock.calls[0]![0] as () => Promise<string | undefined>;
    const token = await getter();
    expect(token).toBe('mock-access-token');
  });

  it('should return undefined from getter when updateToken rejects', async () => {
    mockInit.mockResolvedValue(true);
    mockUpdateToken.mockRejectedValue(new Error('token expired'));
    renderHook(() => useKeycloakInit(config));

    await waitFor(() => expect(mockSetTokenGetter).toHaveBeenCalledOnce());

    const getter = mockSetTokenGetter.mock.calls[0]![0] as () => Promise<string | undefined>;
    const token = await getter();
    expect(token).toBeUndefined();
  });

  it('should omit silentCheckSso from init options when silentCheckSso=false', async () => {
    mockInit.mockResolvedValue(false);
    const { result } = renderHook(() => useKeycloakInit({ ...config, silentCheckSso: false }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    const initArg = mockInit.mock.calls[0]![0] as Record<string, unknown>;
    expect(initArg).not.toHaveProperty('silentCheckSsoRedirectUri');
  });

  describe('lifecycle events', () => {
    it('should call onTokenExpired callback when token expires', async () => {
      mockInit.mockResolvedValue(true);
      const onTokenExpired = vi.fn();
      renderHook(() => useKeycloakInit({ ...config, onTokenExpired }));

      await waitFor(() => expect(mockKeycloakInstance.onTokenExpired).toBeDefined());

      act(() => {
        (mockKeycloakInstance.onTokenExpired as () => void)();
      });

      expect(onTokenExpired).toHaveBeenCalledOnce();
    });

    it('should call onAuthRefreshError and set authenticated=false on refresh failure', async () => {
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

    it('should call onAuthLogout and reset state on logout event', async () => {
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

    it('should call onEvent with event name for each Keycloak event', async () => {
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

    it('should work without any event callbacks (backward compat)', async () => {
      mockInit.mockResolvedValue(true);
      renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(mockKeycloakInstance.onTokenExpired).toBeDefined());

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

  describe('useTokenClaims', () => {
    it('should use tokenParsed when useTokenClaims=true (no loadUserInfo call)', async () => {
      mockInit.mockResolvedValue(true);
      mockKeycloakInstance.tokenParsed = tokenParsedFixture;

      const { result } = renderHook(() => useKeycloakInit({ ...config, useTokenClaims: true }));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.user).toMatchObject({
        sub: 'user-1',
        email: 'token@example.com',
        preferred_username: 'tokenuser',
      });
      expect(mockLoadUserInfo).not.toHaveBeenCalled();
    });

    it('should fall back to loadUserInfo when useTokenClaims is not set', async () => {
      mockInit.mockResolvedValue(true);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mockLoadUserInfo).toHaveBeenCalledOnce();
      expect(result.current.user).toMatchObject({ sub: 'user-1' });
    });

    it('should update user from tokenParsed on token refresh when useTokenClaims=true', async () => {
      mockInit.mockResolvedValue(true);
      mockKeycloakInstance.tokenParsed = tokenParsedFixture;

      const { result } = renderHook(() => useKeycloakInit({ ...config, useTokenClaims: true }));

      await waitFor(() => expect(result.current.loading).toBe(false));

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

  describe('login/logout/register options', () => {
    it('should pass options to keycloak.login() on login', async () => {
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

    it('should pass options to keycloak.logout() on logout', async () => {
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

    it('should call keycloak.register() on register', async () => {
      mockInit.mockResolvedValue(true);
      mockRegister.mockResolvedValue(undefined);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.register();
      });

      expect(mockRegister).toHaveBeenCalledOnce();
    });

    it('should forward options to keycloak.register() on register', async () => {
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

  describe('role checking', () => {
    it('should delegate hasRealmRole to keycloak.hasRealmRole()', async () => {
      mockInit.mockResolvedValue(true);
      mockHasRealmRole.mockReturnValue(true);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.hasRealmRole('admin')).toBe(true);
      expect(mockHasRealmRole).toHaveBeenCalledWith('admin');
    });

    it('should delegate hasResourceRole to keycloak.hasResourceRole()', async () => {
      mockInit.mockResolvedValue(true);
      mockHasResourceRole.mockReturnValue(true);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.hasResourceRole('editor', 'showcase-admin')).toBe(true);
      expect(mockHasResourceRole).toHaveBeenCalledWith('editor', 'showcase-admin');
    });

    it('should return false from hasRealmRole when not authenticated', async () => {
      mockInit.mockResolvedValue(false);
      mockHasRealmRole.mockReturnValue(false);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.hasRealmRole('admin')).toBe(false);
    });

    it('should return false from hasResourceRole when not authenticated', async () => {
      mockInit.mockResolvedValue(false);
      mockHasResourceRole.mockReturnValue(false);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.hasResourceRole('editor')).toBe(false);
    });
  });

  describe('token state and SSO fallback', () => {
    it('should delegate isTokenExpired to keycloak.isTokenExpired()', async () => {
      mockInit.mockResolvedValue(true);
      mockIsTokenExpired.mockReturnValue(false);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.isTokenExpired(30)).toBe(false);
      expect(mockIsTokenExpired).toHaveBeenCalledWith(30);
    });

    it('should return true from isTokenExpired when not authenticated (safe default)', async () => {
      mockInit.mockResolvedValue(false);
      mockIsTokenExpired.mockReturnValue(true);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.isTokenExpired()).toBe(true);
    });

    it('should pass silentCheckSsoFallback to keycloak.init()', async () => {
      mockInit.mockResolvedValue(false);
      const { result } = renderHook(() =>
        useKeycloakInit({ ...config, silentCheckSsoFallback: false })
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      const initArg = mockInit.mock.calls[0]![0] as Record<string, unknown>;
      expect(initArg.silentCheckSsoFallback).toBe(false);
    });

    it('should default silentCheckSsoFallback to true', async () => {
      mockInit.mockResolvedValue(false);
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      const initArg = mockInit.mock.calls[0]![0] as Record<string, unknown>;
      expect(initArg.silentCheckSsoFallback).toBe(true);
    });

    it('should expose tokenParsed from keycloak instance', async () => {
      mockInit.mockResolvedValue(true);
      mockKeycloakInstance.tokenParsed = tokenParsedFixture;
      const { result } = renderHook(() => useKeycloakInit(config));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.tokenParsed).toMatchObject({ sub: 'user-1' });
    });

    it('should have undefined tokenParsed before authentication', () => {
      mockInit.mockResolvedValue(false);
      mockKeycloakInstance.tokenParsed = undefined;
      const { result } = renderHook(() => useKeycloakInit(config));

      expect(result.current.tokenParsed).toBeUndefined();
    });
  });
});
