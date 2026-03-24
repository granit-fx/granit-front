import type { TimelineEntryTypeValue } from './entry-type.js';
import type { PagedResult } from '@granit/query-engine';

// --- API response types ---

export interface TimelineEntry {
  readonly id: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly entryType: TimelineEntryTypeValue;
  readonly body: string;
  readonly authorId: string;
  readonly authorDisplayName: string;
  readonly parentEntryId: string | null;
  readonly createdAt: string;
  readonly attachmentBlobIds: readonly string[];
}

export type TimelineEntryPage = PagedResult<TimelineEntry>;
