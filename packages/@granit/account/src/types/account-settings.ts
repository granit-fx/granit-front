// ---------------------------------------------------------------------------
// Account settings types — mirrors Granit.OpenIddict.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** Response from `GET /config`. */
export interface AccountSettingsResponse {
  readonly allowSelfRegistration: boolean;
}
