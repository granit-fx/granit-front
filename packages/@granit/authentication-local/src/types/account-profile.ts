// ---------------------------------------------------------------------------
// Account profile — mirrors Granit.Identity.Local.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** Response from `GET {basePath}/profile` and `PUT {basePath}/profile`. */
export interface AccountProfileResponse {
  readonly userId: string;
  readonly email: string;
  readonly emailConfirmed: boolean;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly twoFactorEnabled: boolean;
  readonly hasPassword: boolean;
  readonly externalLogins: readonly string[];
}

/**
 * Request body for `PUT {basePath}/profile` (authenticated).
 *
 * Both keys are required (full replacement); pass `null` to clear a name.
 */
export interface AccountProfileUpdateRequest {
  readonly firstName: string | null;
  readonly lastName: string | null;
}
