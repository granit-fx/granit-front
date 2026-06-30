import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useEntraIdInit } from '../hooks/use-entraid-init';

import type { EntraIdCoreConfig } from '@granit/authentication-entraid';

const {
  mockInitialize,
  mockHandleRedirectPromise,
  mockGetActiveAccount,
  mockGetAllAccounts,
  mockSetActiveAccount,
  mockAcquireTokenSilent,
  mockLoginRedirect,
  mockLogoutRedirect,
  mockSetTokenGetter,
  mockSetOnUnauthorized,
  MockInteractionRequiredAuthError,
} = vi.hoisted(() => {
  class MockInteractionRequiredAuthError extends Error {}
  return {
    mockInitialize: vi.fn(),
    mockHandleRedirectPromise: vi.fn(),
    mockGetActiveAccount: vi.fn(),
    mockGetAllAccounts: vi.fn(),
    mockSetActiveAccount: vi.fn(),
    mockAcquireTokenSilent: vi.fn(),
    mockLoginRedirect: vi.fn(),
    mockLogoutRedirect: vi.fn(),
    mockSetTokenGetter: vi.fn(),
    mockSetOnUnauthorized: vi.fn(),
    MockInteractionRequiredAuthError,
  };
});

vi.mock('@azure/msal-browser', () => ({
  PublicClientApplication: vi.fn(function MockMsal() {
    return {
      initialize: mockInitialize,
      handleRedirectPromise: mockHandleRedirectPromise,
      getActiveAccount: mockGetActiveAccount,
      getAllAccounts: mockGetAllAccounts,
      setActiveAccount: mockSetActiveAccount,
      acquireTokenSilent: mockAcquireTokenSilent,
      loginRedirect: mockLoginRedirect,
      logoutRedirect: mockLogoutRedirect,
    };
  }),
  InteractionRequiredAuthError: MockInteractionRequiredAuthError,
}));

vi.mock('@granit/api-client', () => ({
  setTokenGetter: mockSetTokenGetter,
  setOnUnauthorized: mockSetOnUnauthorized,
}));

const baseConfig: EntraIdCoreConfig = {
  clientId: 'app-id',
  authority: 'https://login.microsoftonline.com/tenant',
  redirectUri: 'https://app.example',
};

