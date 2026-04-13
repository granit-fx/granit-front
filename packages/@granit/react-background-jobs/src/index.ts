// Provider
export {
  BackgroundJobsProvider,
  buildBackgroundJobsQueryKey,
  useBackgroundJobsConfig,
} from './providers/background-jobs-provider.js';

// Hooks
export {
  backgroundJobKeys,
  useBackgroundJob,
  useBackgroundJobs,
  usePauseJob,
  useResumeJob,
  useTriggerJob,
} from './hooks/use-background-jobs.js';

// Types
export type {
  BackgroundJobsConfig,
  BackgroundJobsProviderProps,
} from './providers/background-jobs-provider.js';
