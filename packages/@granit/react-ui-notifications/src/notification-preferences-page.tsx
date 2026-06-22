import { useTranslation } from '@granit/react-localization';

import { NotificationPreferencesPanel } from './components/notification-preferences-panel';
import { PushNotificationManager } from './components/push-notification-manager';

import type { PushNotificationManagerProps } from './components/push-notification-manager';

export type NotificationPreferencesPageProps = PushNotificationManagerProps;

export function NotificationPreferencesPage({
  vapidPublicKey,
  serviceWorkerPath,
}: NotificationPreferencesPageProps = {}) {
  const { t } = useTranslation();

  return (
    <div data-slot="notification-preferences-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('Notifications.Preferences')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('Notifications.PreferencesSubtitle')}
        </p>
      </div>

      <NotificationPreferencesPanel />
      <PushNotificationManager
        vapidPublicKey={vapidPublicKey}
        serviceWorkerPath={serviceWorkerPath}
      />
    </div>
  );
}
