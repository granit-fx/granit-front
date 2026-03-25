import type { TimelineEntryTypeValue } from './entry-type.js';
import type { PagedResult } from '@granit/query-engine';

// --- API response types ---

export interface TimelineAttachmentInfo {
  readonly id: string;
  readonly blobId: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly sizeBytes: number;
}

export interface TimelineEntry {
  readonly id: string;
  readonly entryType: TimelineEntryTypeValue;
  readonly body: string;
  readonly authorId: string | null;
  readonly authorName: string | null;
  readonly parentEntryId: string | null;
  readonly occurredAt: string;
  readonly attachments: readonly TimelineAttachmentInfo[];
}

export type TimelineEntryPage = PagedResult<TimelineEntry>;
