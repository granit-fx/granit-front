import { getHistory } from '@granit/workflow';
import { useQuery } from '@tanstack/react-query';

import { useWorkflowConfig } from '../providers/workflow-provider';

import { buildWorkflowQueryKey } from './query-keys';

import type { WorkflowHistoryPage } from '@granit/workflow';
import type { UseQueryResult } from '@tanstack/react-query';

export interface UseWorkflowHistoryOptions {
  entityType: string;
  entityId: string;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

export function useWorkflowHistory({
  entityType,
  entityId,
  page,
  pageSize,
  enabled = true,
}: UseWorkflowHistoryOptions): UseQueryResult<WorkflowHistoryPage> {
  const config = useWorkflowConfig();

  return useQuery({
    queryKey: buildWorkflowQueryKey(
      config,
      'history',
      entityType,
      entityId,
      String(page ?? 1),
      String(pageSize ?? 20)
    ),
    queryFn: () => getHistory(config.client, config.basePath, entityType, entityId, { page, pageSize }),
    enabled,
    staleTime: Infinity, // ISO 27001 audit trail is immutable — cache forever
  });
}
