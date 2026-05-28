// Types
export type {
  WinnerSide,
  FieldConflict,
  MergeFieldChoices,
  MergeRequest,
  MergeResult,
} from './types/index.js';

// API
export { previewMerge, executeMerge } from './api/entity-merge-api.js';

// Helpers
export {
  generateMergeIdempotencyKey,
  seedFieldChoices,
  resolveWinner,
  classifyMergeError,
} from './helpers.js';
export type { MergeErrorKind, ClassifiedMergeError } from './helpers.js';
