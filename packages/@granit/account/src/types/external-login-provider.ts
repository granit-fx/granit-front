// ---------------------------------------------------------------------------
// External login provider types — mirrors Granit.Identity.Local.Endpoints .NET contract
// ---------------------------------------------------------------------------

/**
 * Provider kind for an external login button — selects the brand icon.
 *
 * Open union: a generic `Oidc` scheme can be registered under a free-form type,
 * so unknown values are tolerated while the known set stays autocompletable.
 */
export type ExternalProviderType =
  | 'Google'
  | 'Microsoft'
  | 'Apple'
  | 'GitHub'
  | 'Facebook'
  | 'Oidc'
  | (string & {});

/**
 * An external login provider available on the anonymous sign-in screen, as
 * advertised by `GET /config`. The list only contains providers that are
 * actually usable (scheme registered AND backed by an auth handler).
 */
export interface ExternalLoginProvider {
  /** Authentication scheme name — passed to `POST /external-logins/challenge/{name}`. */
  readonly name: string;
  /** Provider kind — selects the brand icon (`Google`, `Oidc`, …). */
  readonly type: ExternalProviderType;
  /** Human-friendly label for the "Continue with …" button. */
  readonly displayName: string;
}
