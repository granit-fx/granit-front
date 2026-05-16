/**
 * Where a {@link TimelineEntry} originates in the federated stream.
 *
 * The concrete contributor name (`"auditing"`, `"workflow"`, …) lives
 * in `TimelineEntry.sourceKey` as a soft string contract, so new
 * contributors can plug in without bumping this enum. Mirror of
 * `Granit.Timeline.TimelineEntryOrigin` on the backend.
 */
export const TimelineEntryOrigin = {
  /** Entry stored directly in the timeline table (Comment, InternalNote, or native SystemLog). */
  Native: 'Native',
  /** Entry projected from a registered `ITimelineSource`. */
  External: 'External',
} as const;

export type TimelineEntryOriginValue =
  (typeof TimelineEntryOrigin)[keyof typeof TimelineEntryOrigin];

/**
 * Well-known `sourceKey` values for federated timeline sources.
 * Contributors declare their own key — the set is pluggable, not an
 * enum. Mirror of `Granit.Timeline.Abstractions.TimelineSourceKeys`.
 */
export const TimelineSourceKeys = {
  /** Reserved key for entries stored directly in the timeline table. */
  Native: 'native',
} as const;

const SOURCE_KEY_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;

/** Validates a candidate source key against the wire convention `^[a-z][a-z0-9_-]{0,63}$`. */
export function isValidSourceKey(sourceKey: string): boolean {
  return SOURCE_KEY_PATTERN.test(sourceKey);
}

/**
 * Machine-readable rejection reason returned by `PATCH /entries/{id}`
 * in the RFC 7807 `extensions.reason` field when one of the four edit
 * gates rejects the request. Mirror of
 * `Granit.Timeline.Abstractions.TimelineEntryNotEditableReason`.
 */
export const TimelineEntryNotEditableReason = {
  /** Entry projected from an external `ITimelineSource` (anchor shadow or live projection). */
  ExternalOrigin: 'ExternalOrigin',
  /** Entry is a `SystemLog` — immutable by design (ISO 27001). */
  SystemLog: 'SystemLog',
  /** Current user is not the author of the entry. */
  NotAuthor: 'NotAuthor',
  /** The edit window configured in `TimelineOptions.EditWindow` has elapsed. */
  WindowExpired: 'WindowExpired',
} as const;

export type TimelineEntryNotEditableReasonValue =
  (typeof TimelineEntryNotEditableReason)[keyof typeof TimelineEntryNotEditableReason];
