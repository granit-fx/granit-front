import { toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { mockWorkflowHistory, mockWorkflowStatus } from './data.js';

import type {
  TransitionHistory,
  WorkflowStatus,
  WorkflowTransition,
  WorkflowTransitionRequest,
  WorkflowTransitionResult,
} from '@granit/workflow';

function resolveOutcome(
  targetState: string,
  currentState: string,
  transitions: readonly WorkflowTransition[]
): WorkflowTransitionResult {
  const dto = transitions.find((t) => t.targetState === targetState);

  if (!dto) {
    return {
      succeeded: false,
      resultingState: currentState,
      outcome: 'InvalidTransition',
    };
  }
  if (!dto.allowed && dto.requiresApproval) {
    return {
      succeeded: true,
      resultingState: currentState,
      outcome: 'ApprovalRequested',
    };
  }
  if (!dto.allowed) {
    return { succeeded: false, resultingState: currentState, outcome: 'Denied' };
  }
  return { succeeded: true, resultingState: targetState, outcome: 'Completed' };
}

/**
 * Create stateful MSW handlers for workflow endpoints.
 *
 * @param baseUrl - API base path (default: `/api/v1/workflow`)
 */
export function createWorkflowHandlers(baseUrl = '/api/v1/workflow') {
  let currentStatus: WorkflowStatus = { ...mockWorkflowStatus };
  let history: TransitionHistory[] = [...mockWorkflowHistory];

  return [
    // GET /transitions — get current state and available transitions
    http.get(`${baseUrl}/transitions`, ({ request }) => {
      const url = new URL(request.url);
      const requestedState = url.searchParams.get('currentState');

      if (requestedState && requestedState !== currentStatus.currentState) {
        return HttpResponse.json({
          currentState: requestedState,
          availableTransitions: [],
        });
      }

      return HttpResponse.json(currentStatus);
    }),

    // POST /transitions — execute a state transition
    http.post(`${baseUrl}/transitions`, async ({ request }) => {
      const url = new URL(request.url);
      const currentState = url.searchParams.get('currentState') ?? currentStatus.currentState;
      const body = (await request.json()) as WorkflowTransitionRequest;
      const result = resolveOutcome(
        body.targetState,
        currentState,
        currentStatus.availableTransitions
      );

      if (result.outcome === 'Completed') {
        const historyEntry: TransitionHistory = {
          previousState: currentState,
          newState: body.targetState,
          transitionedAt: toISODateString(new Date().toISOString()),
          transitionedBy: 'System Admin',
          comment: body.comment ?? null,
        };
        history = [historyEntry, ...history];

        currentStatus = {
          currentState: body.targetState,
          availableTransitions: [],
        };
      }

      return HttpResponse.json(result);
    }),

    // GET /:entityType/:entityId/history — get transition history
    http.get(`${baseUrl}/:entityType/:entityId/history`, () => {
      return HttpResponse.json({
        items: history,
        totalCount: history.length,
        nextCursor: null,
      });
    }),
  ];
}
