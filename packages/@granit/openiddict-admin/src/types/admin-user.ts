// ---------------------------------------------------------------------------
// Admin user types — mirrors Granit.OpenIddict.Endpoints .NET contract
// ---------------------------------------------------------------------------

import type { PagedResult } from '@granit/query-engine';

/** Query parameters for `GET /users`. */
export interface AdminUserListParams {
  readonly search?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

/** User descriptor returned by admin endpoints — mirrors `AdminUserResponse`. */
export interface AdminUser {
  readonly userId: string;
  readonly username: string | null;
  readonly email: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly enabled: boolean;
  readonly extraProperties: Readonly<Record<string, string>>;
}

/** Paginated list of admin users. */
export type AdminUserPage = PagedResult<AdminUser>;

/** Request body for `POST /users`. */
export interface AdminUserCreateRequest {
  readonly email: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly temporaryPassword?: string;
}

/** Response from impersonation endpoints. */
export interface AdminImpersonationResult {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
}