describe('useEntraIdInit', () => {
  beforeEach(() => {
    mockInitialize.mockResolvedValue(undefined);
    mockHandleRedirectPromise.mockResolvedValue(null);
    mockGetActiveAccount.mockReturnValue(null);
    mockGetAllAccounts.mockReturnValue([]);
    mockSetActiveAccount.mockReset();
    mockAcquireTokenSilent.mockReset();
    mockLoginRedirect.mockResolvedValue(undefined);
    mockLogoutRedirect.mockResolvedValue(undefined);
    mockSetTokenGetter.mockReset();
    mockSetOnUnauthorized.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts in loading=true / authenticated=false', () => {
    const { result } = renderHook(() => useEntraIdInit(baseConfig));
    expect(result.current.loading).toBe(true);
    expect(result.current.authenticated).toBe(false);
  });

  it('settles loading=false when no account exists post-init', async () => {
    const { result } = renderHook(() => useEntraIdInit(baseConfig));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.authenticated).toBe(false);
    expect(mockSetTokenGetter).not.toHaveBeenCalled();
  });

  it('promotes the redirect-response account to active and authenticates the user', async () => {
    const account = {
      username: 'alice@example.com',
      name: 'Alice',
      idTokenClaims: {
        sub: 'alice-sub',
        email: 'alice@example.com',
        given_name: 'Alice',
        family_name: 'Smith',
      },
    };
    mockHandleRedirectPromise.mockResolvedValue({ account });
    mockGetActiveAccount.mockReturnValue(account);

    const { result } = renderHook(() => useEntraIdInit(baseConfig));

    await waitFor(() => expect(result.current.authenticated).toBe(true));
    expect(result.current.user).toMatchObject({
      sub: 'alice-sub',
      email: 'alice@example.com',
      preferred_username: 'alice@example.com',
      given_name: 'Alice',
      family_name: 'Smith',
    });
    expect(mockSetActiveAccount).toHaveBeenCalled();
    expect(mockSetTokenGetter).toHaveBeenCalled();
    expect(mockSetOnUnauthorized).toHaveBeenCalled();
  });

  it('falls back to the first cached account when there is no redirect response', async () => {
    const account = { username: 'bob@example.com', idTokenClaims: { oid: 'bob-oid' } };
    mockGetActiveAccount.mockReturnValue(null);
    mockGetAllAccounts.mockReturnValue([account]);

    const { result } = renderHook(() => useEntraIdInit(baseConfig));

    await waitFor(() => expect(result.current.authenticated).toBe(true));
    // sub falls back to oid claim when sub is missing
    expect(result.current.user?.sub).toBe('bob-oid');
  });

  it('exposes a token-getter that returns the silent access token', async () => {
    const account = { username: 'a', idTokenClaims: { sub: 'a' } };
    mockGetActiveAccount.mockReturnValue(account);
    mockAcquireTokenSilent.mockResolvedValue({ accessToken: 'fresh-token' });

    renderHook(() => useEntraIdInit(baseConfig));

    await waitFor(() => expect(mockSetTokenGetter).toHaveBeenCalled());

    const tokenGetter = mockSetTokenGetter.mock.calls[0]?.[0] as () => Promise<string | undefined>;
    await expect(tokenGetter()).resolves.toBe('fresh-token');
  });

  it('triggers onAcquireTokenFailure when MSAL reports interaction-required', async () => {
    const onAcquireTokenFailure = vi.fn();
    const account = { username: 'a', idTokenClaims: { sub: 'a' } };
    mockGetActiveAccount.mockReturnValue(account);
    mockAcquireTokenSilent.mockRejectedValue(new MockInteractionRequiredAuthError('login'));

    renderHook(() => useEntraIdInit({ ...baseConfig, onAcquireTokenFailure }));

    await waitFor(() => expect(mockSetTokenGetter).toHaveBeenCalled());

    const tokenGetter = mockSetTokenGetter.mock.calls[0]?.[0] as () => Promise<string | undefined>;
    await expect(tokenGetter()).resolves.toBeUndefined();
    expect(onAcquireTokenFailure).toHaveBeenCalled();
  });

  it('swallows non-interaction errors silently and returns undefined', async () => {
    const onAcquireTokenFailure = vi.fn();
    const account = { username: 'a', idTokenClaims: { sub: 'a' } };
    mockGetActiveAccount.mockReturnValue(account);
    mockAcquireTokenSilent.mockRejectedValue(new Error('network'));

    renderHook(() => useEntraIdInit({ ...baseConfig, onAcquireTokenFailure }));

    await waitFor(() => expect(mockSetTokenGetter).toHaveBeenCalled());

    const tokenGetter = mockSetTokenGetter.mock.calls[0]?.[0] as () => Promise<string | undefined>;
    await expect(tokenGetter()).resolves.toBeUndefined();
    expect(onAcquireTokenFailure).not.toHaveBeenCalled();
  });

  it('still settles loading=false when MSAL initialization throws', async () => {
    mockInitialize.mockRejectedValue(new Error('init failed'));
    const { result } = renderHook(() => useEntraIdInit(baseConfig));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.authenticated).toBe(false);
  });

  it('login() forwards options to loginRedirect', async () => {
    const account = { username: 'a', idTokenClaims: { sub: 'a' } };
    mockGetActiveAccount.mockReturnValue(account);

    const { result } = renderHook(() => useEntraIdInit(baseConfig));
    await waitFor(() => expect(result.current.authenticated).toBe(true));

    await result.current.login({
      redirectUri: 'https://app.example/cb',
      loginHint: 'alice',
      prompt: 'login',
    });

    expect(mockLoginRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectUri: 'https://app.example/cb',
        loginHint: 'alice',
        prompt: 'login',
      })
    );
  });

  it('login() forwards the UI locale to MSAL as ui_locales', async () => {
    const account = { username: 'a', idTokenClaims: { sub: 'a' } };
    mockGetActiveAccount.mockReturnValue(account);

    const { result } = renderHook(() => useEntraIdInit(baseConfig));
    await waitFor(() => expect(result.current.authenticated).toBe(true));

    await result.current.login({ locale: 'fr' });

    expect(mockLoginRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        extraQueryParameters: { ui_locales: 'fr' },
      })
    );
  });

  it('login() omits extraQueryParameters when no locale is provided', async () => {
    const account = { username: 'a', idTokenClaims: { sub: 'a' } };
    mockGetActiveAccount.mockReturnValue(account);

    const { result } = renderHook(() => useEntraIdInit(baseConfig));
    await waitFor(() => expect(result.current.authenticated).toBe(true));

    await result.current.login({ loginHint: 'alice' });

    expect(mockLoginRedirect.mock.calls[0]?.[0]).not.toHaveProperty('extraQueryParameters');
  });

  it('logout() forwards postLogoutRedirectUri to logoutRedirect', async () => {
    const account = { username: 'a', idTokenClaims: { sub: 'a' } };
    mockGetActiveAccount.mockReturnValue(account);

    const { result } = renderHook(() => useEntraIdInit(baseConfig));
    await waitFor(() => expect(result.current.authenticated).toBe(true));

    await result.current.logout({ redirectUri: 'https://app.example/bye' });
    expect(mockLogoutRedirect).toHaveBeenCalledWith({
      postLogoutRedirectUri: 'https://app.example/bye',
    });
  });
});
