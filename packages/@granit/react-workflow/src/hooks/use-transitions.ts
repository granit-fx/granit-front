import { createLogger } from '@granit/logger';
import { listTransitions } from '@granit/workflow';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useWorkflowConfig } from '../providers/workflow-provider';

import type { WorkflowTransition } from '@granit/workflow';

const logger = createLogger('workflow:transitions');

export interface UseTransitionsOptions {
  currentState: string;
}

export interface UseTransitionsReturn {
  transitions: readonly WorkflowTransition[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTransitions({ currentState }: UseTransitionsOptions): UseTransitionsReturn {
  const { client, basePath } = useWorkflowConfig();

  const [transitions, setTransitions] = useState<readonly WorkflowTransition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const status = await listTransitions(client, basePath, currentState);

      if (!controller.signal.aborted) {
        setTransitions(status.availableTransitions);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        const wrapped = err instanceof Error ? err : new Error(String(err));
        logger.error('Failed to fetch transitions', wrapped);
        setError(wrapped);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [client, basePath, currentState]);

  useEffect(() => {
    refetch().catch(() => {});
    return () => {
      abortRef.current?.abort();
    };
  }, [refetch]);

  return { transitions, loading, error, refetch };
}
