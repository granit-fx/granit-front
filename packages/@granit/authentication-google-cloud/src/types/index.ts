import type { BaseAuthContextType } from '@granit/authentication';
import type { Auth } from 'firebase/auth';

// ---------------------------------------------------------------------------
// Google Cloud auth context (extends generic base with Firebase Auth instance)
// ---------------------------------------------------------------------------

/** Google Cloud-specific auth context — extends the generic base with the Firebase Auth instance. */
export interface GoogleCloudAuthContextType extends BaseAuthContextType {
  /** Live Firebase Auth instance — null before init completes. */
  firebaseAuth: Auth | null;
}

// ---------------------------------------------------------------------------
// Hook configuration
// ---------------------------------------------------------------------------

export interface GoogleCloudCoreConfig {
  /** Firebase API key. */
  apiKey: string;
  /** Firebase auth domain (e.g. `myproject.firebaseapp.com`). */
  authDomain: string;
  /** Firebase project ID. */
  projectId: string;

  /** OAuth scopes to request on sign-in. */
  scopes?: readonly string[];

  /**
   * Where Firebase Auth persists its tokens (including the refresh token).
   * Defaults to `'memory'` (`inMemoryPersistence`) so credentials are not left
   * in browser-accessible storage (IndexedDB / `localStorage`) where a
   * same-origin script (XSS, extension) could lift them. Override only when
   * cross-tab / cross-reload persistence is required AND the app ships an
   * XSS-hardened CSP. `'localStorage'` maps to Firebase IndexedDB persistence.
   * Prefer the BFF cookie pattern (`@granit/bff`) for durable sessions. See
   * security audit VULN-201.
   */
  tokenStorage?: 'memory' | 'sessionStorage' | 'localStorage';

  /** Called when a token refresh fails. */
  onTokenRefreshError?: () => void;
  /** Called when the session expires. */
  onSessionExpired?: () => void;
}
