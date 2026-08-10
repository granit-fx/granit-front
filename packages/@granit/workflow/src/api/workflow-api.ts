import { buildApiUrl } from '@granit/api-client';

import type {
  WorkflowHistoryPage,
  WorkflowTransitionRequest,
  WorkflowTransitionResultResponse,
  WorkflowStatusResponse,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { PaginationParams } from '@granit/query-engine';

function buildEntityUrl(
  basePath: string,
  entityType: string,
  entityId: string,
  ...segments: string[]
): string {
  return buildApiUrl(
    basePath,
    encodeURIComponent(entityType),
    encodeURIComponent(entityId),
    ...segments
  );
}

/** List available transitions for a given state. */
export async function listTransitions(
  client: AxiosInstance,
  basePath: string,
  currentState: string
): Promise<WorkflowStatusResponse> {
  const { data } = await client.get<WorkflowStatusResponse>(`${basePath}/transitions`, {
    params: { currentState },
  });
  return data;
}

/** Execute a state-machine transition (no entity context). */
export async function executeStateMachineTransition(
  client: AxiosInstance,
  basePath: string,
  currentState: string,
  request: WorkflowTransitionRequest
): Promise<WorkflowTransitionResultResponse> {
  const { data } = await client.post<WorkflowTransitionResultResponse>(
    `${basePath}/transitions`,
    request,
    {
      params: { currentState },
    }
  );
  return data;
}

/** Get the transition history (HDS audit trail) for an entity. */
export async function getHistory(
  client: AxiosInstance,
  basePath: string,
  entityType: string,
  entityId: string,
  params: PaginationParams = {}
): Promise<WorkflowHistoryPage> {
  const { data } = await client.get<WorkflowHistoryPage>(
    buildEntityUrl(basePath, entityType, entityId, 'history'),
    { params }
  );
  return data;
}
