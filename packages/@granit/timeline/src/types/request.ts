import type { TimelineEntryTypeValue } from './entry-type.js';
import type { PaginationParams } from '@granit/query-engine';

// --- API request types ---

export interface CreateTimelineEntryRequest {
  readonly entryType: TimelineEntryTypeValue;
  readonly body: string;
  readonly parentEntryId?: string;
  readonly attachmentBlobIds?: readonly string[];
}

// --- Pagination ---

export type TimelineQueryParams = PaginationParams;
