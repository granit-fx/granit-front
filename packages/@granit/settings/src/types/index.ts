/** Response for `GET /settings/user/{name}` (and global, tenant). */
export interface SettingValueResponse {
  readonly name: string;
  readonly value: string | null;
}

/** Request body for `PUT /settings/{scope}/{name}`. */
export interface UpdateSettingValueRequest {
  /** Pass `null` to clear the override; omit entirely to leave unchanged. */
  readonly value?: string | null;
}

/** Response for `GET /settings/{scope}` — flat key/value map. Absent keys are unset. */
export type SettingsMap = Record<string, string>;

/** Setting scope for API routing. */
export type SettingScope = 'user' | 'global' | 'tenant';

// ── Admin types ─────────────────────────────────────────────────────────────

/**
 * Value shape of a setting as declared at definition time.
 *
 * Mirrors the .NET `ValueKind` enum. Used by admin UIs to pick the right input
 * control. Encryption is orthogonal — see `AdminAppSettingResponse.isEncrypted`.
 */
export type ValueKind = 'String' | 'Bool' | 'Int' | 'Double' | 'Json';

/**
 * Admin-scoped application setting.
 *
 * Mirrors `AdminAppSettingResponse` from `/settings/{scope}/definitions`.
 * Encrypted values are returned as `"***"` by the backend; the admin UI must
 * surface a reset-then-rewrite flow rather than an editable value.
 */
export interface AdminAppSettingResponse {
  readonly key: string;
  readonly label: string | null;
  readonly description: string | null;
  readonly defaultValue: string | null;
  readonly value: string | null;
  readonly valueKind: ValueKind;
  /**
   * Optional allow-list. When non-null and non-empty, the UI should render a
   * dropdown whose options are these values (labels are localized client-side
   * via the `Setting:{key}:Option:{value}` i18n convention).
   */
  readonly allowedValues: readonly string[] | null;
  readonly isEncrypted: boolean;
}

/** Single entry in a bulk update request. `value: null` clears the override. */
export interface BulkSettingEntry {
  readonly key: string;
  readonly value: string | null;
}

/** Per-entry outcome of a bulk update. */
export type BulkSettingOutcome = 'Updated' | 'NotFound' | 'ProviderNotAllowed' | 'ValidationFailed';

/**
 * Per-entry result returned by `PUT /settings/{scope}/bulk`.
 *
 * `errorCode` is a machine-readable i18n key (e.g. `"Granit:Settings:NotFound"`)
 * resolvable via the host's localization endpoint (`GET /localization` by default,
 * mounted under whatever prefix the host configures). `null` iff `outcome === "Updated"`.
 */
export interface BulkSettingResult {
  readonly key: string;
  readonly outcome: BulkSettingOutcome;
  readonly errorCode: string | null;
}

/** Request body for `PUT /settings/{scope}/bulk`. */
export interface BulkUpdateSettingsRequest {
  readonly settings: readonly BulkSettingEntry[];
}

/** Scopes that expose admin bulk endpoints. `user` is per-user and has no bulk form. */
export type AdminSettingsScope = 'global' | 'tenant';

/**
 * Response body for `PUT /settings/{scope}/bulk`.
 *
 * Always returned with HTTP 200 when the body parses — the status does not
 * reflect per-entry outcomes. Callers must inspect `results` and filter
 * `outcome !== "Updated"` to surface failures.
 */
export interface BulkUpdateSettingsResponse {
  readonly results: readonly BulkSettingResult[];
}
