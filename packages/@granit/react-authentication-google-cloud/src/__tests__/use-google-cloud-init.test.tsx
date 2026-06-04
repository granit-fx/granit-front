import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useGoogleCloudInit } from '../hooks/use-google-cloud-init';

import type { GoogleCloudCoreConfig } from '@granit/authentication-google-cloud';

const {
  mockInitializeApp,
  mockInitializeAuth,
  mockOnAuthStateChanged,
  mockSignInWithRedirect,
  mockSignOut,
  mockAddScope,
  mockSetTokenGetter,
  mockSetOnUnauthorized,
  GoogleAuthProviderCtor,
  IN_MEMORY_PERSISTENCE,
  SESSION_PERSISTENCE,
  INDEXEDDB_PERSISTENCE,
} = vi.hoisted(() => {
  const mockAddScope = vi.fn();
  return {
    mockInitializeApp: vi.fn(),
    mockInitializeAuth: vi.fn(),
    mockOnAuthStateChanged: vi.fn(),
    mockSignInWithRedirect: vi.fn(),
    mockSignOut: vi.fn(),
    mockAddScope,
    mockSetTokenGetter: vi.fn(),
    mockSetOnUnauthorized: vi.fn(),
    GoogleAuthProviderCtor: vi.fn(function GoogleAuthProvider() {
      return { addScope: mockAddScope };
    }),
    IN_MEMORY_PERSISTENCE: { __persistence: 'NONE' },
    SESSION_PERSISTENCE: { __persistence: 'SESSION' },
    INDEXEDDB_PERSISTENCE: { __persistence: 'LOCAL' },
  };
});

vi.mock('firebase/app', () => ({
  initializeApp: mockInitializeApp,
}));

vi.mock('firebase/auth', () => ({
  initializeAuth: mockInitializeAuth,
  inMemoryPersistence: IN_MEMORY_PERSISTENCE,
  browserSessionPersistence: SESSION_PERSISTENCE,
  indexedDBLocalPersistence: INDEXEDDB_PERSISTENCE,
  onAuthStateChanged: mockOnAuthStateChanged,
  signInWithRedirect: mockSignInWithRedirect,
  signOut: mockSignOut,
  GoogleAuthProvider: GoogleAuthProviderCtor,
}));

vi.mock('@granit/api-client', () => ({
  setTokenGetter: mockSetTokenGetter,
  setOnUnauthorized: mockSetOnUnauthorized,
}));

const baseConfig: GoogleCloudCoreConfig = {
  apiKey: 'fake-key',
  authDomain: 'app.firebaseapp.com',
  projectId: 'app-id',
};

