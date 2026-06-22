import {
  ActivityNotificationTypes,
  isOverdueActivityNotification,
  resolveActivityNotificationAction,
} from '@granit/react-activities';
import { registerNotificationView } from '@granit/react-notifications';
import { CheckSquare } from 'lucide-react';

import type {
  NotificationPresentContext,
  NotificationPresentation,
  PresentableNotification,
} from '@granit/react-notifications';

/** App-owned routes the activity notification actions resolve to. */
const ACTIVITY_ROUTE = '/activities';
const ACTIVITY_CALENDAR_ROUTE = '/activities/calendar';

interface ActivityNotificationData {
  readonly title?: string;
  readonly body?: string;
}

/** Maps a resolved activity action to the app route its "View" link targets. */
function resolveActivityRoute(
  action: ReturnType<typeof resolveActivityNotificationAction>
): string | undefined {
  if (action?.kind === 'open-overdue-calendar') return ACTIVITY_CALENDAR_ROUTE;
  if (action?.kind === 'open-detail') return `${ACTIVITY_ROUTE}?activityId=${action.activityId}`;
  return undefined;
}

/**
 * Adapts the `@granit/react-activities` notification helpers (which own the
 * navigation contract) into a presentation. Route mapping lives here because
 * routes are an app concern, not a framework one.
 */
function presentActivity(
  data: ActivityNotificationData,
  notification: PresentableNotification,
  ctx: NotificationPresentContext
): NotificationPresentation {
  const like = {
    notificationTypeName: notification.notificationTypeName,
    relatedEntityType: notification.relatedEntityType,
    relatedEntityId: notification.relatedEntityId,
  };
  const action = resolveActivityNotificationAction(like);
  const isOverdue = isOverdueActivityNotification(like);

  const to = resolveActivityRoute(action);

  return {
    title: data.title ?? notification.notificationTypeName,
    body: data.body,
    icon: CheckSquare,
    iconClassName: isOverdue ? 'text-destructive' : 'text-primary',
    typeBadge: ctx.t(`activities:Notification.${notification.notificationTypeName}`, {
      defaultValue: notification.notificationTypeName,
    }),
    action: to
      ? { label: ctx.t('activities:Notification.View', { defaultValue: 'View activity' }), to }
      : undefined,
  };
}

const parseActivity = (data: unknown): ActivityNotificationData =>
  (data ?? {}) as ActivityNotificationData;

for (const code of Object.values(ActivityNotificationTypes)) {
  registerNotificationView<ActivityNotificationData>({
    code,
    parse: parseActivity,
    present: presentActivity,
  });
}
