import type { TimelineEntryType } from './entry-type';
import type { PaginationParams } from '@granit/query-engine';

// --- API request types ---

export interface PostTimelineEntryRequest {
  readonly entryType: TimelineEntryType;
  readonly body: string;
  readonly parentEntryId?: string;
  readonly attachmentBlobIds?: readonly string[];
}

// --- Pagination ---

export type TimelineQueryParams = PaginationParams;
