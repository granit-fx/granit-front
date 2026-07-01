import { useTranslation } from '@granit/react-localization';

import { NotificationInbox } from './notification-inbox';

export function NotificationListPage() {
  const { t } = useTranslation();

  return (
    <div data-slot="notification-list-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('Notifications.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Notifications.Subtitle')}</p>
      </div>

      <NotificationInbox />
    </div>
  );
}
