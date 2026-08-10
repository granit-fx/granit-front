import type { WorkflowTransitionResponse } from './transition';

/** Current workflow status of an entity. */
export interface WorkflowStatusResponse {
  readonly currentState: string;
  readonly availableTransitions: readonly WorkflowTransitionResponse[];
}
