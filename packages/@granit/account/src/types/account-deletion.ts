// ---------------------------------------------------------------------------
// Account deletion types — mirrors Granit.Identity.Local.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** Request body for `POST /delete`. */
export interface AccountDeleteRequest {
  readonly password: string;
}
