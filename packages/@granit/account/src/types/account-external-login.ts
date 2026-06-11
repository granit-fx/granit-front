// ---------------------------------------------------------------------------
// Account external login types — mirrors Granit.Identity.Local.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** External login info returned by `GET /external-logins`. */
export interface AccountExternalLoginInfo {
  readonly loginProvider: string;
  readonly providerKey: string;
  readonly providerDisplayName: string | null;
}

/** Prefill values proposed by the provider for a profile-completion flow. */
export interface AccountExternalLoginPrefill {
  readonly email: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
}

/** Callback result when the session is established server-side and registration is done. */
export interface AccountExternalLoginCompleted {
  readonly status: 'completed';
  readonly userId: string;
  readonly isNewUser: boolean;
  readonly continuationToken: null;
  readonly prefill: null;
}

/** Callback result when the provider authenticated but the local profile must be completed. */
export interface AccountExternalLoginNeedsProfile {
  readonly status: 'needs-profile-completion';
  readonly userId: null;
  readonly isNewUser: false;
  readonly continuationToken: string;
  readonly prefill: AccountExternalLoginPrefill;
}

/**
 * Discriminated response from `GET /external-logins/callback` (headless `?mode=json`).
 *
 * Discriminate on `status`: `'completed'` carries `userId`/`isNewUser`;
 * `'needs-profile-completion'` carries a `continuationToken` and `prefill`.
 */
export type AccountExternalLoginCallbackResponse =
  | AccountExternalLoginCompleted
  | AccountExternalLoginNeedsProfile;

/**
 * Request body for `POST /external-logins/complete-registration`
 * (mirrors the .NET `RegisterExternalRequest`).
 *
 * `token` is the `continuationToken` returned by a `needs-profile-completion` callback.
 */
export interface AccountCompleteExternalRegistrationRequest {
  readonly token: string;
  readonly email: string;
  readonly firstName?: string;
  readonly lastName?: string;
}
