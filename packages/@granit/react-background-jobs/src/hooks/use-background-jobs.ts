import {
  fetchBackgroundJob,
  fetchBackgroundJobs,
  pauseJob,
  resumeJob,
  triggerJob,
} from '@granit/background-jobs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { BackgroundJobListParams, BackgroundJobStatus } from '@granit/background-jobs';
import type { PagedResult } from '@granit/query-engine';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';

const DEFAULT_BASE_PATH = '/api/v1/background-jobs/jobs';

/** Options accepted by all background-jobs hooks. */
export interface BackgroundJobsOptions {
  /** Axios instance used for all requests. */
  readonly client: AxiosInstance;
  /** Base URL for the background-jobs API. Defaults to `/api/v1/background-jobs/jobs`. */
  readonly basePath?: string;
  /** Pagination parameters for the list endpoint. */
  readonly params?: BackgroundJobListParams;
}

/** Query key factory for background jobs queries. */
export const backgroundJobKeys = {
  all: ['background-jobs'] as const,
  list: (params?: BackgroundJobListParams) =>
    [...backgroundJobKeys.all, 'list', params ?? {}] as const,
  job: (name: string) => [...backgroundJobKeys.all, 'job', name] as const,
};

/**
 * Query hook that fetches a paginated list of all background jobs with their current status.
 *
 * Polls every 15 seconds to reflect live scheduler state.
 *
 * @example
 * ```tsx
 * const { data } = useBackgroundJobs({ client: api });
 * // data.items, data.totalCount, data.hasMore
 * ```
 */
export function useBackgroundJobs(
  options: BackgroundJobsOptions
): UseQueryResult<PagedResult<BackgroundJobStatus>> {
  const { client, basePath = DEFAULT_BASE_PATH, params } = options;

  return useQuery({
    queryKey: backgroundJobKeys.list(params),
    queryFn: () => fetchBackgroundJobs(client, basePath, params),
    refetchInterval: 15_000,
  });
}

/**
 * Query hook that fetches a single background job by name.
 *
 * Polls every 15 seconds to reflect live scheduler state.
 * The query is disabled when the name is empty.
 *
 * @example
 * ```tsx
 * const { data: job } = useBackgroundJob('InvoiceSync', { client: api });
 * ```
 */
export function useBackgroundJob(
  name: string,
  options: BackgroundJobsOptions
): UseQueryResult<BackgroundJobStatus> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;

  return useQuery({
    queryKey: backgroundJobKeys.job(name),
    queryFn: () => fetchBackgroundJob(client, basePath, name),
    refetchInterval: 15_000,
    enabled: name.length > 0,
  });
}

/**
 * Mutation hook to pause a background job by name.
 *
 * Sends `POST {basePath}/{name}/pause` and invalidates the jobs list on success.
 *
 * @example
 * ```tsx
 * const { mutate: pause } = usePauseJob({ client: api });
 * pause('InvoiceSync');
 * ```
 */
export function usePauseJob(
  options: BackgroundJobsOptions
): UseMutationResult<void, Error, string> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobName: string) => {
      await pauseJob(client, basePath, jobName);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: backgroundJobKeys.all });
    },
  });
}

/**
 * Mutation hook to resume a paused background job by name.
 *
 * Sends `POST {basePath}/{name}/resume` and invalidates the jobs list on success.
 *
 * @example
 * ```tsx
 * const { mutate: resume } = useResumeJob({ client: api });
 * resume('InvoiceSync');
 * ```
 */
export function useResumeJob(
  options: BackgroundJobsOptions
): UseMutationResult<void, Error, string> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobName: string) => {
      await resumeJob(client, basePath, jobName);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: backgroundJobKeys.all });
    },
  });
}

/**
 * Mutation hook to manually trigger a background job by name.
 *
 * Sends `POST {basePath}/{name}/trigger` and invalidates the jobs list on success.
 *
 * @example
 * ```tsx
 * const { mutate: trigger } = useTriggerJob({ client: api });
 * trigger('InvoiceSync');
 * ```
 */
export function useTriggerJob(
  options: BackgroundJobsOptions
): UseMutationResult<void, Error, string> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobName: string) => {
      await triggerJob(client, basePath, jobName);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: backgroundJobKeys.all });
    },
  });
}
