// ---------------------------------------------------------------------------
// Account settings types — mirrors Granit.Identity.Local.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** Response from `GET /config`. */
export interface AccountSettingsResponse {
  readonly allowSelfRegistration: boolean;
}
