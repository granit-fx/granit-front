// ---------------------------------------------------------------------------
// Password management — mirrors Granit.Identity.Local.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** Request body for `POST {basePath}/forgot-password` (anonymous). */
export interface AccountForgotPasswordRequest {
  readonly email: string;
}

/** Request body for `POST {basePath}/reset-password` (anonymous). */
export interface AccountPasswordResetRequest {
  readonly userId: string;
  readonly token: string;
  readonly newPassword: string;
}

/** Request body for `POST {basePath}/change-password` (authenticated). */
export interface AccountPasswordChangeRequest {
  readonly currentPassword: string;
  readonly newPassword: string;
}
