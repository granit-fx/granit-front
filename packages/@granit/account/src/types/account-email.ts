// ---------------------------------------------------------------------------
// Account email types — mirrors Granit.Identity.Local.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** Request body for `POST /change-email`. */
export interface AccountChangeEmailRequest {
  readonly newEmail: string;
}

/** Request body for `POST /confirm-email-change`. */
export interface AccountConfirmEmailChangeRequest {
  readonly userId: string;
  readonly newEmail: string;
  readonly token: string;
}
