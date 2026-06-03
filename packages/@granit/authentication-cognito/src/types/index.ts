import type { BaseAuthContextType } from '@granit/authentication';
import type { CognitoUserPool } from 'amazon-cognito-identity-js';

// ---------------------------------------------------------------------------
// Cognito auth context (extends generic base with Cognito user pool)
// ---------------------------------------------------------------------------

/** Cognito-specific auth context — extends the generic base with the Cognito user pool. */
export interface CognitoAuthContextType extends BaseAuthContextType {
  /** Live Cognito UserPool instance — null before init completes. */
  userPool: CognitoUserPool | null;
}

// ---------------------------------------------------------------------------
// Hook configuration
// ---------------------------------------------------------------------------

export interface CognitoCoreConfig {
  /** Cognito User Pool ID (e.g. `eu-west-1_XXXXXXXXX`). */
  userPoolId: string;
  /** Cognito App Client ID. */
  clientId: string;
  /** AWS region (e.g. `eu-west-1`). */
  region: string;
  /** OAuth domain for hosted UI (e.g. `myapp.auth.eu-west-1.amazoncognito.com`). */
  domain?: string;
  /** OAuth scopes to request. */
  scopes?: readonly string[];

  /**
   * Where the Cognito SDK stores its tokens (id, access, **and the long-lived
   * refresh token**). Defaults to `'memory'` so tokens are never readable by
   * same-origin JavaScript (XSS, malicious browser extensions). Override only
   * when cross-tab / cross-reload persistence is required AND the app ships an
   * XSS-hardened CSP. Persisting tokens in `localStorage`/`sessionStorage` is a
   * known high-severity risk (CWE-922) — prefer the BFF cookie pattern
   * (`@granit/bff`) for durable sessions. See security audit VULN-102.
   */
  tokenStorage?: 'memory' | 'sessionStorage' | 'localStorage';

  /** Called when a token refresh fails. */
  onTokenRefreshError?: () => void;
  /** Called when the session expires. */
  onSessionExpired?: () => void;
}
