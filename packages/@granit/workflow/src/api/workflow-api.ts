import type {
  TransitionHistory,
  WorkflowTransitionRequest,
  WorkflowTransitionResult,
  WorkflowStatus,
} from '../types/index.js';
import type { PagedResult, PaginationParams } from '@granit/query-engine';
import type { AxiosInstance } from 'axios';

function buildEntityUrl(
  basePath: string,
  entityType: string,
  entityId: string,
  ...segments: string[]
): string {
  const base = `${basePath}/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`;
  return segments.length > 0 ? `${base}/${segments.join('/')}` : base;
}

/** Fetch available transitions for a given state. */
export async function fetchTransitions(
  client: AxiosInstance,
  basePath: string,
  currentState: string
): Promise<WorkflowStatus> {
  const { data } = await client.get<WorkflowStatus>(`${basePath}/transitions`, {
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
): Promise<WorkflowTransitionResult> {
  const { data } = await client.post<WorkflowTransitionResult>(`${basePath}/transitions`, request, {
    params: { currentState },
  });
  return data;
}

/** Response shape for the paginated workflow history endpoint. */
export type WorkflowHistoryPage = PagedResult<TransitionHistory>;

/** Fetch the transition history (HDS audit trail) for an entity. */
export async function fetchHistory(
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
