// Provider
export {
  BackgroundJobsProvider,
  useBackgroundJobsConfig,
} from './providers/background-jobs-provider';

// Query key factory
export { buildBackgroundJobsQueryKey } from './hooks/query-keys';

// Hooks
export {
  useBackgroundJob,
  useBackgroundJobs,
  usePauseJob,
  useResumeJob,
  useTriggerJob,
} from './hooks/use-background-jobs';

// Types
export type {
  BackgroundJobsConfig,
  BackgroundJobsProviderProps,
  ResolvedBackgroundJobsConfig,
} from './providers/background-jobs-provider';
