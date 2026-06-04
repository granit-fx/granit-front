// ---------------------------------------------------------------------------
// Account deletion — mirrors Granit.Identity.Local.Endpoints .NET contract
// ---------------------------------------------------------------------------

/**
 * Request body for `POST {basePath}/delete` (authenticated, step-up: password).
 *
 * On success the server returns 202 Accepted and schedules the account for
 * deletion (GDPR erasure flow).
 */
export interface AccountDeleteRequest {
  readonly password: string;
}
