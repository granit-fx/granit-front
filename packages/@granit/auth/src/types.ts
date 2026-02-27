import type { KeycloakUserInfo } from '@granit/types';
import type Keycloak from 'keycloak-js';

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

/** Keycloak lifecycle event names forwarded by useKeycloakInit. */
export type KeycloakEvent =
  | 'onReady'
  | 'onAuthSuccess'
  | 'onAuthError'
  | 'onAuthRefreshSuccess'
  | 'onAuthRefreshError'
  | 'onAuthLogout'
  | 'onTokenExpired';

// ---------------------------------------------------------------------------
// Login / Logout option types (mirrors keycloak-js but decoupled)
// ---------------------------------------------------------------------------

/** Options forwarded to `keycloak.login()`. All fields are optional. */
export interface LoginOptions {
  redirectUri?: string;
  /** Bypass the Keycloak login page and redirect to a specific identity provider. */
  idpHint?: string;
  /** Pre-fill the username/email field on the login page. */
  loginHint?: string;
  /** Force the Keycloak UI locale (e.g. `"fr"`). */
  locale?: string;
  /** Trigger a specific action: `"register"` for signup, or a required action name. */
  action?: string;
  prompt?: 'login' | 'consent' | 'none';
  /** Request additional OAuth scopes (space-delimited). */
  scope?: string;
  /** Maximum time since last authentication (seconds). */
  maxAge?: number;
}

/** Options forwarded to `keycloak.logout()`. */
export interface LogoutOptions {
  /** URL to redirect to after logout completes. */
  redirectUri?: string;
}

// ---------------------------------------------------------------------------
// Base auth context (shared by all consuming apps — kept minimal)
// ---------------------------------------------------------------------------

/**
 * Base auth context shared by all consuming applications.
 *
 * Apps extend this interface with their own fields:
 * - guava-front: adds `register: () => void`
 * - guava-admin: adds `hasAdminRole: boolean`
 */
export interface BaseAuthContextType {
  /** Live Keycloak instance — null before init completes */
  keycloak: Keycloak | null;
  authenticated: boolean;
  loading: boolean;
  user: KeycloakUserInfo | null;
  login: () => void;
  logout: () => void;
}

// ---------------------------------------------------------------------------
// Hook configuration
// ---------------------------------------------------------------------------

export interface KeycloakCoreConfig {
  url: string;
  realm: string;
  clientId: string;

  /** Whether the silent SSO check is enabled (web-only, skip on native). Default: true */
  silentCheckSso?: boolean;

  /**
   * Fall back to a regular `check-sso` redirect when the silent iframe check
   * fails (e.g. Safari with third-party cookie blocking). Default: true
   */
  silentCheckSsoFallback?: boolean;

  /**
   * When true, extract user info from the decoded JWT (`tokenParsed`) instead
   * of calling the `/userinfo` endpoint. Avoids an extra HTTP round-trip but
   * requires the Keycloak client mappers to include the needed claims in the
   * access token. Default: false (calls `loadUserInfo()`).
   */
  useTokenClaims?: boolean;

  // -- Lifecycle callbacks (all optional) ----------------------------------

  /** Called when the access token expires. */
  onTokenExpired?: () => void;
  /** Called when a token refresh attempt fails. */
  onAuthRefreshError?: () => void;
  /** Called when the Keycloak session is terminated (admin logout, SSO logout). */
  onAuthLogout?: () => void;
  /** Generic handler called for every Keycloak lifecycle event. */
  onEvent?: (event: KeycloakEvent, error?: unknown) => void;
}
