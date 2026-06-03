import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCognitoInit } from '../hooks/use-cognito-init';

import type { CognitoCoreConfig } from '@granit/authentication-cognito';

/** Minimal duck type for the Cognito storage contract under assertion. */
interface ICognitoStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const {
  mockGetCurrentUser,
  mockGetSession,
  mockGetUserAttributes,
  mockSignOut,
  mockSetTokenGetter,
  mockSetOnUnauthorized,
  CognitoUserPoolCtor,
} = vi.hoisted(() => {
  const mockGetCurrentUser = vi.fn();
  return {
    mockGetCurrentUser,
    mockGetSession: vi.fn(),
    mockGetUserAttributes: vi.fn(),
    mockSignOut: vi.fn(),
    mockSetTokenGetter: vi.fn(),
    mockSetOnUnauthorized: vi.fn(),
    CognitoUserPoolCtor: vi.fn(function CognitoUserPool(
      this: { getCurrentUser: () => unknown },
      _config: { Storage?: ICognitoStorageLike }
    ) {
      this.getCurrentUser = mockGetCurrentUser;
    }),
  };
});

vi.mock('amazon-cognito-identity-js', () => ({
  CognitoUserPool: CognitoUserPoolCtor,
}));

vi.mock('@granit/api-client', () => ({
  setTokenGetter: mockSetTokenGetter,
  setOnUnauthorized: mockSetOnUnauthorized,
}));

const baseConfig: CognitoCoreConfig = {
  userPoolId: 'eu-west-1_test',
  clientId: 'test-client-id',
  region: 'eu-west-1',
};

function makeCognitoUser() {
  return {
    getSession: mockGetSession,
    getUserAttributes: mockGetUserAttributes,
    signOut: mockSignOut,
  };
}

