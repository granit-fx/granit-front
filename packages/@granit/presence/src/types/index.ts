import type { ISODateString, UserId } from '@granit/types';

// ---------------------------------------------------------------------------
// Presence enums — aligned with Granit.Presence .NET backend
// ---------------------------------------------------------------------------

/**
 * Effective presence status computed server-side from heartbeat + manual override.
 * Mirrors `Granit.Presence.PresenceStatus`.
 */
export type PresenceStatus = 'Online' | 'Away' | 'Busy' | 'DoNotDisturb' | 'Offline';

/**
 * Manual override the user may set on their own presence.
 * `Available` means "no override" — the effective status falls back to
 * the activity-derived value.
 *
 * Mirrors `Granit.Presence.ManualPresenceStatus`.
 */
export type ManualPresenceStatus = 'Available' | 'Busy' | 'DoNotDisturb' | 'AppearOffline';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

/**
 * Presence snapshot returned by all read endpoints.
 *
 * A user that the server has never seen returns `effectiveStatus = "Offline"`
 * and `lastSeenUtc = null`. There is no 404 case for `/users/{id}` lookups.
 */
export interface PresenceResponse {
  readonly userId: UserId;
  readonly effectiveStatus: PresenceStatus;
  readonly manualOverride: ManualPresenceStatus | null;
  readonly overrideUntilUtc: ISODateString | null;
  readonly lastSeenUtc: ISODateString | null;
}

/**
 * Request body for `PUT /presence/my`.
 *
 * Server-side rules (validated as well, but front can short-circuit):
 *  - When `manualStatus = "Available"`, `untilUtc` must be `null`.
 *  - When `untilUtc` is set, it must be in the future (>= now + 1s) and
 *    within `MaxOverrideDuration` (default 7 days).
 */
export interface SetPresenceRequest {
  readonly manualStatus: ManualPresenceStatus;
  readonly untilUtc: ISODateString | null;
}

/**
 * Request body for `POST /presence/my/poll` — single client heartbeat.
 *
 * `idleSeconds` is the number of seconds since the last user activity
 * (keydown/mousemove/scroll). The server clamps the value to
 * `2 × OfflineThreshold` (default 180s).
 */
export interface HeartbeatRequest {
  readonly idleSeconds: number;
}

/**
 * Request body for `POST /presence/users/batch`.
 * `userIds` must be non-empty, contain at most `MaxBatchSize` (200) entries,
 * and have no duplicates.
 */
export interface BatchPresenceRequest {
  readonly userIds: readonly UserId[];
}

/**
 * Response body for `POST /presence/users/batch`.
 * `presences` is keyed by `userId`. Unknown users get an Offline snapshot
 * with `lastSeenUtc = null` — they are present in the dictionary.
 */
export interface BatchPresenceResponse {
  readonly presences: Readonly<Record<UserId, PresenceResponse>>;
}
