// ---------------------------------------------------------------------------
// @granit/workflow — public API
// ---------------------------------------------------------------------------

// Types
export { TransitionOutcome } from './types/index.js';
export { WorkflowLifecycleStatus } from './types/index.js';

export type {
  WorkflowTransition,
  TransitionHistory,
  TransitionOutcomeValue,
  WorkflowTransitionRequest,
  WorkflowTransitionResult,
  WorkflowConfig,
  WorkflowLifecycleStatusValue,
  WorkflowStatus,
} from './types/index.js';

// API
export {
  executeStateMachineTransition,
  getHistory,
  listTransitions,
} from './api/workflow-api.js';
export type { WorkflowHistoryPage } from './api/workflow-api.js';
