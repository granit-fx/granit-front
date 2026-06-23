import { executeStateMachineTransition } from '@granit/workflow';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { logger as workflowLogger } from '../logger';
import { useWorkflowConfig } from '../providers/workflow-provider';

import { buildWorkflowQueryKey } from './query-keys';

import type { WorkflowTransitionResult } from '@granit/workflow';

const logger = workflowLogger.child('execute-transition');

export interface UseExecuteTransitionOptions {
  onSuccess?: (result: WorkflowTransitionResult) => void;
  onError?: (error: Error) => void;
}

export interface UseExecuteTransitionReturn {
  readonly transition: (
    currentState: string,
    targetState: string,
    comment?: string
  ) => Promise<WorkflowTransitionResult | null>;
  readonly isPending: boolean;
  readonly data: WorkflowTransitionResult | null;
  readonly error: Error | null;
}

export function useExecuteTransition(
  options?: UseExecuteTransitionOptions
): UseExecuteTransitionReturn {
  const config = useWorkflowConfig();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      currentState,
      targetState,
      comment,
    }: {
      currentState: string;
      targetState: string;
      comment?: string;
    }) =>
      executeStateMachineTransition(config.client, config.basePath, currentState, {
        targetState,
        comment,
      }),
    onSuccess: (result) => {
      queryClient
        .invalidateQueries({ queryKey: buildWorkflowQueryKey(config) })
        .catch(() => undefined);
      options?.onSuccess?.(result);
    },
    onError: (err) => {
      const wrapped = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to execute transition', wrapped);
      options?.onError?.(wrapped);
    },
  });

  const transition = useCallback(
    async (
      currentState: string,
      targetState: string,
      comment?: string
    ): Promise<WorkflowTransitionResult | null> => {
      try {
        return await mutation.mutateAsync({ currentState, targetState, comment });
      } catch {
        return null;
      }
    },
    [mutation]
  );

  return {
    transition,
    isPending: mutation.isPending,
    data: mutation.data ?? null,
    error: mutation.error,
  };
}
