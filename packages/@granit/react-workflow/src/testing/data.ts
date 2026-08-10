import { toISODateString } from '@granit/types';

import type { Mutable } from '@granit/testing';
import type { WorkflowTransitionHistoryResponse, WorkflowStatusResponse } from '@granit/workflow';

export const USER_WORKFLOW_STATES = [
  'PendingValidation',
  'Active',
  'Suspended',
  'Archived',
] as const;

export const mockWorkflowStatus: WorkflowStatusResponse = {
  currentState: 'Active',
  availableTransitions: [
    {
      targetState: 'Suspended',
      name: 'Suspend',
      allowed: true,
      requiresApproval: false,
    },
    {
      targetState: 'Archived',
      name: 'Archive',
      allowed: false,
      requiresApproval: true,
    },
  ],
};

export const mockWorkflowHistory: Mutable<WorkflowTransitionHistoryResponse>[] = [
  {
    previousState: 'PendingValidation',
    newState: 'Active',
    transitionedAt: toISODateString('2025-12-15T09:35:00Z'),
    transitionedBy: 'System Admin',
    comment: 'Identity verified, account activated.',
  },
];
