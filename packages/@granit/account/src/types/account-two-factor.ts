// ---------------------------------------------------------------------------
// Account two-factor types — mirrors Granit.Identity.Local.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** Response from `GET /two-factor`. */
export interface AccountTwoFactorStatusResponse {
  readonly isEnabled: boolean;
  readonly hasAuthenticatorApp: boolean;
  /** Whether the email one-time-code factor is enrolled. */
  readonly hasEmailOtp: boolean;
  readonly recoveryCodesLeft: number;
}

/** Response from `GET /two-factor/authenticator-key`. */
export interface AccountAuthenticatorKeyResponse {
  readonly sharedKey: string;
  readonly qrCodeUri: string;
}

/** Request body for `POST /two-factor/enable`. */
export interface AccountTwoFactorEnableRequest {
  readonly code: string;
}

/**
 * Request body for `POST /two-factor/email/enable`. The `code` is the one
 * previously sent by `POST /two-factor/email/send`.
 */
export interface AccountTwoFactorEmailEnableRequest {
  readonly code: string;
}

/** Response from `POST /two-factor/enable`. */
export interface AccountTwoFactorEnableResponse {
  readonly recoveryCodes: readonly string[];
}

/** Response from `POST /two-factor/recovery-codes`. */
export interface AccountRecoveryCodesResponse {
  readonly recoveryCodes: readonly string[];
}

/**
 * Request body for `POST /two-factor/disable`. The backend requires the
 * current password as step-up authentication (OWASP ASVS V2.8.1).
 */
export interface AccountTwoFactorDisableRequest {
  readonly password: string;
}

/**
 * Request body for `POST /two-factor/recovery-codes`. The backend requires the
 * current password as step-up authentication (OWASP ASVS V2.8.1).
 */
export interface AccountGenerateRecoveryCodesRequest {
  readonly password: string;
}
