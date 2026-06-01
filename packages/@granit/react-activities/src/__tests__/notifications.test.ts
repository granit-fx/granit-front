import { describe, expect, it } from 'vitest';

import {
  isActivityNotification,
  isAssignedActivityNotification,
  isOverdueActivityNotification,
  isReminderActivityNotification,
  resolveActivityNotificationAction,
} from '../notifications/register';
import {
  ACTIVITY_NOTIFICATION_RELATED_ENTITY_TYPE,
  ActivityNotificationTypes,
} from '../notifications/types';

import type { ActivityNotificationLike } from '../notifications/register';

const assigned: ActivityNotificationLike = {
  notificationTypeName: ActivityNotificationTypes.Assigned,
  relatedEntityType: ACTIVITY_NOTIFICATION_RELATED_ENTITY_TYPE,
  relatedEntityId: 'act-1',
};

const reminder: ActivityNotificationLike = {
  notificationTypeName: ActivityNotificationTypes.Reminder,
  relatedEntityType: ACTIVITY_NOTIFICATION_RELATED_ENTITY_TYPE,
  relatedEntityId: 'act-2',
};

const overdue: ActivityNotificationLike = {
  notificationTypeName: ActivityNotificationTypes.Overdue,
  relatedEntityType: ACTIVITY_NOTIFICATION_RELATED_ENTITY_TYPE,
  relatedEntityId: 'act-3',
};

const foreign: ActivityNotificationLike = {
  notificationTypeName: 'Granit.Sales.Quote.Approved',
  relatedEntityType: 'Quote',
  relatedEntityId: 'q-1',
};

describe('ActivityNotificationTypes', () => {
  it('exposes the three wire-aligned type names', () => {
    expect(ActivityNotificationTypes.Assigned).toBe('Activities.Activity.Assigned');
    expect(ActivityNotificationTypes.Reminder).toBe('Activities.Activity.Reminder');
    expect(ActivityNotificationTypes.Overdue).toBe('Activities.Activity.Overdue');
  });
});

describe('isActivityNotification (and per-variant predicates)', () => {
  it('identifies all three activity variants', () => {
    expect(isActivityNotification(assigned)).toBe(true);
    expect(isActivityNotification(reminder)).toBe(true);
    expect(isActivityNotification(overdue)).toBe(true);
  });

  it('rejects notifications from other modules', () => {
    expect(isActivityNotification(foreign)).toBe(false);
  });

  it('per-variant predicates discriminate correctly', () => {
    expect(isAssignedActivityNotification(assigned)).toBe(true);
    expect(isAssignedActivityNotification(reminder)).toBe(false);

    expect(isReminderActivityNotification(reminder)).toBe(true);
    expect(isReminderActivityNotification(overdue)).toBe(false);

    expect(isOverdueActivityNotification(overdue)).toBe(true);
    expect(isOverdueActivityNotification(assigned)).toBe(false);
  });
});

describe('resolveActivityNotificationAction', () => {
  it('Assigned → open-detail without scrolling to actions', () => {
    expect(resolveActivityNotificationAction(assigned)).toEqual({
      kind: 'open-detail',
      activityId: 'act-1',
      scrollToActions: false,
    });
  });

  it('Reminder → open-detail with scrollToActions=true', () => {
    expect(resolveActivityNotificationAction(reminder)).toEqual({
      kind: 'open-detail',
      activityId: 'act-2',
      scrollToActions: true,
    });
  });

  it('Overdue → open-overdue-calendar (assignee=me), ignoring relatedEntityId', () => {
    expect(resolveActivityNotificationAction(overdue)).toEqual({
      kind: 'open-overdue-calendar',
      assignee: 'me',
    });
  });

  it('returns null for non-activity notifications', () => {
    expect(resolveActivityNotificationAction(foreign)).toBeNull();
  });

  it('returns null for Assigned/Reminder when relatedEntityId is missing', () => {
    expect(
      resolveActivityNotificationAction({
        ...assigned,
        relatedEntityId: null,
      })
    ).toBeNull();
    expect(
      resolveActivityNotificationAction({
        ...reminder,
        relatedEntityId: '',
      })
    ).toBeNull();
  });

  it('returns null when relatedEntityType does not match the activity marker', () => {
    expect(
      resolveActivityNotificationAction({
        ...assigned,
        relatedEntityType: 'WrongType',
      })
    ).toBeNull();
  });

  it('Overdue still resolves even without relatedEntityId (calendar action is global)', () => {
    expect(
      resolveActivityNotificationAction({
        ...overdue,
        relatedEntityId: null,
        relatedEntityType: null,
      })
    ).toEqual({ kind: 'open-overdue-calendar', assignee: 'me' });
  });
});
