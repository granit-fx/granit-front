// ---------------------------------------------------------------------------
// Account password types — mirrors Granit.Identity.Local.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** Request body for `POST /change-password`. */
export interface AccountPasswordChangeRequest {
  readonly currentPassword: string;
  readonly newPassword: string;
}

/** Request body for `POST /forgot-password`. */
export interface AccountForgotPasswordRequest {
  readonly email: string;
}

/** Request body for `POST /reset-password`. */
export interface AccountPasswordResetRequest {
  readonly userId: string;
  readonly token: string;
  readonly newPassword: string;
}
