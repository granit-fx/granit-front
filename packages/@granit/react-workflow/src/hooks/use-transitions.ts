import { listTransitions } from '@granit/workflow';
import { useQuery } from '@tanstack/react-query';

import { useWorkflowConfig } from '../providers/workflow-provider';

import { buildWorkflowQueryKey } from './query-keys';

import type { WorkflowStatusResponse } from '@granit/workflow';
import type { UseQueryResult } from '@tanstack/react-query';

export interface UseTransitionsOptions {
  currentState: string;
  enabled?: boolean;
}

export function useTransitions({
  currentState,
  enabled = true,
}: UseTransitionsOptions): UseQueryResult<WorkflowStatusResponse> {
  const config = useWorkflowConfig();

  return useQuery({
    queryKey: buildWorkflowQueryKey(config, 'transitions', currentState),
    queryFn: () => listTransitions(config.client, config.basePath, currentState),
    enabled,
  });
}
