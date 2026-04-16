import {
  getBackgroundJob,
  listBackgroundJobs,
  pauseJob,
  resumeJob,
  triggerJob,
} from '@granit/background-jobs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useBackgroundJobsConfig } from '../providers/background-jobs-provider.js';

import type { BackgroundJobListParams, BackgroundJobStatus } from '@granit/background-jobs';
import type { PagedResult } from '@granit/query-engine';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** Query key factory for background jobs queries. */
export const backgroundJobKeys = {
  all: ['background-jobs'] as const,
  list: (params?: BackgroundJobListParams) =>
    [...backgroundJobKeys.all, 'list', params ?? {}] as const,
  job: (name: string) => [...backgroundJobKeys.all, 'job', name] as const,
};

/**
 * Query hook that lists a paginated collection of all background jobs with their current status.
 *
 * Polls every 15 seconds to reflect live scheduler state.
 *
 * @example
 * ```tsx
 * const { data } = useBackgroundJobs();
 * // data.items, data.totalCount, data.hasMore
 * ```
 */
export function useBackgroundJobs(
  params?: BackgroundJobListParams
): UseQueryResult<PagedResult<BackgroundJobStatus>> {
  const { client, basePath } = useBackgroundJobsConfig();
  const jobsPath = `${basePath}/jobs`;

  return useQuery({
    queryKey: backgroundJobKeys.list(params),
    queryFn: () => listBackgroundJobs(client, jobsPath, params),
    refetchInterval: 15_000,
  });
}

/**
 * Query hook that gets a single background job by name.
 *
 * Polls every 15 seconds to reflect live scheduler state.
 * The query is disabled when the name is empty.
 *
 * @example
 * ```tsx
 * const { data: job } = useBackgroundJob('InvoiceSync');
 * ```
 */
export function useBackgroundJob(
  name: string
): UseQueryResult<BackgroundJobStatus> {
  const { client, basePath } = useBackgroundJobsConfig();
  const jobsPath = `${basePath}/jobs`;

  return useQuery({
    queryKey: backgroundJobKeys.job(name),
    queryFn: () => getBackgroundJob(client, jobsPath, name),
    refetchInterval: 15_000,
    enabled: name.length > 0,
  });
}

/**
 * Mutation hook to pause a background job by name.
 *
 * Sends `POST {basePath}/jobs/{name}/pause` and invalidates the jobs list on success.
 *
 * @example
 * ```tsx
 * const { mutate: pause } = usePauseJob();
 * pause('InvoiceSync');
 * ```
 */
export function usePauseJob(): UseMutationResult<void, Error, string> {
  const { client, basePath } = useBackgroundJobsConfig();
  const jobsPath = `${basePath}/jobs`;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobName: string) => {
      await pauseJob(client, jobsPath, jobName);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: backgroundJobKeys.all });
    },
  });
}

/**
 * Mutation hook to resume a paused background job by name.
 *
 * Sends `POST {basePath}/jobs/{name}/resume` and invalidates the jobs list on success.
 *
 * @example
 * ```tsx
 * const { mutate: resume } = useResumeJob();
 * resume('InvoiceSync');
 * ```
 */
export function useResumeJob(): UseMutationResult<void, Error, string> {
  const { client, basePath } = useBackgroundJobsConfig();
  const jobsPath = `${basePath}/jobs`;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobName: string) => {
      await resumeJob(client, jobsPath, jobName);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: backgroundJobKeys.all });
    },
  });
}

/**
 * Mutation hook to manually trigger a background job by name.
 *
 * Sends `POST {basePath}/jobs/{name}/trigger` and invalidates the jobs list on success.
 *
 * @example
 * ```tsx
 * const { mutate: trigger } = useTriggerJob();
 * trigger('InvoiceSync');
 * ```
 */
export function useTriggerJob(): UseMutationResult<void, Error, string> {
  const { client, basePath } = useBackgroundJobsConfig();
  const jobsPath = `${basePath}/jobs`;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobName: string) => {
      await triggerJob(client, jobsPath, jobName);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: backgroundJobKeys.all });
    },
  });
}
