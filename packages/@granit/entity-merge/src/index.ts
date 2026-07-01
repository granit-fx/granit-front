// Types
export type {
  WinnerSide,
  FieldConflict,
  MergeFieldChoices,
  MergeRequest,
  MergeResult,
  MergeErrorKind,
  ClassifiedMergeError,
} from './types/index';

// API
export { previewMerge, executeMerge } from './api/entity-merge-api';

// Helpers
export {
  generateMergeIdempotencyKey,
  seedFieldChoices,
  resolveWinner,
  classifyMergeError,
} from './helpers';
