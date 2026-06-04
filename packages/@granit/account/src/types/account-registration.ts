// ---------------------------------------------------------------------------
// Account registration types — mirrors Granit.Identity.Local.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** Request body for `POST /register`. */
export interface AccountRegisterRequest {
  readonly email: string;
  readonly password: string;
  readonly firstName?: string;
  readonly lastName?: string;
}

// `POST /register` responds `202 Accepted` with no body (registration is
// processed asynchronously, and email-confirmation requirement is exposed via
// `GET /config` → AccountSettingsResponse). There is no register response DTO.
