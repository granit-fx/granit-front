import type { TimelineEntryTypeValue } from './entry-type.js';
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
  readonly entryType: TimelineEntryTypeValue;
  readonly body: string;
  readonly authorId: UserId | null;
  readonly authorName: string | null;
  readonly parentEntryId: TimelineEntryId | null;
  readonly occurredAt: ISODateString;
  readonly attachments: readonly TimelineAttachmentInfo[];
}

export type TimelineEntryPage = PagedResult<TimelineEntry>;
