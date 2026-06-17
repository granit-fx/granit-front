import { setTokenGetter, setOnUnauthorized } from '@granit/api-client';
import { createLogger } from '@granit/logger';
import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  inMemoryPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  onAuthStateChanged,
  signInWithRedirect,
  signOut,
  GoogleAuthProvider,
} from 'firebase/auth';
import * as React from 'react';

import type { LoginOptions, LogoutOptions, OidcUserInfo } from '@granit/authentication';
import type {
  GoogleCloudAuthContextType,
  GoogleCloudCoreConfig,
} from '@granit/authentication-google-cloud';
import type { Auth, Persistence, User } from 'firebase/auth';

const logger = createLogger('react-authentication-google-cloud');

/** Resolve the Firebase persistence from the configured posture (default: memory). */
function resolvePersistence(tokenStorage: GoogleCloudCoreConfig['tokenStorage']): Persistence {
  if (tokenStorage === 'localStorage') return indexedDBLocalPersistence;
  if (tokenStorage === 'sessionStorage') return browserSessionPersistence;
  return inMemoryPersistence;
}

export interface GoogleCloudCoreResult extends GoogleCloudAuthContextType {
  /** Direct ref to the Firebase Auth instance. */
  authRef: React.RefObject<Auth | null>;

  /** Sign in via Google redirect. */
  login: (options?: LoginOptions) => void;
  /** Sign out from Firebase Auth. */
  logout: (options?: LogoutOptions) => void;
}

/** Extract standard OIDC claims from Firebase User. */
function extractUser(firebaseUser: User): OidcUserInfo {
  return {
    sub: firebaseUser.uid,
    email: firebaseUser.email ?? undefined,
    name: firebaseUser.displayName ?? undefined,
    picture: firebaseUser.photoURL ?? undefined,
  };
}

/**
 * Google Cloud Identity Platform (Firebase Auth) initialization hook.
 *
 * Handles: Firebase app init, auth state listener, token acquisition,
 * user info extraction, and wiring the Bearer token to `@granit/api-client`.
 */
export function useGoogleCloudInit(config: GoogleCloudCoreConfig): GoogleCloudCoreResult {
  const [authenticated, setAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<OidcUserInfo | null>(null);

  const authRef = React.useRef<Auth | null>(null);
  const initStartedRef = React.useRef(false);

  React.useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    const app = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
    });

    // `initializeAuth` (not `getAuth`) lets us pin the persistence backend.
    // Default is in-memory so the refresh token never lands in IndexedDB /
    // localStorage. See security audit VULN-201.
    const auth = initializeAuth(app, { persistence: resolvePersistence(config.tokenStorage) });
    authRef.current = auth;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        logger.info('Firebase auth state: signed in');
        setAuthenticated(true);
        setUser(extractUser(firebaseUser));

        setTokenGetter(async (): Promise<string | undefined> => {
          try {
            return await firebaseUser.getIdToken();
          } catch {
            logger.warn('Firebase ID token refresh failed; request will proceed unauthenticated');
            config.onTokenRefreshError?.();
            return undefined;
          }
        });

        setOnUnauthorized(() => {
          signOut(auth);
        });
      } else {
        logger.info('Firebase auth state: signed out');
        setAuthenticated(false);
        setUser(null);
        config.onSessionExpired?.();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [
    config.apiKey,
    config.authDomain,
    config.projectId,
    config.tokenStorage,
    config.onTokenRefreshError,
    config.onSessionExpired,
  ]);

  const login = React.useCallback(
    async (_options?: LoginOptions) => {
      if (!authRef.current) return;
      const provider = new GoogleAuthProvider();
      if (config.scopes) {
        for (const scope of config.scopes) {
          provider.addScope(scope);
        }
      }
      await signInWithRedirect(authRef.current, provider);
    },
    [config.scopes]
  );

  const logout = React.useCallback(async (options?: LogoutOptions) => {
    if (authRef.current) {
      await signOut(authRef.current);
    }
    setAuthenticated(false);
    setUser(null);
    if (options?.redirectUri) {
      globalThis.location.href = options.redirectUri;
    }
  }, []);

  return {
    authRef,
    firebaseAuth: authRef.current,
    authenticated,
    loading,
    user,
    login,
    logout,
  };
}
