import type { TransitionOutcomeValue } from './transition-outcome';
import type { ISODateString } from '@granit/types';

/** Single available workflow transition. */
export interface WorkflowTransition {
  readonly targetState: string;
  readonly name: string;
  readonly allowed: boolean;
  readonly requiresApproval: boolean;
}

/** Result of a transition attempt. */
export interface WorkflowTransitionResult {
  readonly succeeded: boolean;
  readonly resultingState: string;
  readonly outcome: TransitionOutcomeValue;
}

/** Request body to trigger a transition. */
export interface WorkflowTransitionRequest {
  readonly targetState: string;
  readonly comment?: string;
}

/** Single entry in the workflow transition history (HDS audit trail). */
export interface TransitionHistory {
  readonly previousState: string;
  readonly newState: string;
  readonly transitionedAt: ISODateString;
  readonly transitionedBy: string;
  readonly comment: string | null;
}
