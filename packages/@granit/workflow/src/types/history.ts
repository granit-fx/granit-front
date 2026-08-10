import type { WorkflowTransitionHistoryResponse } from './transition';
import type { PagedResult } from '@granit/query-engine';

/** Response shape for the paginated workflow history endpoint. */
export type WorkflowHistoryPage = PagedResult<WorkflowTransitionHistoryResponse>;
