// ---------------------------------------------------------------------------
// Account settings types — mirrors Granit.Identity.Local.Endpoints .NET contract
// ---------------------------------------------------------------------------

import type { ExternalLoginProvider } from './external-login-provider';

/** Response from `GET /config` (anonymous) — `IdentityLocalConfigResponse`. */
export interface AccountSettingsResponse {
  readonly allowSelfRegistration: boolean;
  /**
   * External login providers available for anonymous sign-in. Empty when none
   * are configured or no auth-server is present.
   */
  readonly externalProviders: readonly ExternalLoginProvider[];
}
