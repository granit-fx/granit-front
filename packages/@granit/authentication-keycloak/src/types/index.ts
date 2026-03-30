import type { BaseAuthContextType, OidcUserInfo } from '@granit/authentication';
import type Keycloak from 'keycloak-js';

// ---------------------------------------------------------------------------
// Keycloak-specific user info (re-export of standard OIDC claims)
// ---------------------------------------------------------------------------

/** Keycloak user info — identical to `OidcUserInfo` (OIDC standard claims). */
export type KeycloakUserInfo = OidcUserInfo;

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
// Auth context (extends generic base with Keycloak instance)
// ---------------------------------------------------------------------------

/** Keycloak-specific auth context — extends the generic base with the Keycloak instance. */
export interface KeycloakAuthContextType extends BaseAuthContextType {
  /** Live Keycloak instance — null before init completes. */
  keycloak: Keycloak | null;
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

  /** Called when the access token expires. */
  onTokenExpired?: () => void;
  /** Called when a token refresh attempt fails. */
  onAuthRefreshError?: () => void;
  /** Called when the Keycloak session is terminated (admin logout, SSO logout). */
  onAuthLogout?: () => void;
  /** Generic handler called for every Keycloak lifecycle event. */
  onEvent?: (event: KeycloakEvent, error?: unknown) => void;
}
