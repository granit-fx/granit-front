import type { IPublicClientApplication } from '@azure/msal-browser';
import type { BaseAuthContextType } from '@granit/authentication';

// ---------------------------------------------------------------------------
// Entra ID auth context (extends generic base with MSAL instance)
// ---------------------------------------------------------------------------

/** Entra ID-specific auth context — extends the generic base with the MSAL instance. */
export interface EntraIdAuthContextType extends BaseAuthContextType {
  /** Live MSAL PublicClientApplication instance — null before init completes. */
  msalInstance: IPublicClientApplication | null;
}

// ---------------------------------------------------------------------------
// Hook configuration
// ---------------------------------------------------------------------------

export interface EntraIdCoreConfig {
  /** Application (client) ID from Azure AD app registration. */
  clientId: string;
  /** Authority URL (e.g. `https://login.microsoftonline.com/{tenantId}`). */
  authority: string;
  /** Redirect URI registered in the Azure portal. */
  redirectUri: string;
  /** OAuth scopes to request (e.g. `["openid", "profile", "email"]`). */
  scopes?: readonly string[];

  /** Called when a silent token acquisition fails. */
  onAcquireTokenFailure?: () => void;
  /** Called when the user's session is terminated. */
  onSessionEnd?: () => void;

  /**
   * MSAL token cache location. Defaults to `'memory'` so OIDC tokens are not
   * readable by same-origin JavaScript (XSS, malicious browser extensions).
   * Override only when cross-tab persistence is required AND the app ships an
   * XSS-hardened CSP. Storing tokens in `localStorage`/`sessionStorage` is a
   * known high-severity risk (CWE-922) — prefer the BFF cookie pattern
   * (`@granit/bff`) for persistent sessions.
   */
  cacheLocation?: 'memory' | 'sessionStorage' | 'localStorage';
}
