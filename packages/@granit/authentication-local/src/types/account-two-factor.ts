// ---------------------------------------------------------------------------
// Two-factor management — mirrors Granit.Identity.Local.Endpoints .NET contract
// (login-time 2FA verification lives in account-login.ts)
// ---------------------------------------------------------------------------

/** Response from `GET {basePath}/two-factor`. */
export interface AccountTwoFactorStatusResponse {
  readonly isEnabled: boolean;
  readonly hasAuthenticatorApp: boolean;
  readonly recoveryCodesLeft: number;
}

/**
 * Response from `GET {basePath}/two-factor/authenticator-key`.
 *
 * `qrCodeUri` is an `otpauth://` URI the frontend can render as a QR code for
 * authenticator-app enrolment.
 */
export interface AccountAuthenticatorKeyResponse {
  readonly sharedKey: string;
  readonly qrCodeUri: string;
}

/** Request body for `POST {basePath}/two-factor/enable`. */
export interface AccountTwoFactorEnableRequest {
  readonly code: string;
}

/** Response from `POST {basePath}/two-factor/enable` — single-use recovery codes. */
export interface AccountTwoFactorEnableResponse {
  readonly recoveryCodes: readonly string[];
}

/** Request body for `POST {basePath}/two-factor/disable` (step-up: password). */
export interface AccountTwoFactorDisableRequest {
  readonly password: string;
}

/** Request body for `POST {basePath}/two-factor/recovery-codes` (step-up: password). */
export interface AccountGenerateRecoveryCodesRequest {
  readonly password: string;
}

/** Response from `POST {basePath}/two-factor/recovery-codes`. */
export interface AccountRecoveryCodesResponse {
  readonly recoveryCodes: readonly string[];
}