describe('useCognitoInit', () => {
  beforeEach(() => {
    mockGetCurrentUser.mockReset();
    mockGetSession.mockReset();
    mockGetUserAttributes.mockReset();
    mockSignOut.mockReset();
    mockSetTokenGetter.mockReset();
    mockSetOnUnauthorized.mockReset();
    CognitoUserPoolCtor.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts in loading=true / authenticated=false', () => {
    mockGetCurrentUser.mockReturnValue(null);
    const { result } = renderHook(() => useCognitoInit(baseConfig));
    expect(result.current.authenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('constructs the pool with an in-memory Storage by default (VULN-102)', () => {
    mockGetCurrentUser.mockReturnValue(null);
    renderHook(() => useCognitoInit(baseConfig));
    const poolConfig = CognitoUserPoolCtor.mock.calls[0]?.[0] as { Storage?: ICognitoStorageLike };
    expect(poolConfig.Storage).toBeDefined();
    // Not a Web Storage object → tokens are not readable by same-origin scripts.
    expect(poolConfig.Storage).not.toBe(globalThis.localStorage);
    expect(poolConfig.Storage).not.toBe(globalThis.sessionStorage);
    expect(typeof poolConfig.Storage?.getItem).toBe('function');
    expect(typeof poolConfig.Storage?.setItem).toBe('function');
  });

  it('honors tokenStorage="localStorage" as an explicit opt-in', () => {
    mockGetCurrentUser.mockReturnValue(null);
    renderHook(() => useCognitoInit({ ...baseConfig, tokenStorage: 'localStorage' }));
    const poolConfig = CognitoUserPoolCtor.mock.calls[0]?.[0] as { Storage?: ICognitoStorageLike };
    expect(poolConfig.Storage).toBe(globalThis.localStorage);
  });

  it('settles loading=false when no Cognito user is present', async () => {
    mockGetCurrentUser.mockReturnValue(null);
    const { result } = renderHook(() => useCognitoInit(baseConfig));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.authenticated).toBe(false);
  });

  it('triggers onSessionExpired when getSession returns an invalid session', async () => {
    const onSessionExpired = vi.fn();
    mockGetCurrentUser.mockReturnValue(makeCognitoUser());
    mockGetSession.mockImplementation(
      (cb: (err: Error | null, session: { isValid: () => boolean } | null) => void) => {
        cb(null, { isValid: () => false });
      }
    );

    const { result } = renderHook(() => useCognitoInit({ ...baseConfig, onSessionExpired }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(onSessionExpired).toHaveBeenCalled();
    expect(result.current.authenticated).toBe(false);
  });

  it('triggers onSessionExpired when getSession returns an error', async () => {
    const onSessionExpired = vi.fn();
    mockGetCurrentUser.mockReturnValue(makeCognitoUser());
    mockGetSession.mockImplementation((cb: (err: Error | null, session: unknown) => void) => {
      cb(new Error('boom'), null);
    });

    const { result } = renderHook(() => useCognitoInit({ ...baseConfig, onSessionExpired }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(onSessionExpired).toHaveBeenCalled();
  });

  it('flips authenticated=true and extracts the user when session is valid', async () => {
    mockGetCurrentUser.mockReturnValue(makeCognitoUser());
    mockGetSession.mockImplementation(
      (
        cb: (
          err: Error | null,
          session: {
            isValid: () => boolean;
            getIdToken: () => { getJwtToken: () => string };
            getAccessToken: () => { getJwtToken: () => string };
          } | null
        ) => void
      ) => {
        cb(null, {
          isValid: () => true,
          getIdToken: () => ({ getJwtToken: () => 'id-token' }),
          getAccessToken: () => ({ getJwtToken: () => 'access-token' }),
        });
      }
    );
    mockGetUserAttributes.mockImplementation(
      (cb: (err: Error | null, attrs: { Name: string; Value: string }[] | null) => void) => {
        cb(null, [
          { Name: 'sub', Value: 'user-1' },
          { Name: 'email', Value: 'a@b.test' },
          { Name: 'name', Value: 'Alice' },
        ]);
      }
    );

    const { result } = renderHook(() => useCognitoInit(baseConfig));

    await waitFor(() => expect(result.current.authenticated).toBe(true));
    expect(result.current.user).toMatchObject({
      sub: 'user-1',
      email: 'a@b.test',
      name: 'Alice',
    });
    expect(mockSetTokenGetter).toHaveBeenCalled();
    expect(mockSetOnUnauthorized).toHaveBeenCalled();
  });

  it('still finishes loading when getUserAttributes errors out', async () => {
    mockGetCurrentUser.mockReturnValue(makeCognitoUser());
    mockGetSession.mockImplementation(
      (
        cb: (
          err: Error | null,
          session: {
            isValid: () => boolean;
            getIdToken: () => { getJwtToken: () => string };
            getAccessToken: () => { getJwtToken: () => string };
          } | null
        ) => void
      ) => {
        cb(null, {
          isValid: () => true,
          getIdToken: () => ({ getJwtToken: () => '' }),
          getAccessToken: () => ({ getJwtToken: () => '' }),
        });
      }
    );
    mockGetUserAttributes.mockImplementation((cb: (err: Error | null, attrs: unknown) => void) => {
      cb(new Error('attr fail'), null);
    });

    const { result } = renderHook(() => useCognitoInit(baseConfig));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.authenticated).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('login() does nothing when no domain is configured', async () => {
    mockGetCurrentUser.mockReturnValue(null);
    const originalHref = globalThis.location.href;
    const { result } = renderHook(() => useCognitoInit(baseConfig));

    await waitFor(() => expect(result.current.loading).toBe(false));

    result.current.login();
    expect(globalThis.location.href).toBe(originalHref);
  });

  it('login() redirects to the hosted UI with default scopes when domain is configured', async () => {
    mockGetCurrentUser.mockReturnValue(null);

    const hrefSetter = vi.fn();
    const originalLocation = globalThis.location;
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: new Proxy(originalLocation, {
        set(target, prop, value) {
          if (prop === 'href') {
            hrefSetter(value);
            return true;
          }
          return Reflect.set(target, prop, value);
        },
        get(target, prop) {
          if (prop === 'origin') return 'https://app.example';
          return Reflect.get(target, prop);
        },
      }),
    });

    try {
      const { result } = renderHook(() =>
        useCognitoInit({ ...baseConfig, domain: 'auth.example.com' })
      );
      await waitFor(() => expect(result.current.loading).toBe(false));
      result.current.login();

      expect(hrefSetter).toHaveBeenCalledWith(
        expect.stringContaining('https://auth.example.com/login?client_id=test-client-id')
      );
      expect(hrefSetter.mock.calls[0]?.[0]).toContain('scope=openid+profile+email');
    } finally {
      Object.defineProperty(globalThis, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it('login() honors custom scopes and the redirectUri override', async () => {
    mockGetCurrentUser.mockReturnValue(null);

    const hrefSetter = vi.fn();
    const originalLocation = globalThis.location;
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: new Proxy(originalLocation, {
        set(target, prop, value) {
          if (prop === 'href') {
            hrefSetter(value);
            return true;
          }
          return Reflect.set(target, prop, value);
        },
      }),
    });

    try {
      const { result } = renderHook(() =>
        useCognitoInit({ ...baseConfig, domain: 'auth.example.com', scopes: ['openid', 'foo'] })
      );
      await waitFor(() => expect(result.current.loading).toBe(false));
      result.current.login({ redirectUri: 'https://app.example/cb' });

      expect(hrefSetter.mock.calls[0]?.[0]).toContain('scope=openid+foo');
      expect(hrefSetter.mock.calls[0]?.[0]).toContain(encodeURIComponent('https://app.example/cb'));
    } finally {
      Object.defineProperty(globalThis, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it('logout() signs the user out and redirects when redirectUri is supplied', async () => {
    const userInstance = makeCognitoUser();
    mockGetCurrentUser.mockReturnValue(userInstance);
    mockGetSession.mockImplementation(
      (cb: (err: Error | null, session: { isValid: () => boolean } | null) => void) => {
        cb(null, { isValid: () => false });
      }
    );

    const hrefSetter = vi.fn();
    const originalLocation = globalThis.location;
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: new Proxy(originalLocation, {
        set(target, prop, value) {
          if (prop === 'href') {
            hrefSetter(value);
            return true;
          }
          return Reflect.set(target, prop, value);
        },
      }),
    });

    try {
      const { result } = renderHook(() => useCognitoInit(baseConfig));
      await waitFor(() => expect(result.current.loading).toBe(false));
      result.current.logout({ redirectUri: 'https://app.example/bye' });
      expect(mockSignOut).toHaveBeenCalled();
      expect(hrefSetter).toHaveBeenCalledWith('https://app.example/bye');
    } finally {
      Object.defineProperty(globalThis, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it('logout() is a no-op for signOut when there is no current user', async () => {
    mockGetCurrentUser.mockReturnValue(null);
    const { result } = renderHook(() => useCognitoInit(baseConfig));
    await waitFor(() => expect(result.current.loading).toBe(false));
    result.current.logout();
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
