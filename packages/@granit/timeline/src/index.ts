// Types
export {
  TimelineEntryType,
  type TimelineEntryTypeValue,
  type TimelineAttachmentInfo,
  type TimelineEntry,
  type TimelineEntryPage,
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
