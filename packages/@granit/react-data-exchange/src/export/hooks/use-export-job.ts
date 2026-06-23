import { createExportJob, downloadExportFile, getExportJobStatus } from '@granit/data-exchange';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { logger } from '../../logger';
import { buildExportQueryKey, useExportConfig } from '../providers/export-provider';

import type {
  CreateExportJobRequest,
  ExportJobResponse,
  ExportJobStatus,
} from '@granit/data-exchange';

export interface UseExportJobReturn {
  /** Start a new export job. */
  readonly startExport: (request: CreateExportJobRequest) => void;
  /** Current job being tracked (if any). */
  readonly job: ExportJobResponse | null;
  /** Whether an export is currently in progress. */
  readonly isExporting: boolean;
  /** Whether the job creation mutation is pending. */
  readonly isCreating: boolean;
  /** Error from job creation or polling. */
  readonly error: Error | null;
  /** Reset state to start a new export. */
  readonly reset: () => void;
}

const TERMINAL_STATUSES = new Set<ExportJobStatus>(['Completed', 'Failed']);
const POLL_INTERVAL = 2000;

/**
 * Hook for creating an export job, polling its status, and downloading the file.
 *
 * Lifecycle: create job -> poll status -> auto-download on completion.
 */
export function useExportJob(): UseExportJobReturn {
  const config = useExportConfig();
  const queryClient = useQueryClient();

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const downloadTriggered = useRef(false);

  const createMutation = useMutation({
    mutationFn: (request: CreateExportJobRequest) =>
      createExportJob(config.client, config.basePath, request),
    onSuccess: (data) => {
      downloadTriggered.current = false;
      setActiveJobId(data.id);
    },
  });

  const statusQuery = useQuery({
    queryKey: buildExportQueryKey(config, 'job', activeJobId ?? ''),
    queryFn: () => getExportJobStatus(config.client, config.basePath, activeJobId ?? ''),
    enabled: !!activeJobId && !TERMINAL_STATUSES.has(createMutation.data?.status ?? 'Queued'),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && TERMINAL_STATUSES.has(status)) return false;
      return POLL_INTERVAL;
    },
  });

  const job = statusQuery.data ?? createMutation.data ?? null;

  useEffect(() => {
    if (job?.status !== 'Completed' || downloadTriggered.current) return;
    downloadTriggered.current = true;

    downloadExportFile(config.client, config.basePath, job.id)
      .then(({ blob, fileName }) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      })
      .catch((err: unknown) => {
        logger.error('Export file download failed', err, { jobId: job.id });
      });
  }, [job, config.client, config.basePath]);

  const isExporting = !!activeJobId && (!job || !TERMINAL_STATUSES.has(job.status));

  const reset = useCallback(() => {
    if (activeJobId) {
      queryClient
        .invalidateQueries({
          queryKey: buildExportQueryKey(config, 'job', activeJobId),
        })
        .catch(() => {
          /* best-effort invalidation */
        });
    }
    setActiveJobId(null);
    downloadTriggered.current = false;
    createMutation.reset();
  }, [activeJobId, config, createMutation, queryClient]);

  const startExport = useCallback(
    (request: CreateExportJobRequest) => {
      createMutation.mutate(request);
    },
    [createMutation]
  );

  return {
    startExport,
    job,
    isExporting,
    isCreating: createMutation.isPending,
    error: createMutation.error ?? statusQuery.error ?? null,
    reset,
  };
}
