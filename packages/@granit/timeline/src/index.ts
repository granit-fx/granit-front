// Types
export {
  REACTION_EMOJIS,
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
  type Reaction,
  type ReactionEmoji,
} from './types/index.js';

// Permissions
export { TimelinePermissions } from './permissions.js';

// API
export {
  createEntry,
  deleteEntry,
  getFollowers,
  getStream,
  followEntity,
  unfollowEntity,
} from './api/timeline-api.js';
export { toggleReaction } from './api/reaction-api.js';
