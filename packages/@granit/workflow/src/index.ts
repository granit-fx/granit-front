// ---------------------------------------------------------------------------
// @granit/workflow — public API
// ---------------------------------------------------------------------------

// Types
export { TransitionOutcome } from './types/index';
export { WorkflowLifecycleStatus } from './types/index';

export type {
  WorkflowTransition,
  TransitionHistory,
  TransitionOutcomeValue,
  WorkflowTransitionRequest,
  WorkflowTransitionResult,
  WorkflowConfig,
  WorkflowLifecycleStatusValue,
  WorkflowStatus,
} from './types/index';

// API
export { executeStateMachineTransition, getHistory, listTransitions } from './api/workflow-api';
export type { WorkflowHistoryPage } from './api/workflow-api';
export { WorkflowPermissions } from './permissions';
