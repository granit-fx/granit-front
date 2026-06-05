import {
  cancelImportJob,
  confirmMappings,
  executeImport,
  getImportJob,
  uploadImportFile,
} from '@granit/data-exchange';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { buildImportQueryKey, useImportConfig } from '../providers/import-provider';

import type {
  ImportColumnMapping,
  ImportJobResponse,
  ImportJobStatus,
} from '@granit/data-exchange';

export interface UseImportJobReturn {
  /** Upload a file to start a new import job. */
  readonly upload: (file: File, definitionName: string) => void;
  /**
   * Confirm the column mappings. The current concurrency stamp is fetched and
   * attached automatically, so callers only pass the mappings.
   */
  readonly confirmMap: (mappings: readonly ImportColumnMapping[]) => void;
  /** Execute the import. */
  readonly execute: () => void;
  /** Cancel the import job. */
  readonly cancel: () => void;
  /** The current import job (if any). */
  readonly job: ImportJobResponse | null;
  /** Whether the job is in a terminal state. */
  readonly isTerminal: boolean;
  /** Whether an upload is pending. */
  readonly isUploading: boolean;
  /** Whether mapping confirmation is pending. */
  readonly isConfirming: boolean;
  /** Whether execution dispatch is pending. */
  readonly isExecuting: boolean;
  /** Whether the job status is being polled. */
  readonly isPolling: boolean;
  /** Error from any operation. */
  readonly error: Error | null;
  /** Reset state to start a new import. */
  readonly reset: () => void;
}

const TERMINAL_STATUSES = new Set<ImportJobStatus>([
  'Completed',
  'PartiallyCompleted',
  'Failed',
  'Cancelled',
]);

const POLL_INTERVAL = 2000;

/**
 * Hook for managing the full import job lifecycle.
 *
 * Lifecycle: upload file -> preview -> confirm mappings -> execute -> poll until terminal.
 */
export function useImportJob(): UseImportJobReturn {
  const config = useImportConfig();
  const queryClient = useQueryClient();

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [job, setJob] = useState<ImportJobResponse | null>(null);
  const [executionDispatched, setExecutionDispatched] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: ({ file, definitionName }: { file: File; definitionName: string }) =>
      uploadImportFile(config.client, config.basePath, file, definitionName),
    onSuccess: (data) => {
      setActiveJobId(data.id);
      setJob(data);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (mappings: readonly ImportColumnMapping[]) => {
      const id = activeJobId ?? '';
      // The preview transition regenerates the optimistic-concurrency stamp, so
      // re-read the job to obtain the current value before confirming (avoids 409).
      const current = await getImportJob(config.client, config.basePath, id);
      await confirmMappings(config.client, config.basePath, id, {
        mappings,
        concurrencyStamp: current.concurrencyStamp,
      });
    },
    onSuccess: async () => {
      if (activeJobId) {
        const updated = await getImportJob(config.client, config.basePath, activeJobId);
        setJob(updated);
      }
    },
  });

  const executeMutation = useMutation({
    mutationFn: () => executeImport(config.client, config.basePath, activeJobId ?? ''),
    onSuccess: () => {
      setExecutionDispatched(true);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelImportJob(config.client, config.basePath, activeJobId ?? ''),
    onSuccess: async () => {
      if (activeJobId) {
        const updated = await getImportJob(config.client, config.basePath, activeJobId);
        setJob(updated);
      }
    },
  });

  // Poll job status during execution
  const statusQuery = useQuery({
    queryKey: buildImportQueryKey(config, 'job', activeJobId ?? ''),
    queryFn: () => getImportJob(config.client, config.basePath, activeJobId ?? ''),
    enabled: !!activeJobId && executionDispatched,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && TERMINAL_STATUSES.has(status)) return false;
      return POLL_INTERVAL;
    },
  });

  const currentJob = statusQuery.data ?? job;
  const isTerminal = !!currentJob && TERMINAL_STATUSES.has(currentJob.status);
  const isPolling = !!activeJobId && executionDispatched && !isTerminal;

  const upload = useCallback(
    (file: File, definitionName: string) => {
      uploadMutation.mutate({ file, definitionName });
    },
    [uploadMutation]
  );

  const confirmMap = useCallback(
    (mappings: readonly ImportColumnMapping[]) => {
      confirmMutation.mutate(mappings);
    },
    [confirmMutation]
  );

  const execute = useCallback(() => {
    executeMutation.mutate();
  }, [executeMutation]);

  const cancel = useCallback(() => {
    cancelMutation.mutate();
  }, [cancelMutation]);

  const reset = useCallback(() => {
    if (activeJobId) {
      queryClient
        .invalidateQueries({
          queryKey: buildImportQueryKey(config, 'job', activeJobId),
        })
        .catch(() => {
          /* best-effort invalidation */
        });
    }
    setActiveJobId(null);
    setJob(null);
    setExecutionDispatched(false);
    uploadMutation.reset();
    confirmMutation.reset();
    executeMutation.reset();
    cancelMutation.reset();
  }, [
    activeJobId,
    cancelMutation,
    config,
    confirmMutation,
    executeMutation,
    queryClient,
    uploadMutation,
  ]);

  return {
    upload,
    confirmMap,
    execute,
    cancel,
    job: currentJob,
    isTerminal,
    isUploading: uploadMutation.isPending,
    isConfirming: confirmMutation.isPending,
    isExecuting: executeMutation.isPending || isPolling,
    isPolling,
    error:
      uploadMutation.error ??
      confirmMutation.error ??
      executeMutation.error ??
      cancelMutation.error ??
      statusQuery.error ??
      null,
    reset,
  };
}
