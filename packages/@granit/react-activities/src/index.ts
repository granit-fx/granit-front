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

// Mutation hooks
export {
  useCancelActivity,
  useCompleteActivity,
  useCreateActivity,
  useReassignActivity,
  useRescheduleActivity,
} from './hooks/use-activity-mutations.js';

// Components
export { ActivityList } from './components/activity-list.js';
export type { ActivityActionLabels, ActivityListProps } from './components/activity-list.js';
export { ActivityDetailPanel } from './components/activity-detail-panel.js';
export type { ActivityDetailPanelProps } from './components/activity-detail-panel.js';
export { ActivityCalendar } from './components/activity-calendar.js';
export type {
  ActivityCalendarLabels,
  ActivityCalendarProps,
  ActivityCalendarView,
} from './components/activity-calendar.js';
