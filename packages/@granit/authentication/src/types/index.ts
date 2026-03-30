// ---------------------------------------------------------------------------
// Standard OIDC user claims (provider-agnostic)
// ---------------------------------------------------------------------------

/** Standard OIDC user info claims — compatible with any OIDC provider. */
export interface OidcUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

// ---------------------------------------------------------------------------
// Login / Logout option types (OIDC standard)
// ---------------------------------------------------------------------------

/** Generic login options forwarded to the identity provider. */
export interface LoginOptions {
  redirectUri?: string;
  /** Bypass the login page and redirect to a specific identity provider. */
  idpHint?: string;
  /** Pre-fill the username/email field on the login page. */
  loginHint?: string;
  /** Force the IdP UI locale (e.g. `"fr"`). */
  locale?: string;
  /** Trigger a specific action: `"register"` for signup, or a required action name. */
  action?: string;
  prompt?: 'login' | 'consent' | 'none';
  /** Request additional OAuth scopes (space-delimited). */
  scope?: string;
  /** Maximum time since last authentication (seconds). */
  maxAge?: number;
}

/** Generic logout options forwarded to the identity provider. */
export interface LogoutOptions {
  /** URL to redirect to after logout completes. */
  redirectUri?: string;
}

// ---------------------------------------------------------------------------
// Base auth context (provider-agnostic, extended by each provider package)
// ---------------------------------------------------------------------------

/**
 * Base auth context shared by all consuming applications.
 *
 * Provider-specific packages extend this interface:
 * - `@granit/authentication-keycloak` adds `keycloak: Keycloak | null`
 * - Consuming apps extend further with app-specific fields
 */
export interface BaseAuthContextType {
  authenticated: boolean;
  loading: boolean;
  user: OidcUserInfo | null;
  login: (options?: LoginOptions) => void;
  logout: (options?: LogoutOptions) => void;
}
