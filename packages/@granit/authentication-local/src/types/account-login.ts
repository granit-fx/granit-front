// ---------------------------------------------------------------------------
// Account login types — mirrors Granit.Identity.Local.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** Request body for `POST {basePath}/login`. */
export interface AccountLoginRequest {
  readonly login: string;
  readonly password: string;
}

/**
 * Response from `POST {basePath}/login`.
 *
 * On success the server sets an ASP.NET Core Identity session cookie.
 * The caller should then redirect to the OIDC authorization endpoint
 * (`/connect/authorize`) to complete the token exchange.
 */
export interface AccountLoginResponse {
  readonly succeeded: boolean;
  readonly requiresTwoFactor: boolean;
  readonly isLockedOut: boolean;
  readonly isNotAllowed: boolean;
}

// ---------------------------------------------------------------------------
// Two-factor login verification
// ---------------------------------------------------------------------------

/**
 * Request body for `POST {basePath}/login/two-factor`.
 *
 * Submitted after a login attempt returns `requiresTwoFactor: true`.
 * The server identifies the user via the `Identity.TwoFactorUserId` cookie
 * set during the initial login.
 */
export interface AccountTwoFactorLoginRequest {
  readonly code: string;
  readonly useRecoveryCode?: boolean;
}

// ---------------------------------------------------------------------------
// Passkey assertion completion
// ---------------------------------------------------------------------------

/**
 * Request body for `POST {basePath}/passkeys/assertion/complete`.
 *
 * Submitted after `navigator.credentials.get()` completes the WebAuthn
 * assertion ceremony initiated by `POST {basePath}/passkeys/assertion/begin`.
 */
export interface AccountPasskeyAssertionCompleteRequest {
  readonly credentialJson: string;
}
