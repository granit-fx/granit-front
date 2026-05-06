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
export { ActivitiesSidePanel } from './components/activities-side-panel.js';
export type { ActivitiesSidePanelProps } from './components/activities-side-panel.js';

// Contributions for @granit/react-entities (optional peer)
export { activitiesSidePanel } from './contributions/entity-side-panel.js';
export type { ActivitiesSidePanelContributionOptions } from './contributions/entity-side-panel.js';

// i18n resource bundles (namespace: 'activities')
export { activitiesTranslationsEn, activitiesTranslationsFr } from './locales/index.js';
export type { ActivitiesTranslations } from './locales/index.js';

// Notifications integration (Assigned / Reminder / Overdue)
export {
  ACTIVITY_NOTIFICATION_RELATED_ENTITY_TYPE,
  ActivityNotificationTypes,
} from './notifications/types.js';
export type {
  ActivityNotificationAction,
  ActivityNotificationType,
} from './notifications/types.js';
export {
  isActivityNotification,
  isAssignedActivityNotification,
  isOverdueActivityNotification,
  isReminderActivityNotification,
  resolveActivityNotificationAction,
} from './notifications/register.js';
export type { ActivityNotificationLike } from './notifications/register.js';
