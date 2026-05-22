/**
 * Server defaults for the presence module (mirrors `PresenceOptions` defaults
 * in `Granit.Presence`). Kept here so React hooks can coordinate poll cadence
 * with the server-side offline threshold without re-querying configuration.
 */
export const PRESENCE_DEFAULTS = {
  /** Seconds without heartbeat after which a user is considered Offline. */
  OfflineThresholdSeconds: 90,
  /** Seconds without user activity after which Online flips to Away. */
  AwayThresholdSeconds: 180,
  /** Maximum value the server accepts for `idleSeconds` (= 2 × OfflineThreshold). */
  MaxIdleSeconds: 180,
  /** Maximum batch size for `/presence/users/batch`. */
  MaxBatchSize: 200,
  /** Maximum duration (seconds) of a manual override `untilUtc`. */
  MaxOverrideDurationSeconds: 7 * 24 * 60 * 60,
} as const;
