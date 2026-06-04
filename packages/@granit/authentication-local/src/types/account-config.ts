// ---------------------------------------------------------------------------
// Public config — mirrors Granit.Identity.Local.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** Response from `GET {basePath}/config` (anonymous). */
export interface IdentityLocalConfigResponse {
  /** Whether the front should expose a self-registration entry point. */
  readonly allowSelfRegistration: boolean;
}
