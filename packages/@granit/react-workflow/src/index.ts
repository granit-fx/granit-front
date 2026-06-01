// ---------------------------------------------------------------------------
// @granit/react-workflow — public API
// ---------------------------------------------------------------------------

// Provider
export {
  buildWorkflowQueryKey,
  useWorkflowConfig,
  WorkflowProvider,
} from './providers/workflow-provider';
export type {
  ResolvedWorkflowConfig,
  WorkflowConfig,
  WorkflowProviderProps,
} from './providers/workflow-provider';

// Hooks
export { useExecuteTransition } from './hooks/use-execute-transition';
export type {
  UseExecuteTransitionOptions,
  UseExecuteTransitionReturn,
} from './hooks/use-execute-transition';

export { useTransitions } from './hooks/use-transitions';
export type { UseTransitionsOptions, UseTransitionsReturn } from './hooks/use-transitions';

export { useWorkflowHistory } from './hooks/use-workflow-history';
export type {
  UseWorkflowHistoryOptions,
  UseWorkflowHistoryReturn,
} from './hooks/use-workflow-history';

// Lifecycle transition prompt metadata + i18n bundles
export { buildLifecycleTransitionPrompt } from './transitions/lifecycle-transition-prompt';
export type {
  LifecycleTransitionPrompt,
  LifecycleTransitionSeverity,
} from './transitions/lifecycle-transition-prompt';
export { workflowTranslationsEn, workflowTranslationsFr } from './locales/index';
export type { WorkflowTranslations } from './locales/index';
