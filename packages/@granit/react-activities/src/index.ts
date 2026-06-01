// Provider
export {
  ActivitiesProvider,
  buildActivitiesQueryKey,
  useActivitiesConfig,
} from './providers/activities-provider';
export type {
  ActivitiesConfig,
  ActivitiesProviderProps,
  ResolvedActivitiesConfig,
} from './providers/activities-provider';

// Constants
export { API_VERSION, DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX, MODULE } from './constants';

// Read hooks
export { useActivities, useActivitiesCalendar, useActivity } from './hooks/use-activities';

// Mutation hooks
export {
  useCancelActivity,
  useCompleteActivity,
  useCreateActivity,
  useReassignActivity,
  useRescheduleActivity,
} from './hooks/use-activity-mutations';

// Components
export { ActivityList } from './components/activity-list';
export type { ActivityActionLabels, ActivityListProps } from './components/activity-list';
export { ActivityDetailPanel } from './components/activity-detail-panel';
export type { ActivityDetailPanelProps } from './components/activity-detail-panel';
export { ActivityCalendar } from './components/activity-calendar';
export type {
  ActivityCalendarLabels,
  ActivityCalendarProps,
  ActivityCalendarView,
} from './components/activity-calendar';
export { ActivitiesSidePanel } from './components/activities-side-panel';
export type { ActivitiesSidePanelProps } from './components/activities-side-panel';

// Contributions for @granit/react-entities (optional peer)
export { activitiesSidePanel } from './contributions/entity-side-panel';
export type { ActivitiesSidePanelContributionOptions } from './contributions/entity-side-panel';

// i18n resource bundles (namespace: 'activities')
export { activitiesTranslationsEn, activitiesTranslationsFr } from './locales/index';
export type { ActivitiesTranslations } from './locales/index';

// Notifications integration (Assigned / Reminder / Overdue)
export {
  ACTIVITY_NOTIFICATION_RELATED_ENTITY_TYPE,
  ActivityNotificationTypes,
} from './notifications/types';
export type { ActivityNotificationAction, ActivityNotificationType } from './notifications/types';
export {
  isActivityNotification,
  isAssignedActivityNotification,
  isOverdueActivityNotification,
  isReminderActivityNotification,
  resolveActivityNotificationAction,
} from './notifications/register';
export type { ActivityNotificationLike } from './notifications/register';
