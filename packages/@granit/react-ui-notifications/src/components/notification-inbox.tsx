import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { useNotifications, useUnreadCount } from '@granit/react-notifications';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Spinner } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { useMemo } from 'react';

import { INBOX_PAGE_SIZE } from '../constants';
import { resolveNotificationPresentation } from '../rendering';

import { NotificationAction } from './notification-action';

import type { NotificationPresentContext } from '../rendering';
import type { NotificationSeverity } from '@granit/notifications';

const severityVariant: Record<
  NotificationSeverity,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  Info: 'secondary',
  Success: 'default',
  Warning: 'outline',
  Error: 'destructive',
  Fatal: 'destructive',
};

function useSeverityLabels(): Record<NotificationSeverity, string> {
  const { t } = useTranslation();
  return {
    Info: t('Notifications.Severity.Info', 'Info'),
    Success: t('Notifications.Severity.Success', 'Success'),
    Warning: t('Notifications.Severity.Warning', 'Warning'),
    Error: t('Notifications.Severity.Error', 'Error'),
    Fatal: t('Notifications.Severity.Fatal', 'Fatal'),
  };
}

export function NotificationInbox() {
  const { t } = useTranslation();
  const severityLabel = useSeverityLabels();
  const { formatTimeAgo } = useDateFormatter();
  const { refresh: refreshCount } = useUnreadCount();
  const { notifications, loading, hasMore, loadMore, markRead, markAllRead } = useNotifications({
    pageSize: INBOX_PAGE_SIZE,
  });

  const presentationCtx = useMemo<NotificationPresentContext>(
    () => ({ t: (key, options) => t(key as never, options) as string }),
    [t]
  );

  const unreadCount = notifications.filter((n) => n.state === 'Unread').length;

  const handleMarkRead = async (id: string) => {
    await markRead(id);
    refreshCount();
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    refreshCount();
  };

  if (loading && notifications.length === 0) {
    return (
      <Card data-slot="notification-inbox">
        <CardContent className="flex justify-center py-12">
          <Spinner size="md" />
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card data-slot="notification-inbox">
        <CardContent className="py-12 text-center">
          <Inbox className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm font-medium text-foreground">
            {t('Notifications.NoNotifications')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('Notifications.NoNotificationsDescription')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-slot="notification-inbox">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t('Notifications.Inbox')}
        </CardTitle>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="mr-1 h-4 w-4" />
            {t('Notifications.MarkAllRead')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        <ul className="divide-y divide-border">
          {notifications.map((notification) => {
            const presentation = resolveNotificationPresentation(notification, presentationCtx);
            const Icon = presentation.icon;
            const isRead = notification.state === 'Read';
            const severity = presentation.severity ?? notification.severity;
            return (
              <li
                key={notification.id}
                className={cn('px-6 py-4 transition-colors', !isRead && 'bg-primary/5')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {Icon && (
                        <Icon
                          className={cn('h-4 w-4 shrink-0', presentation.iconClassName)}
                          aria-hidden
                        />
                      )}
                      <p
                        className={cn(
                          'text-sm',
                          isRead ? 'text-muted-foreground' : 'font-semibold text-foreground'
                        )}
                      >
                        {presentation.title}
                      </p>
                      <Badge variant={severityVariant[severity]}>{severityLabel[severity]}</Badge>
                      {presentation.typeBadge && (
                        <Badge variant="outline" className="text-[10px]">
                          {presentation.typeBadge}
                        </Badge>
                      )}
                    </div>
                    {presentation.body && (
                      <p className="mt-1 text-sm text-muted-foreground">{presentation.body}</p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground/70">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {presentation.action && (
                      <NotificationAction
                        action={presentation.action}
                        onActivate={() => void handleMarkRead(notification.id)}
                      />
                    )}
                    {!isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleMarkRead(notification.id)}
                      >
                        {t('Notifications.MarkRead')}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {hasMore && (
          <div className="border-t border-border px-6 py-4 text-center">
            <Button variant="outline" size="sm" onClick={loadMore}>
              {t('Notifications.LoadMore')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
