// ---------------------------------------------------------------------------
// Account registration — mirrors Granit.Identity.Local.Endpoints .NET contract
// ---------------------------------------------------------------------------

/**
 * Request body for `POST {basePath}/register`.
 *
 * On success the server returns 202 Accepted and (when email confirmation is
 * required) sends a confirmation link. Self-registration must be enabled —
 * see {@link IdentityLocalConfigResponse}.
 */
export interface AccountRegisterRequest {
  readonly email: string;
  readonly password: string;
  /** Required key, may be `null` (max 256 when set). */
  readonly firstName: string | null;
  /** Required key, may be `null` (max 256 when set). */
  readonly lastName: string | null;
}
