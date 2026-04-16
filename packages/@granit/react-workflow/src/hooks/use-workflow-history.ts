import { createLogger } from '@granit/logger';
import { getHistory } from '@granit/workflow';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useWorkflowConfig } from '../providers/workflow-provider.js';

import type { TransitionHistory } from '@granit/workflow';

const logger = createLogger('workflow:history');

export interface UseWorkflowHistoryOptions {
  entityType: string;
  entityId: string;
  enabled?: boolean;
}

export interface UseWorkflowHistoryReturn {
  history: readonly TransitionHistory[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useWorkflowHistory({
  entityType,
  entityId,
  enabled = true,
}: UseWorkflowHistoryOptions): UseWorkflowHistoryReturn {
  const { client, basePath } = useWorkflowConfig();

  const [history, setHistory] = useState<readonly TransitionHistory[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await getHistory(client, basePath, entityType, entityId);

      if (!controller.signal.aborted) {
        setHistory(result.items);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        const wrapped = err instanceof Error ? err : new Error(String(err));
        logger.error('Failed to fetch workflow history', wrapped);
        setError(wrapped);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [client, basePath, entityType, entityId]);

  useEffect(() => {
    if (enabled) {
      refetch().catch(() => {}); // Effect cleanup handles abort; error state set inside refetch
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [enabled, refetch]);

  return { history, loading, error, refetch };
}
