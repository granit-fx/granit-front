// Provider
export {
  ActivitiesProvider,
  buildActivitiesQueryKey,
  useActivitiesConfig,
} from './providers/activities-provider.js';
export type {
  ActivitiesConfig,
  ActivitiesProviderProps,
  ResolvedActivitiesConfig,
} from './providers/activities-provider.js';

// Constants
export { API_VERSION, DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX, MODULE } from './constants.js';

// Read hooks
export { useActivities, useActivitiesCalendar, useActivity } from './hooks/use-activities.js';
