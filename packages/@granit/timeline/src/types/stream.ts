import type { TimelineEntryType } from './entry-type';
import type { ReactionMap } from './reaction';
import type { TimelineEntryOriginValue } from './source';
import type { PagedResult } from '@granit/query-engine';
import type { EntityId, ISODateString, UserId } from '@granit/types';

// --- Branded identifiers ---

/** Branded timeline attachment identifier. */
export type TimelineAttachmentId = EntityId<'TimelineAttachment'>;

/** Branded blob identifier. */
export type BlobId = EntityId<'Blob'>;

/** Branded timeline entry identifier. */
export type TimelineEntryId = EntityId<'TimelineEntry'>;

// --- API response types ---

export interface TimelineAttachmentInfo {
  readonly id: TimelineAttachmentId;
  readonly blobId: BlobId;
  readonly fileName: string;
  readonly contentType: string;
  readonly sizeBytes: number;
}

export interface TimelineEntry {
  readonly id: TimelineEntryId;
  readonly entryType: TimelineEntryType;
  readonly body: string;
  readonly authorId: UserId | null;
  readonly authorName: string | null;
  readonly parentEntryId: TimelineEntryId | null;
  readonly occurredAt: ISODateString;
  readonly attachments: readonly TimelineAttachmentInfo[];
  /**
   * Aggregated reactions on this entry — dict keyed by the emoji
   * short name, carrying only emojis with at least one reactor.
   * Omitted (`undefined`) when the entry has zero reactions to keep
   * the wire payload tight (mirrors the backend `Reactions` field on
   * `TimelineStreamEntryResponse`, granit-fx/granit-dotnet#1811).
   */
  readonly reactions?: ReactionMap;
  /**
   * Where this entry originates. `'Native'` for rows stored directly
   * in the timeline; `'External'` for entries projected from a
   * registered `ITimelineSource` (e.g. audit). The native default
   * matches backend behaviour for legacy streams without contributors.
   */
  readonly origin?: TimelineEntryOriginValue;
  /**
   * Contributor key when {@link origin} is `'External'`
   * (e.g. `'auditing'`). Always `'native'` for native rows. Together
   * with {@link sourceId} it forms the stable identifier the anchor
   * endpoint uses to materialise a shadow row.
   */
  readonly sourceKey?: string;
  /** External primary key in the contributor's store, `null` for native rows. */
  readonly sourceId?: string | null;
  /**
   * Timestamp of the last body edit, or `null` if the entry has never
   * been edited. Always `null` for external-origin entries — they
   * reflect upstream changes through a fresh projection, not this
   * field.
   */
  readonly editedAt?: ISODateString | null;
}

export type TimelineEntryPage = PagedResult<TimelineEntry>;

/**
 * Stream fetch result — paged entries plus the list of registered
 * contributors that were dropped from this response (timeout or thrown)
 * under the `DegradeGracefully` policy. Mirror of the backend
 * `TimelineStreamResult`, lifted from the `X-Timeline-Degraded-Sources`
 * response header on the wire.
 */
export interface TimelineStreamPage {
  readonly page: TimelineEntryPage;
  /** Source keys that failed for this call. Empty when every contributor answered in time. */
  readonly degradedSources: readonly string[];
}
