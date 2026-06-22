import { useTranslation } from '@granit/react-localization';
import { useWebPush, WebPushProvider } from '@granit/react-notifications-web-push';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@granit/react-ui';
import { BellRing } from 'lucide-react';

export interface PushNotificationManagerProps {
  /**
   * VAPID public key for the push subscription. The host reads it from its env
   * (e.g. `import.meta.env.VITE_VAPID_PUBLIC_KEY`). When absent, the manager
   * renders nothing — web push is opt-in per deployment.
   */
  readonly vapidPublicKey?: string;
  /** Service worker script path. Defaults to `/sw-push.js`. */
  readonly serviceWorkerPath?: string;
}

/**
 * Web Push subscription toggle.
 * Renders nothing when no VAPID public key is provided. The Axios client is
 * resolved from the surrounding `GranitClientProvider` by the `WebPushProvider`.
 */
export function PushNotificationManager({
  vapidPublicKey,
  serviceWorkerPath = '/sw-push.js',
}: PushNotificationManagerProps) {
  if (!vapidPublicKey) return null;

  return (
    <WebPushProvider config={{ vapidPublicKey, serviceWorkerPath }}>
      <PushNotificationManagerInner />
    </WebPushProvider>
  );
}

function PushNotificationManagerInner() {
  const { t } = useTranslation();
  const { isSupported, permission, isSubscribed, loading, subscribe, unsubscribe } = useWebPush();

  if (!isSupported) return null;

  const denied = permission === 'denied';

  return (
    <Card data-slot="push-notification-manager">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5" />
          {t('Notifications.WebPush')}
        </CardTitle>
        <CardDescription>{t('Notifications.WebPushDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {denied ? (
          <p className="text-sm text-muted-foreground">{t('Notifications.PushDenied')}</p>
        ) : (
          <Button
            data-slot="push-toggle"
            variant={isSubscribed ? 'outline' : 'default'}
            disabled={loading}
            onClick={isSubscribed ? unsubscribe : subscribe}
          >
            {isSubscribed ? t('Notifications.DisablePush') : t('Notifications.EnablePush')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
