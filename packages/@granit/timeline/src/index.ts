// Types
export {
  TimelineEntryType,
  type BlobId,
  type TimelineAttachmentId,
  type TimelineAttachmentInfo,
  type TimelineEntry,
  type TimelineEntryId,
  type TimelineEntryPage,
  type TimelineEntryTypeValue,
  type CreateTimelineEntryRequest,
  type TimelineQueryParams,
  type TimelineConfig,
  type MentionSuggestion,
} from './types/index.js';

// API
export {
  createEntry,
  deleteEntry,
  fetchFollowers,
  fetchStream,
  followEntity,
  unfollowEntity,
} from './api/timeline-api.js';
