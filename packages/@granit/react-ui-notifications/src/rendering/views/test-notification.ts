import { registerNotificationView } from '@granit/react-notifications';
import { z } from 'zod';

import type { NotificationPresentation } from '@granit/react-notifications';

/** Type code emitted by `ShowcaseTestNotificationType` on the backend. */
export const SHOWCASE_TEST_NOTIFICATION = 'Showcase.TestNotification';

const testNotificationSchema = z.object({
  title: z.string(),
  body: z.string().optional(),
  actionUrl: z.string().optional(),
  actionLabel: z.string().optional(),
});

type TestNotificationData = z.infer<typeof testNotificationSchema>;

registerNotificationView<TestNotificationData>({
  code: SHOWCASE_TEST_NOTIFICATION,
  parse: (data) => {
    const result = testNotificationSchema.safeParse(data);
    return result.success ? result.data : null;
  },
  present: (data, _notification, ctx): NotificationPresentation => ({
    title: data.title,
    body: data.body,
    action: data.actionUrl
      ? {
          label: data.actionLabel ?? ctx.t('Notifications.OpenLink', { defaultValue: 'Open' }),
          to: data.actionUrl,
        }
      : undefined,
  }),
});
