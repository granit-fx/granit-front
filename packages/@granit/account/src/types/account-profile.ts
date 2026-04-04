import type { UserId } from '@granit/types';

// ---------------------------------------------------------------------------
// Account profile types — mirrors Granit.OpenIddict.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** Response from `GET /profile`. */
export interface AccountProfileResponse {
  readonly userId: UserId;
  readonly email: string;
  readonly emailConfirmed: boolean;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly twoFactorEnabled: boolean;
  readonly hasPassword: boolean;
  readonly externalLogins: readonly string[];
}

/** Request body for `PUT /profile`. */
export interface AccountProfileUpdateRequest {
  readonly firstName?: string;
  readonly lastName?: string;
}
