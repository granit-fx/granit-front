// ---------------------------------------------------------------------------
// @granit/workflow — public API
// ---------------------------------------------------------------------------

// Types
export { TransitionOutcome } from './types/index';
export { WorkflowLifecycleStatus } from './types/index';

export type {
  WorkflowTransitionResponse,
  WorkflowTransitionHistoryResponse,
  TransitionOutcomeValue,
  WorkflowTransitionRequest,
  WorkflowTransitionResultResponse,
  WorkflowHistoryPage,
  WorkflowLifecycleStatusValue,
  WorkflowStatusResponse,
} from './types/index';

// API
export { executeStateMachineTransition, getHistory, listTransitions } from './api/workflow-api';
export { WorkflowPermissions } from './permissions';
