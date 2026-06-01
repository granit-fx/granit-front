import { createLogger } from '@granit/logger';
import { executeStateMachineTransition } from '@granit/workflow';
import { useCallback, useState } from 'react';

import { useWorkflowConfig } from '../providers/workflow-provider';

import type { WorkflowTransitionResult } from '@granit/workflow';

const logger = createLogger('workflow:execute-transition');

export interface UseExecuteTransitionOptions {
  onSuccess?: (result: WorkflowTransitionResult) => void;
  onError?: (error: Error) => void;
}

export interface UseExecuteTransitionReturn {
  transition: (
    currentState: string,
    targetState: string,
    comment?: string
  ) => Promise<WorkflowTransitionResult | null>;
  loading: boolean;
  result: WorkflowTransitionResult | null;
  error: Error | null;
}

export function useExecuteTransition(
  options?: UseExecuteTransitionOptions
): UseExecuteTransitionReturn {
  const { client, basePath } = useWorkflowConfig();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WorkflowTransitionResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const transition = useCallback(
    async (
      currentState: string,
      targetState: string,
      comment?: string
    ): Promise<WorkflowTransitionResult | null> => {
      setLoading(true);
      setError(null);

      try {
        const data = await executeStateMachineTransition(client, basePath, currentState, {
          targetState,
          comment,
        });
        setResult(data);
        options?.onSuccess?.(data);
        return data;
      } catch (err) {
        const wrapped = err instanceof Error ? err : new Error(String(err));
        logger.error('Failed to execute transition', wrapped);
        setError(wrapped);
        options?.onError?.(wrapped);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client, basePath, options?.onSuccess, options?.onError]
  );

  return { transition, loading, result, error };
}
