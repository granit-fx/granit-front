import { resolveNotificationPresentation } from '@granit/react-notifications';
import { describe, expect, it } from 'vitest';

import type {
  NotificationPresentContext,
  PresentableNotification,
} from '@granit/react-notifications';

// Side-effect: registers this package's notification views into the lib registry.
import '../rendering/register';

const ctx: NotificationPresentContext = { t: (key, options) => options?.defaultValue ?? key };

function notification(overrides: Partial<PresentableNotification>): PresentableNotification {
  return {
    notificationTypeName: 'Unknown.Type',
    severity: 'Info',
    data: {},
    relatedEntityType: null,
    relatedEntityId: null,
    ...overrides,
  };
}

describe('notification views', () => {
  it('should fall back to the default view for an unregistered type', () => {
    const result = resolveNotificationPresentation(
      notification({ data: { title: 'Hello', body: 'World' } }),
      ctx
    );

    expect(result).toMatchObject({ title: 'Hello', body: 'World' });
    expect(result.action).toBeUndefined();
  });

  it('should render the test notification with an action link', () => {
    const result = resolveNotificationPresentation(
      notification({
        notificationTypeName: 'Showcase.TestNotification',
        data: { title: 'Deploy done', body: 'v2 is live', actionUrl: '/diagnostics' },
      }),
      ctx
    );

    expect(result.title).toBe('Deploy done');
    expect(result.action).toEqual({ label: 'Open', to: '/diagnostics' });
  });

  it('should omit the action when the test notification has no actionUrl', () => {
    const result = resolveNotificationPresentation(
      notification({
        notificationTypeName: 'Showcase.TestNotification',
        data: { title: 'No link' },
      }),
      ctx
    );

    expect(result.action).toBeUndefined();
  });

  it('should fall back to the default view when the test payload fails validation', () => {
    const result = resolveNotificationPresentation(
      notification({
        notificationTypeName: 'Showcase.TestNotification',
        data: { title: 42, body: 'broken' },
      }),
      ctx
    );

    expect(result.title).toBe('Showcase.TestNotification');
    expect(result.body).toBe('broken');
  });

  it('should resolve activity notifications to a detail route', () => {
    const result = resolveNotificationPresentation(
      notification({
        notificationTypeName: 'Activities.Activity.Assigned',
        relatedEntityType: 'Activity',
        relatedEntityId: 'act-1',
        data: { title: 'Task assigned' },
      }),
      ctx
    );

    expect(result.action?.to).toBe('/activities?activityId=act-1');
    expect(result.icon).toBeDefined();
  });
});
