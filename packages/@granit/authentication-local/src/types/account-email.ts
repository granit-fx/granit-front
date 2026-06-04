// ---------------------------------------------------------------------------
// Email change — mirrors Granit.Identity.Local.Endpoints .NET contract
// ---------------------------------------------------------------------------

/**
 * Request body for `POST {basePath}/change-email` (authenticated, step-up).
 *
 * Requires the current password as step-up authentication. On success the
 * server returns 202 and sends a confirmation link to the new address.
 */
export interface AccountChangeEmailRequest {
  readonly newEmail: string;
  readonly currentPassword: string;
}

/** Request body for `POST {basePath}/confirm-email-change` (anonymous). */
export interface AccountConfirmEmailChangeRequest {
  readonly userId: string;
  readonly newEmail: string;
  readonly token: string;
}
