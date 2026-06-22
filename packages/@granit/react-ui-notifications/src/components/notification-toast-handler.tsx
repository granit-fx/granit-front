import { useTranslation } from '@granit/react-localization';
import { useRealTimeNotifications } from '@granit/react-notifications';
import { useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';

import { resolveNotificationPresentation } from '../rendering';

import type { NotificationPresentContext } from '../rendering';
import type { NotificationSeverity } from '@granit/notifications';

const severityToast: Record<NotificationSeverity, typeof toast.info> = {
  Info: toast.info,
  Success: toast.success,
  Warning: toast.warning,
  Error: toast.error,
  Fatal: toast.error,
};

export function NotificationToastHandler() {
  const { t } = useTranslation();
  const { lastMessage } = useRealTimeNotifications();
  const prevIdRef = useRef<string | null>(null);

  const presentationCtx = useMemo<NotificationPresentContext>(
    () => ({ t: (key, options) => t(key as never, options) as string }),
    [t]
  );

  useEffect(() => {
    if (!lastMessage || lastMessage.notificationId === prevIdRef.current) return;
    prevIdRef.current = lastMessage.notificationId;

    const presentation = resolveNotificationPresentation(lastMessage, presentationCtx);
    const severity = presentation.severity ?? lastMessage.severity;
    const showToast = severityToast[severity] ?? toast.info;
    showToast(presentation.title || t('Notifications.NewNotification', 'New notification'), {
      description: presentation.body || undefined,
    });
  }, [lastMessage, presentationCtx, t]);

  return null;
}
