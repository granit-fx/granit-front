// ---------------------------------------------------------------------------
// @granit/react-workflow — public API
// ---------------------------------------------------------------------------

// Provider
export {
  buildWorkflowQueryKey,
  useWorkflowConfig,
  WorkflowProvider,
} from './providers/workflow-provider.js';
export type {
  ResolvedWorkflowConfig,
  WorkflowConfig,
  WorkflowProviderProps,
} from './providers/workflow-provider.js';

// Hooks
export { useExecuteTransition } from './hooks/use-execute-transition.js';
export type {
  UseExecuteTransitionOptions,
  UseExecuteTransitionReturn,
} from './hooks/use-execute-transition.js';

export { useTransitions } from './hooks/use-transitions.js';
export type { UseTransitionsOptions, UseTransitionsReturn } from './hooks/use-transitions.js';

export { useWorkflowHistory } from './hooks/use-workflow-history.js';
export type {
  UseWorkflowHistoryOptions,
  UseWorkflowHistoryReturn,
} from './hooks/use-workflow-history.js';