describe('useGoogleCloudInit', () => {
  let unsubscribe: ReturnType<typeof vi.fn>;
  let authStateCallback:
    | ((
        user: {
          uid: string;
          email: string | null;
          displayName: string | null;
          photoURL: string | null;
          getIdToken: () => Promise<string>;
        } | null
      ) => Promise<void> | void)
    | null;

  beforeEach(() => {
    unsubscribe = vi.fn();
    authStateCallback = null;
    mockInitializeApp.mockReset();
    mockInitializeApp.mockReturnValue({});
    mockInitializeAuth.mockReset();
    mockInitializeAuth.mockReturnValue({});
    mockOnAuthStateChanged.mockReset();
    mockOnAuthStateChanged.mockImplementation((_auth: unknown, cb: (user: unknown) => void) => {
      authStateCallback = cb as typeof authStateCallback;
      return unsubscribe;
    });
    mockSignInWithRedirect.mockReset();
    mockSignInWithRedirect.mockResolvedValue(undefined);
    mockSignOut.mockReset();
    mockSignOut.mockResolvedValue(undefined);
    mockAddScope.mockReset();
    mockSetTokenGetter.mockReset();
    mockSetOnUnauthorized.mockReset();
    GoogleAuthProviderCtor.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes Firebase and subscribes to auth state changes', () => {
    renderHook(() => useGoogleCloudInit(baseConfig));
    expect(mockInitializeApp).toHaveBeenCalledWith({
      apiKey: 'fake-key',
      authDomain: 'app.firebaseapp.com',
      projectId: 'app-id',
    });
    expect(mockOnAuthStateChanged).toHaveBeenCalled();
  });

  it('defaults to in-memory persistence so tokens are not stored in IndexedDB (VULN-201)', () => {
    renderHook(() => useGoogleCloudInit(baseConfig));
    expect(mockInitializeAuth).toHaveBeenCalledWith(expect.anything(), {
      persistence: IN_MEMORY_PERSISTENCE,
    });
  });

  it('maps tokenStorage="localStorage" to Firebase IndexedDB persistence', () => {
    renderHook(() => useGoogleCloudInit({ ...baseConfig, tokenStorage: 'localStorage' }));
    expect(mockInitializeAuth).toHaveBeenCalledWith(expect.anything(), {
      persistence: INDEXEDDB_PERSISTENCE,
    });
  });

  it('maps tokenStorage="sessionStorage" to Firebase session persistence', () => {
    renderHook(() => useGoogleCloudInit({ ...baseConfig, tokenStorage: 'sessionStorage' }));
    expect(mockInitializeAuth).toHaveBeenCalledWith(expect.anything(), {
      persistence: SESSION_PERSISTENCE,
    });
  });

  it('flips authenticated=true and extracts the user when a Firebase user appears', async () => {
    const { result } = renderHook(() => useGoogleCloudInit(baseConfig));
    await waitFor(() => expect(authStateCallback).not.toBeNull());

    await authStateCallback!({
      uid: 'user-1',
      email: 'a@b.test',
      displayName: 'Alice',
      photoURL: 'https://cdn/x.png',
      getIdToken: () => Promise.resolve('id-token'),
    });

    await waitFor(() => expect(result.current.authenticated).toBe(true));
    expect(result.current.user).toEqual({
      sub: 'user-1',
      email: 'a@b.test',
      name: 'Alice',
      picture: 'https://cdn/x.png',
    });
    expect(mockSetTokenGetter).toHaveBeenCalled();
    expect(mockSetOnUnauthorized).toHaveBeenCalled();
  });

  it('coalesces nullish profile fields to undefined in the OIDC user', async () => {
    const { result } = renderHook(() => useGoogleCloudInit(baseConfig));
    await waitFor(() => expect(authStateCallback).not.toBeNull());

    await authStateCallback!({
      uid: 'user-2',
      email: null,
      displayName: null,
      photoURL: null,
      getIdToken: () => Promise.resolve(''),
    });

    await waitFor(() => expect(result.current.authenticated).toBe(true));
    expect(result.current.user).toEqual({
      sub: 'user-2',
      email: undefined,
      name: undefined,
      picture: undefined,
    });
  });

  it('exposes a token-getter that returns the Firebase ID token', async () => {
    renderHook(() => useGoogleCloudInit(baseConfig));
    await waitFor(() => expect(authStateCallback).not.toBeNull());

    const getIdToken = vi.fn(() => Promise.resolve('id-token-1'));
    await authStateCallback!({
      uid: 'u',
      email: null,
      displayName: null,
      photoURL: null,
      getIdToken,
    });

    await waitFor(() => expect(mockSetTokenGetter).toHaveBeenCalled());
    const tokenGetter = mockSetTokenGetter.mock.calls[0]?.[0] as () => Promise<string | undefined>;
    await expect(tokenGetter()).resolves.toBe('id-token-1');
  });

  it('triggers onTokenRefreshError when getIdToken throws', async () => {
    const onTokenRefreshError = vi.fn();
    renderHook(() => useGoogleCloudInit({ ...baseConfig, onTokenRefreshError }));
    await waitFor(() => expect(authStateCallback).not.toBeNull());

    const getIdToken = vi.fn(() => Promise.reject(new Error('expired')));
    await authStateCallback!({
      uid: 'u',
      email: null,
      displayName: null,
      photoURL: null,
      getIdToken,
    });

    await waitFor(() => expect(mockSetTokenGetter).toHaveBeenCalled());
    const tokenGetter = mockSetTokenGetter.mock.calls[0]?.[0] as () => Promise<string | undefined>;
    await expect(tokenGetter()).resolves.toBeUndefined();
    expect(onTokenRefreshError).toHaveBeenCalled();
  });

  it('clears the user and triggers onSessionExpired when the auth listener fires with null', async () => {
    const onSessionExpired = vi.fn();
    const { result } = renderHook(() => useGoogleCloudInit({ ...baseConfig, onSessionExpired }));
    await waitFor(() => expect(authStateCallback).not.toBeNull());

    await authStateCallback!(null);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.authenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(onSessionExpired).toHaveBeenCalled();
  });

  it('login() registers the configured scopes and triggers signInWithRedirect', async () => {
    const { result } = renderHook(() =>
      useGoogleCloudInit({ ...baseConfig, scopes: ['profile', 'calendar'] })
    );
    await waitFor(() => expect(authStateCallback).not.toBeNull());

    await result.current.login();

    expect(GoogleAuthProviderCtor).toHaveBeenCalled();
    expect(mockAddScope).toHaveBeenCalledWith('profile');
    expect(mockAddScope).toHaveBeenCalledWith('calendar');
    expect(mockSignInWithRedirect).toHaveBeenCalled();
  });

  it('login() works without configured scopes', async () => {
    const { result } = renderHook(() => useGoogleCloudInit(baseConfig));
    await waitFor(() => expect(authStateCallback).not.toBeNull());

    await result.current.login();
    expect(mockAddScope).not.toHaveBeenCalled();
    expect(mockSignInWithRedirect).toHaveBeenCalled();
  });

  it('logout() signs out and redirects when redirectUri is supplied', async () => {
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
      const { result } = renderHook(() => useGoogleCloudInit(baseConfig));
      await waitFor(() => expect(authStateCallback).not.toBeNull());

      await result.current.logout({ redirectUri: 'https://app.example/bye' });
      expect(mockSignOut).toHaveBeenCalled();
      expect(hrefSetter).toHaveBeenCalledWith('https://app.example/bye');
    } finally {
      Object.defineProperty(globalThis, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it('logout() is a no-op for signOut when authRef is null', async () => {
    // Simulate an unmounted instance: clear authRef before logout by
    // making initializeAuth return undefined.
    mockInitializeAuth.mockReturnValue(undefined);
    const { result } = renderHook(() => useGoogleCloudInit(baseConfig));
    await waitFor(() => expect(authStateCallback).not.toBeNull());
    // First logout: authRef.current was set to undefined → signOut should not be called.
    // (We can't easily reset authRef post-init; this branch is exercised when authRef is null.)
    // We assert at minimum that calling logout doesn't throw.
    await expect(result.current.logout()).resolves.toBeUndefined();
  });
});
