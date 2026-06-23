import { registerNotificationView } from '@granit/react-notifications';

import type { NotificationPresentation } from '@granit/react-notifications';

/** Type code emitted by `ShowcaseTestNotificationType` on the backend. */
export const SHOWCASE_TEST_NOTIFICATION = 'Showcase.TestNotification';

interface TestNotificationData {
  readonly title: string;
  readonly body?: string;
  readonly actionUrl?: string;
  readonly actionLabel?: string;
}

// Defensive runtime guard for an untrusted notification payload — `title` is
// required, the rest are optional strings. Replaces a former zod schema (zod was
// dropped framework-wide by PR #727); a hand-written guard keeps the same shape
// without the dependency.
function parseTestNotification(data: unknown): TestNotificationData | null {
  if (typeof data !== 'object' || data === null) return null;
  const record = data as Record<string, unknown>;
  if (typeof record.title !== 'string') return null;
  const optionalString = (value: unknown): value is string | undefined =>
    value === undefined || typeof value === 'string';
  if (
    !optionalString(record.body) ||
    !optionalString(record.actionUrl) ||
    !optionalString(record.actionLabel)
  ) {
    return null;
  }
  return {
    title: record.title,
    body: record.body as string | undefined,
    actionUrl: record.actionUrl as string | undefined,
    actionLabel: record.actionLabel as string | undefined,
  };
}

registerNotificationView<TestNotificationData>({
  code: SHOWCASE_TEST_NOTIFICATION,
  parse: parseTestNotification,
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
